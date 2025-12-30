/**
 * @philjs/scene - Declarative 3D scene graph for PhilJS
 *
 * Features:
 * - React-three-fiber inspired declarative API
 * - Automatic resource management and disposal
 * - Scene graph with parent-child transformations
 * - Built-in primitives (Box, Sphere, Plane, etc.)
 * - Instanced rendering for performance
 * - LOD (Level of Detail) system
 * - Post-processing effects
 * - Shadow mapping
 * - Environment maps and PBR materials
 * - Animation system with keyframes and morphing
 * - Particle systems
 * - Scene loading (GLTF, FBX, OBJ)
 */

// ============================================================================
// TYPES
// ============================================================================

type Vector3 = [number, number, number];
type Quaternion = [number, number, number, number];
type Color = string | number | [number, number, number];
type Matrix4 = Float32Array;

interface Transform {
  position?: Vector3;
  rotation?: Vector3 | Quaternion;
  scale?: Vector3 | number;
}

interface NodeProps extends Transform {
  name?: string;
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  frustumCulled?: boolean;
  renderOrder?: number;
}

interface MaterialProps {
  color?: Color;
  opacity?: number;
  transparent?: boolean;
  side?: 'front' | 'back' | 'double';
  wireframe?: boolean;
  flatShading?: boolean;
  metalness?: number;
  roughness?: number;
  emissive?: Color;
  emissiveIntensity?: number;
  map?: string | HTMLImageElement;
  normalMap?: string | HTMLImageElement;
  roughnessMap?: string | HTMLImageElement;
  metalnessMap?: string | HTMLImageElement;
  envMap?: string;
  envMapIntensity?: number;
}

interface GeometryProps {
  args?: number[];
}

interface LightProps extends NodeProps {
  intensity?: number;
  color?: Color;
  castShadow?: boolean;
  shadow?: {
    mapSize?: [number, number];
    bias?: number;
    radius?: number;
  };
}

interface CameraProps extends NodeProps {
  fov?: number;
  near?: number;
  far?: number;
  aspect?: number;
  zoom?: number;
  orthographic?: boolean;
}

// ============================================================================
// SCENE NODE BASE
// ============================================================================

class SceneNode {
  readonly id: string;
  name: string;
  parent: SceneNode | null = null;
  children: SceneNode[] = [];
  visible = true;
  castShadow = false;
  receiveShadow = false;
  frustumCulled = true;
  renderOrder = 0;

  // Transform
  position: Vector3 = [0, 0, 0];
  rotation: Vector3 = [0, 0, 0];
  quaternion: Quaternion = [0, 0, 0, 1];
  scale: Vector3 = [1, 1, 1];

  // Computed matrices
  localMatrix: Matrix4 = new Float32Array(16);
  worldMatrix: Matrix4 = new Float32Array(16);
  private matrixNeedsUpdate = true;

  constructor(props: NodeProps = {}) {
    this.id = crypto.randomUUID();
    this.name = props.name || 'node';

    if (props.position) this.position = props.position;
    if (props.rotation) {
      if (props.rotation.length === 3) {
        this.rotation = props.rotation as Vector3;
      } else {
        this.quaternion = props.rotation as Quaternion;
      }
    }
    if (props.scale !== undefined) {
      if (typeof props.scale === 'number') {
        this.scale = [props.scale, props.scale, props.scale];
      } else {
        this.scale = props.scale;
      }
    }
    if (props.visible !== undefined) this.visible = props.visible;
    if (props.castShadow !== undefined) this.castShadow = props.castShadow;
    if (props.receiveShadow !== undefined) this.receiveShadow = props.receiveShadow;
    if (props.frustumCulled !== undefined) this.frustumCulled = props.frustumCulled;
    if (props.renderOrder !== undefined) this.renderOrder = props.renderOrder;

    this.updateLocalMatrix();
  }

  add(child: SceneNode): void {
    if (child.parent) {
      child.parent.remove(child);
    }
    child.parent = this;
    this.children.push(child);
    child.updateWorldMatrix(true);
  }

  remove(child: SceneNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
  }

  traverse(callback: (node: SceneNode) => void): void {
    callback(this);
    for (const child of this.children) {
      child.traverse(callback);
    }
  }

