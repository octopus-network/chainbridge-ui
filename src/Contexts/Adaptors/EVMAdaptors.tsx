import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react';
import { Bridge, BridgeFactory } from '@chainsafe/chainbridge-contracts';
import { useWeb3 } from '@chainsafe/web3-context';
import { BigNumber, ethers, utils } from 'ethers';
import { Buffer } from 'buffer';
import { parseUnits } from 'ethers/lib/utils';
import { decodeAddress } from '@polkadot/util-crypto';
import { Web3Provider } from '@ethersproject/providers';
import {
  chainbridgeConfig,
  EvmBridgeConfig,
  TokenConfig,
} from '../../chainbridgeConfig';
import { Erc20DetailedFactory } from '../../Contracts/Erc20DetailedFactory';
import { Weth } from '../../Contracts/Weth';
import { WethFactory } from '../../Contracts/WethFactory';
import { useNetworkManager } from '../NetworkManagerContext';
import {
  IDestinationBridgeProviderProps,
  IHomeBridgeProviderProps,
} from './interfaces';
import { HomeBridgeContext } from '../HomeBridgeContext';
import { DestinationBridgeContext } from '../DestinationBridgeContext';

const resetAllowanceLogicFor = [
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  // Add other offending tokens here
];

const chains = import.meta.env.VITE_CHAINS as 'testnets' | 'mainnets';

const getBaseFeeWithGasPrice = async (
  provider: Web3Provider | undefined,
  gasPrice: number,
): Promise<string> => {
  const lastBlock = await provider?.getBlock(-1);

  const baseFee = lastBlock?.baseFeePerGas?.mul(1125).div(1000);

  return BigNumber.from(utils.parseUnits(gasPrice.toString(), 9))
    .add(BigNumber.from(baseFee))
    .toString();
};

