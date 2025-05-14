import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Paper, CircularProgress } from '@mui/material';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState('Not Connected');
  const fileInputRef = React.useRef(null);

  function setupWebSocket() {
    const socket = new WebSocket('ws://localhost:3000/ws');

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setWsStatus('Connected');
    };

    socket.onmessage = (event) => {
      console.log('Message from server: ', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'transcription_update') {
        setTranscription(data.text);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error: ', error);
      setWsStatus('Connection Error');
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.error('Connection lost');
      }
      setWsStatus('Not Connected');
      setTimeout(setupWebSocket, 5000);
    };

    return socket;
  }

  useEffect(() => {
    const socket = setupWebSocket();
    return () => {
      socket.close();
    };
  }, []);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select an audio file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      setTranscription('File uploaded, waiting for transcription...');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Audio Transcription App
          </Typography>
          <Typography variant="body2" sx={{ marginRight: 2 }}>
            WebSocket Status: {wsStatus}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ marginTop: 5 }}>
        <Paper elevation={3} sx={{ padding: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleFileClick}
            sx={{ marginRight: 2 }}
          >
            Select Audio File
            {file && <Typography variant="caption" sx={{ marginLeft: 1 }}>
              ({file.name})
            </Typography>}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload Audio'}
          </Button>

          {transcription && (
            <Paper elevation={1} sx={{ marginTop: 2, padding: 2 }}>
              <Typography variant="h6">Transcription Result:</Typography>
              <Typography>{transcription}</Typography>
            </Paper>
          )}
        </Paper>
      </Container>
    </div>
  );
}

export default App;
