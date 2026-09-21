"use client";

import { useEffect, useRef } from "react";
import * as pc from "playcanvas";
import { BOARD_SIZE, colOf, rowOf, type Board } from "@/lib/games/checkers";
import {
  GROOVE,
  paintArcadeScreen,
  paintBoardTrim,
  paintFloor,
  paintNeonSign,
  paintPoster,
  paintRug,
  paintStandingSign,
  paintWall,
} from "./loungeTextures";

export type LoungeView = "lounge" | "table" | "game";

export type BoardHighlights = {
  /** Squares of pieces the local player may pick up. */
  movable: number[];
  /** Currently selected square. */
  selected: number | null;
  /** Legal destinations for the selected piece. */
  targets: number[];
  /** Origin/destination of the most recent move. */
  lastFrom: number | null;
  lastTo: number | null;
};

type LoungeCanvasProps = {
  view: LoungeView;
  board: Board | null;
  highlights: BoardHighlights;
  onDeskClick: () => void;
  onTableClick: () => void;
  onSquareClick: (index: number) => void;
};

const TABLE = new pc.Vec3(1.9, 0, -0.7);
const DESK = new pc.Vec3(-3.4, 0, 2.4);
const TABLE_TOP_Y = 0.78;
const BOARD_TOP_Y = TABLE_TOP_Y + 0.05;
const SQUARE = 0.172;

function squareCenter(index: number, out: pc.Vec3) {
  const row = rowOf(index);
  const col = colOf(index);
  out.set(
    TABLE.x + (col - 3.5) * SQUARE,
    BOARD_TOP_Y,
    TABLE.z + (row - 3.5) * SQUARE,
  );
  return out;
}

type ViewRig = {
  look: pc.Vec3;
  orthoHeight: number;
  pitch: number;
  /** Minimum visible world half-width, so narrow screens zoom out to fit. */
  minHalfWidth: number;
};

const VIEW_RIGS: Record<LoungeView, ViewRig> = {
  lounge: { look: new pc.Vec3(0.1, 1.05, -0.3), orthoHeight: 4.75, pitch: 32, minHalfWidth: 5.2 },
  table: { look: new pc.Vec3(TABLE.x, 0.85, TABLE.z), orthoHeight: 2.5, pitch: 39, minHalfWidth: 2.4 },
  game: { look: new pc.Vec3(TABLE.x, 0.82, TABLE.z), orthoHeight: 1.32, pitch: 55, minHalfWidth: 1.35 },
};

const CAMERA_YAW = (45 * Math.PI) / 180;
const CAMERA_DIST = 20;

function colorFromHex(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return new pc.Color(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  );
}

function litMaterial(hex: string, options?: { gloss?: number; metal?: boolean }) {
  const material = new pc.StandardMaterial();
  material.diffuse = colorFromHex(hex);
  if (options?.metal) {
    material.useMetalness = true;
    material.metalness = 0.7;
  }
  material.shininess = options?.gloss ?? 28;
  material.update();
  return material;
}

function glowMaterial(hex: string, intensity: number, opacity = 1) {
  const material = new pc.StandardMaterial();
  material.useLighting = false;
  material.diffuse = new pc.Color(0, 0, 0);
  material.emissive = colorFromHex(hex);
  material.emissiveIntensity = intensity;
  material.opacity = opacity;
  material.blendType = opacity < 1 ? pc.BLEND_NORMAL : pc.BLEND_NONE;
  material.depthWrite = opacity >= 1;
  material.cull = pc.CULLFACE_NONE;
  material.update();
  return material;
}

function textureFromCanvas(
  device: pc.GraphicsDevice,
  canvas: HTMLCanvasElement,
  name: string,
) {
  const texture = new pc.Texture(device, {
    name,
    width: canvas.width,
    height: canvas.height,
    format: pc.PIXELFORMAT_RGBA8,
    magFilter: pc.FILTER_LINEAR,
    minFilter: pc.FILTER_LINEAR,
    addressU: pc.ADDRESS_CLAMP_TO_EDGE,
    addressV: pc.ADDRESS_CLAMP_TO_EDGE,
    mipmaps: false,
    flipY: false,
  });
  texture.setSource(canvas);
  return texture;
}

function texturedMaterial(
  texture: pc.Texture,
  options?: { emissive?: number; lit?: boolean; cutout?: boolean },
) {
  const material = new pc.StandardMaterial();
  if (options?.lit) {
    material.diffuseMap = texture;
  } else {
    material.useLighting = false;
    material.diffuse = new pc.Color(0, 0, 0);
    material.emissiveMap = texture;
    material.emissive = new pc.Color(1, 1, 1);
    material.emissiveIntensity = options?.emissive ?? 1;
  }
  if (options?.cutout) {
    material.opacityMap = texture;
    material.alphaTest = 0.15;
  }
  material.cull = pc.CULLFACE_NONE;
  material.update();
  return material;
}

