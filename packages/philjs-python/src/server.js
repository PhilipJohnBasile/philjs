/**
 * Python Server Integration for PhilJS AI/ML
 */
import { execa } from 'execa';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
/**
 * Python AI/ML server instance
 */
export class PythonServer {
    process = null;
    config;
    constructor(config = {}) {
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
    async start() {
        if (this.process) {
            throw new Error('Server already running');
        }
        const pythonPath = this.config.virtualEnv
            ? join(this.config.virtualEnv, 'bin', 'python')
            : this.config.pythonPath;
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
    async stop() {
        if (!this.process)
            return;
        this.process.kill('SIGTERM');
        await this.process.catch(() => { });
        this.process = null;
    }
    /**
     * Call a Python function
     */
    async call(fn) {
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
    isRunning() {
        return this.process !== null && !this.process.killed;
    }
    async waitForReady(timeout = 30000) {
        const start = Date.now();
        const url = `http://${this.config.host}:${this.config.port}/health`;
        while (Date.now() - start < timeout) {
            try {
                const response = await fetch(url);
                if (response.ok)
                    return;
            }
            catch {
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
export async function createPythonServer(config) {
    const server = new PythonServer(config);
    await server.start();
    return server;
}
/**
 * Initialize a Python project with AI/ML dependencies
 */
export async function initPythonProject(dir) {
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
PhilJS Python AI/ML Server - Full LLM Integration
"""
import os
import time
import asyncio
import hashlib
import json
from typing import AsyncIterator, Any
from collections.abc import Callable
from dataclasses import dataclass, field
from functools import wraps

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

# ============================================================================
# Rate Limiter with Token Bucket Algorithm
# ============================================================================

@dataclass
class TokenBucket:
    """Token bucket rate limiter implementation."""
    capacity: float
    refill_rate: float  # tokens per second
    tokens: float = field(default=0.0, init=False)
    last_refill: float = field(default_factory=time.monotonic, init=False)

    def __post_init__(self):
        self.tokens = self.capacity

    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

    def consume(self, tokens: float = 1.0) -> bool:
        """Try to consume tokens. Returns True if successful."""
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def wait_time(self, tokens: float = 1.0) -> float:
        """Calculate wait time until tokens are available."""
        self._refill()
        if self.tokens >= tokens:
            return 0.0
        deficit = tokens - self.tokens
        return deficit / self.refill_rate

class RateLimiter:
    """Multi-key rate limiter using token bucket algorithm."""

    def __init__(
        self,
        requests_per_minute: float = 60,
        tokens_per_minute: float = 100000,
        burst_multiplier: float = 1.5
    ):
        self.request_buckets: dict[str, TokenBucket] = {}
        self.token_buckets: dict[str, TokenBucket] = {}
        self.requests_per_second = requests_per_minute / 60
        self.tokens_per_second = tokens_per_minute / 60
        self.burst_multiplier = burst_multiplier

    def _get_bucket(
        self,
        buckets: dict[str, TokenBucket],
        key: str,
        rate: float
    ) -> TokenBucket:
        """Get or create a bucket for the given key."""
        if key not in buckets:
            capacity = rate * 60 * self.burst_multiplier  # Allow burst
            buckets[key] = TokenBucket(capacity=capacity, refill_rate=rate)
        return buckets[key]

    async def acquire(
        self,
        key: str,
        request_tokens: float = 1.0,
        estimated_tokens: float = 0.0
    ) -> None:
        """Acquire permission to make a request. Blocks if rate limited."""
        request_bucket = self._get_bucket(
            self.request_buckets, key, self.requests_per_second
        )
        token_bucket = self._get_bucket(
            self.token_buckets, key, self.tokens_per_second
        )

        # Wait for request slot
        while not request_bucket.consume(request_tokens):
            wait_time = request_bucket.wait_time(request_tokens)
            await asyncio.sleep(min(wait_time, 1.0))

        # Wait for token budget if estimated
        if estimated_tokens > 0:
            while not token_bucket.consume(estimated_tokens):
                wait_time = token_bucket.wait_time(estimated_tokens)
                await asyncio.sleep(min(wait_time, 1.0))

    def record_usage(self, key: str, actual_tokens: float) -> None:
        """Record actual token usage after request completes."""
        bucket = self._get_bucket(
            self.token_buckets, key, self.tokens_per_second
        )
        # Adjust for actual usage vs estimated
        # This is informational - actual limiting happens in acquire()
        pass

# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=float(os.getenv("PHILJS_RPM", "60")),
    tokens_per_minute=float(os.getenv("PHILJS_TPM", "100000"))
)

# ============================================================================
# Retry Handler with Exponential Backoff
# ============================================================================

class RetryableError(Exception):
    """Error that should trigger a retry."""
    def __init__(self, message: str, retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after

class RetryHandler:
    """Exponential backoff retry handler for API calls."""

    def __init__(
        self,
        max_retries: int = 5,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_status_codes: tuple[int, ...] = (429, 500, 502, 503, 504)
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_status_codes = retryable_status_codes

    def calculate_delay(self, attempt: int, retry_after: float | None = None) -> float:
        """Calculate delay before next retry."""
        if retry_after is not None:
            return min(retry_after, self.max_delay)

        delay = self.base_delay * (self.exponential_base ** attempt)
        delay = min(delay, self.max_delay)

        if self.jitter:
            import random
            delay *= (0.5 + random.random())

        return delay

    async def execute(
        self,
        func: Callable[..., Any],
        *args,
        **kwargs
    ) -> Any:
        """Execute function with retry logic."""
        last_exception = None

        for attempt in range(self.max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except RetryableError as e:
                last_exception = e
                if attempt < self.max_retries:
                    delay = self.calculate_delay(attempt, e.retry_after)
                    await asyncio.sleep(delay)
            except Exception as e:
                # Check if it's an API error with retryable status
                error_str = str(e).lower()
                is_retryable = any(
                    code_str in error_str
                    for code_str in ["429", "500", "502", "503", "504", "rate limit"]
                )
                if is_retryable and attempt < self.max_retries:
                    last_exception = e
                    delay = self.calculate_delay(attempt)
                    await asyncio.sleep(delay)
                else:
                    raise

        raise last_exception or Exception("Max retries exceeded")

# Global retry handler instance
retry_handler = RetryHandler(
    max_retries=int(os.getenv("PHILJS_MAX_RETRIES", "5")),
    base_delay=float(os.getenv("PHILJS_RETRY_DELAY", "1.0"))
)

# ============================================================================
# Multi-Provider LLM Client Factory
# ============================================================================

class LLMClientFactory:
    """Factory for creating LLM clients based on provider/model."""

    OPENAI_MODELS = {
        "gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-4o", "gpt-4o-mini",
        "gpt-3.5-turbo", "gpt-3.5-turbo-16k", "o1", "o1-mini", "o1-preview",
        "o3-mini"
    }

    ANTHROPIC_MODELS = {
        "claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
        "claude-3-5-sonnet", "claude-3-5-haiku",
        "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022",
        "claude-sonnet-4-20250514", "claude-opus-4-20250514"
    }

    @classmethod
    def detect_provider(cls, model: str) -> str:
        """Auto-detect provider from model name."""
        model_lower = model.lower()

        # Check exact matches first
        if model in cls.OPENAI_MODELS or model_lower.startswith(("gpt-", "o1", "o3")):
            return "openai"
        if model in cls.ANTHROPIC_MODELS or model_lower.startswith("claude"):
            return "anthropic"

        # Check prefixes
        if any(model_lower.startswith(p) for p in ["text-", "davinci", "curie", "babbage", "ada"]):
            return "openai"

        # Default to OpenAI for unknown models
        return "openai"

    @classmethod
    async def create_client(cls, model: str, provider: str | None = None):
        """Create appropriate client for the model."""
        if provider is None:
            provider = cls.detect_provider(model)

        if provider == "openai":
            return OpenAIClient()
        elif provider == "anthropic":
            return AnthropicClient()
        else:
            raise ValueError(f"Unsupported provider: {provider}")

# ============================================================================
# OpenAI Client Implementation
# ============================================================================

class OpenAIClient:
    """OpenAI API client with streaming support."""

    def __init__(self):
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(
                api_key=os.getenv("OPENAI_API_KEY"),
                base_url=os.getenv("OPENAI_BASE_URL"),
                timeout=float(os.getenv("PHILJS_TIMEOUT", "60"))
            )
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        tools: list[dict] | None = None,
        tool_choice: str | dict | None = None
    ) -> dict | AsyncIterator[dict]:
        """Send chat completion request."""

        async def _make_request():
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream
            }

            if tools:
                kwargs["tools"] = tools
            if tool_choice:
                kwargs["tool_choice"] = tool_choice

            try:
                response = await self.client.chat.completions.create(**kwargs)
                return response
            except Exception as e:
                error_str = str(e)
                if "rate limit" in error_str.lower() or "429" in error_str:
                    raise RetryableError(error_str, retry_after=60)
                raise

        # Apply rate limiting
        key = f"openai:{model}"
        estimated_tokens = sum(len(m.get("content", "")) / 4 for m in messages)
        await rate_limiter.acquire(key, estimated_tokens=estimated_tokens)

        # Execute with retry
        response = await retry_handler.execute(_make_request)

        if stream:
            return self._stream_response(response, key)

        # Record actual usage
        if hasattr(response, "usage") and response.usage:
            rate_limiter.record_usage(key, response.usage.total_tokens)

        return self._format_response(response)

    async def _stream_response(
        self,
        response,
        rate_key: str
    ) -> AsyncIterator[dict]:
        """Stream response chunks."""
        total_tokens = 0
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta:
                delta = chunk.choices[0].delta
                yield {
                    "id": chunk.id,
                    "model": chunk.model,
                    "choices": [{
                        "index": 0,
                        "delta": {
                            "role": getattr(delta, "role", None),
                            "content": getattr(delta, "content", None)
                        },
                        "finish_reason": chunk.choices[0].finish_reason
                    }]
                }
                if delta.content:
                    total_tokens += len(delta.content) / 4

        rate_limiter.record_usage(rate_key, total_tokens)

    def _format_response(self, response) -> dict:
        """Format response to standard structure."""
        return {
            "id": response.id,
            "model": response.model,
            "choices": [{
                "index": c.index,
                "message": {
                    "role": c.message.role,
                    "content": c.message.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in (c.message.tool_calls or [])
                    ] if c.message.tool_calls else None
                },
                "finish_reason": c.finish_reason
            } for c in response.choices],
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0
            }
        }

    async def embeddings(
        self,
        model: str,
        inputs: list[str],
        dimensions: int | None = None
    ) -> dict:
        """Generate embeddings."""

        async def _make_request(batch: list[str]):
            kwargs: dict[str, Any] = {"model": model, "input": batch}
            if dimensions:
                kwargs["dimensions"] = dimensions

            try:
                response = await self.client.embeddings.create(**kwargs)
                return response
            except Exception as e:
                error_str = str(e)
                if "rate limit" in error_str.lower() or "429" in error_str:
                    raise RetryableError(error_str, retry_after=60)
                raise

        # Batch inputs (max 2048 per batch for most models)
        batch_size = int(os.getenv("PHILJS_EMBEDDING_BATCH_SIZE", "100"))
        all_embeddings = []
        total_tokens = 0

        for i in range(0, len(inputs), batch_size):
            batch = inputs[i:i + batch_size]

            # Rate limiting
            key = f"openai:embeddings:{model}"
            estimated_tokens = sum(len(text) / 4 for text in batch)
            await rate_limiter.acquire(key, estimated_tokens=estimated_tokens)

            # Execute with retry
            response = await retry_handler.execute(_make_request, batch)

            # Extract embeddings in correct order
            batch_embeddings = sorted(response.data, key=lambda x: x.index)
            all_embeddings.extend([e.embedding for e in batch_embeddings])

            if response.usage:
                total_tokens += response.usage.total_tokens
                rate_limiter.record_usage(key, response.usage.total_tokens)

        return {
            "model": model,
            "embeddings": all_embeddings,
            "usage": {
                "prompt_tokens": total_tokens,
                "total_tokens": total_tokens
            }
        }

# ============================================================================
# Anthropic Client Implementation
# ============================================================================

class AnthropicClient:
    """Anthropic API client with streaming support."""

    def __init__(self):
        try:
            from anthropic import AsyncAnthropic
            self.client = AsyncAnthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                timeout=float(os.getenv("PHILJS_TIMEOUT", "60"))
            )
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        tools: list[dict] | None = None,
        tool_choice: str | dict | None = None
    ) -> dict | AsyncIterator[dict]:
        """Send message request to Anthropic."""

        # Convert messages format
        system_message = None
        anthropic_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                anthropic_messages.append({
                    "role": "user" if msg["role"] == "user" else "assistant",
                    "content": msg["content"]
                })

        async def _make_request():
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": anthropic_messages,
                "max_tokens": max_tokens
            }

            if system_message:
                kwargs["system"] = system_message
            if temperature != 1.0:  # Anthropic uses 1.0 as default
                kwargs["temperature"] = temperature

            # Convert tools to Anthropic format
            if tools:
                kwargs["tools"] = [
                    {
                        "name": t["function"]["name"],
                        "description": t["function"]["description"],
                        "input_schema": t["function"]["parameters"]
                    }
                    for t in tools
                ]

            if tool_choice:
                if isinstance(tool_choice, str):
                    kwargs["tool_choice"] = {"type": tool_choice}
                else:
                    kwargs["tool_choice"] = {
                        "type": "tool",
                        "name": tool_choice["function"]["name"]
                    }

            try:
                if stream:
                    return await self.client.messages.stream(**kwargs).__aenter__()
                else:
                    return await self.client.messages.create(**kwargs)
            except Exception as e:
                error_str = str(e)
                if "rate limit" in error_str.lower() or "429" in error_str:
                    raise RetryableError(error_str, retry_after=60)
                raise

        # Apply rate limiting
        key = f"anthropic:{model}"
        estimated_tokens = sum(len(m.get("content", "")) / 4 for m in messages)
        await rate_limiter.acquire(key, estimated_tokens=estimated_tokens)

        # Execute with retry
        response = await retry_handler.execute(_make_request)

        if stream:
            return self._stream_response(response, key)

        # Record actual usage
        if hasattr(response, "usage") and response.usage:
            total = response.usage.input_tokens + response.usage.output_tokens
            rate_limiter.record_usage(key, total)

        return self._format_response(response)

    async def _stream_response(
        self,
        stream_manager,
        rate_key: str
    ) -> AsyncIterator[dict]:
        """Stream response chunks."""
        total_tokens = 0
        current_text = ""

        async with stream_manager as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    if hasattr(event.delta, "text"):
                        text = event.delta.text
                        current_text += text
                        total_tokens += len(text) / 4
                        yield {
                            "id": "msg_stream",
                            "model": stream._model if hasattr(stream, "_model") else "claude",
                            "choices": [{
                                "index": 0,
                                "delta": {
                                    "role": "assistant",
                                    "content": text
                                },
                                "finish_reason": None
                            }]
                        }
                elif event.type == "message_stop":
                    yield {
                        "id": "msg_stream",
                        "model": stream._model if hasattr(stream, "_model") else "claude",
                        "choices": [{
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    }

        rate_limiter.record_usage(rate_key, total_tokens)

    def _format_response(self, response) -> dict:
        """Format Anthropic response to OpenAI-compatible structure."""
        content = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "type": "function",
                    "function": {
                        "name": block.name,
                        "arguments": json.dumps(block.input)
                    }
                })

        return {
            "id": response.id,
            "model": response.model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content,
                    "tool_calls": tool_calls if tool_calls else None
                },
                "finish_reason": response.stop_reason or "stop"
            }],
            "usage": {
                "prompt_tokens": response.usage.input_tokens if response.usage else 0,
                "completion_tokens": response.usage.output_tokens if response.usage else 0,
                "total_tokens": (
                    (response.usage.input_tokens + response.usage.output_tokens)
                    if response.usage else 0
                )
            }
        }

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="PhilJS Python AI/ML Server",
    description="Full LLM integration with OpenAI and Anthropic support",
    version="1.0.0"
)

class HealthResponse(BaseModel):
    status: str = "ok"
    providers: dict[str, bool] = {}

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint with provider availability."""
    providers = {
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY"))
    }
    return HealthResponse(status="ok", providers=providers)

# ----------------------------------------------------------------------------
# Chat Completions Endpoint
# ----------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str
    name: str | None = None
    tool_calls: list[dict] | None = None

class ToolFunction(BaseModel):
    name: str
    description: str
    parameters: dict

class Tool(BaseModel):
    type: str = "function"
    function: ToolFunction

class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 4096
    stream: bool = False
    tools: list[Tool] | None = None
    tool_choice: str | dict | None = None
    provider: str | None = None  # Optional override

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    """
    Chat completions endpoint with full LLM integration.

    Supports:
    - OpenAI models (gpt-4, gpt-3.5-turbo, etc.)
    - Anthropic models (claude-3-opus, claude-3-sonnet, etc.)
    - Streaming via SSE
    - Tool/function calling
    - Rate limiting and retry logic
    """
    try:
        # Get appropriate client
        provider = request.provider or LLMClientFactory.detect_provider(request.model)

        if provider == "openai":
            client = OpenAIClient()
        elif provider == "anthropic":
            client = AnthropicClient()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

        # Convert messages
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        # Convert tools if present
        tools = None
        if request.tools:
            tools = [
                {
                    "type": t.type,
                    "function": {
                        "name": t.function.name,
                        "description": t.function.description,
                        "parameters": t.function.parameters
                    }
                }
                for t in request.tools
            ]

        # Make request
        response = await client.chat(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream,
            tools=tools,
            tool_choice=request.tool_choice
        )

        if request.stream:
            return StreamingResponse(
                stream_sse(response),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )

        return response

    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Provider not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def stream_sse(response_iter: AsyncIterator[dict]) -> AsyncIterator[str]:
    """Convert response iterator to SSE format."""
    try:
        async for chunk in response_iter:
            yield f"data: {json.dumps(chunk)}\\n\\n"
        yield "data: [DONE]\\n\\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\\n\\n"

# ----------------------------------------------------------------------------
# Embeddings Endpoint
# ----------------------------------------------------------------------------

class EmbeddingsRequest(BaseModel):
    model: str
    input: str | list[str]
    dimensions: int | None = None
    provider: str | None = None

@app.post("/v1/embeddings")
async def embeddings(request: EmbeddingsRequest):
    """
    Embeddings endpoint with automatic batching.

    Supports:
    - OpenAI embedding models (text-embedding-3-small, text-embedding-3-large, etc.)
    - Automatic batching for large inputs
    - Dimension reduction (for supported models)
    - Rate limiting and retry logic
    """
    try:
        # Normalize input to list
        inputs = [request.input] if isinstance(request.input, str) else request.input

        # Detect provider from model
        provider = request.provider
        if provider is None:
            if request.model.startswith("text-embedding"):
                provider = "openai"
            else:
                provider = "openai"  # Default to OpenAI for embeddings

        if provider == "openai":
            client = OpenAIClient()
            response = await client.embeddings(
                model=request.model,
                inputs=inputs,
                dimensions=request.dimensions
            )
            return response
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Embeddings not supported for provider: {provider}"
            )

    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Provider not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------------------------------
# Generic Python Function Call Endpoint
# ----------------------------------------------------------------------------

class FunctionCall(BaseModel):
    name: str
    module: str
    function: str
    args: list = []
    kwargs: dict = {}

@app.post("/call")
async def call_function(request: FunctionCall):
    """Execute a Python function dynamically."""
    try:
        import importlib
        module = importlib.import_module(request.module)
        func = getattr(module, request.function)

        if asyncio.iscoroutinefunction(func):
            result = await func(*request.args, **request.kwargs)
        else:
            result = func(*request.args, **request.kwargs)

        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------------------------------
# Server Entry Point
# ----------------------------------------------------------------------------

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
export async function checkPythonInstalled() {
    try {
        const { stdout } = await execa('python3', ['--version']);
        const version = stdout.replace('Python ', '').trim();
        return { installed: true, version };
    }
    catch {
        try {
            const { stdout } = await execa('python', ['--version']);
            const version = stdout.replace('Python ', '').trim();
            return { installed: true, version };
        }
        catch {
            return { installed: false };
        }
    }
}
//# sourceMappingURL=server.js.map