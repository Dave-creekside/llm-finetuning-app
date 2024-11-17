from fastapi import FastAPI, WebSocket, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import torch
import psutil
import json
from typing import Dict, List
import asyncio

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active training sessions
active_sessions: Dict[str, dict] = {}
connected_clients: List[WebSocket] = []

async def get_system_metrics():
    while True:
        gpu_info = []
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                gpu = torch.cuda.get_device_properties(i)
                memory = torch.cuda.memory_stats(i)
                gpu_info.append({
                    "id": i,
                    "name": gpu.name,
                    "total_memory": gpu.total_memory,
                    "memory_allocated": memory.get("allocated_bytes.all.current", 0),
                    "utilization": torch.cuda.utilization(i)
                })
        
        metrics = {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "gpu_info": gpu_info,
            "active_sessions": len(active_sessions)
        }
        
        # Broadcast metrics to all connected clients
        for client in connected_clients:
            try:
                await client.send_json(metrics)
            except:
                connected_clients.remove(client)
        
        await asyncio.sleep(1)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        connected_clients.remove(websocket)

@app.on_event("startup")
async def startup_event():
    background_tasks = BackgroundTasks()
    background_tasks.add_task(get_system_metrics)

@app.get("/")
async def root():
    return {"status": "running", "gpu_available": torch.cuda.is_available()}
