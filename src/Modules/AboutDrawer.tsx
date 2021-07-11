import React from 'react';

import { makeStyles, createStyles, ITheme } from '@chainsafe/common-theme';
import { Button, Typography } from '@chainsafe/common-components';
import CustomDrawer from '../Components/Custom/CustomDrawer';

const useStyles = makeStyles(({ constants }: ITheme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    buttons: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      '& button': {
        fontSize: '14px',
        height: '40px',
        borderRadius: '40px',
      },
      '& *': {
        marginRight: constants.generalUnit,
        textDecoration: 'none',
      },
    },
  }),
);

interface IAboutDrawerProps {
  open: boolean;
  close: () => void;
}

const AboutDrawer: React.FC<IAboutDrawerProps> = ({
  open,
  close,
}: IAboutDrawerProps) => {
  const classes = useStyles();

  return (
    <CustomDrawer onClose={close} open={open} className={classes.root}>
      <Typography variant="h1" component="h4">
        What is ChainBridge?
      </Typography>
      <Typography component="p" variant="h5">
        ChainBridge is a modular multi-directional blockchain bridge to allow
        data and value transfer between any number of blockchains. This should
        enable users to specify a destination blockchain from their source
        chain, and send data to that blockchain for consumption on the
        destination chain. <br />
        <br />
        This could be a token that is locked on ChainA and redeemed on ChainB,
        or an operation that is executed on a destination chain and initiated on
        the source chain.
      </Typography>
      <section className={classes.buttons}>
        <Button onClick={() => close()} variant="outline">
          OK
        </Button>
      </section>
    </CustomDrawer>
  );
};

export default AboutDrawer;
