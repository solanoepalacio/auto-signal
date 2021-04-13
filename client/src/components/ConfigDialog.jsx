import React, { useState } from 'react';
import { Button, Typography } from '@material-ui/core';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import SettingsIcon from '@material-ui/icons/Settings';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import SpaceBarIcon from '@material-ui/icons/SpaceBar';
import MouseIcon from '@material-ui/icons/Mouse';


export default function ConfigDialog() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  return (
    <div onClick={() => setConfigDialogOpen(true)}>
      <SettingsIcon />
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Configuration:</DialogTitle>
        <DialogContent>
            <DialogContentText>Une la imagen seleccionada al grupo de la derecha</DialogContentText>
        </DialogContent>
      </Dialog>
    </div>

  )
}