import React, { useState } from 'react';
import { Button, Typography, Grid, TextField, Box } from '@material-ui/core';
import landmarksImg from './handlandmarks.png'
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import SettingsIcon from '@material-ui/icons/Settings';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Divider from '@material-ui/core/Divider';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

export default function ConfigDialog({ onLandmarkChange, landmarkConfig, onPinchConfigSwitch, pinchConfig, handConfig, onHandConfigChange }) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  return (
    <div onClick={() => setConfigDialogOpen(true)}>
      <SettingsIcon />
      <Dialog fullWidth={true} open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Configuration:</DialogTitle>
        <DialogContent>
        <FormGroup row>
            <FormControlLabel
              labelPlacement="start"
              control={
                <RadioGroup aria-label="gender" name="gender1" value={handConfig} onChange={({ target: { value }}) => onHandConfigChange(value)}>
                  <FormControlLabel value="left" control={<Radio />} label="Left" />
                  <FormControlLabel value="right" control={<Radio />} label="right" />
              </RadioGroup>
              }
              label="Hand to use"
            />
          </FormGroup>
          <Divider />
          <FormGroup row>
            <FormControlLabel
              labelPlacement="start"
              control={
                <Switch
                  checked={pinchConfig}
                  onChange={(e) => onPinchConfigSwitch(e)}
                />
              }
              label="Move objects using pinch"
            />
          </FormGroup>
          <Divider />
          
            <FormGroup  row>
              <FormControlLabel
                labelPlacement="start"
                control={<TextField
                  margin="normal"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 21 } }}
                  value={landmarkConfig}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                }
                onChange={({ target: { value }}) => onLandmarkChange(value)}
                color="secondary"
                label="Hand Landmark used to draw (0 - 21)"
              />
              <img style={{ margin: '1.2rem 0' }}src={landmarksImg} width="90%%"></img>
            </FormGroup>
        </DialogContent>
      </Dialog>
    </div>

  )
}