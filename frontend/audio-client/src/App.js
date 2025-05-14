import React, { useState, useRef, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  TextField,
  CircularProgress,
} from '@mui/material';
import './App.css';

function App() {
  // --- 状态定义 ---
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [transcriptions, setTranscriptions] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  const [websocketUrl, setWebsocketUrl] = useState(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/audio`;
  });

  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- 上传音频文件 ---
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
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('Upload successful:', data);
      setTranscription('File uploaded, waiting for transcription...');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  // --- 录音相关 ---
  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      sendAudioData();
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioData = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const reader = new FileReader();
    reader.onloadend = () => {
      const buffer = reader.result;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(buffer);
      }
      audioChunksRef.current = [];
    };
    reader.readAsArrayBuffer(audioBlob);
  };

  // --- WebSocket 连接 ---
  const setupWebSocket = () => {
    socketRef.current = new WebSocket(websocketUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket is connected.');
    };

    socketRef.current.onmessage = (event) => {
      setTranscriptions((prev) => [...prev, event.data]);
    };

    socketRef.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket closed');
    };
  };

  useEffect(() => {
    setupWebSocket();
    return () => {
      socketRef.current?.close();
    };
  }, [websocketUrl]);

  // --- UI 渲染 ---
  return (
    <Container>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Audio Transcription App</Typography>
        </Toolbar>
      </AppBar>

      <Box mt={2}>
        <TextField
          label="WebSocket URL"
          value={websocketUrl}
          fullWidth
          onChange={(e) => setWebsocketUrl(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Button
          variant="contained"
          onClick={handleStartRecording}
          disabled={isRecording}
        >
          Start Recording
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleStopRecording}
          disabled={!isRecording}
          sx={{ ml: 2 }}
        >
          Stop Recording
        </Button>
      </Box>

      <Box mt={4}>
        <Paper sx={{ p: 3 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            style={{ display: 'none' }}
          />
          <Button onClick={handleFileClick} variant="outlined" sx={{ mr: 2 }}>
            Select Audio File
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!file || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload Audio'}
          </Button>
          {file && (
            <Typography variant="caption" sx={{ ml: 2 }}>
              ({file.name})
            </Typography>
          )}
        </Paper>
      </Box>

      <Box mt={4}>
        {transcription && (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6">Transcription Result:</Typography>
            <Typography>{transcription}</Typography>
          </Paper>
        )}
        {transcriptions.length > 0 && (
          <Box className="transcription-container">
            {transcriptions.map((t, i) => (
              <div key={i} className="chat-bubble">{t}</div>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
