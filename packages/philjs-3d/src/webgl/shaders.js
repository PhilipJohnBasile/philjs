/**
 * @file Shader Management
 * @description Compile, link, and manage WebGL shaders
 */
/**
 * Compile a shader from source
 */
export function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Failed to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Failed to compile shader: ${info}`);
    }
    return shader;
}
/**
 * Create and link a shader program
 */
export function createProgram(gl, source) {
    const vertexShader = compileShader(gl, source.vertex, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, source.fragment, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error('Failed to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(`Failed to link program: ${info}`);
    }
    // Get uniforms and attributes
    const uniforms = new Map();
    const attributes = new Map();
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
        const info = gl.getActiveUniform(program, i);
        if (info) {
            const location = gl.getUniformLocation(program, info.name);
            if (location) {
                uniforms.set(info.name, location);
            }
        }
    }
    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttribs; i++) {
        const info = gl.getActiveAttrib(program, i);
        if (info) {
            const location = gl.getAttribLocation(program, info.name);
            if (location >= 0) {
                attributes.set(info.name, location);
            }
        }
    }
    return {
        program,
        vertexShader,
        fragmentShader,
        uniforms,
        attributes,
    };
}
/**
 * Use a shader program
 */
export function useProgram(gl, shaderProgram) {
    gl.useProgram(shaderProgram.program);
}
/**
 * Delete a shader program
 */
export function deleteProgram(gl, shaderProgram) {
    gl.deleteShader(shaderProgram.vertexShader);
    gl.deleteShader(shaderProgram.fragmentShader);
    gl.deleteProgram(shaderProgram.program);
}
/**
 * Set uniform value (auto-detect type)
 */
export function setUniform(gl, program, name, value) {
    const location = program.uniforms.get(name);
    if (!location) {
        console.warn(`Uniform "${name}" not found in shader program`);
        return;
    }
    if (typeof value === 'boolean') {
        gl.uniform1i(location, value ? 1 : 0);
    }
    else if (typeof value === 'number') {
        gl.uniform1f(location, value);
    }
    else if (Array.isArray(value) || value instanceof Float32Array) {
        const arr = value instanceof Float32Array ? value : new Float32Array(value);
        switch (arr.length) {
            case 1:
                gl.uniform1fv(location, arr);
                break;
            case 2:
                gl.uniform2fv(location, arr);
                break;
            case 3:
                gl.uniform3fv(location, arr);
                break;
            case 4:
                gl.uniform4fv(location, arr);
                break;
            case 9:
                gl.uniformMatrix3fv(location, false, arr);
                break;
            case 16:
                gl.uniformMatrix4fv(location, false, arr);
                break;
            default:
                throw new Error(`Unsupported uniform array length: ${arr.length}`);
        }
    }
    else if (value instanceof Int32Array) {
        switch (value.length) {
            case 1:
                gl.uniform1iv(location, value);
                break;
            case 2:
                gl.uniform2iv(location, value);
                break;
            case 3:
                gl.uniform3iv(location, value);
                break;
            case 4:
                gl.uniform4iv(location, value);
                break;
            default:
                throw new Error(`Unsupported uniform array length: ${value.length}`);
        }
    }
}
/**
 * Set multiple uniforms at once
 */
export function setUniforms(gl, program, uniforms) {
    for (const [name, value] of Object.entries(uniforms)) {
        setUniform(gl, program, name, value);
    }
}
// Built-in shader sources
export const BASIC_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = normalize(uNormalMatrix * aNormal);
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;
export const BASIC_FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uAmbientStrength;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vPosition;

void main() {
  // Ambient
  vec3 ambient = uAmbientStrength * uLightColor;

  // Diffuse
  vec3 lightDir = normalize(uLightPosition - vPosition);
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  vec3 result = (ambient + diffuse) * uColor;
  gl_FragColor = vec4(result, 1.0);
}
`;
export const UNLIT_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewProjectionMatrix;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = uModelViewProjectionMatrix * vec4(aPosition, 1.0);
}
`;
export const UNLIT_FRAGMENT_SHADER = `
precision mediump float;

uniform vec4 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;

varying vec2 vTexCoord;

void main() {
  if (uUseTexture) {
    gl_FragColor = texture2D(uTexture, vTexCoord) * uColor;
  } else {
    gl_FragColor = uColor;
  }
}
`;
export const TEXTURED_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = normalize(uNormalMatrix * aNormal);
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;
export const TEXTURED_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D uDiffuseMap;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uAmbientStrength;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vPosition;

void main() {
  vec4 texColor = texture2D(uDiffuseMap, vTexCoord);

  // Ambient
  vec3 ambient = uAmbientStrength * uLightColor;

  // Diffuse
  vec3 lightDir = normalize(uLightPosition - vPosition);
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  vec3 result = (ambient + diffuse) * texColor.rgb;
  gl_FragColor = vec4(result, texColor.a);
}
`;
//# sourceMappingURL=shaders.js.map