export const EVMHomeAdaptorProvider = ({
  children,
}: IHomeBridgeProviderProps): JSX.Element => {
  const {
    isReady,
    network,
    provider,
    gasPrice,
    address,
    tokens,
    wallet,
    checkIsReady,
    onboard,
    resetOnboard,
  } = useWeb3();

  console.log('EVMHomeAdaptorProvider-isReady', isReady);

  const getNetworkName = (id: number) => {
    console.log('getNetworkName-id', id);

    switch (Number(id)) {
      // case 5:
      //   return 'Localhost';
      case 1:
        return 'Mainnet';
      case 3:
        return 'Ropsten';
      case 4:
        return 'Rinkeby';
      case 5:
        return 'Goerli';
      case 6:
        return 'Kotti';
      case 42:
        return 'Kovan';
      case 61:
        return 'Ethereum Classic - Mainnet';
      default:
        return 'Other';
    }
  };

  const {
    homeChainConfig,
    setTransactionStatus,
    setDepositNonce,
    handleSetHomeChain,
    homeChains,
    setNetworkId,
  } = useNetworkManager();

  const [homeBridge, setHomeBridge] = useState<Bridge | undefined>(undefined);
  const [relayerThreshold, setRelayerThreshold] = useState<number | undefined>(
    undefined,
  );
  const [bridgeFee, setBridgeFee] = useState<number | undefined>();

  const [depositAmount, setDepositAmount] = useState<number | undefined>();
  const [selectedToken, setSelectedToken] = useState<string>('');

  // Contracts
  const [wrapper, setWrapper] = useState<Weth | undefined>(undefined);
  const [wrapTokenConfig, setWrapperConfig] = useState<TokenConfig | undefined>(
    undefined,
  );

  useEffect(() => {
    if (network) {
      const chain = homeChains.find(chain => chain.networkId === network);
      setNetworkId(network);
      if (chain) {
        handleSetHomeChain(chain.chainId);
      }
    }
  }, [handleSetHomeChain, homeChains, network, setNetworkId]);

  const [initialising, setInitialising] = useState(false);
  const [walletSelected, setWalletSelected] = useState(false);
  useEffect(() => {
    if (initialising || homeBridge || !onboard) return;
    console.log('starting init');
    setInitialising(true);
    if (!walletSelected) {
      onboard
        .walletSelect('metamask')
        .then(success => {
          setWalletSelected(success);
          if (success) {
            checkIsReady()
              .then(success => {
                if (success) {
                  if (homeChainConfig && network && isReady && provider) {
                    const signer = provider.getSigner();
                    if (!signer) {
                      console.log('No signer');
                      setInitialising(false);
                      return;
                    }

                    const bridge = BridgeFactory.connect(
                      (homeChainConfig as EvmBridgeConfig).bridgeAddress,
                      signer,
                    );
                    setHomeBridge(bridge);

                    const wrapperToken = homeChainConfig.tokens.find(
                      token => token.isNativeWrappedToken,
                    );

                    if (!wrapperToken) {
                      setWrapperConfig(undefined);
                      setWrapper(undefined);
                    } else {
                      setWrapperConfig(wrapperToken);
                      const connectedWeth = WethFactory.connect(
                        wrapperToken.address,
                        signer,
                      );
                      setWrapper(connectedWeth);
                    }
                  }
                }
              })
              .catch(error => {
                console.error(error);
              })
              .finally(() => {
                setInitialising(false);
              });
          }
        })
        .catch(error => {
          setInitialising(false);
          console.error(error);
        });
    } else {
      checkIsReady()
        .then(success => {
          if (success) {
            if (homeChainConfig && network && isReady && provider) {
              const signer = provider.getSigner();
              if (!signer) {
                console.log('No signer');
                setInitialising(false);
                return;
              }

              const bridge = BridgeFactory.connect(
                (homeChainConfig as EvmBridgeConfig).bridgeAddress,
                signer,
              );
              setHomeBridge(bridge);

              const wrapperToken = homeChainConfig.tokens.find(
                token => token.isNativeWrappedToken,
              );

              if (!wrapperToken) {
                setWrapperConfig(undefined);
                setWrapper(undefined);
              } else {
                setWrapperConfig(wrapperToken);
                const connectedWeth = WethFactory.connect(
                  wrapperToken.address,
                  signer,
                );
                setWrapper(connectedWeth);
              }
            }
          }
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          setInitialising(false);
        });
    }
  }, [
    initialising,
    homeChainConfig,
    isReady,
    provider,
    checkIsReady,
    network,
    homeBridge,
    onboard,
    walletSelected,
  ]);

  useEffect(() => {
    const getRelayerThreshold = async () => {
      if (homeBridge) {
        const threshold = BigNumber.from(
          await homeBridge._relayerThreshold(),
        ).toNumber();
        setRelayerThreshold(threshold);
      }
    };
    const getBridgeFee = async () => {
      if (homeBridge) {
        const bridgeFee = Number(utils.formatEther(await homeBridge._fee()));
        setBridgeFee(bridgeFee);
      }
    };
    getRelayerThreshold();
    getBridgeFee();
  }, [homeBridge]);

  const handleConnect = useCallback(async () => {
    if (wallet && wallet.connect && network) {
      await onboard?.walletSelect('metamask');
      await wallet.connect();
    }
  }, [wallet, network, onboard]);

  const deposit = useCallback(
    async (
      amount: number,
      recipient: string,
      tokenAddress: string,
      destinationChainId: number,
    ) => {
      let decodedRecipient = '';

      if (!homeChainConfig || !homeBridge) {
        console.error('Home bridge contract is not instantiated');
        return;
      }
      const signer = provider?.getSigner();
      if (!address || !signer) {
        console.log('No signer');
        return;
      }

      const destinationChain = chainbridgeConfig[chains].find(
        c => c.chainId === destinationChainId,
      );
      if (destinationChain?.type === 'Substrate') {
        decodedRecipient = `0x${Buffer.from(decodeAddress(recipient)).toString(
          'hex',
        )}`;
      }
      const token = homeChainConfig.tokens.find(
        token => token.address === tokenAddress,
      );

      if (!token) {
        console.log('Invalid token selected');
        return;
      }
      setTransactionStatus('Initializing Transfer');
      setDepositAmount(amount);
      setSelectedToken(tokenAddress);
      const erc20 = Erc20DetailedFactory.connect(tokenAddress, signer);
      const erc20Decimals = tokens[tokenAddress].decimals;

      const data = `0x${
        utils
          .hexZeroPad(
            // TODO Wire up dynamic token decimals
            BigNumber.from(
              utils.parseUnits(amount.toString(), erc20Decimals),
            ).toHexString(),
            32,
          )
          .substr(2) // Deposit Amount (32 bytes)
      }${
        utils
          .hexZeroPad(utils.hexlify((decodedRecipient.length - 2) / 2), 32)
          .substr(2) // len(recipientAddress) (32 bytes)
      }${decodedRecipient.substr(2)}`; // recipientAddress (?? bytes)

      try {
        let baseFeeWithGasPrice = await getBaseFeeWithGasPrice(
          // @ts-expect-error
          provider,
          gasPrice,
        );

        const currentAllowance = await erc20.allowance(
          address,
          (homeChainConfig as EvmBridgeConfig).erc20HandlerAddress,
        );

        if (
          Number(utils.formatUnits(currentAllowance, erc20Decimals)) < amount
        ) {
          if (
            Number(utils.formatUnits(currentAllowance, erc20Decimals)) > 0 &&
            resetAllowanceLogicFor.includes(tokenAddress)
          ) {
            // We need to reset the user's allowance to 0 before we give them a new allowance
            // TODO Should we alert the user this is happening here?
            await (
              await erc20.approve(
                (homeChainConfig as EvmBridgeConfig).erc20HandlerAddress,
                BigNumber.from(utils.parseUnits('0', erc20Decimals)),
                {
                  gasPrice: baseFeeWithGasPrice,
                },
              )
            ).wait(1);
          }

          baseFeeWithGasPrice = await getBaseFeeWithGasPrice(
            // @ts-expect-error
            provider,
            gasPrice,
          );

          await (
            await erc20.approve(
              (homeChainConfig as EvmBridgeConfig).erc20HandlerAddress,
              BigNumber.from(
                utils.parseUnits(amount.toString(), erc20Decimals),
              ),
              {
                gasPrice: baseFeeWithGasPrice,
              },
            )
          ).wait(1);
        }
        homeBridge.once(
          homeBridge.filters.Deposit(
            destinationChainId,
            token.resourceId,
            null,
          ),
          (destChainId, resourceId, depositNonce) => {
            setDepositNonce(`${depositNonce.toString()}`);
            setTransactionStatus('In Transit');
          },
        );

        // @ts-expect-error
        baseFeeWithGasPrice = await getBaseFeeWithGasPrice(provider, gasPrice);

        await (
          await homeBridge.deposit(destinationChainId, token.resourceId, data, {
            gasPrice: baseFeeWithGasPrice,
            value: utils.parseUnits((bridgeFee || 0).toString(), 18),
          })
        ).wait();

        return Promise.resolve();
      } catch (error) {
        Sentry.captureException(error);
        setTransactionStatus('Transfer Aborted');
        setSelectedToken(tokenAddress);
      }
    },
    [
      homeBridge,
      address,
      bridgeFee,
      homeChainConfig,
      gasPrice,
      provider,
      setDepositNonce,
      setTransactionStatus,
      tokens,
    ],
  );

  const wrapToken = async (value: number): Promise<string> => {
    if (!wrapTokenConfig || !wrapper?.deposit || !homeChainConfig)
      return 'not ready';

    try {
      const baseFeeWithGasPrice = await getBaseFeeWithGasPrice(
        // @ts-expect-error
        provider,
        gasPrice,
      );

      const tx = await wrapper.deposit({
        value: parseUnits(`${value}`, homeChainConfig.decimals),
        gasPrice: baseFeeWithGasPrice,
      });

      await tx?.wait();
      if (tx?.hash) {
        return tx?.hash;
      }
      return '';
    } catch (error) {
      console.error(error);
      return '';
    }
  };

  const unwrapToken = async (value: number): Promise<string> => {
    if (!wrapTokenConfig || !wrapper?.withdraw || !homeChainConfig)
      return 'not ready';

    try {
      const baseFeeWithGasPrice = await getBaseFeeWithGasPrice(
        // @ts-expect-error
        provider,
        gasPrice,
      );

      const tx = await wrapper.deposit({
        value: parseUnits(`${value}`, homeChainConfig.decimals),
        gasPrice: baseFeeWithGasPrice,
      });

      await tx?.wait();
      if (tx?.hash) {
        return tx?.hash;
      }
      return '';
    } catch (error) {
      console.error(error);
      return '';
    }
  };

  const wCFGBalance = useMemo(() => {
    const ethChain = chainbridgeConfig[chains].find(
      chain => chain.type === 'Ethereum',
    );

    const wCFG = ethChain?.tokens.find(
      token => token.name === 'USDC',
    ) as TokenConfig;

    return tokens[wCFG.address]?.balance;
  }, [tokens]);

  return (
    <HomeBridgeContext.Provider
      value={{
        connect: handleConnect,
        disconnect: async () => {
          await resetOnboard();
        },
        getNetworkName,
        bridgeFee,
        deposit,
        depositAmount,
        selectedToken,
        setDepositAmount,
        setSelectedToken,
        tokens,
        relayerThreshold,
        wrapTokenConfig,
        wrapper,
        wrapToken,
        unwrapToken,
        isReady,
        chainConfig: homeChainConfig,
        address,
        nativeTokenBalance: wCFGBalance,
      }}
    >
      {children}
    </HomeBridgeContext.Provider>
  );
};

