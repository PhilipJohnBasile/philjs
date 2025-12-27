/**
 * Python Server Integration for PhilJS AI/ML
 */

import { execa, type ExecaChildProcess } from 'execa';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PythonServerConfig, PythonFunction } from './types.js';

/**
 * Python AI/ML server instance
 */
export class PythonServer {
  private process: ExecaChildProcess | null = null;
  private config: PythonServerConfig;

  constructor(config: PythonServerConfig = {}) {
    this.config = {
      port: 8000,
      host: '0.0.0.0',
      workers: 1,
      pythonPath: 'python3',
      gpuEnabled: false,
      ...config,
    };
  }

  /**
   * Start the Python server
   */
  async start(): Promise<void> {
    if (this.process) {
      throw new Error('Server already running');
    }

    const pythonPath = this.config.virtualEnv
      ? join(this.config.virtualEnv, 'bin', 'python')
      : this.config.pythonPath!;

    const serverScript = join(__dirname, '..', 'python', 'server.py');

    this.process = execa(pythonPath, [serverScript], {
      env: {
        ...process.env,
        PHILJS_PORT: String(this.config.port),
        PHILJS_HOST: this.config.host,
        PHILJS_WORKERS: String(this.config.workers),
        CUDA_VISIBLE_DEVICES: this.config.gpuEnabled ? '' : '-1',
      },
      stdio: 'inherit',
    });

    await this.waitForReady();
  }

  /**
   * Stop the Python server
   */
  async stop(): Promise<void> {
    if (!this.process) return;

    this.process.kill('SIGTERM');
    await this.process.catch(() => {});
    this.process = null;
  }

  /**
   * Call a Python function
   */
  async call<T>(fn: PythonFunction): Promise<T> {
    const response = await fetch(`http://${this.config.host}:${this.config.port}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fn),
    });

    if (!response.ok) {
      throw new Error(`Python function call failed: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  private async waitForReady(timeout = 30000): Promise<void> {
    const start = Date.now();
    const url = `http://${this.config.host}:${this.config.port}/health`;

    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) return;
      } catch {
        // Not ready yet
      }
      await new Promise(r => setTimeout(r, 500));
    }

    throw new Error('Python server failed to start');
  }
}

/**
 * Create and start a Python AI/ML server
 */
export async function createPythonServer(config?: PythonServerConfig): Promise<PythonServer> {
  const server = new PythonServer(config);
  await server.start();
  return server;
}

/**
 * Initialize a Python project with AI/ML dependencies
 */
export async function initPythonProject(dir: string): Promise<void> {
  const pyDir = join(dir, 'python');
  await mkdir(pyDir, { recursive: true });

  // Create requirements.txt
  const requirements = `# PhilJS Python AI/ML Dependencies
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.5.0

# LLM
openai>=1.10.0
anthropic>=0.18.0
langchain>=0.1.0
langchain-openai>=0.0.5

# Embeddings & Vector
sentence-transformers>=2.3.0
chromadb>=0.4.0

# ML Framework (choose one)
torch>=2.1.0
transformers>=4.37.0

# Utils
python-dotenv>=1.0.0
httpx>=0.26.0
`;

  await writeFile(join(pyDir, 'requirements.txt'), requirements);

  // Create main server file
  const serverPy = `"""
PhilJS Python AI/ML Server
"""
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="PhilJS Python AI/ML Server")

class HealthResponse(BaseModel):
    status: str = "ok"

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 4096
    stream: bool = False

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    # TODO: Implement LLM integration
    return {
        "id": "chatcmpl-xxx",
        "model": request.model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello from PhilJS Python!"},
            "finish_reason": "stop"
        }],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    }

class EmbeddingsRequest(BaseModel):
    model: str
    input: str | list[str]
    dimensions: int | None = None

@app.post("/v1/embeddings")
async def embeddings(request: EmbeddingsRequest):
    # TODO: Implement embeddings
    inputs = [request.input] if isinstance(request.input, str) else request.input
    return {
        "model": request.model,
        "embeddings": [[0.0] * 1536 for _ in inputs],
        "usage": {"prompt_tokens": 0, "total_tokens": 0}
    }

if __name__ == "__main__":
    port = int(os.getenv("PHILJS_PORT", "8000"))
    host = os.getenv("PHILJS_HOST", "0.0.0.0")
    workers = int(os.getenv("PHILJS_WORKERS", "1"))

    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        workers=workers,
        reload=os.getenv("PHILJS_DEV", "false") == "true"
    )
`;

  await writeFile(join(pyDir, 'server.py'), serverPy);
}

/**
 * Check if Python is installed
 */
export async function checkPythonInstalled(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execa('python3', ['--version']);
    const version = stdout.replace('Python ', '').trim();
    return { installed: true, version };
  } catch {
    try {
      const { stdout } = await execa('python', ['--version']);
      const version = stdout.replace('Python ', '').trim();
      return { installed: true, version };
    } catch {
      return { installed: false };
    }
  }
}
