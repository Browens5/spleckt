"use client";

import { useEffect, useRef } from "react";
import * as pc from "playcanvas";
import { BOARD_SIZE, colOf, rowOf, type Board, type Seat } from "@/lib/games/checkers";
import {
  GROOVE,
  paintArcadeScreen,
  paintBoardTrim,
  paintFloor,
  paintNeonSign,
  paintPoster,
  paintRug,
  paintStandingSign,
  paintVinyl,
  paintWall,
} from "./loungeTextures";

import type { TableInfo } from "@/lib/games/types";

export type LoungeView = "lounge" | "table" | "game";
export type LoungeTableId = TableInfo["id"];

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
  focusTable?: LoungeTableId;
  board: Board | null;
  highlights: BoardHighlights;
  /** Seat whose home row should sit at the bottom of the screen. */
  facingSeat?: Seat | null;
  showTrophy?: boolean;
  onDeskClick: () => void;
  onTableClick: (tableId: LoungeTableId) => void;
  onSquareClick: (index: number) => void;
};

const TABLE = new pc.Vec3(1.9, 0, -0.7);
const SCUM_TABLE = new pc.Vec3(-2.15, 0, -2.05);
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
  yaw: number;
  /** Minimum visible world half-width, so narrow screens zoom out to fit. */
  minHalfWidth: number;
};

const VIEW_RIGS: Record<LoungeView, ViewRig> = {
  lounge: {
    look: new pc.Vec3(0.1, 1.05, -0.3),
    orthoHeight: 4.75,
    pitch: 32,
    yaw: 45,
    minHalfWidth: 5.2,
  },
  table: {
    look: new pc.Vec3(TABLE.x, 0.82, TABLE.z),
    orthoHeight: 1.45,
    pitch: 86,
    yaw: 0,
    minHalfWidth: 1.5,
  },
  game: {
    look: new pc.Vec3(TABLE.x, 0.82, TABLE.z),
    orthoHeight: 1.18,
    pitch: 88,
    yaw: 0,
    minHalfWidth: 1.2,
  },
};

const CAMERA_DIST = 20;

