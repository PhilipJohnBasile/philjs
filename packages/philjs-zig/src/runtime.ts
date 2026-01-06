/**
 * Zig Runtime for PhilJS - High-performance operations
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ZigBuildConfig, RuntimeConfig } from './types.js';

/**
 * Helper to execute commands (replaces execa)
 */
function execCommand(cmd: string, args: string[], options: { cwd?: string; stdio?: 'inherit' | 'pipe' } = {}): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: options.cwd,
      stdio: options.stdio === 'inherit' ? 'inherit' : 'pipe',
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    if (proc.stdout) {
      proc.stdout.on('data', (data) => { stdout += data.toString(); });
    }
    if (proc.stderr) {
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Check if Zig is installed
 */
export async function checkZigInstalled(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execCommand('zig', ['version']);
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false };
  }
}

/**
 * Build Zig project
 */
export async function buildZig(config: ZigBuildConfig = {}): Promise<string> {
  const {
    target = 'native',
    optimize = 'ReleaseFast',
    simd = true,
    outDir = './dist/zig',
    linkLibc = false,
  } = config;

  const args = ['build'];

  if (optimize !== 'Debug') {
    args.push(`-Doptimize=${optimize}`);
  }

  if (target !== 'native') {
    args.push(`-Dtarget=${target}`);
  }

  const zigDir = join(__dirname, '..', 'zig');

  await execCommand('zig', args, {
    cwd: zigDir,
    stdio: 'inherit',
  });

  return join(zigDir, 'zig-out');
}

/**
 * Initialize Zig project for PhilJS
 */
export async function initZigProject(dir: string, name: string): Promise<void> {
  const zigDir = join(dir, 'zig');
  await mkdir(join(zigDir, 'src'), { recursive: true });

  // build.zig
  const buildZig = `const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // WASM library
    const wasm = b.addSharedLibrary(.{
        .name = "${name}",
        .root_source_file = b.path("src/main.zig"),
        .target = b.resolveTargetQuery(.{
            .cpu_arch = .wasm32,
            .os_tag = .freestanding,
        }),
        .optimize = optimize,
    });

    // Enable SIMD
    wasm.root_module.addCpuFeature(.simd128);

    b.installArtifact(wasm);

    // Native library (for testing)
    const lib = b.addSharedLibrary(.{
        .name = "${name}-native",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    b.installArtifact(lib);

    // Tests
    const tests = b.addTest(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const run_tests = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_tests.step);
}
`;
  await writeFile(join(zigDir, 'build.zig'), buildZig);

  // src/main.zig
  const mainZig = `//! PhilJS Zig Performance Module
//!
//! High-performance operations for PhilJS using SIMD and zero-allocation algorithms.

const std = @import("std");

// SIMD vector type for fast operations
const Vec4f = @Vector(4, f32);

/// Fast array sum using SIMD
export fn simd_sum(ptr: [*]const f32, len: usize) f32 {
    if (len == 0) return 0;

    var sum_vec: Vec4f = @splat(0);
    var i: usize = 0;

    // Process 4 elements at a time with SIMD
    while (i + 4 <= len) : (i += 4) {
        const chunk: Vec4f = ptr[i..][0..4].*;
        sum_vec += chunk;
    }

    // Sum the SIMD vector
    var result = @reduce(.Add, sum_vec);

    // Handle remaining elements
    while (i < len) : (i += 1) {
        result += ptr[i];
    }

    return result;
}

/// Fast dot product using SIMD
export fn simd_dot(a: [*]const f32, b: [*]const f32, len: usize) f32 {
    if (len == 0) return 0;

    var sum_vec: Vec4f = @splat(0);
    var i: usize = 0;

    while (i + 4 <= len) : (i += 4) {
        const chunk_a: Vec4f = a[i..][0..4].*;
        const chunk_b: Vec4f = b[i..][0..4].*;
        sum_vec += chunk_a * chunk_b;
    }

    var result = @reduce(.Add, sum_vec);

    while (i < len) : (i += 1) {
        result += a[i] * b[i];
    }

    return result;
}

/// Fast cosine similarity
export fn cosine_similarity(a: [*]const f32, b: [*]const f32, len: usize) f32 {
    const dot = simd_dot(a, b, len);
    const norm_a = @sqrt(simd_dot(a, a, len));
    const norm_b = @sqrt(simd_dot(b, b, len));

    if (norm_a == 0 or norm_b == 0) return 0;
    return dot / (norm_a * norm_b);
}

/// Memory-efficient string hashing (FNV-1a)
export fn fnv1a_hash(ptr: [*]const u8, len: usize) u64 {
    var hash: u64 = 0xcbf29ce484222325;
    var i: usize = 0;

    while (i < len) : (i += 1) {
        hash ^= ptr[i];
        hash *%= 0x100000001b3;
    }

    return hash;
}

/// Allocator for WASM (bump allocator)
var heap: [1024 * 1024]u8 = undefined;
var heap_offset: usize = 0;

export fn alloc(size: usize) ?[*]u8 {
    if (heap_offset + size > heap.len) return null;
    const ptr = heap[heap_offset..].ptr;
    heap_offset += size;
    return ptr;
}

export fn reset_heap() void {
    heap_offset = 0;
}

test "simd_sum" {
    const data = [_]f32{ 1, 2, 3, 4, 5, 6, 7, 8 };
    const result = simd_sum(&data, data.len);
    try std.testing.expectApproxEqAbs(@as(f32, 36), result, 0.0001);
}

test "cosine_similarity" {
    const a = [_]f32{ 1, 0, 0 };
    const b = [_]f32{ 1, 0, 0 };
    const result = cosine_similarity(&a, &b, 3);
    try std.testing.expectApproxEqAbs(@as(f32, 1.0), result, 0.0001);
}
`;
  await writeFile(join(zigDir, 'src', 'main.zig'), mainZig);
}

/**
 * High-performance runtime using Zig WASM
 */
export class ZigRuntime {
  private instance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory | null = null;

  constructor(private config: RuntimeConfig = {}) {}

  /**
   * Initialize the Zig WASM runtime
   */
  async init(wasmPath: string): Promise<void> {
    const wasmBytes = await (await fetch(wasmPath)).arrayBuffer();

    const memory = new WebAssembly.Memory({
      initial: this.config.heapSize ? this.config.heapSize / 65536 : 16,
      maximum: 256,
      ...(this.config.sharedMemory !== undefined ? { shared: this.config.sharedMemory } : {}),
    });

    const { instance } = await WebAssembly.instantiate(wasmBytes, {
      env: { memory },
    });

    this.instance = instance;
    this.memory = memory;
  }

  /**
   * Call a Zig function
   */
  call<T>(name: string, ...args: number[]): T {
    if (!this.instance) throw new Error('Runtime not initialized');
    const fn = this.instance.exports[name] as Function;
    return fn(...args);
  }

  /**
   * Get memory view
   */
  getMemory(): Float32Array {
    if (!this.memory) throw new Error('Runtime not initialized');
    return new Float32Array(this.memory.buffer);
  }
}
