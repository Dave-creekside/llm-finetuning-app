import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import os
from typing import Dict, Any, Optional
import uuid
import asyncio

class FineTuningManager:
    def __init__(self):
        self.active_jobs: Dict[str, Dict[str, Any]] = {}
        
    async def start_fine_tuning(
        self,
        model_name: str,
        training_data: Dataset,
        hyperparameters: Dict[str, Any],
        callback = None
    ) -> str:
        job_id = str(uuid.uuid4())
        
        # Configure training arguments
        training_args = TrainingArguments(
            output_dir=f"./checkpoints/{job_id}",
            num_train_epochs=hyperparameters.get("epochs", 3),
            per_device_train_batch_size=hyperparameters.get("batch_size", 4),
            gradient_accumulation_steps=hyperparameters.get("gradient_accumulation_steps", 4),
            learning_rate=hyperparameters.get("learning_rate", 2e-5),
            fp16=True,  # Use mixed precision training
            logging_steps=10,
            save_strategy="steps",
            save_steps=100,
            evaluation_strategy="steps",
            eval_steps=100,
            load_best_model_at_end=True,
        )
        
        # Load model and tokenizer
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="auto",  # Automatically handle multi-GPU
            torch_dtype=torch.float16
        )
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Prepare trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=training_data,
            data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
        )
        
        # Store job information
        self.active_jobs[job_id] = {
            "model_name": model_name,
            "status": "running",
            "progress": 0.0,
            "metrics": {},
            "trainer": trainer
        }
        
        # Start training in background
        async def train():
            try:
                trainer.train()
                self.active_jobs[job_id]["status"] = "completed"
                if callback:
                    await callback({"status": "completed", "job_id": job_id})
            except Exception as e:
                self.active_jobs[job_id]["status"] = "failed"
                self.active_jobs[job_id]["error"] = str(e)
                if callback:
                    await callback({"status": "failed", "job_id": job_id, "error": str(e)})
        
        asyncio.create_task(train())
        return job_id
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id not in self.active_jobs:
            return None
        
        job = self.active_jobs[job_id]
        return {
            "status": job["status"],
            "progress": job["progress"],
            "metrics": job["metrics"]
        }
    
    def stop_job(self, job_id: str) -> bool:
        if job_id not in self.active_jobs:
            return False
        
        trainer = self.active_jobs[job_id]["trainer"]
        trainer.stop_training()
        self.active_jobs[job_id]["status"] = "stopped"
        return True