function lerpDegrees(current: number, target: number, t: number) {
  const delta = ((target - current + 540) % 360) - 180;
  return current + delta * t;
}

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
  focusTable = "table-1",
  board,
  highlights,
  facingSeat = null,
  showTrophy = false,
  onDeskClick,
  onTableClick,
  onSquareClick,
}: LoungeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(view);
  const focusRef = useRef(focusTable);
  const boardRef = useRef(board);
  const highlightsRef = useRef(highlights);
  const facingSeatRef = useRef(facingSeat);
  const showTrophyRef = useRef(showTrophy);
  const onDeskRef = useRef(onDeskClick);
  const onTableRef = useRef(onTableClick);
  const onSquareRef = useRef(onSquareClick);
  const refreshBoardRef = useRef<(() => void) | null>(null);
  const refreshHighlightsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    viewRef.current = view;
    focusRef.current = focusTable;
    boardRef.current = board;
    highlightsRef.current = highlights;
    facingSeatRef.current = facingSeat;
    showTrophyRef.current = showTrophy;
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
      yaw: VIEW_RIGS.lounge.yaw,
    };
    const placeCamera = () => {
      const pitchRad = (camState.pitch * Math.PI) / 180;
      const yawRad = (camState.yaw * Math.PI) / 180;
      if (camState.pitch >= 70) {
        // lookAt() is unstable when the view is nearly vertical — set the
        // camera pose directly so the board stays square to the screen.
        camera.setPosition(
          camState.look.x,
          camState.look.y + CAMERA_DIST,
          camState.look.z,
        );
        camera.setEulerAngles(-90, camState.yaw, 0);
      } else {
        const horiz = Math.cos(pitchRad) * CAMERA_DIST;
        camera.setPosition(
          camState.look.x + Math.sin(yawRad) * horiz,
          camState.look.y + Math.sin(pitchRad) * CAMERA_DIST,
          camState.look.z + Math.cos(yawRad) * horiz,
        );
        camera.lookAt(camState.look);
      }
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

    const scumLamp = new pc.Entity("scum-light");
    scumLamp.addComponent("light", {
      type: "point",
      color: new pc.Color(1, 0.88, 0.95),
      intensity: 1.05,
      range: 5,
    });
    scumLamp.setPosition(SCUM_TABLE.x, 2.3, SCUM_TABLE.z);
    app.root.addChild(scumLamp);

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
    // guestbook + pen
    addPrim(deskRoot, "box", creamMat, [0.18, 1.08, 0.18], [0.38, 0.025, 0.26]);
    addPrim(deskRoot, "box", litMaterial(GROOVE.orange), [0.18, 1.1, 0.18], [0.32, 0.02, 0.22]);
    addPrim(deskRoot, "cylinder", goldMat, [0.4, 1.12, 0.18], [0.015, 0.1, 0.015], [0, 0, 62]);

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
    const addBeanbag = (
      parent: pc.Entity | pc.GraphNode,
      mat: pc.StandardMaterial,
      x: number,
      z: number,
      yaw = 0,
      size = 1,
    ) => {
      const bag = new pc.Entity("beanbag");
      bag.setLocalPosition(x, 0, z);
      bag.setLocalEulerAngles(0, yaw, 0);
      parent.addChild(bag);
      addPrim(bag, "sphere", mat, [0, 0.22 * size, 0.02], [0.98 * size, 0.42 * size, 0.98 * size]);
      addPrim(bag, "sphere", mat, [0, 0.34 * size, -0.22 * size], [0.7 * size, 0.36 * size, 0.52 * size]);
      addPrim(bag, "sphere", goldMat, [0, 0.4 * size, 0.06 * size], [0.08 * size, 0.05 * size, 0.08 * size]);
      return bag;
    };
    addBeanbag(app.root, beanbagMats.purple, -4.4, -1.6, 40);
    addBeanbag(app.root, beanbagMats.green, -4.85, -3.15, -20, 0.9);
    addBeanbag(app.root, beanbagMats.orange, 4.3, 1.4, 110);
    addBeanbag(app.root, beanbagMats.purple, 3.6, 2.5, 200, 0.85);
    addBeanbag(app.root, beanbagMats.green, 5.1, -1.6, -80, 0.88);

    const addLoungeChair = (
      parent: pc.Entity | pc.GraphNode,
      cushion: pc.StandardMaterial,
      x: number,
      z: number,
      yaw: number,
      size = 1,
    ) => {
      const chair = new pc.Entity("chair");
      chair.setLocalPosition(x, 0, z);
      chair.setLocalEulerAngles(0, yaw, 0);
      parent.addChild(chair);
      const leg = 0.26 * size;
      for (const [lx, lz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        addPrim(
          chair,
          "cylinder",
          woodDark,
          [lx * leg, 0.18 * size, lz * leg],
          [0.07 * size, 0.36 * size, 0.07 * size],
        );
      }
      addPrim(chair, "cylinder", wood, [0, 0.34 * size, 0], [0.84 * size, 0.05 * size, 0.84 * size]);
      addPrim(chair, "cylinder", cushion, [0, 0.42 * size, 0.04 * size], [0.78 * size, 0.1 * size, 0.78 * size]);
      addPrim(chair, "box", wood, [0, 0.74 * size, -0.34 * size], [0.74 * size, 0.58 * size, 0.08 * size]);
      addPrim(chair, "box", cushion, [0, 0.74 * size, -0.27 * size], [0.66 * size, 0.5 * size, 0.1 * size]);
      addPrim(chair, "sphere", goldMat, [0, 0.46 * size, 0.06 * size], [0.07 * size, 0.04 * size, 0.07 * size]);
      return chair;
    };

    // record cabinet + vinyls (back-right wall, like the reference)
    const vinylMat = texturedMaterial(
      textureFromCanvas(device, paintVinyl(), "vinyl"),
      { emissive: 0.7, cutout: true },
    );
    const shelf = new pc.Entity("record-shelf");
    shelf.setPosition(5.35, 0, -4.55);
    app.root.addChild(shelf);
    addPrim(shelf, "box", woodDark, [0, 0.55, 0], [1.35, 1.1, 0.42]);
    addPrim(shelf, "box", wood, [0, 1.12, 0], [1.4, 0.06, 0.48]);
    addPrim(shelf, "box", wood, [0, 0.58, 0], [1.4, 0.05, 0.48]);
    for (let i = 0; i < 8; i += 1) {
      addPrim(
        shelf,
        "box",
        litMaterial(i % 2 === 0 ? GROOVE.orange : GROOVE.plum),
        [-0.5 + i * 0.14, 0.28, 0.12],
        [0.11, 0.38, 0.32],
      );
    }
    addPrim(shelf, "plane", vinylMat, [0.18, 1.2, 0.05], [0.42, 1, 0.42], [90, 0, 18]);
    addPrim(shelf, "plane", vinylMat, [-0.05, 1.2, 0.08], [0.38, 1, 0.38], [90, 0, -12]);
    addPrim(shelf, "box", woodDark, [-0.38, 1.22, 0.02], [0.32, 0.05, 0.26]);
    addPrim(shelf, "cylinder", goldMat, [-0.38, 1.27, 0.02], [0.1, 0.03, 0.1]);

    // pink orb lamp
    const orb = new pc.Entity("orb-lamp");
    orb.setPosition(6.0, 0, -3.15);
    app.root.addChild(orb);
    addPrim(orb, "cylinder", woodDark, [0, 0.28, 0], [0.18, 0.56, 0.18]);
    addPrim(orb, "sphere", glowMaterial(GROOVE.magenta, 1.4), [0, 0.72, 0], [0.28, 0.28, 0.28]);

    // extra lava lamp by the arcade
    const cornerLava = new pc.Entity("corner-lava");
    cornerLava.setPosition(-3.55, 0, -4.55);
    app.root.addChild(cornerLava);
    addPrim(cornerLava, "box", woodDark, [0, 0.28, 0], [0.42, 0.56, 0.42]);
    addPrim(cornerLava, "cone", goldMat, [0, 0.62, 0], [0.16, 0.12, 0.16]);
    const cornerGlass = new pc.StandardMaterial();
    cornerGlass.diffuse = colorFromHex(GROOVE.orange);
    cornerGlass.opacity = 0.4;
    cornerGlass.blendType = pc.BLEND_NORMAL;
    cornerGlass.update();
    addPrim(cornerLava, "cone", cornerGlass, [0, 0.88, 0], [0.13, 0.4, 0.13], [180, 0, 0]);
    addPrim(cornerLava, "sphere", glowMaterial(GROOVE.orange, 1.5), [0, 0.78, 0], [0.07, 0.09, 0.07]);
    addPrim(cornerLava, "cone", goldMat, [0, 1.08, 0], [0.06, 0.07, 0.06]);

    // little deco table with dice / cards
    const deco = new pc.Entity("deco-table");
    deco.setPosition(-1.6, 0, 1.8);
    app.root.addChild(deco);
    addPrim(deco, "cylinder", wood, [0, 0.42, 0], [1.15, 0.06, 1.15]);
    addPrim(deco, "cylinder", woodDark, [0, 0.2, 0], [0.12, 0.4, 0.12]);
    addPrim(deco, "box", creamMat, [-0.12, 0.47, 0.08], [0.22, 0.02, 0.3]);
    addPrim(deco, "box", litMaterial(GROOVE.magenta), [0.18, 0.48, -0.1], [0.08, 0.08, 0.08]);
    addPrim(deco, "box", litMaterial(GROOVE.gold), [0.28, 0.48, 0.12], [0.08, 0.08, 0.08]);
    addBeanbag(app.root, beanbagMats.orange, -2.4, 2.35, 30, 0.82);
    addBeanbag(app.root, beanbagMats.purple, -0.7, 2.55, 200, 0.8);

    // extra plant on a shelf
    addPrim(app.root, "box", wood, [-6.55, 2.55, -4.4], [0.35, 0.06, 0.7], [0, 90, 0]);
    addPrim(app.root, "cylinder", potMat, [-6.5, 2.68, -4.4], [0.18, 0.2, 0.18]);
    addPrim(app.root, "cone", leafMat, [-6.5, 2.92, -4.4], [0.22, 0.32, 0.22]);

    // jukebox along the right wall
    const juke = new pc.Entity("jukebox");
    juke.setPosition(6.15, 0, 0.35);
    juke.setEulerAngles(0, -90, 0);
    app.root.addChild(juke);
    addPrim(juke, "box", litMaterial("#2a1224", { gloss: 40 }), [0, 0.85, 0], [0.72, 1.7, 0.48]);
    addPrim(juke, "box", glowMaterial(GROOVE.magenta, 1.2), [0, 1.55, 0.25], [0.58, 0.08, 0.04]);
    addPrim(juke, "box", glowMaterial(GROOVE.gold, 1.2), [0, 1.42, 0.25], [0.58, 0.08, 0.04]);
    addPrim(juke, "box", glowMaterial(GROOVE.teal, 1.2), [0, 1.29, 0.25], [0.58, 0.08, 0.04]);
    addPrim(juke, "box", woodDark, [0, 0.55, 0.26], [0.5, 0.55, 0.04]);
    addPrim(juke, "cylinder", goldMat, [0, 0.95, 0.26], [0.16, 0.04, 0.16], [90, 0, 0]);

    // wall clock
    addPrim(app.root, "cylinder", creamMat, [3.9, 2.55, -5.52], [0.55, 0.04, 0.55], [90, 0, 0]);
    addPrim(app.root, "cylinder", goldMat, [3.9, 2.55, -5.5], [0.08, 0.03, 0.08], [90, 0, 0]);
    addPrim(app.root, "box", woodDark, [3.9, 2.68, -5.5], [0.03, 0.18, 0.02]);
    addPrim(app.root, "box", woodDark, [4.02, 2.55, -5.5], [0.12, 0.03, 0.02]);

    // ---- game table ---------------------------------------------------
    const tableRoot = new pc.Entity("table-1");
    tableRoot.setPosition(TABLE.x, 0, TABLE.z);
    app.root.addChild(tableRoot);

    addPrim(tableRoot, "cylinder", woodDark, [0, 0.08, 0], [0.95, 0.16, 0.95]);
    addPrim(tableRoot, "cylinder", woodDark, [0, 0.4, 0], [0.18, 0.72, 0.18]);
    addPrim(tableRoot, "cylinder", goldMat, [0, 0.72, 0], [0.22, 0.04, 0.22]);
    const tableTop = addPrim(
      tableRoot,
      "cylinder",
      wood,
      [0, TABLE_TOP_Y - 0.035, 0],
      [2.42, 0.08, 2.42],
    );
    tableTop.render!.receiveShadows = true;
    addPrim(tableRoot, "cylinder", goldMat, [0, TABLE_TOP_Y + 0.008, 0], [2.48, 0.015, 2.48]);

    addLoungeChair(tableRoot, beanbagMats.orange, 0.15, -1.68, 0, 1.05);
    addLoungeChair(tableRoot, beanbagMats.purple, -0.12, 1.68, 180, 1.05);
    addLoungeChair(tableRoot, beanbagMats.green, 1.62, 0.12, 90, 0.95);
    addLoungeChair(tableRoot, beanbagMats.orange, -1.6, -0.08, -90, 0.95);

    // drinks, snack bowl, spare pieces on the table rim
    const mugMat = litMaterial(GROOVE.plum, { gloss: 50 });
    addPrim(tableRoot, "cylinder", mugMat, [0.92, TABLE_TOP_Y + 0.06, 0.55], [0.12, 0.12, 0.12]);
    addPrim(tableRoot, "cylinder", creamMat, [0.92, TABLE_TOP_Y + 0.13, 0.55], [0.1, 0.02, 0.1]);
    addPrim(tableRoot, "box", mugMat, [1.02, TABLE_TOP_Y + 0.06, 0.55], [0.04, 0.06, 0.08]);
    addPrim(tableRoot, "cylinder", creamMat, [-0.88, TABLE_TOP_Y + 0.02, 0.72], [0.16, 0.015, 0.16]);
    const spareRed = litMaterial("#c0392b", { gloss: 58 });
    const spareBlack = litMaterial("#26201c", { gloss: 58 });
    addPrim(tableRoot, "cylinder", spareRed, [-0.9, TABLE_TOP_Y + 0.045, 0.7], [0.1, 0.04, 0.1]);
    addPrim(tableRoot, "cylinder", spareBlack, [-0.78, TABLE_TOP_Y + 0.045, 0.8], [0.1, 0.04, 0.1]);
    addPrim(tableRoot, "box", woodDark, [-0.98, TABLE_TOP_Y + 0.05, -0.28], [0.3, 0.1, 0.22]);
    addPrim(tableRoot, "box", goldMat, [-0.98, TABLE_TOP_Y + 0.105, -0.28], [0.26, 0.012, 0.18]);
    addPrim(tableRoot, "cylinder", goldMat, [0.72, TABLE_TOP_Y + 0.025, -0.68], [0.2, 0.03, 0.2]);
    addPrim(tableRoot, "sphere", litMaterial(GROOVE.orange), [0.7, TABLE_TOP_Y + 0.055, -0.66], [0.045, 0.04, 0.045]);
    addPrim(tableRoot, "sphere", litMaterial(GROOVE.gold), [0.76, TABLE_TOP_Y + 0.055, -0.7], [0.04, 0.035, 0.04]);
    addPrim(tableRoot, "sphere", litMaterial(GROOVE.magenta), [0.68, TABLE_TOP_Y + 0.055, -0.72], [0.038, 0.035, 0.038]);

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

    // ---- scum table ---------------------------------------------------
    const scumRoot = new pc.Entity("table-2");
    scumRoot.setPosition(SCUM_TABLE.x, 0, SCUM_TABLE.z);
    app.root.addChild(scumRoot);
    addPrim(scumRoot, "cylinder", woodDark, [0, 0.08, 0], [0.9, 0.16, 0.9]);
    addPrim(scumRoot, "cylinder", woodDark, [0, 0.4, 0], [0.18, 0.72, 0.18]);
    addPrim(scumRoot, "cylinder", goldMat, [0, 0.72, 0], [0.22, 0.04, 0.22]);
    const scumTop = addPrim(
      scumRoot,
      "cylinder",
      wood,
      [0, TABLE_TOP_Y - 0.035, 0],
      [2.28, 0.08, 2.28],
    );
    scumTop.render!.receiveShadows = true;
    addPrim(scumRoot, "cylinder", goldMat, [0, TABLE_TOP_Y + 0.008, 0], [2.34, 0.015, 2.34]);
    const feltMat = litMaterial("#3d1848", { gloss: 22 });
    addPrim(scumRoot, "cylinder", feltMat, [0, TABLE_TOP_Y + 0.02, 0], [1.7, 0.012, 1.7]);

    addLoungeChair(scumRoot, beanbagMats.purple, 0.1, -1.58, 0, 1);
    addLoungeChair(scumRoot, beanbagMats.orange, -0.08, 1.58, 180, 1);
    addLoungeChair(scumRoot, beanbagMats.green, 1.52, 0.08, 90, 0.92);
    addLoungeChair(scumRoot, beanbagMats.purple, -1.5, -0.06, -90, 0.92);

    const cardBack = litMaterial("#6d1b4a", { gloss: 48 });
    const cardFace = creamMat;
    addPrim(scumRoot, "box", cardBack, [-0.18, TABLE_TOP_Y + 0.03, 0.05], [0.22, 0.012, 0.32], [0, 18, 0]);
    addPrim(scumRoot, "box", cardBack, [-0.12, TABLE_TOP_Y + 0.042, 0.02], [0.22, 0.012, 0.32], [0, 8, 0]);
    addPrim(scumRoot, "box", cardFace, [0.22, TABLE_TOP_Y + 0.03, -0.18], [0.2, 0.01, 0.3], [0, -22, 0]);
    addPrim(scumRoot, "box", cardBack, [0.32, TABLE_TOP_Y + 0.04, -0.12], [0.2, 0.01, 0.3], [0, -8, 0]);
    addPrim(scumRoot, "box", woodDark, [0.72, TABLE_TOP_Y + 0.05, 0.48], [0.28, 0.08, 0.2]);
    addPrim(scumRoot, "cylinder", mugMat, [-0.78, TABLE_TOP_Y + 0.06, 0.52], [0.11, 0.11, 0.11]);
    addPrim(scumRoot, "cylinder", creamMat, [-0.78, TABLE_TOP_Y + 0.125, 0.52], [0.09, 0.02, 0.09]);

    const scumLabelMat = texturedMaterial(
      textureFromCanvas(
        device,
        paintStandingSign("TABLE 2", "· SCUM ·", GROOVE.magenta),
        "scum-label",
      ),
      { emissive: 1.15, cutout: true },
    );
    const scumLabel = addPrim(
      app.root,
      "plane",
      scumLabelMat,
      [SCUM_TABLE.x, 2.1, SCUM_TABLE.z],
      [1.35, 1, 0.85],
      [90, 45, 0],
      "scum-label",
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

    // ---- winner trophy -----------------------------------------------
    const trophy = new pc.Entity("trophy");
    trophy.setPosition(TABLE.x, BOARD_TOP_Y + 0.18, TABLE.z);
    trophy.enabled = false;
    app.root.addChild(trophy);
    addPrim(trophy, "cylinder", goldMat, [0, 0.03, 0], [0.16, 0.05, 0.16]);
    addPrim(trophy, "cylinder", goldMat, [0, 0.1, 0], [0.09, 0.05, 0.09]);
    addPrim(trophy, "cylinder", goldMat, [0, 0.22, 0], [0.035, 0.22, 0.035]);
    addPrim(trophy, "cone", goldMat, [0, 0.42, 0], [0.16, 0.18, 0.16], [180, 0, 0]);
    addPrim(trophy, "sphere", goldMat, [0, 0.56, 0], [0.055, 0.055, 0.055]);
    addPrim(trophy, "cylinder", goldMat, [0.11, 0.4, 0], [0.03, 0.12, 0.03], [0, 0, 55]);
    addPrim(trophy, "cylinder", goldMat, [-0.11, 0.4, 0], [0.03, 0.12, 0.03], [0, 0, -55]);

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
      const checkersPoint = new pc.Vec3(TABLE.x, 0.85, TABLE.z);
      const scumPoint = new pc.Vec3(SCUM_TABLE.x, 0.85, SCUM_TABLE.z);
      const deskDist = rayPointDistance(from, dir, deskPoint);
      const checkersDist = rayPointDistance(from, dir, checkersPoint);
      const scumDist = rayPointDistance(from, dir, scumPoint);
      const nearestTable =
        scumDist < checkersDist
          ? ({ id: "table-2" as const, dist: scumDist })
          : ({ id: "table-1" as const, dist: checkersDist });
      if (nearestTable.dist < 1.45 && (nearestTable.dist <= deskDist || deskDist >= 1.55)) {
        return nearestTable.id;
      }
      if (deskDist < 1.55) return "desk" as const;
      return null;
    };

    let panX = 0;
    let panZ = 0;
    let yawOrbit = 0;
    let pitchOrbit = 0;
    let lastView: LoungeView = "lounge";
    let lastFocus: LoungeTableId = "table-1";
    let dragging = false;
    let downAt: { x: number; y: number } | null = null;
    let dragMoved = false;
    canvas.style.cursor = "grab";
    const PAN_MAX: Record<LoungeView, number> = {
      lounge: 2.3,
      table: 0.7,
      game: 0.5,
    };
    const clampPan = () => {
      const max = PAN_MAX[viewRef.current];
      const length = Math.hypot(panX, panZ);
      if (length > max) {
        panX *= max / length;
        panZ *= max / length;
      }
    };
    const applyDrag = (dx: number, dy: number) => {
      if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
      const view = viewRef.current;
      const scale = (camState.orthoHeight * 2) / Math.max(1, canvas.clientHeight);
      if (view === "lounge") {
        yawOrbit = Math.max(-22, Math.min(22, yawOrbit - dx * 0.055));
        pitchOrbit = Math.max(-7, Math.min(8, pitchOrbit + dy * 0.03));
      }
      const yawDeg =
        view === "game" && focusRef.current === "table-1"
          ? Number(facingSeatRef.current) === 2
            ? 180
            : 0
          : VIEW_RIGS[view].yaw + yawOrbit;
      const yawRad = (yawDeg * Math.PI) / 180;
      const rx = Math.cos(yawRad);
      const rz = -Math.sin(yawRad);
      const ux = Math.sin(yawRad);
      const uz = Math.cos(yawRad);
      panX += (-dx * rx + dy * ux) * scale;
      panZ += (-dx * rz + dy * uz) * scale;
      clampPan();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (dragging && downAt) {
        applyDrag(event.clientX - downAt.x, event.clientY - downAt.y);
        downAt = { x: event.clientX, y: event.clientY };
        canvas.style.cursor = "grabbing";
        return;
      }
      if (viewRef.current === "game" && focusRef.current === "table-1") {
        const index = pickBoardSquare(event.clientX, event.clientY);
        const marks = highlightsRef.current;
        const active =
          index !== null &&
          (marks.movable.includes(index) ||
            marks.targets.includes(index) ||
            marks.selected === index);
        canvas.style.cursor = active ? "pointer" : "grab";
        return;
      }
      canvas.style.cursor = pickHotspot(event.clientX, event.clientY)
        ? "pointer"
        : "grab";
    };

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      downAt = { x: event.clientX, y: event.clientY };
      dragMoved = false;
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!downAt) return;
      const moved =
        dragMoved ||
        Math.abs(event.clientX - downAt.x) > 8 ||
        Math.abs(event.clientY - downAt.y) > 8;
      downAt = null;
      dragging = false;
      canvas.style.cursor = "grab";
      if (moved) return;

      if (viewRef.current === "game") {
        if (focusRef.current === "table-1") {
          const index = pickBoardSquare(event.clientX, event.clientY);
          if (index !== null) onSquareRef.current(index);
        }
        return;
      }
      const hotspot = pickHotspot(event.clientX, event.clientY);
      if (hotspot === "desk") onDeskRef.current();
      if (hotspot === "table-1" || hotspot === "table-2") onTableRef.current(hotspot);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const onResize = () => applyResolution();
    window.addEventListener("resize", onResize);
    const onVisibility = () => {
      app.autoRender = !document.hidden;
      app.timeScale = document.hidden ? 0 : 1;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ---- animation loop -----------------------------------------------
    app.on("update", (dt: number) => {
      const viewNow = viewRef.current;
      const focusNow = focusRef.current;
      if (viewNow !== lastView || focusNow !== lastFocus) {
        panX = 0;
        panZ = 0;
        yawOrbit = 0;
        pitchOrbit = 0;
        lastView = viewNow;
        lastFocus = focusNow;
      }
      const rig = VIEW_RIGS[viewNow];
      const lookX =
        viewNow === "lounge"
          ? rig.look.x
          : focusNow === "table-2"
            ? SCUM_TABLE.x
            : TABLE.x;
      const lookZ =
        viewNow === "lounge"
          ? rig.look.z
          : focusNow === "table-2"
            ? SCUM_TABLE.z
            : TABLE.z;
      const checkersGame = viewNow === "game" && focusNow === "table-1";
      const facingYaw = checkersGame && Number(facingSeatRef.current) === 2 ? 180 : 0;
      const targetYaw = checkersGame ? facingYaw : rig.yaw + (viewNow === "lounge" ? yawOrbit : 0);
      const targetPitch = rig.pitch + (viewNow === "lounge" ? pitchOrbit : 0);
      const ease = Math.min(1, dt * 5);
      const lookEase = dragging ? 1 : ease;
      camState.look.x += (lookX + panX - camState.look.x) * lookEase;
      camState.look.y += (rig.look.y - camState.look.y) * ease;
      camState.look.z += (lookZ + panZ - camState.look.z) * lookEase;
      camState.orthoHeight += (rig.orthoHeight - camState.orthoHeight) * ease;
      camState.pitch += (targetPitch - camState.pitch) * lookEase;
      if (viewNow === "game") {
        camState.yaw = targetYaw;
      } else {
        camState.yaw = lerpDegrees(camState.yaw, targetYaw, lookEase);
      }
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
      scumLabel.enabled = viewRef.current !== "game";
      scumLabel.setPosition(
        SCUM_TABLE.x,
        2.08 + Math.sin(t * 1.4 + 0.8) * 0.05,
        SCUM_TABLE.z,
      );

      trophy.enabled = showTrophyRef.current;
      if (trophy.enabled) {
        trophy.setPosition(
          TABLE.x,
          BOARD_TOP_Y + 0.22 + Math.sin(t * 2.2) * 0.05,
          TABLE.z,
        );
        trophy.setEulerAngles(0, t * 42, 0);
      }

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
      canvas.removeEventListener("pointercancel", onPointerUp);
      app.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="games-canvas" />;
}
