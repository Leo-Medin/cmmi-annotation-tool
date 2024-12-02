import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, TextField, Box, Snackbar, Alert } from '@mui/material';
import { Severity } from '@/utils/appTypes';

const initialRequest = "What's in this image?"

const AIAssistant = ({ imageUrl }: { imageUrl: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState(initialRequest);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ children: string; severity: Severity } | null>(null)

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setUserInput(initialRequest);
    setIsOpen(false);
  }

  const handleSubmit = async () => {
    setLoading(true);
    setAiResponse(''); // Clear previous response

    const url = window.location.protocol + "//" + window.location.host + '/api/ai/';
    const reqBody = {
        mode: 'process-vision-request',
        text: userInput,
        imageUrl
    }
    await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
    })
    .then(response => response.json())
    .then((result) => {
        if (result.status) {
            setAiResponse(result.response)
        }
        else {
            setSnackbar({ children: result.message? result.message: 'Something went wrong in handleSubmit() API request', severity: 'error' })
        }
    })
    .finally(()=>{
        setLoading(false);
    })
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        style={{ position: 'fixed', bottom: 20, right: 20 }}
        onClick={handleOpen}
      >
        Assistant AI
      </Button>
      <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>AI Assistant</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter your request"
            variant="outlined"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading}
            margin="dense"
          />
          {loading ? (
            <Box display="flex" justifyContent="center" marginTop={2}>
              <CircularProgress />
            </Box>
          ) : (
            <TextField
              fullWidth
              label="AI Response"
              variant="outlined"
              value={aiResponse}
              disabled
              margin="dense"
              multiline
              rows={6}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} color="primary" disabled={loading || !userInput}>
            Submit
          </Button>
          <Button onClick={handleClose} color="secondary" disabled={loading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      {!!snackbar && (
        <Snackbar
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={() => setSnackbar(null)}
          autoHideDuration={6000}
        >
          <Alert {...snackbar} onClose={() => setSnackbar(null)} />
        </Snackbar>
      )}
    </>
  );
};

export default AIAssistant;