function addPrim(
  parent: pc.Entity | pc.GraphNode,
  type: string,
  material: pc.StandardMaterial,
  position: [number, number, number],
  scale: [number, number, number],
  angles: [number, number, number] = [0, 0, 0],
  name = type,
) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type, material });
  entity.setLocalPosition(...position);
  entity.setLocalScale(...scale);
  entity.setLocalEulerAngles(...angles);
  parent.addChild(entity);
  return entity;
}

function rayPointDistance(from: pc.Vec3, dir: pc.Vec3, point: pc.Vec3) {
  const toPoint = new pc.Vec3().sub2(point, from);
  const cross = new pc.Vec3().cross(toPoint, dir);
  return cross.length() / dir.length();
}

export function LoungeCanvas({
  view,
  board,
  highlights,
  onDeskClick,
  onTableClick,
  onSquareClick,
}: LoungeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(view);
  const boardRef = useRef(board);
  const highlightsRef = useRef(highlights);
  const onDeskRef = useRef(onDeskClick);
  const onTableRef = useRef(onTableClick);
  const onSquareRef = useRef(onSquareClick);
  const refreshBoardRef = useRef<(() => void) | null>(null);
  const refreshHighlightsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    viewRef.current = view;
    boardRef.current = board;
    highlightsRef.current = highlights;
    onDeskRef.current = onDeskClick;
    onTableRef.current = onTableClick;
    onSquareRef.current = onSquareClick;
  });

  useEffect(() => {
    refreshBoardRef.current?.();
  }, [board]);

  useEffect(() => {
    refreshHighlightsRef.current?.();
  }, [highlights]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      },
    });
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    const coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const applyResolution = () => {
      // keep the framebuffer small: big win for mobile GPU memory
      app.graphicsDevice.maxPixelRatio = Math.min(
        window.devicePixelRatio || 1,
        coarsePointer ? 1 : 1.25,
      );
      app.resizeCanvas();
    };
    applyResolution();
    app.scene.ambientLight = new pc.Color(0.3, 0.22, 0.32);

    const device = app.graphicsDevice;

    // ---- camera -------------------------------------------------------
    const camera = new pc.Entity("camera");
    camera.addComponent("camera", {
      projection: pc.PROJECTION_ORTHOGRAPHIC,
      orthoHeight: VIEW_RIGS.lounge.orthoHeight,
      clearColor: new pc.Color(0.07, 0.03, 0.1),
      nearClip: 0.1,
      farClip: 60,
      toneMapping: pc.TONEMAP_ACES,
    });
    app.root.addChild(camera);
    const cameraComponent = camera.camera;
    if (!cameraComponent) {
      app.destroy();
      return;
    }

    const camState = {
      look: VIEW_RIGS.lounge.look.clone(),
      orthoHeight: VIEW_RIGS.lounge.orthoHeight,
      pitch: VIEW_RIGS.lounge.pitch,
    };
    const placeCamera = () => {
      const pitchRad = (camState.pitch * Math.PI) / 180;
      const horiz = Math.cos(pitchRad) * CAMERA_DIST;
      camera.setPosition(
        camState.look.x + Math.sin(CAMERA_YAW) * horiz,
        camState.look.y + Math.sin(pitchRad) * CAMERA_DIST,
        camState.look.z + Math.cos(CAMERA_YAW) * horiz,
      );
      camera.lookAt(camState.look);
      const aspect = Math.max(0.3, canvas.clientWidth / Math.max(1, canvas.clientHeight));
      const rig = VIEW_RIGS[viewRef.current];
      cameraComponent.orthoHeight = Math.max(
        camState.orthoHeight,
        rig.minHalfWidth / aspect,
      );
    };
    placeCamera();

    // ---- lights -------------------------------------------------------
    const key = new pc.Entity("key-light");
    key.addComponent("light", {
      type: "directional",
      color: new pc.Color(1, 0.85, 0.72),
      intensity: 1.05,
      castShadows: true,
      shadowBias: 0.2,
      normalOffsetBias: 0.05,
      shadowDistance: 30,
      shadowResolution: 1024,
    });
    key.setEulerAngles(52, -28, 0);
    app.root.addChild(key);

    const warm = new pc.Entity("warm-light");
    warm.addComponent("light", {
      type: "point",
      color: colorFromHex(GROOVE.orange),
      intensity: 0.9,
      range: 9,
    });
    warm.setPosition(DESK.x, 2.4, DESK.z);
    app.root.addChild(warm);

    const tableLamp = new pc.Entity("table-light");
    tableLamp.addComponent("light", {
      type: "point",
      color: new pc.Color(1, 0.92, 0.78),
      intensity: 1.25,
      range: 5.5,
    });
    tableLamp.setPosition(TABLE.x, 2.35, TABLE.z);
    app.root.addChild(tableLamp);

    const discoLight = new pc.Entity("disco-light");
    discoLight.addComponent("light", {
      type: "point",
      color: colorFromHex(GROOVE.magenta),
      intensity: 0.55,
      range: 10,
    });
    discoLight.setPosition(-1, 3, 0.6);
    app.root.addChild(discoLight);

    // ---- room ---------------------------------------------------------
    const floorMat = texturedMaterial(
      textureFromCanvas(device, paintFloor(), "floor"),
      { lit: true },
    );
    const floor = addPrim(app.root, "plane", floorMat, [0, 0, 0], [14.5, 1, 12.5]);
    floor.render!.receiveShadows = true;

    const rugMat = texturedMaterial(textureFromCanvas(device, paintRug(), "rug"), {
      lit: true,
      cutout: true,
    });
    const rug = addPrim(app.root, "plane", rugMat, [0.4, 0.012, 0.7], [6.6, 1, 6.6]);
    rug.render!.receiveShadows = true;

    const backWallMat = texturedMaterial(
      textureFromCanvas(device, paintWall(512, 256, 11), "wall-back"),
      { emissive: 0.85 },
    );
    addPrim(app.root, "plane", backWallMat, [0.5, 2.1, -5.6], [15, 1, 4.2], [90, 0, 0]);

    const leftWallMat = texturedMaterial(
      textureFromCanvas(device, paintWall(512, 256, 23), "wall-left"),
      { emissive: 0.85 },
    );
    addPrim(
      app.root,
      "plane",
      leftWallMat,
      [-6.9, 2.1, -0.2],
      [11.4, 1, 4.2],
      [90, 90, 0],
    );

    // neon signs
    const neon = (
      text: string,
      color: string,
      pos: [number, number, number],
      rot: [number, number, number],
      scale: number,
      big = false,
    ) => {
      const material = texturedMaterial(
        textureFromCanvas(device, paintNeonSign(text, color, big), `neon-${text}`),
        { emissive: 1.6, cutout: true },
      );
      return addPrim(
        app.root,
        "plane",
        material,
        pos,
        [scale, 1, scale * (big ? 0.375 : 0.25)],
        rot,
        `neon-${text}`,
      );
    };
    neon("SPLECKT GAMES", GROOVE.orange, [0.5, 2.8, -5.55], [90, 0, 0], 4.4, true);
    neon("GAME ON", GROOVE.magenta, [-2.6, 2.42, -5.55], [90, 0, 0], 2.2);
    neon("LOUNGE", GROOVE.blue, [4.3, 2.6, -5.55], [90, 0, 0], 2.2);
    neon("ROLL PLAY", GROOVE.green, [-6.85, 2.3, 1.7], [90, 90, 0], 2.2);

    // posters
    const posterSpots: Array<{ pos: [number, number, number]; rot: [number, number, number] }> = [
      { pos: [-1.1, 1.85, -5.55], rot: [90, 0, 0] },
      { pos: [2.6, 2.0, -5.55], rot: [90, 0, 0] },
      { pos: [-6.85, 2.0, -2.6], rot: [90, 90, 0] },
      { pos: [-6.85, 1.9, 3.3], rot: [90, 90, 0] },
    ];
    posterSpots.forEach((spot, index) => {
      const posterMat = texturedMaterial(
        textureFromCanvas(device, paintPoster(index), `poster-${index}`),
        { emissive: 0.9 },
      );
      addPrim(app.root, "plane", posterMat, spot.pos, [1.1, 1, 1.38], spot.rot);
    });

    // string lights draped along the walls
    const bulbMats = [
      glowMaterial(GROOVE.magenta, 1.7),
      glowMaterial(GROOVE.gold, 1.7),
      glowMaterial(GROOVE.green, 1.7),
      glowMaterial(GROOVE.blue, 1.7),
    ];
    const stringLight = (
      from: pc.Vec3,
      to: pc.Vec3,
      sag: number,
      count: number,
      offset: number,
    ) => {
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const bulb = new pc.Entity("bulb");
        bulb.addComponent("render", {
          type: "sphere",
          material: bulbMats[(i + offset) % bulbMats.length],
        });
        bulb.setLocalScale(0.07, 0.09, 0.07);
        bulb.setPosition(
          from.x + (to.x - from.x) * t,
          from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * sag,
          from.z + (to.z - from.z) * t,
        );
        app.root.addChild(bulb);
      }
    };
    stringLight(new pc.Vec3(-6.6, 3.5, -5.5), new pc.Vec3(0.4, 3.6, -5.5), 0.45, 12, 0);
    stringLight(new pc.Vec3(0.4, 3.6, -5.5), new pc.Vec3(7.2, 3.45, -5.5), 0.4, 12, 2);
    stringLight(new pc.Vec3(-6.8, 3.5, -5.2), new pc.Vec3(-6.8, 3.35, 3.6), 0.45, 12, 1);

    // ---- front desk ---------------------------------------------------
    const deskRoot = new pc.Entity("front-desk");
    deskRoot.setPosition(DESK.x, 0, DESK.z);
    deskRoot.setEulerAngles(0, 32, 0);
    app.root.addChild(deskRoot);

    const wood = litMaterial(GROOVE.brown, { gloss: 36 });
    const woodDark = litMaterial("#3f2716", { gloss: 30 });
    const creamMat = litMaterial(GROOVE.cream, { gloss: 44 });
    const goldMat = litMaterial(GROOVE.gold, { gloss: 70, metal: true });

    addPrim(deskRoot, "box", wood, [0, 0.5, 0], [2.5, 1.0, 0.9]);
    addPrim(deskRoot, "box", creamMat, [0, 1.03, 0], [2.7, 0.07, 1.05]);
    // groovy stripes on the desk face
    addPrim(deskRoot, "box", litMaterial(GROOVE.magenta), [0, 0.62, 0.46], [2.5, 0.18, 0.02]);
    addPrim(deskRoot, "box", litMaterial(GROOVE.gold), [0, 0.44, 0.46], [2.5, 0.12, 0.02]);

    const deskSignMat = texturedMaterial(
      textureFromCanvas(
        device,
        paintStandingSign("FRONT DESK", "sign in here ➜", GROOVE.orange),
        "desk-sign",
      ),
      { emissive: 1.1, cutout: true },
    );
    addPrim(deskRoot, "plane", deskSignMat, [0, 1.5, 0.05], [1.5, 1, 0.95], [90, 0, 0], "desk-sign");
    addPrim(deskRoot, "cylinder", woodDark, [-0.62, 1.12, 0.15], [0.05, 0.12, 0.05]);
    // service bell
    addPrim(deskRoot, "cylinder", goldMat, [0.7, 1.09, 0.2], [0.16, 0.04, 0.16]);
    addPrim(deskRoot, "sphere", goldMat, [0.7, 1.14, 0.2], [0.14, 0.1, 0.14]);

    // lava lamp on the desk
    const lampRoot = new pc.Entity("lava-lamp");
    lampRoot.setLocalPosition(-0.85, 1.065, 0.1);
    deskRoot.addChild(lampRoot);
    addPrim(lampRoot, "cone", goldMat, [0, 0.09, 0], [0.22, 0.18, 0.22]);
    const lavaGlass = new pc.StandardMaterial();
    lavaGlass.diffuse = colorFromHex(GROOVE.plum);
    lavaGlass.opacity = 0.42;
    lavaGlass.blendType = pc.BLEND_NORMAL;
    lavaGlass.update();
    addPrim(lampRoot, "cone", lavaGlass, [0, 0.4, 0], [0.19, 0.5, 0.19], [180, 0, 0]);
    const blobMat = glowMaterial(GROOVE.magenta, 1.6);
    const blobA = addPrim(lampRoot, "sphere", blobMat, [0, 0.28, 0], [0.1, 0.12, 0.1]);
    const blobB = addPrim(lampRoot, "sphere", blobMat, [0.02, 0.5, 0], [0.07, 0.09, 0.07]);
    addPrim(lampRoot, "cone", goldMat, [0, 0.68, 0], [0.09, 0.08, 0.09]);

    // ---- decor --------------------------------------------------------
    const discoMat = litMaterial("#cfd6de", { gloss: 92, metal: true });
    discoMat.emissive = new pc.Color(0.5, 0.55, 0.65);
    discoMat.emissiveIntensity = 0.35;
    discoMat.update();
    const disco = addPrim(
      app.root,
      "sphere",
      discoMat,
      [-1, 3.2, 0.6],
      [0.55, 0.55, 0.55],
      [0, 0, 0],
      "disco",
    );
    addPrim(app.root, "cylinder", woodDark, [-1, 3.85, 0.6], [0.02, 0.8, 0.02]);

    // arcade cabinets against the back wall, screens facing the room
    const cabinetSides = [litMaterial("#5a2a7d", { gloss: 40 }), litMaterial("#7d2a4e", { gloss: 40 })];
    [-5.5, -4.3].forEach((x, index) => {
      const cab = new pc.Entity("arcade");
      cab.setPosition(x, 0, -5.0);
      app.root.addChild(cab);
      const body = cabinetSides[index];
      addPrim(cab, "box", body, [0, 0.85, 0], [0.75, 1.7, 0.7]);
      addPrim(cab, "box", body, [0, 1.82, -0.12], [0.75, 0.28, 0.45]);
      const screenMat = texturedMaterial(
        textureFromCanvas(device, paintArcadeScreen(index), `arcade-${index}`),
        { emissive: 1.2 },
      );
      addPrim(cab, "plane", screenMat, [0, 1.32, 0.36], [0.58, 1, 0.5], [72, 0, 0]);
      addPrim(cab, "box", glowMaterial(index === 0 ? GROOVE.magenta : GROOVE.gold, 1.3), [0, 1.98, 0.1], [0.75, 0.14, 0.05]);
      addPrim(cab, "box", litMaterial(GROOVE.orange), [0, 0.95, 0.37], [0.62, 0.1, 0.06]);
    });

    // floor lamp
    const lampBase = new pc.Entity("floor-lamp");
    lampBase.setPosition(5.6, 0, -3.9);
    app.root.addChild(lampBase);
    addPrim(lampBase, "cylinder", woodDark, [0, 0.05, 0], [0.4, 0.1, 0.4]);
    addPrim(lampBase, "cylinder", goldMat, [0, 0.9, 0], [0.05, 1.8, 0.05]);
    addPrim(lampBase, "cone", glowMaterial(GROOVE.orange, 1.2), [0, 1.9, 0], [0.5, 0.4, 0.5]);

    // potted plants
    const leafMat = litMaterial("#3c6b31");
    const potMat = litMaterial(GROOVE.rust);
    for (const [px, pz] of [[4.9, 3.4], [-5.9, 2.9]]) {
      const plant = new pc.Entity("plant");
      plant.setPosition(px, 0, pz);
      app.root.addChild(plant);
      addPrim(plant, "cylinder", potMat, [0, 0.25, 0], [0.5, 0.5, 0.5]);
      addPrim(plant, "cone", leafMat, [0, 0.85, 0], [0.55, 0.8, 0.55]);
      addPrim(plant, "cone", leafMat, [0.18, 0.7, 0.1], [0.4, 0.6, 0.4], [0, 0, -18]);
      addPrim(plant, "cone", leafMat, [-0.16, 0.72, -0.08], [0.42, 0.65, 0.42], [0, 0, 16]);
    }

    // scattered beanbags
    const beanbagMats = {
      orange: litMaterial(GROOVE.rust, { gloss: 18 }),
      purple: litMaterial("#4c2470", { gloss: 18 }),
      green: litMaterial("#4e8a2e", { gloss: 18 }),
    };
    addPrim(app.root, "sphere", beanbagMats.purple, [-4.4, 0.25, -1.6], [0.9, 0.5, 0.9]);
    addPrim(app.root, "sphere", beanbagMats.green, [-3.4, 0.22, -2.5], [0.8, 0.45, 0.8]);
    addPrim(app.root, "sphere", beanbagMats.orange, [4.3, 0.24, 1.4], [0.85, 0.48, 0.85]);

    // ---- game table ---------------------------------------------------
    const tableRoot = new pc.Entity("table-1");
    tableRoot.setPosition(TABLE.x, 0, TABLE.z);
    app.root.addChild(tableRoot);

    addPrim(tableRoot, "cylinder", woodDark, [0, 0.06, 0], [0.85, 0.12, 0.85]);
    addPrim(tableRoot, "cylinder", woodDark, [0, 0.4, 0], [0.16, 0.7, 0.16]);
    const tableTop = addPrim(tableRoot, "cylinder", wood, [0, TABLE_TOP_Y - 0.035, 0], [2.35, 0.07, 2.35]);
    tableTop.render!.receiveShadows = true;

    // beanbag seats on the two playing sides
    addPrim(tableRoot, "sphere", beanbagMats.orange, [0.15, 0.26, -1.65], [0.95, 0.52, 0.95]);
    addPrim(tableRoot, "sphere", beanbagMats.purple, [-0.1, 0.26, 1.65], [0.95, 0.52, 0.95]);

    // lava lamp on the far edge of the game table
    const tableLamp2 = new pc.Entity("table-lava");
    tableLamp2.setLocalPosition(-0.82, TABLE_TOP_Y, -0.78);
    tableRoot.addChild(tableLamp2);
    addPrim(tableLamp2, "cone", goldMat, [0, 0.07, 0], [0.16, 0.14, 0.16]);
    const tableLavaGlass = new pc.StandardMaterial();
    tableLavaGlass.diffuse = colorFromHex(GROOVE.teal);
    tableLavaGlass.opacity = 0.4;
    tableLavaGlass.blendType = pc.BLEND_NORMAL;
    tableLavaGlass.update();
    addPrim(tableLamp2, "cone", tableLavaGlass, [0, 0.3, 0], [0.14, 0.38, 0.14], [180, 0, 0]);
    const tableBlob = addPrim(
      tableLamp2,
      "sphere",
      glowMaterial(GROOVE.green, 1.5),
      [0, 0.22, 0],
      [0.075, 0.09, 0.075],
    );
    addPrim(tableLamp2, "cone", goldMat, [0, 0.52, 0], [0.07, 0.07, 0.07]);

    // floating table label (billboarded toward the iso camera)
    const labelMat = texturedMaterial(
      textureFromCanvas(
        device,
        paintStandingSign("TABLE 1", "· CHECKERS ·", GROOVE.gold),
        "table-label",
      ),
      { emissive: 1.15, cutout: true },
    );
    const tableLabel = addPrim(
      app.root,
      "plane",
      labelMat,
      [TABLE.x, 2.1, TABLE.z],
      [1.35, 1, 0.85],
      [90, 45, 0],
      "table-label",
    );

    // ---- checkers board ----------------------------------------------
    const boardTrimMat = texturedMaterial(
      textureFromCanvas(device, paintBoardTrim(), "board-trim"),
      { lit: true },
    );
    const boardBase = addPrim(
      tableRoot,
      "box",
      boardTrimMat,
      [0, TABLE_TOP_Y + 0.02, 0],
      [SQUARE * 8 + 0.14, 0.05, SQUARE * 8 + 0.14],
    );
    boardBase.render!.receiveShadows = true;

    const lightSquareMat = litMaterial("#e8cf9e", { gloss: 40 });
    const darkSquareMat = litMaterial("#4a2c17", { gloss: 40 });
    const squareCenterVec = new pc.Vec3();
    for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
      squareCenter(index, squareCenterVec);
      const dark = (rowOf(index) + colOf(index)) % 2 === 1;
      const square = addPrim(
        app.root,
        "box",
        dark ? darkSquareMat : lightSquareMat,
        [squareCenterVec.x, TABLE_TOP_Y + 0.047, squareCenterVec.z],
        [SQUARE, 0.012, SQUARE],
      );
      square.render!.receiveShadows = true;
    }

    // highlight overlays, one per square
    const selectedMat = glowMaterial(GROOVE.gold, 1.5, 0.85);
    const targetMat = glowMaterial("#7fe07a", 1.6, 0.9);
    const movableMat = glowMaterial(GROOVE.orange, 1.0, 0.4);
    const lastMoveMat = glowMaterial(GROOVE.magenta, 0.9, 0.35);
    const overlays: pc.Entity[] = [];
    for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
      squareCenter(index, squareCenterVec);
      const overlay = addPrim(
        app.root,
        "plane",
        targetMat,
        [squareCenterVec.x, BOARD_TOP_Y + 0.004, squareCenterVec.z],
        [SQUARE * 0.94, 1, SQUARE * 0.94],
      );
      overlay.enabled = false;
      overlays.push(overlay);
    }

    const refreshHighlights = () => {
      const marks = highlightsRef.current;
      for (let index = 0; index < overlays.length; index += 1) {
        const overlay = overlays[index];
        let material: pc.StandardMaterial | null = null;
        if (marks.selected === index) material = selectedMat;
        else if (marks.targets.includes(index)) material = targetMat;
        else if (marks.movable.includes(index)) material = movableMat;
        else if (marks.lastFrom === index || marks.lastTo === index) {
          material = lastMoveMat;
        }
        overlay.enabled = material !== null;
        if (material && overlay.render) {
          overlay.render.meshInstances.forEach((mesh) => {
            mesh.material = material!;
          });
        }
      }
    };

    // ---- pieces -------------------------------------------------------
    const piecesRoot = new pc.Entity("pieces");
    app.root.addChild(piecesRoot);

    const pieceMaterial = (hex: string, emissiveHex?: string, intensity = 0) => {
      const material = new pc.StandardMaterial();
      material.diffuse = colorFromHex(hex);
      material.shininess = 58;
      if (emissiveHex) {
        material.emissive = colorFromHex(emissiveHex);
        material.emissiveIntensity = intensity;
      }
      material.update();
      return material;
    };
    const seatMats: Record<number, {
      base: pc.StandardMaterial;
      movable: pc.StandardMaterial;
      selected: pc.StandardMaterial;
    }> = {
      1: {
        base: pieceMaterial("#c0392b"),
        movable: pieceMaterial("#c0392b", GROOVE.orange, 0.55),
        selected: pieceMaterial("#c0392b", GROOVE.gold, 1.0),
      },
      2: {
        base: pieceMaterial("#26201c"),
        movable: pieceMaterial("#26201c", GROOVE.orange, 0.5),
        selected: pieceMaterial("#26201c", GROOVE.gold, 0.9),
      },
    };
    const crownMat = glowMaterial(GROOVE.gold, 1.2);
    const pieceBodies = new Map<number, { parts: pc.Entity[]; seat: number }>();

    const applyPieceHighlights = () => {
      const marks = highlightsRef.current;
      for (const [index, body] of pieceBodies) {
        const mats = seatMats[body.seat];
        const material =
          marks.selected === index
            ? mats.selected
            : marks.movable.includes(index)
              ? mats.movable
              : mats.base;
        for (const part of body.parts) {
          part.render?.meshInstances.forEach((mesh) => {
            mesh.material = material;
          });
        }
      }
    };

    let tween: {
      entity: pc.Entity;
      from: pc.Vec3;
      to: pc.Vec3;
      t: number;
    } | null = null;
    let lastAnimatedKey = "";

    const refreshBoard = () => {
      tween = null;
      pieceBodies.clear();
      const cells = boardRef.current;
      const children = piecesRoot.children.slice();
      for (const child of children) child.destroy();
      if (!cells) return;

      const marks = highlightsRef.current;
      const pos = new pc.Vec3();
      cells.forEach((piece, index) => {
        if (!piece) return;
        squareCenter(index, pos);
        const root = new pc.Entity(`piece-${index}`);
        root.setPosition(pos.x, BOARD_TOP_Y + 0.024, pos.z);
        piecesRoot.addChild(root);
        const mat = seatMats[piece.seat].base;
        const parts = [
          addPrim(root, "cylinder", mat, [0, 0, 0], [0.128, 0.048, 0.128]),
          addPrim(root, "cylinder", mat, [0, 0.02, 0], [0.1, 0.02, 0.1]),
        ];
        if (piece.king) {
          parts.push(
            addPrim(root, "cylinder", mat, [0, 0.048, 0], [0.115, 0.04, 0.115]),
          );
          addPrim(root, "cylinder", crownMat, [0, 0.075, 0], [0.055, 0.018, 0.055]);
        }
        pieceBodies.set(index, { parts, seat: piece.seat });

        // slide the most recently moved piece in from its source square
        if (
          marks.lastTo === index &&
          marks.lastFrom !== null &&
          viewRef.current === "game"
        ) {
          const key = `${marks.lastFrom}-${marks.lastTo}`;
          if (key !== lastAnimatedKey) {
            lastAnimatedKey = key;
            const fromPos = squareCenter(marks.lastFrom, new pc.Vec3());
            fromPos.y = BOARD_TOP_Y + 0.024;
            tween = {
              entity: root,
              from: fromPos,
              to: root.getPosition().clone(),
              t: 0,
            };
            root.setPosition(fromPos);
          }
        }
      });
      applyPieceHighlights();
    };
    refreshBoardRef.current = refreshBoard;
    const refreshAllHighlights = () => {
      refreshHighlights();
      applyPieceHighlights();
    };
    refreshHighlightsRef.current = refreshAllHighlights;
    refreshBoard();
    refreshAllHighlights();

    // ---- picking ------------------------------------------------------
    const pickBoardSquare = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const from = cameraComponent.screenToWorld(sx, sy, cameraComponent.nearClip);
      const to = cameraComponent.screenToWorld(sx, sy, cameraComponent.farClip);
      const dy = to.y - from.y;
      if (Math.abs(dy) < 1e-6) return null;
      const t = (BOARD_TOP_Y - from.y) / dy;
      if (t < 0) return null;
      const x = from.x + (to.x - from.x) * t;
      const z = from.z + (to.z - from.z) * t;
      const col = Math.floor((x - TABLE.x) / SQUARE + 4);
      const row = Math.floor((z - TABLE.z) / SQUARE + 4);
      if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return null;
      return row * BOARD_SIZE + col;
    };

    const pickHotspot = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const from = cameraComponent.screenToWorld(sx, sy, cameraComponent.nearClip);
      const to = cameraComponent.screenToWorld(sx, sy, cameraComponent.farClip);
      const dir = new pc.Vec3().sub2(to, from);
      const deskPoint = new pc.Vec3(DESK.x, 1.1, DESK.z);
      const tablePoint = new pc.Vec3(TABLE.x, 0.85, TABLE.z);
      const deskDist = rayPointDistance(from, dir, deskPoint);
      const tableDist = rayPointDistance(from, dir, tablePoint);
      if (tableDist < 1.45 && (tableDist <= deskDist || deskDist >= 1.55)) {
        return "table" as const;
      }
      if (deskDist < 1.55) return "desk" as const;
      return null;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (viewRef.current === "game") {
        const index = pickBoardSquare(event.clientX, event.clientY);
        const marks = highlightsRef.current;
        const active =
          index !== null &&
          (marks.movable.includes(index) ||
            marks.targets.includes(index) ||
            marks.selected === index);
        canvas.style.cursor = active ? "pointer" : "default";
        return;
      }
      canvas.style.cursor = pickHotspot(event.clientX, event.clientY)
        ? "pointer"
        : "default";
    };

    let downAt: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      downAt = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!downAt) return;
      const moved =
        Math.abs(event.clientX - downAt.x) > 8 ||
        Math.abs(event.clientY - downAt.y) > 8;
      downAt = null;
      if (moved) return;

      if (viewRef.current === "game") {
        const index = pickBoardSquare(event.clientX, event.clientY);
        if (index !== null) onSquareRef.current(index);
        return;
      }
      const hotspot = pickHotspot(event.clientX, event.clientY);
      if (hotspot === "desk") onDeskRef.current();
      if (hotspot === "table") onTableRef.current();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    const onResize = () => applyResolution();
    window.addEventListener("resize", onResize);
    const onVisibility = () => {
      app.autoRender = !document.hidden;
      app.timeScale = document.hidden ? 0 : 1;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ---- animation loop -----------------------------------------------
    app.on("update", (dt: number) => {
      const rig = VIEW_RIGS[viewRef.current];
      const ease = Math.min(1, dt * 5);
      camState.look.lerp(camState.look, rig.look, ease);
      camState.orthoHeight += (rig.orthoHeight - camState.orthoHeight) * ease;
      camState.pitch += (rig.pitch - camState.pitch) * ease;
      placeCamera();

      const t = performance.now() * 0.001;
      disco.setEulerAngles(0, t * 30, 0);
      discoLight.setPosition(
        -1 + Math.sin(t * 0.7) * 1.6,
        3,
        0.6 + Math.cos(t * 0.7) * 1.6,
      );
      const hue = (Math.sin(t * 0.4) + 1) / 2;
      discoLight.light!.color = new pc.Color(
        0.7 + hue * 0.3,
        0.3 + (1 - hue) * 0.35,
        0.75,
      );
      blobA.setLocalPosition(0, 0.24 + Math.sin(t * 0.9) * 0.14, 0);
      blobB.setLocalPosition(0.02, 0.42 + Math.sin(t * 0.7 + 2) * 0.16, 0);
      tableBlob.setLocalPosition(0, 0.18 + Math.sin(t * 0.8 + 1) * 0.1, 0);
      tableLabel.enabled = viewRef.current !== "game";
      tableLabel.setPosition(TABLE.x, 2.08 + Math.sin(t * 1.4) * 0.05, TABLE.z);

      if (tween) {
        tween.t = Math.min(1, tween.t + dt * 1.8);
        const k = tween.t;
        const smoothed = k * k * (3 - 2 * k);
        const x = tween.from.x + (tween.to.x - tween.from.x) * smoothed;
        const z = tween.from.z + (tween.to.z - tween.from.z) * smoothed;
        const y = tween.to.y + Math.sin(smoothed * Math.PI) * 0.09;
        tween.entity.setPosition(x, y, z);
        if (tween.t >= 1) {
          tween.entity.setPosition(tween.to);
          tween = null;
        }
      }
    });

    app.start();

    return () => {
      refreshBoardRef.current = null;
      refreshHighlightsRef.current = null;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      app.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="games-canvas" />;
}