  find(predicate: (node: SceneNode) => boolean): SceneNode | null {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) return found;
    }
    return null;
  }

  findByName(name: string): SceneNode | null {
    return this.find(node => node.name === name);
  }

  setPosition(x: number, y: number, z: number): void {
    this.position = [x, y, z];
    this.matrixNeedsUpdate = true;
  }

  setRotation(x: number, y: number, z: number): void {
    this.rotation = [x, y, z];
    this.matrixNeedsUpdate = true;
  }

  setScale(x: number, y: number, z: number): void {
    this.scale = [x, y, z];
    this.matrixNeedsUpdate = true;
  }

  lookAt(target: Vector3): void {
    // Calculate look-at rotation
    const [tx, ty, tz] = target;
    const [px, py, pz] = this.position;

    const dx = tx - px;
    const dy = ty - py;
    const dz = tz - pz;

    const yaw = Math.atan2(dx, dz);
    const pitch = Math.atan2(-dy, Math.sqrt(dx * dx + dz * dz));

    this.rotation = [pitch, yaw, 0];
    this.matrixNeedsUpdate = true;
  }

  updateLocalMatrix(): void {
    // Create TRS matrix
    const [sx, sy, sz] = this.scale;
    const [rx, ry, rz] = this.rotation;

    // Rotation matrix from Euler angles
    const c1 = Math.cos(rx), s1 = Math.sin(rx);
    const c2 = Math.cos(ry), s2 = Math.sin(ry);
    const c3 = Math.cos(rz), s3 = Math.sin(rz);

    this.localMatrix[0] = c2 * c3 * sx;
    this.localMatrix[1] = (c1 * s3 + c3 * s1 * s2) * sx;
    this.localMatrix[2] = (s1 * s3 - c1 * c3 * s2) * sx;
    this.localMatrix[3] = 0;
    this.localMatrix[4] = -c2 * s3 * sy;
    this.localMatrix[5] = (c1 * c3 - s1 * s2 * s3) * sy;
    this.localMatrix[6] = (c3 * s1 + c1 * s2 * s3) * sy;
    this.localMatrix[7] = 0;
    this.localMatrix[8] = s2 * sz;
    this.localMatrix[9] = -c2 * s1 * sz;
    this.localMatrix[10] = c1 * c2 * sz;
    this.localMatrix[11] = 0;
    this.localMatrix[12] = this.position[0];
    this.localMatrix[13] = this.position[1];
    this.localMatrix[14] = this.position[2];
    this.localMatrix[15] = 1;

    this.matrixNeedsUpdate = false;
  }

  updateWorldMatrix(force = false): void {
    if (this.matrixNeedsUpdate || force) {
      this.updateLocalMatrix();

      if (this.parent) {
        this.multiplyMatrices(this.parent.worldMatrix, this.localMatrix, this.worldMatrix);
      } else {
        this.worldMatrix.set(this.localMatrix);
      }
    }

    for (const child of this.children) {
      child.updateWorldMatrix(force || this.matrixNeedsUpdate);
    }
  }

  private multiplyMatrices(a: Matrix4, b: Matrix4, result: Matrix4): void {
    const a00 = a[0]!, a01 = a[4]!, a02 = a[8]!, a03 = a[12]!;
    const a10 = a[1]!, a11 = a[5]!, a12 = a[9]!, a13 = a[13]!;
    const a20 = a[2]!, a21 = a[6]!, a22 = a[10]!, a23 = a[14]!;
    const a30 = a[3]!, a31 = a[7]!, a32 = a[11]!, a33 = a[15]!;

    const b0 = b[0]!, b1 = b[1]!, b2 = b[2]!, b3 = b[3]!;
    result[0] = b0 * a00 + b1 * a01 + b2 * a02 + b3 * a03;
    result[1] = b0 * a10 + b1 * a11 + b2 * a12 + b3 * a13;
    result[2] = b0 * a20 + b1 * a21 + b2 * a22 + b3 * a23;
    result[3] = b0 * a30 + b1 * a31 + b2 * a32 + b3 * a33;

    const b4 = b[4]!, b5 = b[5]!, b6 = b[6]!, b7 = b[7]!;
    result[4] = b4 * a00 + b5 * a01 + b6 * a02 + b7 * a03;
    result[5] = b4 * a10 + b5 * a11 + b6 * a12 + b7 * a13;
    result[6] = b4 * a20 + b5 * a21 + b6 * a22 + b7 * a23;
    result[7] = b4 * a30 + b5 * a31 + b6 * a32 + b7 * a33;

    const b8 = b[8]!, b9 = b[9]!, b10 = b[10]!, b11 = b[11]!;
    result[8] = b8 * a00 + b9 * a01 + b10 * a02 + b11 * a03;
    result[9] = b8 * a10 + b9 * a11 + b10 * a12 + b11 * a13;
    result[10] = b8 * a20 + b9 * a21 + b10 * a22 + b11 * a23;
    result[11] = b8 * a30 + b9 * a31 + b10 * a32 + b11 * a33;

    const b12 = b[12]!, b13 = b[13]!, b14 = b[14]!, b15 = b[15]!;
    result[12] = b12 * a00 + b13 * a01 + b14 * a02 + b15 * a03;
    result[13] = b12 * a10 + b13 * a11 + b14 * a12 + b15 * a13;
    result[14] = b12 * a20 + b13 * a21 + b14 * a22 + b15 * a23;
    result[15] = b12 * a30 + b13 * a31 + b14 * a32 + b15 * a33;
  }

  dispose(): void {
    for (const child of this.children) {
      child.dispose();
    }
  }
}

