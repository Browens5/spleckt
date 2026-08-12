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
uniform sampler2D u_equirect;
uniform int u_face;
uniform float u_tanHalfFov;
uniform float u_yaw;

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
  float lon = atan(dir.x, dir.z) + u_yaw;
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  float u = lon * (0.5 / 3.141592653589793) + 0.5;
  float v = 0.5 - lat * (1.0 / 3.141592653589793);
  return vec2(fract(u), clamp(v, 0.0, 1.0));
}

void main() {
  vec2 uv = v_uv * 2.0 - 1.0;
  uv.y = -uv.y;
  vec3 dir = faceDir(u_face, uv);
  vec2 sampleUv = dirToEquirect(dir);
  gl_FragColor = texture2D(u_equirect, sampleUv);
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
  private disposed = false;

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
    gl.uniform1i(gl.getUniformLocation(program, "u_equirect"), 0);

    this.faceLoc = gl.getUniformLocation(program, "u_face")!;
    this.fovLoc = gl.getUniformLocation(program, "u_tanHalfFov")!;
    this.yawLoc = gl.getUniformLocation(program, "u_yaw")!;
  }

  uploadEquirect(source: TexImageSource, width: number, height: number) {
    const { gl, texture } = this;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    void width;
    void height;
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
