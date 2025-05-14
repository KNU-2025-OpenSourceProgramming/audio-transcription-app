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