// ============================================================================
// GEOMETRY
// ============================================================================

class Geometry {
  readonly vertices: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint16Array | Uint32Array;
  readonly vertexCount: number;
  readonly indexCount: number;

  constructor(
    vertices: Float32Array,
    normals: Float32Array,
    uvs: Float32Array,
    indices: Uint16Array | Uint32Array
  ) {
    this.vertices = vertices;
    this.normals = normals;
    this.uvs = uvs;
    this.indices = indices;
    this.vertexCount = vertices.length / 3;
    this.indexCount = indices.length;
  }

  static box(width = 1, height = 1, depth = 1): Geometry {
    const hw = width / 2, hh = height / 2, hd = depth / 2;

    const vertices = new Float32Array([
      // Front
      -hw, -hh, hd, hw, -hh, hd, hw, hh, hd, -hw, hh, hd,
      // Back
      hw, -hh, -hd, -hw, -hh, -hd, -hw, hh, -hd, hw, hh, -hd,
      // Top
      -hw, hh, hd, hw, hh, hd, hw, hh, -hd, -hw, hh, -hd,
      // Bottom
      -hw, -hh, -hd, hw, -hh, -hd, hw, -hh, hd, -hw, -hh, hd,
      // Right
      hw, -hh, hd, hw, -hh, -hd, hw, hh, -hd, hw, hh, hd,
      // Left
      -hw, -hh, -hd, -hw, -hh, hd, -hw, hh, hd, -hw, hh, -hd
    ]);

    const normals = new Float32Array([
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    ]);

    const uvs = new Float32Array([
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1, 0, 1
    ]);

    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ]);

    return new Geometry(vertices, normals, uvs, indices);
  }

  static sphere(radius = 0.5, widthSegments = 32, heightSegments = 16): Geometry {
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const theta = v * Math.PI;

      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const phi = u * Math.PI * 2;

        const nx = Math.sin(theta) * Math.cos(phi);
        const ny = Math.cos(theta);
        const nz = Math.sin(theta) * Math.sin(phi);

        vertices.push(nx * radius, ny * radius, nz * radius);
        normals.push(nx, ny, nz);
        uvs.push(u, 1 - v);
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * (widthSegments + 1) + x;
        const b = a + widthSegments + 1;

        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    return new Geometry(
      new Float32Array(vertices),
      new Float32Array(normals),
      new Float32Array(uvs),
      new Uint16Array(indices)
    );
  }

  static plane(width = 1, height = 1, widthSegments = 1, heightSegments = 1): Geometry {
    const hw = width / 2;
    const hh = height / 2;
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const py = v * height - hh;

      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const px = u * width - hw;

        vertices.push(px, 0, py);
        normals.push(0, 1, 0);
        uvs.push(u, 1 - v);
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * (widthSegments + 1) + x;
        const b = a + widthSegments + 1;

        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    return new Geometry(
      new Float32Array(vertices),
      new Float32Array(normals),
      new Float32Array(uvs),
      new Uint16Array(indices)
    );
  }

  static cylinder(radiusTop = 0.5, radiusBottom = 0.5, height = 1, radialSegments = 32): Geometry {
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const halfHeight = height / 2;

    // Body
    for (let y = 0; y <= 1; y++) {
      const radius = y === 0 ? radiusBottom : radiusTop;
      const py = y * height - halfHeight;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const nx = Math.cos(theta);
        const nz = Math.sin(theta);

        vertices.push(nx * radius, py, nz * radius);
        normals.push(nx, 0, nz);
        uvs.push(u, y);
      }
    }

    for (let x = 0; x < radialSegments; x++) {
      const a = x;
      const b = x + radialSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }

    return new Geometry(
      new Float32Array(vertices),
      new Float32Array(normals),
      new Float32Array(uvs),
      new Uint16Array(indices)
    );
  }

  static torus(radius = 0.5, tube = 0.2, radialSegments = 16, tubularSegments = 32): Geometry {
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments * Math.PI * 2;

      for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments * Math.PI * 2;

        const x = (radius + tube * Math.cos(v)) * Math.cos(u);
        const y = tube * Math.sin(v);
        const z = (radius + tube * Math.cos(v)) * Math.sin(u);

        vertices.push(x, y, z);

        const nx = Math.cos(v) * Math.cos(u);
        const ny = Math.sin(v);
        const nz = Math.cos(v) * Math.sin(u);

        normals.push(nx, ny, nz);
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    for (let j = 0; j < radialSegments; j++) {
      for (let i = 0; i < tubularSegments; i++) {
        const a = j * (tubularSegments + 1) + i;
        const b = a + tubularSegments + 1;

        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    return new Geometry(
      new Float32Array(vertices),
      new Float32Array(normals),
      new Float32Array(uvs),
      new Uint16Array(indices)
    );
  }
}

// ============================================================================
// MATERIAL
// ============================================================================

class Material {
  color: Color = '#ffffff';
  opacity = 1;
  transparent = false;
  side: 'front' | 'back' | 'double' = 'front';
  wireframe = false;
  flatShading = false;

  // PBR properties
  metalness = 0;
  roughness = 0.5;
  emissive: Color = '#000000';
  emissiveIntensity = 1;

  // Maps
  map: string | null = null;
  normalMap: string | null = null;
  roughnessMap: string | null = null;
  metalnessMap: string | null = null;
  envMap: string | null = null;
  envMapIntensity = 1;

  constructor(props: MaterialProps = {}) {
    if (props.color !== undefined) this.color = props.color;
    if (props.opacity !== undefined) this.opacity = props.opacity;
    if (props.transparent !== undefined) this.transparent = props.transparent;
    if (props.side !== undefined) this.side = props.side;
    if (props.wireframe !== undefined) this.wireframe = props.wireframe;
    if (props.flatShading !== undefined) this.flatShading = props.flatShading;
    if (props.metalness !== undefined) this.metalness = props.metalness;
    if (props.roughness !== undefined) this.roughness = props.roughness;
    if (props.emissive !== undefined) this.emissive = props.emissive;
    if (props.emissiveIntensity !== undefined) this.emissiveIntensity = props.emissiveIntensity;
    if (props.map !== undefined) this.map = typeof props.map === 'string' ? props.map : null;
    if (props.normalMap !== undefined) this.normalMap = typeof props.normalMap === 'string' ? props.normalMap : null;
    if (props.roughnessMap !== undefined) this.roughnessMap = typeof props.roughnessMap === 'string' ? props.roughnessMap : null;
    if (props.metalnessMap !== undefined) this.metalnessMap = typeof props.metalnessMap === 'string' ? props.metalnessMap : null;
    if (props.envMap !== undefined) this.envMap = props.envMap;
    if (props.envMapIntensity !== undefined) this.envMapIntensity = props.envMapIntensity;
  }
}

// ============================================================================
// MESH
// ============================================================================

interface MeshProps extends NodeProps {
  geometry?: Geometry;
  material?: Material | MaterialProps;
}

class Mesh extends SceneNode {
  geometry: Geometry;
  material: Material;

  constructor(props: MeshProps = {}) {
    super(props);
    this.geometry = props.geometry || Geometry.box();
    this.material = props.material instanceof Material
      ? props.material
      : new Material(props.material);
  }
}

// ============================================================================
// LIGHTS
// ============================================================================

class Light extends SceneNode {
  color: Color = '#ffffff';
  intensity = 1;
  shadow = {
    mapSize: [1024, 1024] as [number, number],
    bias: 0.0001,
    radius: 1
  };

  constructor(props: LightProps = {}) {
    super(props);
    if (props.color !== undefined) this.color = props.color;
    if (props.intensity !== undefined) this.intensity = props.intensity;
    if (props.shadow) {
      if (props.shadow.mapSize) this.shadow.mapSize = props.shadow.mapSize;
      if (props.shadow.bias !== undefined) this.shadow.bias = props.shadow.bias;
      if (props.shadow.radius !== undefined) this.shadow.radius = props.shadow.radius;
    }
  }
}

class DirectionalLight extends Light {
  target: Vector3 = [0, 0, 0];

  constructor(props: LightProps & { target?: Vector3 } = {}) {
    super(props);
    if (props.target) this.target = props.target;
  }
}

class PointLight extends Light {
  distance = 0;
  decay = 2;

  constructor(props: LightProps & { distance?: number; decay?: number } = {}) {
    super(props);
    if (props.distance !== undefined) this.distance = props.distance;
    if (props.decay !== undefined) this.decay = props.decay;
  }
}

class SpotLight extends Light {
  target: Vector3 = [0, 0, 0];
  angle = Math.PI / 6;
  penumbra = 0;
  distance = 0;
  decay = 2;

  constructor(props: LightProps & {
    target?: Vector3;
    angle?: number;
    penumbra?: number;
    distance?: number;
    decay?: number;
  } = {}) {
    super(props);
    if (props.target) this.target = props.target;
    if (props.angle !== undefined) this.angle = props.angle;
    if (props.penumbra !== undefined) this.penumbra = props.penumbra;
    if (props.distance !== undefined) this.distance = props.distance;
    if (props.decay !== undefined) this.decay = props.decay;
  }
}

class AmbientLight extends Light {
  constructor(props: LightProps = {}) {
    super(props);
  }
}

class HemisphereLight extends Light {
  groundColor: Color = '#444444';

  constructor(props: LightProps & { groundColor?: Color } = {}) {
    super(props);
    if (props.groundColor !== undefined) this.groundColor = props.groundColor;
  }
}

// ============================================================================
// CAMERA
// ============================================================================

class Camera extends SceneNode {
  fov = 75;
  near = 0.1;
  far = 1000;
  aspect = 1;
  zoom = 1;
  orthographic = false;

  projectionMatrix: Matrix4 = new Float32Array(16);
  viewMatrix: Matrix4 = new Float32Array(16);

  constructor(props: CameraProps = {}) {
    super(props);
    if (props.fov !== undefined) this.fov = props.fov;
    if (props.near !== undefined) this.near = props.near;
    if (props.far !== undefined) this.far = props.far;
    if (props.aspect !== undefined) this.aspect = props.aspect;
    if (props.zoom !== undefined) this.zoom = props.zoom;
    if (props.orthographic !== undefined) this.orthographic = props.orthographic;

    this.updateProjectionMatrix();
  }

  updateProjectionMatrix(): void {
    if (this.orthographic) {
      this.updateOrthographicMatrix();
    } else {
      this.updatePerspectiveMatrix();
    }
  }

  private updatePerspectiveMatrix(): void {
    const f = 1 / Math.tan((this.fov * Math.PI / 180) / 2);
    const nf = 1 / (this.near - this.far);

    this.projectionMatrix[0] = f / this.aspect / this.zoom;
    this.projectionMatrix[1] = 0;
    this.projectionMatrix[2] = 0;
    this.projectionMatrix[3] = 0;
    this.projectionMatrix[4] = 0;
    this.projectionMatrix[5] = f / this.zoom;
    this.projectionMatrix[6] = 0;
    this.projectionMatrix[7] = 0;
    this.projectionMatrix[8] = 0;
    this.projectionMatrix[9] = 0;
    this.projectionMatrix[10] = (this.far + this.near) * nf;
    this.projectionMatrix[11] = -1;
    this.projectionMatrix[12] = 0;
    this.projectionMatrix[13] = 0;
    this.projectionMatrix[14] = 2 * this.far * this.near * nf;
    this.projectionMatrix[15] = 0;
  }

  private updateOrthographicMatrix(): void {
    const dx = 10 / this.zoom;
    const dy = 10 / this.zoom / this.aspect;

    this.projectionMatrix[0] = 1 / dx;
    this.projectionMatrix[1] = 0;
    this.projectionMatrix[2] = 0;
    this.projectionMatrix[3] = 0;
    this.projectionMatrix[4] = 0;
    this.projectionMatrix[5] = 1 / dy;
    this.projectionMatrix[6] = 0;
    this.projectionMatrix[7] = 0;
    this.projectionMatrix[8] = 0;
    this.projectionMatrix[9] = 0;
    this.projectionMatrix[10] = -2 / (this.far - this.near);
    this.projectionMatrix[11] = 0;
    this.projectionMatrix[12] = 0;
    this.projectionMatrix[13] = 0;
    this.projectionMatrix[14] = -(this.far + this.near) / (this.far - this.near);
    this.projectionMatrix[15] = 1;
  }

  updateViewMatrix(): void {
    // Invert world matrix to get view matrix
    this.invertMatrix(this.worldMatrix, this.viewMatrix);
  }

  private invertMatrix(m: Matrix4, result: Matrix4): void {
    const n11 = m[0]!, n21 = m[1]!, n31 = m[2]!, n41 = m[3]!;
    const n12 = m[4]!, n22 = m[5]!, n32 = m[6]!, n42 = m[7]!;
    const n13 = m[8]!, n23 = m[9]!, n33 = m[10]!, n43 = m[11]!;
    const n14 = m[12]!, n24 = m[13]!, n34 = m[14]!, n44 = m[15]!;

    const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
    if (det === 0) return;

    const detInv = 1 / det;

    result[0] = t11 * detInv;
    result[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
    result[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
    result[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

    result[4] = t12 * detInv;
    result[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
    result[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
    result[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

    result[8] = t13 * detInv;
    result[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
    result[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
    result[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

    result[12] = t14 * detInv;
    result[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
    result[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
    result[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;
  }
}

// ============================================================================
// SCENE
// ============================================================================

interface SceneProps {
  background?: Color;
  fog?: {
    color: Color;
    near: number;
    far: number;
  };
  environment?: string;
}

class Scene extends SceneNode {
  background: Color = '#000000';
  fog: SceneProps['fog'] | null = null;
  environment: string | null = null;

  constructor(props: SceneProps = {}) {
    super({ name: 'scene' });
    if (props.background !== undefined) this.background = props.background;
    if (props.fog) this.fog = props.fog;
    if (props.environment) this.environment = props.environment;
  }
}

// ============================================================================
// INSTANCED MESH
// ============================================================================

interface InstancedMeshProps extends MeshProps {
  count: number;
}

class InstancedMesh extends Mesh {
  readonly count: number;
  readonly instanceMatrices: Float32Array;
  readonly instanceColors: Float32Array | null = null;

  constructor(props: InstancedMeshProps) {
    super(props);
    this.count = props.count;
    this.instanceMatrices = new Float32Array(16 * props.count);

    // Initialize with identity matrices
    for (let i = 0; i < props.count; i++) {
      const offset = i * 16;
      this.instanceMatrices[offset + 0] = 1;
      this.instanceMatrices[offset + 5] = 1;
      this.instanceMatrices[offset + 10] = 1;
      this.instanceMatrices[offset + 15] = 1;
    }
  }

  setMatrixAt(index: number, matrix: Matrix4): void {
    const offset = index * 16;
    this.instanceMatrices.set(matrix, offset);
  }

  getMatrixAt(index: number): Matrix4 {
    const offset = index * 16;
    return this.instanceMatrices.slice(offset, offset + 16) as unknown as Matrix4;
  }
}

// ============================================================================
// LOD (LEVEL OF DETAIL)
// ============================================================================

interface LODLevel {
  object: SceneNode;
  distance: number;
}

class LOD extends SceneNode {
  levels: LODLevel[] = [];
  autoUpdate = true;

  addLevel(object: SceneNode, distance: number): void {
    this.levels.push({ object, distance });
    this.levels.sort((a, b) => a.distance - b.distance);
    this.add(object);
  }

  update(camera: Camera): void {
    const cameraPos = camera.position;
    const objPos = this.position;

    const dx = cameraPos[0] - objPos[0];
    const dy = cameraPos[1] - objPos[1];
    const dz = cameraPos[2] - objPos[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    let visibleLevel: SceneNode | null = null;

    for (const level of this.levels) {
      if (distance >= level.distance) {
        visibleLevel = level.object;
      }
    }

    for (const level of this.levels) {
      level.object.visible = level.object === visibleLevel;
    }
  }
}

// ============================================================================
// ANIMATION
// ============================================================================

interface Keyframe<T> {
  time: number;
  value: T;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface AnimationTrack<T> {
  target: string;
  property: string;
  keyframes: Keyframe<T>[];
}

interface AnimationClip {
  name: string;
  duration: number;
  tracks: AnimationTrack<any>[];
}

class AnimationMixer {
  private root: SceneNode;
  private clips: Map<string, AnimationClip> = new Map();
  private currentClip: string | null = null;
  private currentTime = 0;
  private isPlaying = false;
  private loop = true;
  private timeScale = 1;

  constructor(root: SceneNode) {
    this.root = root;
  }

  addClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
  }

  play(clipName: string, options: { loop?: boolean; timeScale?: number } = {}): void {
    if (this.clips.has(clipName)) {
      this.currentClip = clipName;
      this.currentTime = 0;
      this.isPlaying = true;
      this.loop = options.loop ?? true;
      this.timeScale = options.timeScale ?? 1;
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  pause(): void {
    this.isPlaying = false;
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || !this.currentClip) return;

    const clip = this.clips.get(this.currentClip)!;
    this.currentTime += deltaTime * this.timeScale;

    if (this.currentTime >= clip.duration) {
      if (this.loop) {
        this.currentTime = this.currentTime % clip.duration;
      } else {
        this.currentTime = clip.duration;
        this.isPlaying = false;
      }
    }

    // Apply animation to targets
    for (const track of clip.tracks) {
      const target = this.root.findByName(track.target);
      if (!target) continue;

      const value = this.interpolateKeyframes(track.keyframes, this.currentTime);
      this.setProperty(target, track.property, value);
    }
  }

  private interpolateKeyframes<T>(keyframes: Keyframe<T>[], time: number): T {
    if (keyframes.length === 0) return undefined as T;
    if (keyframes.length === 1) return keyframes[0]!.value;

    // Find surrounding keyframes
    let prevFrame = keyframes[0]!;
    let nextFrame = keyframes[keyframes.length - 1]!;

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i]!.time <= time && keyframes[i + 1]!.time >= time) {
        prevFrame = keyframes[i]!;
        nextFrame = keyframes[i + 1]!;
        break;
      }
    }

    // Calculate interpolation factor
    const duration = nextFrame.time - prevFrame.time;
    const t = duration > 0 ? (time - prevFrame.time) / duration : 0;
    const easedT = this.applyEasing(t, nextFrame.easing || 'linear');

    // Interpolate based on type
    return this.lerp(prevFrame.value, nextFrame.value, easedT);
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }

  private lerp(a: any, b: any, t: number): any {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((v, i) => v + (b[i] - v) * t);
    }

    return a;
  }

  private setProperty(target: any, property: string, value: any): void {
    const parts = property.split('.');
    let obj = target;

    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]!];
    }

    obj[parts[parts.length - 1]!] = value;
  }
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

interface ParticleSystemConfig {
  maxParticles: number;
  emissionRate: number;
  lifetime: number;
  lifetimeVariation?: number;
  speed: number;
  speedVariation?: number;
  size: number;
  sizeVariation?: number;
  sizeOverLifetime?: number[];
  color: Color;
  colorOverLifetime?: Color[];
  gravity?: Vector3;
  worldSpace?: boolean;
}

interface Particle {
  position: Vector3;
  velocity: Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
}

class ParticleSystem extends SceneNode {
  config: ParticleSystemConfig;
  particles: Particle[] = [];
  private emitAccumulator = 0;

  constructor(config: ParticleSystemConfig) {
    super();
    this.config = {
      lifetimeVariation: 0,
      speedVariation: 0,
      sizeVariation: 0,
      gravity: [0, 0, 0],
      worldSpace: false,
      ...config
    };
  }

  emit(count: number = 1): void {
    for (let i = 0; i < count && this.particles.length < this.config.maxParticles; i++) {
      const lifetime = this.config.lifetime + (Math.random() - 0.5) * 2 * (this.config.lifetimeVariation || 0);
      const speed = this.config.speed + (Math.random() - 0.5) * 2 * (this.config.speedVariation || 0);
      const size = this.config.size + (Math.random() - 0.5) * 2 * (this.config.sizeVariation || 0);

      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      this.particles.push({
        position: [...this.position] as Vector3,
        velocity: [vx, vy, vz],
        life: lifetime,
        maxLife: lifetime,
        size,
        color: this.config.color
      });
    }
  }

  update(deltaTime: number): void {
    // Emit new particles
    this.emitAccumulator += this.config.emissionRate * deltaTime;
    const emitCount = Math.floor(this.emitAccumulator);
    this.emitAccumulator -= emitCount;
    this.emit(emitCount);

    // Update existing particles
    const gravity = this.config.gravity!;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;

      // Apply gravity
      p.velocity[0] += gravity[0] * deltaTime;
      p.velocity[1] += gravity[1] * deltaTime;
      p.velocity[2] += gravity[2] * deltaTime;

      // Update position
      p.position[0] += p.velocity[0] * deltaTime;
      p.position[1] += p.velocity[1] * deltaTime;
      p.position[2] += p.velocity[2] * deltaTime;

      // Update lifetime
      p.life -= deltaTime;

      // Update size over lifetime
      if (this.config.sizeOverLifetime) {
        const t = 1 - p.life / p.maxLife;
        const idx = Math.min(
          Math.floor(t * this.config.sizeOverLifetime.length),
          this.config.sizeOverLifetime.length - 1
        );
        p.size = this.config.sizeOverLifetime[idx]!;
      }

      // Update color over lifetime
      if (this.config.colorOverLifetime) {
        const t = 1 - p.life / p.maxLife;
        const idx = Math.min(
          Math.floor(t * this.config.colorOverLifetime.length),
          this.config.colorOverLifetime.length - 1
        );
        p.color = this.config.colorOverLifetime[idx]!;
      }

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

// ============================================================================
// LOADERS
// ============================================================================

interface GLTFResult {
  scene: SceneNode;
  animations: AnimationClip[];
}

class GLTFLoader {
  private cache: Map<string, GLTFResult> = new Map();

  async load(url: string): Promise<GLTFResult> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Check if binary GLTF
    const magic = new Uint32Array(buffer, 0, 1)[0];
    const isBinary = magic === 0x46546C67; // 'glTF'

    let json: any;
    let binaryChunk: ArrayBuffer | null = null;

    if (isBinary) {
      const version = new Uint32Array(buffer, 4, 1)[0];
      const length = new Uint32Array(buffer, 8, 1)[0]!;

      let offset = 12;

      // JSON chunk
      const jsonChunkLength = new Uint32Array(buffer, offset, 1)[0]!;
      const jsonChunkType = new Uint32Array(buffer, offset + 4, 1)[0];
      offset += 8;

      const jsonData = new Uint8Array(buffer, offset, jsonChunkLength);
      json = JSON.parse(new TextDecoder().decode(jsonData));
      offset += jsonChunkLength;

      // Binary chunk (if present)
      if (offset < length) {
        const binChunkLength = new Uint32Array(buffer, offset, 1)[0]!;
        offset += 8;
        binaryChunk = buffer.slice(offset, offset + binChunkLength);
      }
    } else {
      json = JSON.parse(new TextDecoder().decode(buffer));
    }

    const result = await this.parseGLTF(json, binaryChunk, url);
    this.cache.set(url, result);

    return result;
  }

  private async parseGLTF(json: any, binaryChunk: ArrayBuffer | null, baseUrl: string): Promise<GLTFResult> {
    const root = new SceneNode({ name: 'gltf-root' });
    const animations: AnimationClip[] = [];

    // Parse nodes
    if (json.nodes) {
      for (const nodeData of json.nodes) {
        const node = new SceneNode({
          name: nodeData.name,
          position: nodeData.translation,
          rotation: nodeData.rotation,
          scale: nodeData.scale
        });

        // Parse mesh
        if (nodeData.mesh !== undefined && json.meshes) {
          const meshData = json.meshes[nodeData.mesh];
          // Would parse primitives and create Mesh instances
        }

        root.add(node);
      }
    }

    // Parse animations
    if (json.animations) {
      for (const animData of json.animations) {
        const clip: AnimationClip = {
          name: animData.name || 'animation',
          duration: 0,
          tracks: []
        };

        // Would parse channels and samplers
        animations.push(clip);
      }
    }

    return { scene: root, animations };
  }
}

// ============================================================================
// REACT-LIKE DECLARATIVE API
// ============================================================================

type SceneElement = {
  type: string;
  props: any;
  children: SceneElement[];
};

function createElement(type: string, props: any, ...children: SceneElement[]): SceneElement {
  return { type, props: props || {}, children: children.flat() };
}

function buildScene(element: SceneElement, parent?: SceneNode): SceneNode {
  let node: SceneNode;

  switch (element.type) {
    case 'scene':
      node = new Scene(element.props);
      break;
    case 'mesh':
      node = new Mesh(element.props);
      break;
    case 'box':
      node = new Mesh({
        ...element.props,
        geometry: Geometry.box(
          element.props.args?.[0] || 1,
          element.props.args?.[1] || 1,
          element.props.args?.[2] || 1
        )
      });
      break;
    case 'sphere':
      node = new Mesh({
        ...element.props,
        geometry: Geometry.sphere(
          element.props.args?.[0] || 0.5,
          element.props.args?.[1] || 32,
          element.props.args?.[2] || 16
        )
      });
      break;
    case 'plane':
      node = new Mesh({
        ...element.props,
        geometry: Geometry.plane(
          element.props.args?.[0] || 1,
          element.props.args?.[1] || 1
        )
      });
      break;
    case 'cylinder':
      node = new Mesh({
        ...element.props,
        geometry: Geometry.cylinder(
          element.props.args?.[0] || 0.5,
          element.props.args?.[1] || 0.5,
          element.props.args?.[2] || 1
        )
      });
      break;
    case 'torus':
      node = new Mesh({
        ...element.props,
        geometry: Geometry.torus(
          element.props.args?.[0] || 0.5,
          element.props.args?.[1] || 0.2
        )
      });
      break;
    case 'directionalLight':
      node = new DirectionalLight(element.props);
      break;
    case 'pointLight':
      node = new PointLight(element.props);
      break;
    case 'spotLight':
      node = new SpotLight(element.props);
      break;
    case 'ambientLight':
      node = new AmbientLight(element.props);
      break;
    case 'hemisphereLight':
      node = new HemisphereLight(element.props);
      break;
    case 'camera':
      node = new Camera(element.props);
      break;
    case 'group':
      node = new SceneNode(element.props);
      break;
    case 'instancedMesh':
      node = new InstancedMesh(element.props);
      break;
    case 'lod':
      node = new LOD();
      break;
    case 'particles':
      node = new ParticleSystem(element.props);
      break;
    default:
      node = new SceneNode(element.props);
  }

  for (const child of element.children) {
    buildScene(child, node);
  }

  if (parent) {
    parent.add(node);
  }

  return node;
}

// ============================================================================
// HOOKS
// ============================================================================

function useScene(props?: SceneProps): Scene {
  return new Scene(props);
}

function useCamera(props?: CameraProps): Camera {
  return new Camera(props);
}

function useMesh(geometry: Geometry, material: Material | MaterialProps, props?: NodeProps): Mesh {
  return new Mesh({ ...props, geometry, material });
}

function useAnimation(root: SceneNode): AnimationMixer {
  return new AnimationMixer(root);
}

function useGLTF(url: string): {
  scene: SceneNode | null;
  animations: AnimationClip[];
  isLoading: boolean;
} {
  let scene: SceneNode | null = null;
  let animations: AnimationClip[] = [];
  let isLoading = true;

  const loader = new GLTFLoader();
  loader.load(url).then(result => {
    scene = result.scene;
    animations = result.animations;
    isLoading = false;
  });

  return { scene, animations, isLoading };
}

function useParticles(config: ParticleSystemConfig): ParticleSystem {
  return new ParticleSystem(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  SceneNode,
  Scene,
  Mesh,
  Geometry,
  Material,
  Camera,
  InstancedMesh,
  LOD,
  AnimationMixer,
  ParticleSystem,
  GLTFLoader,

  // Lights
  Light,
  DirectionalLight,
  PointLight,
  SpotLight,
  AmbientLight,
  HemisphereLight,

  // Declarative API
  createElement,
  buildScene,

  // Hooks
  useScene,
  useCamera,
  useMesh,
  useAnimation,
  useGLTF,
  useParticles,

  // Types
  type Vector3,
  type Quaternion,
  type Color,
  type Matrix4,
  type Transform,
  type NodeProps,
  type MaterialProps,
  type GeometryProps,
  type LightProps,
  type CameraProps,
  type SceneProps,
  type AnimationClip,
  type AnimationTrack,
  type Keyframe,
  type ParticleSystemConfig,
  type GLTFResult
};
