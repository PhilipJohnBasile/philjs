/**
 * @file WebGL Integration
 * @description Complete WebGL integration for PhilJS
 */
// Context management
export { createWebGLContext, isWebGLSupported, isWebGL2Supported, getWebGLCapabilities, resizeCanvas, clearContext, enableDefaultFeatures, } from './context.js';
// Shader management
export { compileShader, createProgram, useProgram, deleteProgram, setUniform, setUniforms, BASIC_VERTEX_SHADER, BASIC_FRAGMENT_SHADER, UNLIT_VERTEX_SHADER, UNLIT_FRAGMENT_SHADER, TEXTURED_VERTEX_SHADER, TEXTURED_FRAGMENT_SHADER, } from './shaders.js';
// Buffer management
export { createBuffer, createBufferInfo, updateBuffer, deleteBuffer, createVertexArray, bindVertexArray, deleteVertexArray, createVertexArrayInfo, setupVertexAttributes, drawVertexArray, deleteVertexArrayInfo, } from './buffers.js';
// Texture management
export { createTextureFromImage, loadTexture, createPlaceholderTexture, createDataTexture, createCubemapTexture, updateTexture, bindTexture, unbindTexture, deleteTexture, } from './textures.js';
// Camera and math utilities
export { mat4Identity, mat4Multiply, mat4Perspective, mat4Orthographic, mat4LookAt, mat4Translate, mat4RotateX, mat4RotateY, mat4RotateZ, mat4Scale, mat4Invert, mat4Transpose, mat3FromMat4, mat3InvertTranspose, createCamera, updateCameraView, updateCameraProjection, setCameraPosition, setCameraTarget, setCameraAspect, orbitCamera, zoomCamera, getViewProjectionMatrix, } from './camera.js';
// 3D Primitives
export { createCube, createSphere, createPlane, createCylinder, createCone, createTorus, createRoundedBox, mergeGeometries, transformGeometry, } from './primitives.js';
// Animation
export { createAnimationLoop, createFixedTimestepLoop, createAnimator, Easing, lerp, lerpVec3, slerp, } from './animation.js';
// Hooks
export { useWebGL, useAnimationFrame, useShaderProgram, useActiveProgram, useUniforms, useCamera, useAutoResize, useRenderPass, cleanupWebGL, } from './hooks.js';
// Components
export { WebGLCanvas, createWebGLCanvasElement } from './WebGLCanvas.js';
//# sourceMappingURL=index.js.map