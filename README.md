# LLM Fine-Tuning Monitor

A modern web application for monitoring LLM fine-tuning processes with real-time GPU metrics and training progress visualization.

## Features

- Real-time monitoring of system resources (CPU, RAM, GPU)
- Multi-GPU support with detailed per-GPU metrics
- Mobile-responsive dashboard
- Historical metrics visualization
- WebSocket-based real-time updates
- Support for multiple concurrent fine-tuning sessions

## System Requirements

- Python 3.8+
- CUDA-compatible GPUs (Optimized for 2x RTX 4070)
- Node.js 16+
- 128GB RAM recommended

## Installation

1. Clone the repository and set up the Python environment:

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running the Application

1. Start the backend server:

```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

3. Access the dashboard at http://localhost:5173

## Usage

1. Start a fine-tuning job through the API:
```python
import requests

response = requests.post("http://localhost:8000/fine-tune", json={
    "model_name": "gpt2",
    "hyperparameters": {
        "learning_rate": 2e-5,
        "epochs": 3,
        "batch_size": 4
    }
})
```

2. Monitor the training progress through the web interface

3. View real-time metrics on your mobile device by accessing the web interface from your phone's browser

## Architecture

- Backend: FastAPI + PyTorch
- Frontend: React + TypeScript + Tailwind CSS
- Real-time updates: WebSocket
- GPU Monitoring: NVIDIA Management Library (NVML) via PyTorch

## License

MIT
