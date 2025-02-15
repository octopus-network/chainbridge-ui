import { ApiPromise, WsProvider } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import {
  chainbridgeConfig,
  SubstrateBridgeConfig,
} from '../../../chainbridgeConfig';

const chains = import.meta.env.VITE_CHAINS as 'testnets' | 'mainnets';

export const createApi = async (rpcUrl: string): Promise<ApiPromise> => {
  const provider = new WsProvider(rpcUrl);
  const subChainConfig = chainbridgeConfig[chains].find(
    c => c.rpcUrl === rpcUrl,
  ) as SubstrateBridgeConfig;
  const types = (await import(`./bridgeTypes.json`)) as any;
  return ApiPromise.create({ provider, types });
};

export const submitDeposit = (
  api: ApiPromise,
  amount: number,
  recipient: string,
  destinationChainId: number,
): unknown => {
  const subChainConfig = chainbridgeConfig[chains].find(
    c => c.chainId !== destinationChainId,
  ) as SubstrateBridgeConfig;

  return api.tx[subChainConfig.transferPalletName][
    subChainConfig.transferFunctionName
  ](
    new BigNumber(amount)
      .multipliedBy(
        new BigNumber(10).pow(new BigNumber(subChainConfig.decimals)),
      )
      .toString(10),
    recipient,
    destinationChainId,
  );
};
