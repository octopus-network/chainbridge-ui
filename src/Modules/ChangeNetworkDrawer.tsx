import React from 'react';

import { makeStyles, createStyles, ITheme } from '@chainsafe/common-theme';
import { Button, Typography } from '@chainsafe/common-components';
import CustomDrawer from '../Components/Custom/CustomDrawer';
import { useNetworkManager } from '../Contexts/NetworkManagerContext';
import { useHomeBridge } from '../Contexts/HomeBridgeContext';
import { useDestinationBridge } from '../Contexts/DestinationBridgeContext';

const useStyles = makeStyles(({ constants }: ITheme) =>
  createStyles({
    root: {},
    buttons: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      '& button': {
        fontSize: '14px',
        height: '40px',
        borderRadius: '40px',
      },
      '& > *': {
        marginTop: constants.generalUnit * 2,
        marginRight: constants.generalUnit,
        textDecoration: 'none',
      },
    },
    paragraph: {
      margin: `${constants.generalUnit * 3}px 0`,
    },
  }),
);

interface IChangeNetworkDrawerProps {
  open: boolean;
  close: () => void;
}

const ChangeNetworkDrawer: React.FC<IChangeNetworkDrawerProps> = ({
  open,
  close,
}) => {
  const classes = useStyles();

  const {
    setWalletType,
    handleSetHomeChain,
    setDestinationChain,
  } = useNetworkManager();
  const { disconnect } = useHomeBridge();
  const destinationBridge = useDestinationBridge();

  return (
    <CustomDrawer open={open} className={classes.root}>
      <Typography variant="h3" component="h2">
        Changing Networks
      </Typography>
      <Typography className={classes.paragraph} component="p" variant="h5">
        To change networks, please open your browser wallet and change networks
        there. If your wallet does not support your desired home network, please
        connect a different wallet. <br />
        <br />
        Note: your transfer settings will be reset.
      </Typography>
      <section className={classes.buttons}>
        <Button onClick={close} variant="outline">
          OK
        </Button>
        <Button
          onClick={async () => {
            // TODO: trigger unsubscribes & clear all state
            await Promise.all([destinationBridge.disconnect(), disconnect()]);
            handleSetHomeChain(undefined);
            setDestinationChain(undefined);
            setWalletType('unset');
          }}
          variant="outline"
        >
          Connect different wallet
        </Button>
      </section>
    </CustomDrawer>
  );
};

export default ChangeNetworkDrawer;
