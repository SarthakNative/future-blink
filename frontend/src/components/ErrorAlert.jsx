import React from 'react';
import { Alert, Snackbar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ErrorAlert = ({ error, open, onClose }) => {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  if (!error) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ width: '100%' }}
      >
        {typeof error === 'string' ? error : error.message || 'An error occurred'}
      </Alert>
    </Snackbar>
  );
};

export default ErrorAlert;