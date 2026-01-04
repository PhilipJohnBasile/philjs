/**
 * @file WebGL Hooks
 * @description PhilJS hooks for WebGL integration
 */
import { createWebGLContext, resizeCanvas } from './context.js';
import { createProgram, useProgram, setUniforms } from './shaders.js';
import { createAnimationLoop } from './animation.js';
import { createCamera, updateCameraView, updateCameraProjection } from './camera.js';
/**
 * Global WebGL state (singleton per context)
 */
const webglStates = new WeakMap();
/**
 * Get or create WebGL state for a canvas
 */
function getWebGLState(canvas) {
    let state = webglStates.get(canvas);
    if (!state) {
        state = {
            gl: null,
            isWebGL2: false,
            canvas: null,
            programs: new Map(),
            textures: new Map(),
            buffers: new Map(),
            vaos: new Map(),
            currentProgram: null,
            animationLoop: null,
        };
        webglStates.set(canvas, state);
    }
    return state;
}
/**
 * Initialize WebGL for a canvas element
 * Returns a context object for use with other hooks
 */
export function useWebGL(canvas, options = {}) {
    if (!canvas)
        return null;
    const state = getWebGLState(canvas);
    // Initialize if not already done
    if (!state.gl) {
        try {
            const result = createWebGLContext(canvas, options);
            state.gl = result.gl;
            state.isWebGL2 = result.isWebGL2;
            state.canvas = result.canvas;
            return {
                gl: result.gl,
                isWebGL2: result.isWebGL2,
                canvas: result.canvas,
                state,
                result,
            };
        }
        catch (error) {
            console.error('Failed to initialize WebGL:', error);
            return null;
        }
    }
    return {
        gl: state.gl,
        isWebGL2: state.isWebGL2,
        canvas: state.canvas,
        state,
        result: {
            gl: state.gl,
            isWebGL2: state.isWebGL2,
            canvas: state.canvas,
            extensions: {},
        },
    };
}
/**
 * Hook for animation frame loop
 */
export function useAnimationFrame(context, callback, autoStart = true) {
    if (!context) {
        return {
            start: () => { },
            stop: () => { },
            isRunning: false,
        };
    }
    const { state } = context;
    if (!state.animationLoop) {
        state.animationLoop = createAnimationLoop(callback);
    }
    if (autoStart && !state.animationLoop.isRunning) {
        state.animationLoop.start();
    }
    return {
        start: () => state.animationLoop?.start(),
        stop: () => state.animationLoop?.stop(),
        get isRunning() {
            return state.animationLoop?.isRunning ?? false;
        },
    };
}
/**
 * Hook for shader program management
 */
export function useShaderProgram(context, name, vertexSource, fragmentSource) {
    if (!context)
        return null;
    const { gl, state } = context;
    // Check if program already exists
    let program = state.programs.get(name);
    if (program) {
        return program;
    }
    // Create new program
    try {
        program = createProgram(gl, { vertex: vertexSource, fragment: fragmentSource });
        state.programs.set(name, program);
        return program;
    }
    catch (error) {
        console.error(`Failed to create shader program "${name}":`, error);
        return null;
    }
}
/**
 * Hook for using a shader program
 */
export function useActiveProgram(context, program) {
    if (!context || !program)
        return;
    const { gl, state } = context;
    if (state.currentProgram !== program) {
        useProgram(gl, program);
        state.currentProgram = program;
    }
}
/**
 * Hook for setting shader uniforms
 */
export function useUniforms(context, program, uniforms) {
    if (!context || !program)
        return;
    const { gl } = context;
    useActiveProgram(context, program);
    setUniforms(gl, program, uniforms);
}
/**
 * Hook for camera management
 */
export function useCamera(context, options = {}) {
    if (!context)
        return null;
    const { canvas } = context;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    return createCamera({
        ...options,
        aspect,
    });
}
/**
 * Hook for auto-resize handling
 */
export function useAutoResize(context, callback, pixelRatio = window.devicePixelRatio || 1) {
    if (!context)
        return;
    const { gl, canvas } = context;
    const handleResize = () => {
        if (resizeCanvas(canvas, pixelRatio)) {
            gl.viewport(0, 0, canvas.width, canvas.height);
            callback?.(canvas.width, canvas.height);
        }
    };
    // Initial resize
    handleResize();
    // Note: In a real PhilJS implementation, this would use signals/effects
    // For now, we'll use ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(handleResize);
        observer.observe(canvas);
    }
}
/**
 * Hook for render pass
 */
export function useRenderPass(context, clearColor = [0, 0, 0, 1]) {
    if (!context) {
        return {
            begin: () => { },
            end: () => { },
        };
    }
    const { gl } = context;
    return {
        begin: () => {
            gl.clearColor(...clearColor);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        },
        end: () => {
            // Placeholder for any cleanup
        },
    };
}
/**
 * Cleanup WebGL resources
 */
export function cleanupWebGL(canvas) {
    const state = webglStates.get(canvas);
    if (!state)
        return;
    // Stop animation loop
    state.animationLoop?.stop();
    // Delete programs
    if (state.gl) {
        for (const program of state.programs.values()) {
            state.gl.deleteShader(program.vertexShader);
            state.gl.deleteShader(program.fragmentShader);
            state.gl.deleteProgram(program.program);
        }
        // Delete textures
        for (const texture of state.textures.values()) {
            state.gl.deleteTexture(texture.texture);
        }
        // Delete buffers
        for (const buffer of state.buffers.values()) {
            state.gl.deleteBuffer(buffer.buffer);
        }
    }
    // Clear state
    state.programs.clear();
    state.textures.clear();
    state.buffers.clear();
    state.vaos.clear();
    webglStates.delete(canvas);
}
//# sourceMappingURL=hooks.js.map