from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_sock import Sock
import ssl
import whisper
import io
import numpy as np
import torch
import soundfile as sf
import os
from werkzeug.utils import secure_filename
import json

app = Flask(__name__,
    template_folder='./www',
    static_folder='./www',
    static_url_path='/'
)
CORS(app)  # 允许所有域的访问
sock = Sock(app)
model = whisper.load_model("base")

# 确保上传目录存在
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # 使用Whisper模型进行转录
            result = model.transcribe(filepath)
            return jsonify({
                'success': True,
                'transcription': result['text']
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            # 清理上传的文件
            if os.path.exists(filepath):
                os.remove(filepath)
    
    return jsonify({'error': 'Invalid file type'}), 400

@sock.route('/ws')
def handle_websocket(ws):
    try:
        while True:
            data = ws.receive()
            if data is None:
                break
            
            try:
                # 处理实时音频数据
                audio_stream = io.BytesIO(data)
                audio_stream.seek(0)

                # 保存临时音频文件
                temp_file = os.path.join(UPLOAD_FOLDER, 'temp_audio.wav')
                with open(temp_file, 'wb') as f:
                    f.write(audio_stream.read())

                # 使用Whisper模型进行转录
                result = model.transcribe(temp_file)
                
                # 发送转录结果
                ws.send(json.dumps({
                    'type': 'transcription_update',
                    'text': result['text']
                }))

                # 清理临时文件
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    
            except Exception as e:
                print(f'Error processing audio: {e}')
                ws.send(json.dumps({
                    'type': 'error',
                    'message': str(e)
                }))
    except Exception as e:
        print(f'WebSocket error: {e}')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True) 