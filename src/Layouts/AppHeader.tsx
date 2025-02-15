import { createStyles, ITheme, makeStyles } from '@chainsafe/common-theme';
import React from 'react';
import clsx from 'clsx';
import { Typography } from '@chainsafe/common-components';
import { shortenAddress } from '../Utils/Helpers';
import { useChainbridge } from '../Contexts/ChainbridgeContext';
import CentrifugeLogo from '../media/centrifuge_wordmark.svg?component';

const useStyles = makeStyles(({ constants, palette, zIndex }: ITheme) =>
  createStyles({
    root: {
      display: 'flex',
      position: 'fixed',
      justifyContent: 'space-between',
      padding: `${constants.generalUnit * 2}px ${constants.generalUnit * 4}px`,
      width: '100%',
      top: 0,
      left: 0,
      backgroundColor: '#FFFFFF',
      color: palette.additional.header[2],
      alignItems: 'center',
      zIndex: zIndex?.layer2,
    },
    left: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    state: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    indicator: {
      display: 'block',
      height: 10,
      width: 10,
      borderRadius: '50%',
      backgroundColor: palette.additional.green[6],
      marginRight: constants.generalUnit,
    },
    address: {
      marginRight: constants.generalUnit,
    },
    network: {},
  }),
);

const AppHeader: React.FC = () => {
  const classes = useStyles();
  const { homeConfig, isReady, address } = useChainbridge();
  return (
    <header className={clsx(classes.root)}>
      <div className={classes.left}>
        <CentrifugeLogo />
      </div>
      <section className={classes.state}>
        {!isReady ? (
          <Typography variant="h5">No wallet connected</Typography>
        ) : (
          <>
            <div className={classes.indicator} />
            <Typography variant="h5" className={classes.address}>
              {address && shortenAddress(address)}
            </Typography>
            <Typography variant="h5" className={classes.address}>
              connected to <strong>{homeConfig?.name}</strong>
            </Typography>
          </>
        )}
      </section>
    </header>
  );
};

export default AppHeader;