export const EVMDestinationAdaptorProvider = ({
  children,
}: IDestinationBridgeProviderProps): JSX.Element => {
  console.log('EVM destination loaded');
  const {
    depositNonce,
    destinationChainConfig,
    homeChainConfig,
    tokensDispatch,
    setTransactionStatus,
    setTransferTxHash,
    setDepositVotes,
    depositVotes,
  } = useNetworkManager();

  const [destinationBridge, setDestinationBridge] = useState<
    Bridge | undefined
  >(undefined);

  useEffect(() => {
    if (destinationBridge) return;
    let provider;
    if (destinationChainConfig?.rpcUrl.startsWith('wss')) {
      if (destinationChainConfig.rpcUrl.includes('infura')) {
        const parts = destinationChainConfig.rpcUrl.split('/');

        provider = new ethers.providers.InfuraWebSocketProvider(
          destinationChainConfig.networkId,
          parts[parts.length - 1],
        );
      }
      if (destinationChainConfig.rpcUrl.includes('alchemyapi')) {
        const parts = destinationChainConfig.rpcUrl.split('/');

        provider = new ethers.providers.AlchemyWebSocketProvider(
          destinationChainConfig.networkId,
          parts[parts.length - 1],
        );
      }
    } else {
      provider = new ethers.providers.JsonRpcProvider(
        destinationChainConfig?.rpcUrl,
      );
    }
    if (destinationChainConfig && provider) {
      const bridge = BridgeFactory.connect(
        (destinationChainConfig as EvmBridgeConfig).bridgeAddress,
        provider,
      );
      setDestinationBridge(bridge);
    }
  }, [destinationChainConfig, destinationBridge]);

  useEffect(() => {
    if (
      destinationChainConfig &&
      homeChainConfig?.chainId &&
      destinationBridge &&
      depositNonce
    ) {
      destinationBridge.on(
        destinationBridge.filters.ProposalEvent(
          homeChainConfig.chainId,
          BigNumber.from(depositNonce),
          null,
          null,
          null,
        ),
        (originChainId, depositNonce, status, resourceId, dataHash, tx) => {
          switch (BigNumber.from(status).toNumber()) {
            case 1:
              tokensDispatch({
                type: 'addMessage',
                payload: `Proposal created on ${destinationChainConfig.name}`,
              });
              break;
            case 2:
              tokensDispatch({
                type: 'addMessage',
                payload: `Proposal has passed. Executing...`,
              });
              break;
            case 3:
              setTransactionStatus('Transfer Completed');
              setTransferTxHash(tx.transactionHash);
              break;
            case 4:
              Sentry.captureException({
                status,
                tx,
                dataHash,
                resourceId,
                depositNonce,
              });
              setTransactionStatus('Transfer Aborted');
              setTransferTxHash(tx.transactionHash);
              break;
            // no default
          }
        },
      );

      destinationBridge.on(
        destinationBridge.filters.ProposalVote(
          homeChainConfig.chainId,
          BigNumber.from(depositNonce),
          null,
          null,
        ),
        async (originChainId, depositNonce, status, resourceId, tx) => {
          const txReceipt = await tx.getTransactionReceipt();
          if (txReceipt?.status === 1) {
            setDepositVotes(depositVotes + 1);
          }
          tokensDispatch({
            type: 'addMessage',
            payload: {
              address: String(txReceipt?.from),
              signed: txReceipt?.status === 1 ? 'Confirmed' : 'Rejected',
            },
          });
        },
      );
    }

    return () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      destinationBridge?.removeAllListeners();
    };
  }, [
    depositNonce,
    homeChainConfig,
    destinationBridge,
    depositVotes,
    destinationChainConfig,
    setDepositVotes,
    setTransactionStatus,
    setTransferTxHash,
    tokensDispatch,
  ]);

  return (
    <DestinationBridgeContext.Provider
      value={{
        disconnect: async () => undefined,
      }}
    >
      {children}
    </DestinationBridgeContext.Provider>
  );
};
