from flask import Flask, jsonify, send_file
import json
import os

app = Flask(__name__, static_folder='static')

CONFIG_FILE = 'config.json'
STATUS_FILE = 'status.json'

@app.route('/api/status')
def get_status():
    if not os.path.exists(STATUS_FILE) or not os.path.exists(CONFIG_FILE):
        return jsonify({"error": "Data files not found. Ensure daemon is running."}), 404
    
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    with open(STATUS_FILE, 'r', encoding='utf-8') as f:
        status = json.load(f)
        
    devices = []
    for dev in config.get('devices', []):
        dev_id = dev['id']
        state = status.get(dev_id, {
            "status": "unknown",
            "last_checked": "",
            "failed_attempts": 0
        })
        devices.append({
            "id": dev_id,
            "name": dev['name'],
            "ip": dev['ip'],
            "type": dev['type'],
            "status": state["status"],
            "last_checked": state["last_checked"],
            "failed_attempts": state["failed_attempts"]
        })
        
    return jsonify({"devices": devices})

@app.route('/')
def index():
    if not os.path.exists('static/dashboard.html'):
        return "Dashboard not created yet.", 404
    return send_file('static/dashboard.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
