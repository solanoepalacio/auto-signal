import React, { useState } from 'react';
import { Button, Typography } from '@material-ui/core';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import SpaceBarIcon from '@material-ui/icons/SpaceBar';
import MouseIcon from '@material-ui/icons/Mouse';


export default function HelpDialog() {
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  return (
    <div className="help-button" onClick={() => setHelpDialogOpen(true)}>
      <Typography >Help</Typography>
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Keyboard Reference:</DialogTitle>
        <DialogContent>
          <div className="keyboard-help">
            <ArrowUpwardIcon />
            <DialogContentText>Borra todas las lineas dibujadas (en el video)</DialogContentText>
          </div>
          <div className="keyboard-help">
            <ArrowForwardIcon />
            <DialogContentText>Mueve la seleccion hacia la derecha</DialogContentText>
          </div>
          <div className="keyboard-help">
            <ArrowBackIcon />
            <DialogContentText>Mueve la seleccion hacia la izquierda</DialogContentText>
          </div>
          <div className="keyboard-help">
            <ArrowDownwardIcon />
            <DialogContentText>Borra la ultima linea dibujada (en el video)</DialogContentText>
          </div>

          <div className="keyboard-help">
            <SpaceBarIcon />
            <DialogContentText>Presiona esta tecla para dibujar</DialogContentText>
          </div>

          <div className="keyboard-help">
            <MouseIcon />
            <DialogContentText>Une la imagen seleccionada al grupo de la derecha</DialogContentText>
          </div>
        </DialogContent>
        {/* <DialogActions>
            <Button variant="contained" onClick={handleSavePatient} color="primary">
              <SaveIcon></SaveIcon>
            </Button>
          </DialogActions> */}
      </Dialog>
    </div>

  )
}