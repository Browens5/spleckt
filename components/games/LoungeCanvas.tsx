"use client";

import { useEffect, useRef } from "react";
import * as pc from "playcanvas";
import { BOARD_SIZE, colOf, rowOf, type Board } from "@/lib/games/checkers";
import {
  GROOVE,
  paintBoardTrim,
  paintFloor,
  paintMarquee,
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
};

const VIEW_RIGS: Record<LoungeView, ViewRig> = {
  lounge: { look: new pc.Vec3(0.1, 0.72, -0.25), orthoHeight: 4.35, pitch: 33 },
  table: { look: new pc.Vec3(TABLE.x, 0.85, TABLE.z), orthoHeight: 2.5, pitch: 39 },
  game: { look: new pc.Vec3(TABLE.x, 0.82, TABLE.z), orthoHeight: 1.32, pitch: 55 },
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
    const applyResolution = () => {
      app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      app.resizeCanvas();
    };
    applyResolution();
    app.scene.ambientLight = new pc.Color(0.34, 0.27, 0.22);

    const device = app.graphicsDevice;

    // ---- camera -------------------------------------------------------
    const camera = new pc.Entity("camera");
    camera.addComponent("camera", {
      projection: pc.PROJECTION_ORTHOGRAPHIC,
      orthoHeight: VIEW_RIGS.lounge.orthoHeight,
      clearColor: new pc.Color(0.09, 0.05, 0.04),
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
      cameraComponent.orthoHeight = camState.orthoHeight;
    };
    placeCamera();

    // ---- lights -------------------------------------------------------
    const key = new pc.Entity("key-light");
    key.addComponent("light", {
      type: "directional",
      color: new pc.Color(1, 0.88, 0.7),
      intensity: 1.15,
      castShadows: true,
      shadowBias: 0.2,
      normalOffsetBias: 0.05,
      shadowDistance: 30,
      shadowResolution: 2048,
    });
    key.setEulerAngles(52, -28, 0);
    app.root.addChild(key);

    const warm = new pc.Entity("warm-light");
    warm.addComponent("light", {
      type: "point",
      color: colorFromHex(GROOVE.orange),
      intensity: 0.85,
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
    const rug = addPrim(app.root, "plane", rugMat, [0.4, 0.012, 0.7], [7.4, 1, 7.4]);
    rug.render!.receiveShadows = true;

    const backWallMat = texturedMaterial(
      textureFromCanvas(device, paintWall(1024, 384, true), "wall-back"),
      { emissive: 0.85 },
    );
    addPrim(app.root, "plane", backWallMat, [0.5, 2.1, -5.6], [15, 1, 4.2], [90, 0, 0]);

    const leftWallMat = texturedMaterial(
      textureFromCanvas(device, paintWall(1024, 384, false), "wall-left"),
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

    // marquee sign on the back wall
    const marqueeMat = texturedMaterial(
      textureFromCanvas(
        device,
        paintMarquee(["SPLECKT GAMES", "· board game lounge ·"]),
        "marquee",
      ),
      { emissive: 1.15, cutout: true },
    );
    addPrim(app.root, "plane", marqueeMat, [0.6, 3.15, -5.55], [4.6, 1, 1.45], [90, 0, 0]);

    // posters
    const posterSpots: Array<{ pos: [number, number, number]; rot: [number, number, number] }> = [
      { pos: [-3.4, 2.2, -5.55], rot: [90, 0, 0] },
      { pos: [4.4, 2.3, -5.55], rot: [90, 0, 0] },
      { pos: [-6.85, 2.25, -3.1], rot: [90, 90, 0] },
      { pos: [-6.85, 2.15, 2.2], rot: [90, 90, 0] },
    ];
    posterSpots.forEach((spot, index) => {
      const posterMat = texturedMaterial(
        textureFromCanvas(device, paintPoster(index), `poster-${index}`),
        { emissive: 0.9 },
      );
      addPrim(app.root, "plane", posterMat, spot.pos, [1.15, 1, 1.45], spot.rot);
    });

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
    // groovy stripe on the desk face
    addPrim(deskRoot, "box", litMaterial(GROOVE.rust), [0, 0.62, 0.46], [2.5, 0.18, 0.02]);
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
    const disco = addPrim(
      app.root,
      "sphere",
      litMaterial("#cfd6de", { gloss: 92, metal: true }),
      [-1, 3.2, 0.6],
      [0.55, 0.55, 0.55],
      [0, 0, 0],
      "disco",
    );
    addPrim(app.root, "cylinder", woodDark, [-1, 3.85, 0.6], [0.02, 0.8, 0.02]);

    // floor lamp
    const lampBase = new pc.Entity("floor-lamp");
    lampBase.setPosition(-5.4, 0, -3.9);
    app.root.addChild(lampBase);
    addPrim(lampBase, "cylinder", woodDark, [0, 0.05, 0], [0.4, 0.1, 0.4]);
    addPrim(lampBase, "cylinder", goldMat, [0, 0.9, 0], [0.05, 1.8, 0.05]);
    addPrim(lampBase, "cone", glowMaterial(GROOVE.orange, 1.2), [0, 1.9, 0], [0.5, 0.4, 0.5]);

    // potted plant
    const plant = new pc.Entity("plant");
    plant.setPosition(4.9, 0, 3.4);
    app.root.addChild(plant);
    addPrim(plant, "cylinder", litMaterial(GROOVE.rust), [0, 0.25, 0], [0.5, 0.5, 0.5]);
    const leafMat = litMaterial("#3c6b31");
    addPrim(plant, "cone", leafMat, [0, 0.85, 0], [0.55, 0.8, 0.55]);
    addPrim(plant, "cone", leafMat, [0.18, 0.7, 0.1], [0.4, 0.6, 0.4], [0, 0, -18]);
    addPrim(plant, "cone", leafMat, [-0.16, 0.72, -0.08], [0.42, 0.65, 0.42], [0, 0, 16]);

    // beanbags
    addPrim(app.root, "sphere", litMaterial(GROOVE.plum), [-4.6, 0.25, -1.6], [0.9, 0.5, 0.9]);
    addPrim(app.root, "sphere", litMaterial(GROOVE.teal), [-3.6, 0.22, -2.4], [0.8, 0.45, 0.8]);

    // ---- game table ---------------------------------------------------
    const tableRoot = new pc.Entity("table-1");
    tableRoot.setPosition(TABLE.x, 0, TABLE.z);
    app.root.addChild(tableRoot);

    addPrim(tableRoot, "cylinder", woodDark, [0, 0.06, 0], [0.85, 0.12, 0.85]);
    addPrim(tableRoot, "cylinder", woodDark, [0, 0.4, 0], [0.16, 0.7, 0.16]);
    const tableTop = addPrim(tableRoot, "cylinder", wood, [0, TABLE_TOP_Y - 0.035, 0], [2.35, 0.07, 2.35]);
    tableTop.render!.receiveShadows = true;

    // chairs on the two playing sides
    const chairMat = litMaterial(GROOVE.rust, { gloss: 24 });
    for (const dz of [-1.55, 1.55]) {
      const chair = new pc.Entity("chair");
      chair.setLocalPosition(0, 0, dz);
      chair.setLocalEulerAngles(0, dz > 0 ? 0 : 180, 0);
      tableRoot.addChild(chair);
      addPrim(chair, "box", chairMat, [0, 0.42, 0], [0.62, 0.09, 0.62]);
      addPrim(chair, "box", chairMat, [0, 0.75, 0.3], [0.62, 0.62, 0.09]);
      for (const [lx, lz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) {
        addPrim(chair, "cylinder", woodDark, [lx, 0.19, lz], [0.06, 0.38, 0.06]);
      }
    }

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

    const lightSquareMat = litMaterial(GROOVE.sand, { gloss: 40 });
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
    const targetMat = glowMaterial("#7fe07a", 1.35, 0.75);
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
    refreshHighlightsRef.current = refreshHighlights;

    // ---- pieces -------------------------------------------------------
    const piecesRoot = new pc.Entity("pieces");
    app.root.addChild(piecesRoot);
    const seatMats: Record<number, pc.StandardMaterial> = {
      1: litMaterial("#c0392b", { gloss: 58 }),
      2: litMaterial("#26201c", { gloss: 58 }),
    };
    const crownMat = glowMaterial(GROOVE.gold, 1.2);

    let tween: {
      entity: pc.Entity;
      from: pc.Vec3;
      to: pc.Vec3;
      t: number;
    } | null = null;
    let lastAnimatedKey = "";

    const refreshBoard = () => {
      tween = null;
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
        const mat = seatMats[piece.seat];
        addPrim(root, "cylinder", mat, [0, 0, 0], [0.128, 0.048, 0.128]);
        addPrim(root, "cylinder", mat, [0, 0.02, 0], [0.1, 0.02, 0.1]);
        if (piece.king) {
          addPrim(root, "cylinder", mat, [0, 0.048, 0], [0.115, 0.04, 0.115]);
          addPrim(root, "cylinder", crownMat, [0, 0.075, 0], [0.055, 0.018, 0.055]);
        }

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
    };
    refreshBoardRef.current = refreshBoard;
    refreshBoard();
    refreshHighlights();

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
      tableLabel.setPosition(TABLE.x, 2.08 + Math.sin(t * 1.4) * 0.05, TABLE.z);

      if (tween) {
        tween.t = Math.min(1, tween.t + dt * 3.4);
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
