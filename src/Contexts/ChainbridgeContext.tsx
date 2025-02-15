import React, { useCallback, useContext } from 'react';
import { Tokens } from '@chainsafe/web3-context/dist/context/tokensReducer';
import {
  BridgeConfig,
  chainbridgeConfig,
  TokenConfig,
} from '../chainbridgeConfig';
import {
  TransactionStatus,
  useNetworkManager,
  Vote,
} from './NetworkManagerContext';
import { useHomeBridge } from './HomeBridgeContext';
import NetworkSelectModal from '../Modules/NetworkSelectModal';

interface IChainbridgeContextProps {
  children: React.ReactNode | React.ReactNode[];
}

type ChainbridgeContext = {
  homeConfig: BridgeConfig | undefined;
  connect: () => Promise<void>;
  handleSetHomeChain: (chainId: number) => void;
  setDestinationChain: (chainId: number | undefined) => void;
  destinationChains: Array<{ chainId: number; name: string }>;
  destinationChainConfig?: BridgeConfig;
  deposit(
    amount: number,
    recipient: string,
    tokenAddress: string,
  ): Promise<void>;
  resetDeposit(): void;
  depositVotes: number;
  relayerThreshold?: number;
  depositNonce?: string;
  depositAmount?: number;
  bridgeFee?: number;
  inTransitMessages: Array<string | Vote>;
  transferTxHash?: string;
  selectedToken?: string;
  transactionStatus?: TransactionStatus;
  wrapToken: (value: number) => Promise<string>;
  unwrapToken: (value: number) => Promise<string>;
  wrapTokenConfig: TokenConfig | undefined;
  tokens: Tokens;
  nativeTokenBalance: number | undefined;
  isReady: boolean | undefined;
  address: string | undefined;
  chainId?: number;
};

const ChainbridgeContext = React.createContext<ChainbridgeContext | undefined>(
  undefined,
);

const chains = import.meta.env.VITE_CHAINS as 'testnets' | 'mainnets';

const ChainbridgeProvider = ({
  children,
}: IChainbridgeContextProps): JSX.Element => {
  const {
    handleSetHomeChain,
    destinationChainConfig,
    setTransactionStatus,
    setDestinationChain,
    setDepositNonce,
    setDepositVotes,
    transferTxHash,
    inTransitMessages,
    tokensDispatch,
    transactionStatus,
    depositNonce,
    depositVotes,
    homeChainConfig,
    destinationChains,
    chainId,
  } = useNetworkManager();

  const {
    connect,
    setDepositAmount,
    setSelectedToken,
    chainConfig,
    deposit,
    relayerThreshold,
    nativeTokenBalance,
    address,
    selectedToken,
    bridgeFee,
    depositAmount,
    isReady,
    wrapTokenConfig,
    tokens,
    wrapToken,
    unwrapToken,
  } = useHomeBridge();

  const resetDeposit = () => {
    chainbridgeConfig[chains].length > 2 && setDestinationChain(undefined);
    setTransactionStatus(undefined);
    setDepositNonce(undefined);
    setDepositVotes(0);
    setDepositAmount(undefined);
    tokensDispatch({
      type: 'resetMessages',
    });
    setSelectedToken('');
  };

  const handleDeposit = useCallback(
    async (amount: number, recipient: string, tokenAddress: string) => {
      if (chainConfig && destinationChainConfig) {
        return deposit(
          amount,
          recipient,
          tokenAddress,
          destinationChainConfig.chainId,
        );
      }
    },
    [deposit, destinationChainConfig, chainConfig],
  );

  return (
    <ChainbridgeContext.Provider
      value={{
        homeConfig: homeChainConfig,
        connect,
        destinationChains,
        handleSetHomeChain,
        setDestinationChain,
        resetDeposit,
        deposit: handleDeposit,
        destinationChainConfig,
        depositVotes,
        relayerThreshold,
        depositNonce,
        bridgeFee,
        transactionStatus,
        inTransitMessages,
        depositAmount,
        transferTxHash,
        selectedToken,
        // TODO: Confirm if EVM specific
        wrapToken,
        wrapTokenConfig,
        unwrapToken,
        isReady,
        nativeTokenBalance,
        tokens,
        address,
        chainId,
      }}
    >
      <NetworkSelectModal />
      {children}
    </ChainbridgeContext.Provider>
  );
};

const useChainbridge = (): ChainbridgeContext => {
  const context = useContext(ChainbridgeContext);
  if (context === undefined) {
    throw new Error(
      'useChainbridge must be called within a ChainbridgeProvider',
    );
  }
  return context;
};

export { ChainbridgeProvider, useChainbridge };
