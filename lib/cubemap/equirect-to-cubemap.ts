import type { CubeFace } from "@/lib/cubemap/types";

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_panorama;
uniform int u_face;
uniform float u_tanHalfFov;
uniform float u_yaw;
uniform int u_projection; // 0 = equirect, 1 = YouTube EAC 3x2

vec3 faceDir(int face, vec2 uv) {
  // uv in [-1, 1], y up
  float x = uv.x * u_tanHalfFov;
  float y = uv.y * u_tanHalfFov;
  if (face == 0) return normalize(vec3(x, y, 1.0));       // front  (+Z)
  if (face == 1) return normalize(vec3(1.0, y, -x));      // right  (+X)
  if (face == 2) return normalize(vec3(-x, y, -1.0));     // back   (-Z)
  if (face == 3) return normalize(vec3(-1.0, y, x));      // left   (-X)
  if (face == 4) return normalize(vec3(x, 1.0, -y));      // top    (+Y)
  return normalize(vec3(x, -1.0, y));                     // bottom (-Y)
}

vec2 dirToEquirect(vec3 dir) {
  float lon = atan(dir.x, dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  float u = lon * (0.5 / 3.141592653589793) + 0.5;
  float v = 0.5 - lat * (1.0 / 3.141592653589793);
  return vec2(fract(u), clamp(v, 0.0, 1.0));
}

float eacTangentToUv(float t) {
  // s = (atan(t) / (pi/4) + 1) / 2
  return (atan(t) / 0.7853981633974483 + 1.0) * 0.5;
}

vec2 dirToEac(vec3 dir) {
  vec3 d = normalize(dir);
  float ax = abs(d.x);
  float ay = abs(d.y);
  float az = abs(d.z);

  int tile;
  float ts;
  float tt;

  // Invert faceDir() for a full 90° cube face, then apply EAC remap.
  if (ax >= ay && ax >= az) {
    if (d.x > 0.0) {
      tile = 1; // right
      ts = -d.z / d.x;
      tt = d.y / d.x;
    } else {
      tile = 3; // left
      ts = d.z / (-d.x);
      tt = d.y / (-d.x);
    }
  } else if (ay >= ax && ay >= az) {
    if (d.y > 0.0) {
      tile = 4; // top
      ts = d.x / d.y;
      tt = -d.z / d.y;
    } else {
      tile = 5; // bottom
      ts = d.x / (-d.y);
      tt = d.z / (-d.y);
    }
  } else if (d.z > 0.0) {
    tile = 0; // front
    ts = d.x / d.z;
    tt = d.y / d.z;
  } else {
    tile = 2; // back
    ts = -d.x / (-d.z);
    tt = d.y / (-d.z);
  }

  float fu = clamp(eacTangentToUv(ts), 0.0, 1.0);
  float fv = clamp(eacTangentToUv(tt), 0.0, 1.0);

  // YouTube / Photo Sphere Viewer 3×2 layout:
  // | left | front | right |
  // | bottom | back | top |
  float col;
  float row;
  if (tile == 3) { col = 0.0; row = 0.0; }
  else if (tile == 0) { col = 1.0; row = 0.0; }
  else if (tile == 1) { col = 2.0; row = 0.0; }
  else if (tile == 5) { col = 0.0; row = 1.0; }
  else if (tile == 2) { col = 1.0; row = 1.0; }
  else { col = 2.0; row = 1.0; }

  // Texture v=0 is the top of the uploaded frame.
  float u = (col + fu) / 3.0;
  float v = (row + (1.0 - fv)) / 2.0;
  return vec2(u, clamp(v, 0.0, 1.0));
}

vec3 rotateYaw(vec3 dir, float yaw) {
  float c = cos(yaw);
  float s = sin(yaw);
  return vec3(c * dir.x + s * dir.z, dir.y, -s * dir.x + c * dir.z);
}

void main() {
  // Clip-space y=+1 is the top of the output face. Keep uv.y positive upward
  // so cube faces are not vertically flipped.
  vec2 uv = v_uv * 2.0 - 1.0;
  vec3 dir = rotateYaw(faceDir(u_face, uv), u_yaw);
  vec2 sampleUv = u_projection == 1 ? dirToEac(dir) : dirToEquirect(dir);
  gl_FragColor = texture2D(u_panorama, sampleUv);
}
`;

const FACE_INDEX: Record<CubeFace, number> = {
  front: 0,
  right: 1,
  back: 2,
  left: 3,
  top: 4,
  bottom: 5,
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Shader compile failed.";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

export class EquirectCubemapRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private faceLoc: WebGLUniformLocation;
  private fovLoc: WebGLUniformLocation;
  private yawLoc: WebGLUniformLocation;
  private projectionLoc: WebGLUniformLocation;
  private disposed = false;
  private projectionMode: 0 | 1 = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    const gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL is required for cubemap projection.");
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create WebGL program.");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed.");
    }
    this.program = program;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "u_panorama"), 0);

    this.faceLoc = gl.getUniformLocation(program, "u_face")!;
    this.fovLoc = gl.getUniformLocation(program, "u_tanHalfFov")!;
    this.yawLoc = gl.getUniformLocation(program, "u_yaw")!;
    this.projectionLoc = gl.getUniformLocation(program, "u_projection")!;
    gl.uniform1i(this.projectionLoc, 0);
  }

  setProjection(projection: "equirect" | "eac") {
    this.projectionMode = projection === "eac" ? 1 : 0;
  }

  uploadEquirect(
    source: TexImageSource,
    width: number,
    height: number,
    options?: { nearest?: boolean },
  ) {
    const { gl, texture } = this;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Canvas/video row 0 is the top of the image; keep that at texture v=0 so
    // equirect v=0 (north pole) samples the top of the source.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    const filter = options?.nearest ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    void width;
    void height;
  }

  /**
   * Threshold a soft/projected mask face into a crisp photogrammetry mask:
   * black = masked out, white = keep.
   */
  static thresholdMaskCanvas(
    source: HTMLCanvasElement,
    faceSize: number,
    cutoff = 127,
  ) {
    const out = document.createElement("canvas");
    out.width = faceSize;
    out.height = faceSize;
    const ctx = out.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas unavailable.");
    ctx.drawImage(source, 0, 0, faceSize, faceSize);
    const image = ctx.getImageData(0, 0, faceSize, faceSize);
    const { data } = image;
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i]! >= cutoff ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return out;
  }

  renderFace(
    face: CubeFace,
    faceSize: number,
    fovDegrees: number,
    yawDegrees: number,
  ) {
    const { gl, canvas, program } = this;
    if (this.disposed) throw new Error("Renderer was disposed.");
    canvas.width = faceSize;
    canvas.height = faceSize;
    gl.viewport(0, 0, faceSize, faceSize);
    gl.useProgram(program);
    const halfFov = ((fovDegrees * Math.PI) / 180) / 2;
    gl.uniform1i(this.faceLoc, FACE_INDEX[face]);
    gl.uniform1f(this.fovLoc, Math.tan(halfFov));
    gl.uniform1f(this.yawLoc, (yawDegrees * Math.PI) / 180);
    gl.uniform1i(this.projectionLoc, this.projectionMode);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return canvas;
  }

  dispose() {
    if (this.disposed) return;
    const { gl } = this;
    gl.deleteTexture(this.texture);
    gl.deleteProgram(this.program);
    this.disposed = true;
  }
}

/** Pack selected faces into a horizontal strip. */
export function composeStrip(
  faces: CubeFace[],
  faceCanvases: Map<CubeFace, HTMLCanvasElement>,
  faceSize: number,
) {
  const out = document.createElement("canvas");
  out.width = faceSize * faces.length;
  out.height = faceSize;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable.");
  faces.forEach((face, index) => {
    const src = faceCanvases.get(face);
    if (src) ctx.drawImage(src, index * faceSize, 0);
  });
  return out;
}

/**
 * Classic cubemap cross:
 *       [top]
 * [left][front][right][back]
 *       [bottom]
 * Missing faces leave transparent/empty cells.
 */
export function composeCross(
  faces: CubeFace[],
  faceCanvases: Map<CubeFace, HTMLCanvasElement>,
  faceSize: number,
) {
  const out = document.createElement("canvas");
  out.width = faceSize * 4;
  out.height = faceSize * 3;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable.");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, out.width, out.height);

  const slots: Partial<Record<CubeFace, [number, number]>> = {
    top: [1, 0],
    left: [0, 1],
    front: [1, 1],
    right: [2, 1],
    back: [3, 1],
    bottom: [1, 2],
  };

  for (const face of faces) {
    const slot = slots[face];
    const src = faceCanvases.get(face);
    if (!slot || !src) continue;
    ctx.drawImage(src, slot[0] * faceSize, slot[1] * faceSize);
  }
  return out;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg" | "webp",
  quality: number,
) {
  const mime =
    format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}
