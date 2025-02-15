import React from 'react';
import { init, ErrorBoundary, showReportDialog } from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { ThemeSwitcher } from '@chainsafe/common-theme';
import {
  CssBaseline,
  Router,
  ToasterProvider,
} from '@chainsafe/common-components';
import { Web3Provider } from '@chainsafe/web3-context';
import { utils } from 'ethers';
import Routes from './Components/Routes';
import { lightTheme } from './Themes/LightTheme';
import { ChainbridgeProvider } from './Contexts/ChainbridgeContext';
import AppWrapper from './Layouts/AppWrapper';
import { NetworkManagerProvider } from './Contexts/NetworkManagerContext';
import { chainbridgeConfig } from './chainbridgeConfig';
import '@chainsafe/common-theme/dist/font-faces.css';

const chains = import.meta.env.VITE_CHAINS as 'testnets' | 'mainnets';

if (
  import.meta.env.NODE_ENV === 'production' &&
  import.meta.env.VITE_SENTRY_DSN_URL
) {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN_URL as string,
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

const App = (): JSX.Element => {
  const tokens = chainbridgeConfig[chains]
    .filter(c => c.type === 'Ethereum')
    .reduce((tca, bc) => {
      if (bc.networkId) {
        return {
          ...tca,
          [bc.networkId]: bc.tokens,
        };
      }
      return tca;
    }, {});

  return (
    <ErrorBoundary
      fallback={({ error, componentStack, eventId, resetError }) => (
        <div>
          <p>
            An error occurred and has been logged. If you would like to provide
            additional info to help us debug and resolve the issue, click the
            &quot;Provide Additional Details&quot; button
          </p>
          <p>{error?.message.toString()}</p>
          <p>{componentStack}</p>
          <p>{eventId}</p>
          <button
            type="button"
            onClick={() => showReportDialog({ eventId: eventId || '' })}
          >
            Provide Additional Details
          </button>
          <button type="button" onClick={resetError}>
            Reset error
          </button>
        </div>
      )}
      onReset={() => window.location.reload()}
    >
      <ThemeSwitcher themes={{ light: lightTheme }}>
        <CssBaseline />
        <ToasterProvider autoDismiss>
          <Web3Provider
            tokensToWatch={tokens}
            networkIds={[5]}
            onboardConfig={{
              dappId: import.meta.env.VITE_BLOCKNATIVE_DAPP_ID as string,
              walletSelect: {
                wallets: [{ walletName: 'metamask', preferred: true }],
              },
              subscriptions: {
                network: network =>
                  network && console.log('chainId: ', network),
                balance: amount =>
                  amount && console.log('balance: ', utils.formatEther(amount)),
              },
            }}
            checkNetwork={false}
            gasPricePollingInterval={120}
            gasPriceSetting="fast"
          >
            <NetworkManagerProvider>
              <ChainbridgeProvider>
                <Router>
                  <AppWrapper>
                    <Routes />
                  </AppWrapper>
                </Router>
              </ChainbridgeProvider>
            </NetworkManagerProvider>
          </Web3Provider>
        </ToasterProvider>
      </ThemeSwitcher>
    </ErrorBoundary>
  );
};

export default App;
