import ETHIcon from './media/tokens/eth.svg';
import { testnets_0, testnets_1, testnets_centrifuge } from './network.config';
// import WETHIcon from "./media/tokens/weth.svg";

export type TokenConfig = {
  address: string;
  name?: string;
  symbol?: string;
  imageUri?: string;
  resourceId: string;
  isNativeWrappedToken?: boolean;
};

export type ChainType = 'Ethereum' | 'Substrate';

export type BridgeConfig = {
  networkId?: number;
  chainId: number;
  name: string;
  rpcUrl: string;
  type: ChainType;
  tokens: TokenConfig[];
  nativeTokenSymbol: string;
  decimals: number;
};

export type EvmBridgeConfig = BridgeConfig & {
  bridgeAddress: string;
  erc20HandlerAddress: string;
  type: 'Ethereum';
  // This should be the full path to display a tx hash, without the trailing slash, ie. https://etherscan.io/tx
  blockExplorer?: string;
  defaultGasPrice?: number;
  deployedBlockNumber?: number;
};

export type SubstrateBridgeConfig = BridgeConfig & {
  type: 'Substrate';
  chainbridgePalletName: string;
  bridgeFeeFunctionName?: string; // If this value is provided, the chain value will be used will be used
  bridgeFeeValue?: number; // If the above value is not provided, this value will be used for the fee. No scaling should be applied.
  transferPalletName: string;
  transferFunctionName: string;
  typesFileName: string;
  blockExplorer?: string;
};

export type ChainbridgeConfig = {
  mainnets: Array<EvmBridgeConfig | SubstrateBridgeConfig>;
  testnets: Array<EvmBridgeConfig | SubstrateBridgeConfig>;
};

export const chainbridgeConfig: ChainbridgeConfig = {
  // Local GETH <> Local Substrate
  mainnets: [
    {
      chainId: 0,
      networkId: 1,
      name: 'Ethereum',
      decimals: 18,
      bridgeAddress: '0xFe50BA7241b635Eda23a32875c383A34E8a3596c',
      erc20HandlerAddress: '0x84D1e77F472a4aA697359168C4aF4ADD4D2a71fa',
      rpcUrl: 'https://mainnet.infura.io/v3/ed5e0e19bcbc427cbf8f661736d44516',
      type: 'Ethereum',
      nativeTokenSymbol: 'ETH',
      tokens: [
        {
          address: '0xc221b7e65ffc80de234bbb6667abdd46593d34f0',
          name: 'wCFG',
          symbol: 'wCFG',
          imageUri: ETHIcon,
          resourceId:
            '0x00000000000000000000000000000009e974040e705c10fb4de576d6cc261900',
        },
      ],
      blockExplorer: 'https://etherscan.io/tx',
    },
    {
      chainId: 1,
      networkId: 1,
      name: 'Centrifuge',
      decimals: 18,
      rpcUrl: 'wss://fullnode.parachain.centrifuge.io',
      type: 'Substrate',
      nativeTokenSymbol: 'CFG',
      chainbridgePalletName: 'chainBridge',
      bridgeFeeFunctionName: 'nativeTokenTransferFee',
      transferPalletName: 'bridge',
      transferFunctionName: 'transferNative',
      typesFileName: 'bridgeTypes.json',
      tokens: [
        {
          address: 'substrate-native',
          name: 'CFG',
          symbol: 'CFG',
          resourceId: 'substrate-native',
        },
      ],
      blockExplorer: 'https://centrifuge.subscan.io/extrinsic',
    },
  ],
  testnets: testnets_1,
};
