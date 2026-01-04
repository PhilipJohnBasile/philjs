/**
 * @file Shader Management
 * @description Compile, link, and manage WebGL shaders
 */
import type { ShaderProgram, ShaderSource } from './types.js';
/**
 * Compile a shader from source
 */
export declare function compileShader(gl: WebGLRenderingContext | WebGL2RenderingContext, source: string, type: number): WebGLShader;
/**
 * Create and link a shader program
 */
export declare function createProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, source: ShaderSource): ShaderProgram;
/**
 * Use a shader program
 */
export declare function useProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, shaderProgram: ShaderProgram): void;
/**
 * Delete a shader program
 */
export declare function deleteProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, shaderProgram: ShaderProgram): void;
/**
 * Set uniform value (auto-detect type)
 */
export declare function setUniform(gl: WebGLRenderingContext | WebGL2RenderingContext, program: ShaderProgram, name: string, value: number | number[] | Float32Array | Int32Array | boolean): void;
/**
 * Set multiple uniforms at once
 */
export declare function setUniforms(gl: WebGLRenderingContext | WebGL2RenderingContext, program: ShaderProgram, uniforms: Record<string, number | number[] | Float32Array | Int32Array | boolean>): void;
export declare const BASIC_VERTEX_SHADER = "\nattribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\n\nuniform mat4 uModelMatrix;\nuniform mat4 uViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform mat3 uNormalMatrix;\n\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\nvarying vec3 vPosition;\n\nvoid main() {\n  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);\n  vPosition = worldPosition.xyz;\n  vNormal = normalize(uNormalMatrix * aNormal);\n  vTexCoord = aTexCoord;\n  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;\n}\n";
export declare const BASIC_FRAGMENT_SHADER = "\nprecision mediump float;\n\nuniform vec3 uColor;\nuniform vec3 uLightPosition;\nuniform vec3 uLightColor;\nuniform float uAmbientStrength;\n\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\nvarying vec3 vPosition;\n\nvoid main() {\n  // Ambient\n  vec3 ambient = uAmbientStrength * uLightColor;\n\n  // Diffuse\n  vec3 lightDir = normalize(uLightPosition - vPosition);\n  float diff = max(dot(vNormal, lightDir), 0.0);\n  vec3 diffuse = diff * uLightColor;\n\n  vec3 result = (ambient + diffuse) * uColor;\n  gl_FragColor = vec4(result, 1.0);\n}\n";
export declare const UNLIT_VERTEX_SHADER = "\nattribute vec3 aPosition;\nattribute vec2 aTexCoord;\n\nuniform mat4 uModelViewProjectionMatrix;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  vTexCoord = aTexCoord;\n  gl_Position = uModelViewProjectionMatrix * vec4(aPosition, 1.0);\n}\n";
export declare const UNLIT_FRAGMENT_SHADER = "\nprecision mediump float;\n\nuniform vec4 uColor;\nuniform sampler2D uTexture;\nuniform bool uUseTexture;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  if (uUseTexture) {\n    gl_FragColor = texture2D(uTexture, vTexCoord) * uColor;\n  } else {\n    gl_FragColor = uColor;\n  }\n}\n";
export declare const TEXTURED_VERTEX_SHADER = "\nattribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\n\nuniform mat4 uModelMatrix;\nuniform mat4 uViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform mat3 uNormalMatrix;\n\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\nvarying vec3 vPosition;\n\nvoid main() {\n  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);\n  vPosition = worldPosition.xyz;\n  vNormal = normalize(uNormalMatrix * aNormal);\n  vTexCoord = aTexCoord;\n  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;\n}\n";
export declare const TEXTURED_FRAGMENT_SHADER = "\nprecision mediump float;\n\nuniform sampler2D uDiffuseMap;\nuniform vec3 uLightPosition;\nuniform vec3 uLightColor;\nuniform float uAmbientStrength;\n\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\nvarying vec3 vPosition;\n\nvoid main() {\n  vec4 texColor = texture2D(uDiffuseMap, vTexCoord);\n\n  // Ambient\n  vec3 ambient = uAmbientStrength * uLightColor;\n\n  // Diffuse\n  vec3 lightDir = normalize(uLightPosition - vPosition);\n  float diff = max(dot(vNormal, lightDir), 0.0);\n  vec3 diffuse = diff * uLightColor;\n\n  vec3 result = (ambient + diffuse) * texColor.rgb;\n  gl_FragColor = vec4(result, texColor.a);\n}\n";
//# sourceMappingURL=shaders.d.ts.map