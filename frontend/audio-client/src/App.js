import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import logo from './logo.svg';
import './App.css';

function App() {
  function setupWebSocket() {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      console.log('Message from server ', event.data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error: ', error);
      // 改善错误处理逻辑
      alert('WebSocket error occurred. Please try again later.');
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.error('Connection died');
        // 尝试重新连接
        setTimeout(setupWebSocket, 5000);
      }
    };
  }

  // 在组件挂载时调用setupWebSocket
  React.useEffect(() => {
    setupWebSocket();
  }, []);

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Audio Transcription App
          </Typography>
          <Button color="inherit" style={{ backgroundColor: '#3f51b5', color: '#fff', margin: '0 10px' }}>Login</Button>
        </Toolbar>
      </AppBar>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
