# GitHub 协作冲刺实践场景

本文档提供了利用 Flask 服务器和 React 前端，让 4 名开发者通过 GitHub 协作进行冲刺实践的场景。所有步骤都为初学者配置，易于遵循。

## 目录

1.  [初步准备](#1-%EC%82%AC%EC%A0%84-%EC%A4%80%EB%B9%84)
2.  [项目初始化 (PM: dev1)](#2-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%B4%88%EA%B8%B0%ED%99%94 m-dev1)
3.  [开发者环境设置](#3-%EA%B0%9C%EB%B0%9C%EC%9E%90-%ED%99%98%EA%B2%BD-%EC%84%A4%EC%A0%95)
4.  [计划冲刺及问题注册](#4-%EC%8A%A4%ED%94%84%EB%A6%B0%ED%8A%B8-%EA%B3%84%ED%9A%8D-%EB%B0%8F-%EC%9D%B4%EC%8A%88-%EB%93%B1%EB%A1%9D)
5.  [开发及协作工作流程](#5-%EA%B0%9C%EB%B0%9C-%EB%B0%8F-%ED%98%91%EC%97%85-%EC%9B%8C%ED%81%AC%ED%94%8C%EB%A1%9C%EC%9A%B0)
6.  [代码冲突解决场景](#6-%EC%BD%94%EB%93%9C-%EC%B6%A9%EB%8F%8C-%ED%95%B4%EA%B2%B0-%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4)
7.  [项目构建及最终部署](#7-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EB%B9%8C%EB%93%9C-%EB%B0%8F-%EC%B5%9C%EC%A2%85-%EB%B0%B0%ED%8F%AC)

## 1\. 准备工作

### 1.1 Docker 容器连接信息

*   **dev1 (PM)**: `ssh dev1@localhost   22` (密码: dev1)
*   **dev2**: `ssh dev2@localhost   22` (密码: dev2)
*   **dev3**: `ssh dev3@localhost   22` (密码: dev3)
*   **dev4**: `ssh dev4@localhost   22` (密码: dev4)

### 1.2 GitHub 账户及个人访问令牌

1.  如果没有 GitHub 账户，请到 [GitHub 注册](https://github.com/signup) 创建。
2.  [创建 GitHub 个人访问令牌](https://github.com/settings/tokens) ：
    *   GitHub 网站右上角个人资料图标 → 设置 → 开发者设置 → 个人访问令牌 → 令牌（经典）
    *   点击“生成新令牌” → 选择“生成新令牌（经典）”
    *   注意：“GitHub 协作实践令牌”
    *   权限设置： `仓库` 、 `工作流` 勾选
    *   点击“生成令牌” → 将生成的令牌复制到安全的地方保存。

## 项目初始化 (PM: dev1)

### 2.1 创建 GitHub 仓库 (通过网页界面执行)

1.  登录 GitHub → 点击 "+" 图标 → 选择 "新建仓库"
2.  仓库设置：
    *   Repository name: `audio-transcription-app`
    *   Description: `基于 Whisper 的实时语音识别应用`
    *   可见性：选择公开或私有
    *   使用 README 初始化此代码仓库
    *   .gitignore：选择 Node
    *   许可证：选择 MIT
3.  点击“创建代码仓库”

### 2.2 GitHub Actions 密钥设置（通过网页界面执行）

1.  创建的存储库页面 → "设置" 标签页 → 左侧 "密钥和变量" → "操作"
2.  点击 "新建存储库密钥"
3.  名称：`NGROK_AUTH_TOKEN`
4.  Value: 从 ngrok 获取的认证令牌
5.  点击 "添加密钥"

### 2.3 在网页界面创建 GitHub 项目

1.  GitHub 仓库页面 → "项目" 标签 → 点击 "创建项目"
2.  选择“看板”模板 → 点击“创建”
3.  项目名称：“语音识别应用 Sprint 1”
4.  保持默认创建的列：“待办”、“进行中”、“完成”

### 创建 2.4 分支（在网页界面执行）

1.  GitHub 仓库页面 → "代码" 标签页 → 点击分支选择下拉菜单
2.  在 "新建分支" 输入框中输入 `develop` → 点击 "创建分支：develop"

### 下午 2:30 初始开发环境设置 (dev1 账户)

```bash
# dev1 用户通过 Docker 容器连接 (使用 VSCode Remote-SSH 或 PuTTY)
# 创建工作目录
mkdir    
cd  

# 克隆仓库
git clone https://github.com/{GitHub用户名}/audio-transcription-app.git .
# 在提示中输入 GitHub 用户名和个人访问令牌

# 切换到 develop 分支
git checkout develop

# 创建项目目录结构
mkdir backend/www frontend

# 编写 Flask 后端代码
cat > backend/app.py << 'EOF'
from flask import Flask, render_template
from flask_cors import CORS
from flask_sock import Sock
import ssl
import whisper
import io
import numpy as np
import torch
import soundfile as sf

app = Flask(__name__,
    template_folder='./www',
    static_folder='./www',
    static_url_path='/'
)
CORS(app)  # 允许所有域的访问
sock = Sock(app)
model = whisper.load_model("base")

@app.route('/')
def index():
    return render_template('index.html')

@sock.route('/audio')
def handle_audio(ws):
    while True:
        data = ws.receive()
        if data is None:
            break
        
        audio_stream = io.BytesIO(data)
        audio_stream.seek(0)  # 移动到流的开始

        try:
            # 将音频数据保存为 .wav 文件
            with open('received_audio.wav', 'wb') as f:
                f.write(audio_stream.read())

            # 将 .wav 文件传递给 Whisper 模型进行识别
            result = model.transcribe('received_audio.wav')
            ws.send(result['text'])
        except Exception as e:
            print(f'Error: {e}')
            ws.send('Error processing audio')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
EOF

# 初始化前端 (React)
cd  /frontend
npx create-react-app audio-client

# 创建后端 www 目录
mkdir    /backend/www

# 创建初始 index.html
cat >  /backend/www/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>음성 인식 앱</title>
</head>
<body>
    <h1>음성 인식 앱 - 초기 설정 완료</h1>
    <p>프로젝트가 성공적으로 초기화되었습니다!</p>
</body>
</html>
EOF

# 配置 GitHub Actions CI/CD 工作流
mkdir    /.github/workflows

cat >  /.github/workflows/ci-cd.yml << 'EOF'
name: CI/CD 파이프라인

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Python 설정
      uses: actions/setup ython@v2
      with:
        python-version: '3.10'
    
    - name: Python 의존성 설치
      run: |
        python -m pip install --upgrade pip
        pip install flask flask-cors flask-sock torch soundfile numpy
        pip install git+https://github.com/openai/whisper.git
    
    - name: Node.js 설정
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: 프론트엔드 의존성 설치
      run: |
        cd frontend/audio-client
        npm install
    
    - name: 프론트엔드 빌드
      run: |
        cd frontend/audio-client
        npm run build
        mkdir   ../../backend/www
        cp -r build/* ../../backend/www/
    
    - name: ngrok 설치
      run: |
        wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
        tar xvzf ngrok-v3-stable-linux-amd64.tgz
        chmod +x ngrok
    
    - name: 애플리케이션 실행 및 ngrok 터널 열기
      env:
        NGROK_AUTH_TOKEN: ${{ secrets.NGROK_AUTH_TOKEN }}
      run: |
        ./ngrok config add-authtoken $NGROK_AUTH_TOKEN
        cd backend
        python app.py &
        sleep 5
        ../ngrok http 3000 --log=stdout > ngrok.log &
        sleep 5
        NGROK_URL=$(grep -o 'https://.*\.ngrok-free\.app' ngrok.log | head -n 1)
        echo "애플리케이션이 다음 URL에서 5분간 접속 가능합니다: $NGROK_URL"
        echo "NGROK_URL=$NGROK_URL" >> $GITHUB_ENV
    
    - name: 테스트 URL 출력
      run: |
        echo "애플리케이션 URL: ${{ env.NGROK_URL }}"
        echo "5분 후 URL은 만료됩니다. 테스트를 서둘러 진행해 주세요."
        sleep 300
EOF

# 指定后端需求
cat >  /backend/requirements.txt << 'EOF'
flask
flask-cors
flask-sock
openai-whisper
torch
soundfile
numpy
EOF

# 提交更改
cd  
git add .
git commit -m "初始项目结构设置及 CI/CD 工作流配置"
git push origin develop

# 将初始项目结构合并到 main 分支 (重要: 仅合并初始设置)
git checkout main
git merge develop
git push origin main
```

## 3\. 开发者环境设置

### 3.1 开发者通用环境设置（所有开发者）

> **参考** ：每个开发者（dev1~dev4）都通过相同的过程设置开发环境。

```bash
# 开发者账户通过 Docker 容器连接 (使用 VSCode Remote-SSH)

# 创建工作目录
mkdir    
cd  

# 克隆仓库
git clone https://github.com/{GitHub用户名}/audio-transcription-app.git .
# 在提示中输入 GitHub 用户名和个人访问令牌

# 切换到 develop 分支
git checkout develop

# 安装 Node.js 依赖项 (仅前端开发者需要)
cd  /frontend/audio-client
npm install

# 在 VS Code 中打开项目
# 使用 VS Code Remote-SSH 扩展连接到每个开发者账户后
# "File" > "Open Folder" >   选择
```

## 4\. 计划冲刺及问题登记

### 4.1 冲刺计划会议（项目经理：dev1）

PM 与团队成员一起进行冲刺计划会议，并按如下方式分配工作。

1.  **dev1 (PM)**:
    
    *   项目初始化及 CI/CD 设置
    *   最终整合及部署监督
2.  **开发人员 2**:
    
    *   后端设置及音频处理功能实现
    *   Flask 服务器优化
3.  **开发人员 3**:
    
    *   前端基础结构设置
    *   React 应用 UI 组件实现
4.  **dev4**:
    
    *   前端-后端整合及 WebSocket 连接
    *   测试及文档化

### 4.2 GitHub 问题注册 (PM: dev1, 在网页界面执行)

1.  GitHub 仓库页面 → "问题" 标签 → "新建问题" 点击
2.  创建下一个问题：

**问题 1：后端设置及音频处理功能实现**

*   标题："后端设置及音频处理功能实现"
*   描述:
    
    ```
    设置 Flask 服务器并通过 WebSocket 实现音频处理功能。
    
    任务:
    - 优化 Flask 服务器配置
    - 检查 Whisper 模型设置
    - 验证音频流处理逻辑
    - 添加错误处理及日志记录
    
    负责人: @dev2
    ```
    
*   指派给：dev2
*   标签："后端", "增强"
*   项目："语音识别应用冲刺1" 选择 → "待办" 状态设置

**问题 2：前端基本结构设置**

*   标题："前端基本结构设置"
*   说明：
    
    ```
    设置 React 应用的基本结构并实现 UI 组件。
    
    任务:
    - 配置 React 项目
    - 实现 AppBar 和 UI 组件
    - 布局及样式设计
    
    负责人: @dev3
    ```
    
*   指派：dev3
*   标签： "前端", "增强"
*   项目： "语音识别应用冲刺1" 选择 → "待办" 状态设置

**问题 3：前端-后端集成及 WebSocket 连接**

*   标题："前端-后端集成及 WebSocket 连接"
*   说明:
    
    ```
    实现 React 应用与 Flask 服务器之间的 WebSocket 连接。
    
    任务:
    - 实现 WebSocket 连接
    - 音频录制及传输功能
    - 响应处理及显示
    - 测试及文档化
    
    负责人: @dev4
    ```
    
*   指派：dev4
*   标签："集成", "增强"
*   项目："语音识别应用冲刺1" 选择 → "待办" 状态设置

### 4.3 问题通知 (PM: dev1)

PM 通过电子邮件或消息通知每个团队成员其分配的问题。在 GitHub 中，当问题自动分配给开发人员时，系统会自动向其发送电子邮件。

## 5\. 开发及协作流程

### 5.1 开发者分支创建及工作

#### 5.1.1 后端开发者（dev2）工作

```bash
# dev2 用户登录后
cd  

# 确认当前分支为 develop
git branch

# 创建并切换到功能分支
git checkout -b feature/backend-setup

# 更改问题状态 (在网页界面中)
# 在 "语音识别应用冲刺1" 项目中将相关问题拖动到 "进行中"

# 修改后端代码 (在 VS Code 中编辑)
# 打开 app.py 文件，添加注释并优化日志功能

cd  /backend
# 验证代码并测试
conda activate whisper_env
python app.py
# 在浏览器中访问 http://localhost:3000 进行测试

# 提交更改
git add .
git commit -m "优化后端设置及添加日志功能"
git push origin feature/backend-setup

# 创建拉取请求 (在网页界面中)
# GitHub 仓库页面 → "拉取请求" 标签 → 点击 "新建拉取请求"
# base: develop ← compare: feature/backend-setup 选择
# 标题: "后端设置及音频处理功能实现"
# 在描述中添加 "Closes #1" 以链接问题
# 点击 "创建拉取请求"

# 更改问题状态 (在网页界面中)
# 在 "语音识别应用冲刺1" 项目中将相关问题拖动到 "完成"
```

#### 5.1.2 前端基础结构开发者（dev3）工作

```bash
# dev3 用户登录后
cd  

# 创建并切换到功能分支
git checkout -b feature/frontend-setup

# 更改问题状态 (在网页界面中)
# 在 "语音识别应用冲刺1" 项目中将相关问题拖动到 "进行中"

# 编写前端代码
cd  /frontend/audio-client

# 修改 App.js 文件
cat > src/App.js << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import './App.css';

function App() {
  // 根据当前 URL 自动生成 WebSocket URL
  const getDefaultWebsocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/audio`;
  };

  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [websocketUrl, setWebsocketUrl] = useState(getDefaultWebsocketUrl());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);

  const handleWebSocketUrlChange = (event) => {
    setWebsocketUrl(event.target.value);
  };

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
      const audioArrayBuffer = reader.result;
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(audioArrayBuffer);
      }
      audioChunksRef.current = [];
    };
    reader.readAsArrayBuffer(audioBlob);
  };

  const setupWebSocket = () => {
    socketRef.current = new WebSocket(websocketUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket is connected.');
    };

    socketRef.current.onmessage = (event) => {
      setTranscriptions((prev) => [...prev, event.data]);
    };

    socketRef.current.onclose = (event) => {
      console.log('WebSocket is closed.', event);
    };

    socketRef.current.onerror = (error) => {
      console.log('WebSocket error:', error);
    };
  };

  useEffect(() => {
    setupWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [websocketUrl]);

  return (
    <Container>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Audio Recorder</Typography>
        </Toolbar>
      </AppBar>
      <Box mt={2}>
        <TextField
          label="WebSocket URL"
          variant="outlined"
          fullWidth
          value={websocketUrl}
          onChange={handleWebSocketUrlChange}
          style={{ marginBottom: 16 }}
        />
        <Button
          variant="contained"
          color="primary"
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
          style={{ marginLeft: 16 }}
        >
          Stop Recording
        </Button>
      </Box>
      <div className="transcription-container">
        {transcriptions.map((text, index) => (
          <div
            key={index}
            className="chat-bubble"
          >
            {text}
          </div>
        ))}
      </div>
    </Container>
  );
}

export default App;
EOF

# 添加 CSS 样式
cat > src/App.css << 'EOF'
.transcription-container {
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.chat-bubble {
  background-color: #f1f0f0;
  border-radius: 10px;
  padding: 10px 15px;
  margin: 10px 0;
  max-width: 80%;
  word-wrap: break-word;
}
EOF

# 修改 package.json - 添加 Material UI 依赖项
npm install @mui/material @emotion/react @emotion/styled

# 测试代码
npm start
# 在浏览器中访问 http://localhost:3000 进行测试

# 提交更改
git add .
git commit -m "实现前端基本结构及 UI 组件"
git push origin feature/frontend-setup

# 创建拉取请求 (在网页界面中)
# GitHub 仓库页面 → "拉取请求" 标签 → 点击 "新建拉取请求"
# base: develop ← compare: feature/frontend-setup 选择
# 标题: "设置前端基本结构"
# 在描述中添加 "Closes #2" 以链接问题
# 点击 "创建拉取请求"

# 更改问题状态 (在网页界面中)
# 在 "语音识别应用冲刺1" 项目中将相关问题拖动到 "完成"
```

#### 5.1.3 前端-后端集成开发人员（dev4）工作

```bash
# dev4 用户登录后
cd  

# 创建并切换到功能分支 (PR 合并后进行)
git checkout develop
git pull  # 获取最新更改
git checkout -b feature/integration

# 更改问题状态 (在网页界面中)
# 在 "语音识别应用冲刺1" 项目中将相关问题拖动到 "进行中"

# 构建前端并集成后端
cd  /frontend/audio-client
npm run build

# 将构建结果复制到后端 static 文件夹
mkdir    /backend/www
cp -r build/*  /backend/www/

# 集成测试
cd  /backend
conda activate whisper_env
python app.py
# 在浏览器中访问 http://localhost:3000 进行测试

# 提交更改
git add .
git commit -m "完成前端-后端集成及测试"
git push origin feature/integration

# 创建拉取请求 (在网页界面中)
# GitHub 仓库页面 → "拉取请求" 标签 → 点击 "新建拉取请求"
# base: develop ← compare: feature/integration 选择
# 标题: "前端-后端集成及 WebSocket 连接"
# 在描述中添加 "Closes #3" 以链接问题
# 点击 "创建拉取请求"

# 更改问题状态 (在网页界面中)
# 在 "语音识别应用冲刺1" 项目中将相关问题拖动到 "完成"
```

### 5.2 PR 审核及批准（项目经理：dev1）

项目经理将审核并批准每个 PR。在网页界面进行。

1.  GitHub 仓库页面 → "拉取请求" 标签
2.  点击每个 PR → 在“已更改文件”选项卡中检查代码
3.  代码审查完成后 → 选择“审查更改”→ 选择“批准”→ 点击“提交审查”
4.  点击“合并拉取请求”→ 点击“确认合并”

## 6\. 代码冲突解决场景

以下是多个开发者在同时工作时可能出现的代码冲突场景及解决方法。

### 6.1 冲突场景设置

假设开发者 2 名（dev3，dev4）同时修改 App.js 文件。

#### 6.1.1 dev3 的工作

```bash
# dev3 用户登录后
cd  
git checkout develop
git pull  # 获取最新更改
git checkout -b feature/ui-improvements

# 修改 App.js 文件 (更改标题及按钮样式)
# 在 VS Code 中打开 frontend/audio-client/src/App.js 文件
# 将 AppBar 的标题更改为 "Audio Transcription App"
# 改善按钮样式

# 提交更改
git add .
git commit -m "改善 UI 标题及按钮样式"
git push origin feature/ui-improvements

# 创建拉取请求 (在网页界面中)
```

#### 6.1.2 dev4 的工作

```bash
# dev4 用户登录后
cd  
git checkout develop
git pull  # 获取最新更改
git checkout -b feature/websocket-improvements

# 修改 App.js 文件 (改善 WebSocket 连接逻辑)
# 在 VS Code 中打开 frontend/audio-client/src/App.js 文件
# 改善 setupWebSocket 函数中的错误处理

# 提交更改
git add .
git commit -m "改善 WebSocket 连接及错误处理"
git push origin feature/websocket-improvements

# 创建拉取请求 (在网页界面中)
```

### 6.2 冲突解决过程

dev3 的 PR 首先被批准并合并后，dev4 创建 PR 时会发生冲突。

#### 6.2.1 冲突解决（dev4）

```bash
# dev4 用户登录后
git checkout feature/websocket-improvements
git fetch origin
git merge origin/develop

# 解决冲突 (在 VS Code 中查看冲突标记并修改)
# 编辑冲突文件后保存

# 解决冲突后提交
git add .
git commit -m "解决冲突: 合并 WebSocket 改善及 UI 改善"
git push origin feature/websocket-improvements

# 更新拉取请求 (在网页界面中确认冲突已解决)
```

## 项目构建及最终部署

### 7.1 从 develop 分支合并到 main 分支（PM：dev1）

```bash
# dev1 用户登录后
cd  
git checkout develop
git pull  # 获取最新更改

# 最终验证 develop 分支
cd backend
conda activate whisper_env
python app.py
# 在浏览器中访问 http://localhost:3000 进行最终测试

# 创建 Release 分支
git checkout -b release/v1.0
git push origin release/v1.0

# 创建拉取请求 (在网页界面中)
# base: main ← compare: release/v1.0 选择
# 标题: "发布 v1.0: 语音识别应用第一个版本"
# 点击 "创建拉取请求"
```


### 7.2 发布及部署（通过网页界面执行）

1.  GitHub 仓库页面 → "拉取请求" 标签页 → 点击 release PR
2.  PR 审查及批准 → "合并拉取请求" → "确认合并"
3.  GitHub 仓库页面 → "操作" 标签 → CI/CD 工作流执行确认
4.  在工作流日志中确认 ngrok URL 以测试已部署的应用

### 创建 7.3 版本标签（在网页界面中执行）

1.  GitHub 仓库页面 → "代码" 标签 → "发布" 部分 → "创建新发布"
2.  标签版本: "v1.0.0"
3.  目标: main 分支
4.  发布标题: "语音识别应用 v1.0.0"
5.  撰写说明：
    
    ```
    第一个正式发布版本。
    
    主要功能:
    - 实时语音识别及文本转换
    - 通过 WebSocket 进行音频流传输
    - 用户友好的 UI
    
    此版本已完成冲刺1的所有目标。
    ```
    
6.  点击“发布版本”

## 结论

通过这个冲刺场景，4 名开发者实践了利用 GitHub 进行协作的整个流程。参与者们体验了从问题管理、分支创建、代码审查、冲突解决、CI/CD 管道配置到最终部署的整个过程。

这些练习将有助于理解实际开发环境中的团队协作方式。