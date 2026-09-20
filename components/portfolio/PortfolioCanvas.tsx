"use client";

import { useEffect, useRef } from "react";
import * as pc from "playcanvas";
import {
  CARD_FACE_HEIGHT,
  CARD_RADIUS,
  DECK_RADIUS,
  cardUvFromLocal,
  carouselSlot,
  createWheelNavState,
  nearestIndex,
  wheelStep,
} from "@/lib/portfolio/carousel";
import type { PortfolioProject } from "@/lib/portfolio/types";
import {
  paintDeckTexture,
  paintGridTexture,
  paintProjectCard,
  uvHitsPlayButton,
} from "./cardTexture";

type CanvasProps = {
  projects: PortfolioProject[];
  selectedIndex: number;
  expanded: boolean;
  interactive: boolean;
  onSelect: (index: number) => void;
  onInspect: (index: number, mode?: "toggle" | "open") => void;
  onActivate: (index: number) => void;
  onCollapse: () => void;
};

type CardNode = {
  root: pc.Entity;
  face: pc.Entity;
  index: number;
};

type CardHit = {
  index: number;
  play: boolean;
};

function emissiveMaterial(
  color: pc.Color,
  intensity: number,
  opacity = 1,
  additive = false,
) {
  const material = new pc.StandardMaterial();
  material.useLighting = false;
  material.diffuse = new pc.Color(0, 0, 0);
  material.emissive = color;
  material.emissiveIntensity = intensity;
  material.opacity = opacity;
  material.blendType =
    opacity < 1 || additive ? pc.BLEND_ADDITIVEALPHA : pc.BLEND_NONE;
  material.depthWrite = opacity >= 1 && !additive;
  material.cull = pc.CULLFACE_NONE;
  material.update();
  return material;
}

function metalMaterial(diffuse: pc.Color, emissive: pc.Color, intensity: number) {
  const material = new pc.StandardMaterial();
  material.useLighting = true;
  material.diffuse = diffuse;
  material.emissive = emissive;
  material.emissiveIntensity = intensity;
  material.useMetalness = true;
  material.metalness = 0.82;
  material.shininess = 70;
  material.update();
  return material;
}

function canvasPixelRatio() {
  const dpr = window.devicePixelRatio || 1;
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const longEdge = Math.max(window.innerWidth, window.innerHeight);
  const maxCss = coarse ? 1280 : 1920;
  const sizeScale = Math.min(1, maxCss / Math.max(longEdge, 1));
  return Math.min(dpr, coarse ? 1 : 1.25) * sizeScale;
}

function cameraRig(expand: number, portrait: boolean) {
  const amount = Math.max(0, Math.min(1, expand));
  return {
    y: portrait ? 2.42 : 2.34,
    z: (portrait ? 8.2 : 7.38) + amount * 0.06,
    lookY: (portrait ? 0.78 : 0.82) + amount * 0.16,
  };
}

function textureFromCanvas(
  device: pc.GraphicsDevice,
  canvas: HTMLCanvasElement,
  name: string,
  repeat = false,
) {
  const texture = new pc.Texture(device, {
    name,
    width: canvas.width,
    height: canvas.height,
    format: pc.PIXELFORMAT_RGBA8,
    magFilter: pc.FILTER_LINEAR,
    minFilter: pc.FILTER_LINEAR,
    addressU: repeat ? pc.ADDRESS_REPEAT : pc.ADDRESS_CLAMP_TO_EDGE,
    addressV: repeat ? pc.ADDRESS_REPEAT : pc.ADDRESS_CLAMP_TO_EDGE,
    mipmaps: false,
    flipY: false,
  });
  texture.setSource(canvas);
  return texture;
}

function cardMaterial(texture: pc.Texture) {
  const material = new pc.StandardMaterial();
  material.useLighting = false;
  material.diffuse = new pc.Color(0, 0, 0);
  material.emissive = new pc.Color(1, 1, 1);
  material.emissiveMap = texture;
  material.emissiveIntensity = 1.05;
  material.opacityMap = texture;
  material.alphaTest = 0.12;
  material.blendType = pc.BLEND_NONE;
  material.depthWrite = true;
  material.depthTest = true;
  material.cull = pc.CULLFACE_NONE;
  material.update();
  return material;
}

function addMesh(
  parent: pc.Entity,
  mesh: pc.Mesh,
  material: pc.StandardMaterial,
  name: string,
) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", {
    meshInstances: [new pc.MeshInstance(mesh, material)],
  });
  parent.addChild(entity);
  return entity;
}

function ringMesh(device: pc.GraphicsDevice, radius: number, tube: number) {
  return pc.Mesh.fromGeometry(
    device,
    new pc.TorusGeometry({
      ringRadius: radius,
      tubeRadius: tube,
      segments: 96,
      sides: 8,
    }),
  );
}

function cylinderMesh(
  device: pc.GraphicsDevice,
  radius: number,
  height: number,
  segments = 48,
) {
  return pc.Mesh.fromGeometry(
    device,
    new pc.CylinderGeometry({
      radius,
      height,
      heightSegments: 1,
      capSegments: segments,
    }),
  );
}

export function PortfolioCanvas({
  projects,
  selectedIndex,
  expanded,
  interactive,
  onSelect,
  onInspect,
  onActivate,
  onCollapse,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectsRef = useRef(projects);
  const selectedRef = useRef(selectedIndex);
  const expandedRef = useRef(expanded);
  const interactiveRef = useRef(interactive);
  const onSelectRef = useRef(onSelect);
  const onInspectRef = useRef(onInspect);
  const onActivateRef = useRef(onActivate);
  const onCollapseRef = useRef(onCollapse);
  const rebuildRef = useRef<(() => void) | null>(null);
  const paintFocusRef = useRef<((expanded: boolean, index: number) => void) | null>(
    null,
  );

  useEffect(() => {
    projectsRef.current = projects;
    selectedRef.current = selectedIndex;
    expandedRef.current = expanded;
    interactiveRef.current = interactive;
    onSelectRef.current = onSelect;
    onInspectRef.current = onInspect;
    onActivateRef.current = onActivate;
    onCollapseRef.current = onCollapse;
  });

  useEffect(() => {
    rebuildRef.current?.();
  }, [projects]);

  useEffect(() => {
    paintFocusRef.current?.(expanded, selectedIndex);
  }, [expanded, selectedIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        antialias: !coarsePointer,
        alpha: false,
        powerPreference: "low-power",
      },
    });
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    const applyResolution = () => {
      app.graphicsDevice.maxPixelRatio = canvasPixelRatio();
      app.resizeCanvas();
    };
    applyResolution();
    app.scene.ambientLight = new pc.Color(0.02, 0.04, 0.06);
    app.scene.fog.type = pc.FOG_NONE;

    const camera = new pc.Entity("camera");
    camera.addComponent("camera", {
      clearColor: new pc.Color(0.004, 0.007, 0.012),
      fov: 34,
      nearClip: 0.1,
      farClip: 80,
      toneMapping: pc.TONEMAP_ACES2,
    });
    const firstRig = cameraRig(expandedRef.current ? 1 : 0, canvas.clientHeight > canvas.clientWidth * 1.05);
    camera.setPosition(0, firstRig.y, firstRig.z);
    camera.lookAt(0, firstRig.lookY, -0.22);
    app.root.addChild(camera);
    const cameraComponent = camera.camera;
    if (!cameraComponent) {
      app.destroy();
      return;
    }

    const keyLight = new pc.Entity("key");
    keyLight.addComponent("light", {
      type: "directional",
      color: new pc.Color(0.35, 0.55, 0.7),
      intensity: 0.55,
    });
    keyLight.setEulerAngles(48, 12, 0);
    app.root.addChild(keyLight);

    const fill = new pc.Entity("fill");
    fill.addComponent("light", {
      type: "point",
      color: new pc.Color(0.2, 0.7, 1),
      intensity: 1.15,
      range: 12,
    });
    fill.setPosition(0, 2.6, 2.2);
    app.root.addChild(fill);

    const device = app.graphicsDevice;
    const cyan = new pc.Color(0.22, 0.9, 1);
    const cyanHot = new pc.Color(0.55, 0.97, 1);
    const metal = metalMaterial(
      new pc.Color(0.03, 0.045, 0.06),
      new pc.Color(0.04, 0.12, 0.16),
      0.18,
    );
    const metalDark = metalMaterial(
      new pc.Color(0.015, 0.02, 0.03),
      new pc.Color(0.02, 0.06, 0.08),
      0.1,
    );
    const ringMat = emissiveMaterial(cyan, 1.7, 1, false);
    const ringMatSoft = emissiveMaterial(cyan, 0.9, 0.7, true);
    const runnerMat = emissiveMaterial(cyanHot, 2.1, 0.95, true);
    const beamMat = emissiveMaterial(cyan, 1.15, 0.8, true);
    const tickMat = emissiveMaterial(cyan, 1.35, 1, false);
    const pulseMats = [ringMat, ringMatSoft, runnerMat, beamMat, tickMat];

    const stage = new pc.Entity("stage");
    stage.setPosition(0, -0.16, -3.15);
    app.root.addChild(stage);

    addMesh(
      stage,
      cylinderMesh(device, DECK_RADIUS, 0.2, 64),
      metalDark,
      "deck-base",
    ).setLocalPosition(0, 0.02, 0);
    addMesh(
      stage,
      cylinderMesh(device, DECK_RADIUS - 0.16, 0.06, 64),
      metal,
      "deck-plate",
    ).setLocalPosition(0, 0.12, 0);
    addMesh(
      stage,
      cylinderMesh(device, 0.48, 0.12, 24),
      metal,
      "hub",
    ).setLocalPosition(0, 0.18, 0);

    const deckTexture = textureFromCanvas(device, paintDeckTexture(), "deck-rings");
    const deckRingMat = new pc.StandardMaterial();
    deckRingMat.useLighting = false;
    deckRingMat.diffuse = new pc.Color(0, 0, 0);
    deckRingMat.emissiveMap = deckTexture;
    deckRingMat.emissive = new pc.Color(1, 1, 1);
    deckRingMat.emissiveIntensity = 0.95;
    deckRingMat.opacityMap = deckTexture;
    deckRingMat.alphaTest = 0.12;
    deckRingMat.update();
    const deckFace = new pc.Entity("deck-face");
    deckFace.addComponent("render", { type: "plane", material: deckRingMat });
    deckFace.setLocalScale(DECK_RADIUS * 2.02, 1, DECK_RADIUS * 2.02);
    deckFace.setLocalPosition(0, 0.155, 0);
    stage.addChild(deckFace);

    addMesh(
      stage,
      ringMesh(device, DECK_RADIUS - 0.05, 0.032),
      ringMat,
      "rim-track",
    ).setLocalPosition(0, 0.16, 0);
    addMesh(
      stage,
      ringMesh(device, CARD_RADIUS, 0.04),
      ringMat,
      "card-track",
    ).setLocalPosition(0, 0.16, 0);

    const tickRing = new pc.Entity("tick-ring");
    tickRing.setLocalPosition(0, 0.175, 0);
    stage.addChild(tickRing);
    const tickCount = 48;
    for (let i = 0; i < tickCount; i += 1) {
      const angle = (i / tickCount) * Math.PI * 2;
      const major = i % 4 === 0;
      const tick = new pc.Entity("tick");
      tick.addComponent("render", { type: "box", material: tickMat });
      tick.setLocalScale(major ? 0.045 : 0.018, 0.012, major ? 0.22 : 0.1);
      tick.setLocalPosition(
        Math.sin(angle) * (DECK_RADIUS - 0.28),
        0,
        Math.cos(angle) * (DECK_RADIUS - 0.28),
      );
      tick.setLocalEulerAngles(0, (angle * 180) / Math.PI, 0);
      tickRing.addChild(tick);
    }

    const gearRing = new pc.Entity("gear-ring");
    gearRing.setLocalPosition(0, 0.18, 0);
    stage.addChild(gearRing);
    const teeth = 18;
    for (let i = 0; i < teeth; i += 1) {
      const angle = (i / teeth) * Math.PI * 2;
      const tooth = new pc.Entity("tooth");
      tooth.addComponent("render", { type: "box", material: metal });
      tooth.setLocalScale(0.08, 0.05, 0.16);
      tooth.setLocalPosition(Math.sin(angle) * 0.78, 0, Math.cos(angle) * 0.78);
      tooth.setLocalEulerAngles(0, (angle * 180) / Math.PI, 0);
      gearRing.addChild(tooth);
    }
    addMesh(gearRing, ringMesh(device, 0.7, 0.018), ringMat, "hub-ring");

    const innerRing = new pc.Entity("inner-spin");
    innerRing.setLocalPosition(0, 0.17, 0);
    stage.addChild(innerRing);
    addMesh(innerRing, ringMesh(device, 2.85, 0.012), tickMat, "inner-track");

    const gridTexture = textureFromCanvas(
      device,
      paintGridTexture(),
      "grid",
      true,
    );
    const gridMat = new pc.StandardMaterial();
    gridMat.useLighting = false;
    gridMat.diffuse = new pc.Color(0, 0, 0);
    gridMat.emissiveMap = gridTexture;
    gridMat.emissive = new pc.Color(1, 1, 1);
    gridMat.emissiveIntensity = 0.32;
    gridMat.update();
    const floor = new pc.Entity("floor");
    floor.addComponent("render", { type: "plane", material: gridMat });
    floor.setLocalScale(36, 1, 36);
    floor.setPosition(0, -0.08, 0);
    app.root.addChild(floor);

    const addBeam = (
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const beam = new pc.Entity("beam");
      beam.addComponent("render", { type: "box", material: beamMat });
      beam.setLocalScale(sx, sy, sz);
      beam.setPosition(x, y, z);
      app.root.addChild(beam);
    };
    addBeam(0.03, 8.4, 0.03, -7.4, 4.1, -6.4);
    addBeam(0.03, 8.4, 0.03, 7.4, 4.1, -6.4);
    addBeam(14.8, 0.025, 0.025, 0, 8.3, -6.4);
    addBeam(11.2, 0.02, 0.02, 0, 7.4, -6.4);
    addBeam(0.02, 0.02, 10.2, -7.4, 8.3, -1.8);
    addBeam(0.02, 0.02, 10.2, 7.4, 8.3, -1.8);

    const backWall = new pc.Entity("wall");
    backWall.addComponent("render", { type: "box", material: metalDark });
    backWall.setLocalScale(30, 16, 0.18);
    backWall.setPosition(0, 4.4, -10.2);
    app.root.addChild(backWall);

    const runners: pc.Entity[] = [];
    for (let i = 0; i < 14; i += 1) {
      const runner = new pc.Entity("runner");
      runner.addComponent("render", { type: "box", material: runnerMat });
      runner.setLocalScale(0.06, 0.03, 0.28);
      stage.addChild(runner);
      runners.push(runner);
    }

    const cardsRoot = new pc.Entity("cards");
    stage.addChild(cardsRoot);

    const cards: CardNode[] = [];
    const cardArt = new Map<
      pc.Entity,
      { texture: pc.Texture; material: pc.StandardMaterial }
    >();
    let current = selectedRef.current;
    let expandCurrent = expandedRef.current ? 1 : 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartValue = 0;
    let moved = false;
    let generation = 0;
    let destroyed = false;

    const releaseCardArt = (face: pc.Entity) => {
      const previous = cardArt.get(face);
      if (!previous) return;
      previous.material.destroy();
      previous.texture.destroy();
      cardArt.delete(face);
    };

    const clearCards = () => {
      for (const card of cards) {
        releaseCardArt(card.face);
        card.root.destroy();
      }
      cards.length = 0;
      for (const art of cardArt.values()) {
        art.material.destroy();
        art.texture.destroy();
      }
      cardArt.clear();
    };

    const rebuild = () => {
      generation += 1;
      const token = generation;
      const list = projectsRef.current;
      clearCards();
      if (list.length === 0) return;

      list.forEach((project, index) => {
        const root = new pc.Entity(`card-${project.id}`);

        const stem = new pc.Entity("stem");
        stem.addComponent("render", { type: "cylinder", material: metal });
        stem.setLocalScale(0.07, 0.46, 0.07);
        stem.setLocalPosition(0, -CARD_FACE_HEIGHT * 0.5 + 0.18, -0.08);
        root.addChild(stem);

        const foot = new pc.Entity("foot");
        foot.addComponent("render", { type: "box", material: tickMat });
        foot.setLocalScale(0.42, 0.03, 0.12);
        foot.setLocalPosition(0, -CARD_FACE_HEIGHT * 0.5 - 0.02, -0.04);
        root.addChild(foot);

        const face = new pc.Entity("face");
        face.addComponent("render", { type: "plane" });
        face.setLocalEulerAngles(90, 0, 0);
        face.setLocalScale(1.5, 1, 2.26);
        root.addChild(face);
        cardsRoot.addChild(root);
        cards.push({ root, face, index });

        const focused = expandedRef.current && index === selectedRef.current;
        void paintProjectCard(project, index + 1, focused).then((painted) => {
          if (destroyed || token !== generation) return;
          applyCardArt(face, painted, `card-${project.id}`, token);
        });
      });
    };

    const applyCardArt = (
      face: pc.Entity,
      painted: HTMLCanvasElement,
      name: string,
      token: number,
    ) => {
      if (!app.graphicsDevice) return;
      let texture: pc.Texture;
      try {
        texture = textureFromCanvas(app.graphicsDevice, painted, name);
      } catch {
        return;
      }
      if (destroyed || token !== generation) {
        texture.destroy();
        return;
      }
      releaseCardArt(face);
      const material = cardMaterial(texture);
      cardArt.set(face, { texture, material });
      if (face.render) {
        face.render.meshInstances.forEach((mesh) => {
          mesh.material = material;
        });
      }
    };

    paintFocusRef.current = (isExpanded, index) => {
      const token = generation;
      const list = projectsRef.current;
      for (const card of cards) {
        const project = list[card.index];
        if (!project) continue;
        const focused = isExpanded && card.index === index;
        void paintProjectCard(project, card.index + 1, focused).then(
          (painted) => {
            if (destroyed || token !== generation) return;
            applyCardArt(card.face, painted, `card-${project.id}`, token);
          },
        );
      }
    };

    rebuildRef.current = rebuild;
    rebuild();

    const applyLayout = (value: number, expand: number) => {
      const list = projectsRef.current;
      for (const card of cards) {
        const slot = carouselSlot(card.index, value, list.length, expand);
        card.root.setLocalPosition(slot.x, slot.y, slot.z);
        card.root.setLocalScale(slot.scale, slot.scale, slot.scale);
        card.root.setLocalEulerAngles(0, slot.yaw, 0);
        const drawOrder = 800 - Math.round(Math.min(8, Math.abs(slot.delta)) * 40);
        card.face.render?.meshInstances.forEach((mesh) => {
          mesh.drawOrder = drawOrder;
        });
      }
    };

    const onResize = () => applyResolution();
    const onVisibility = () => {
      app.autoRender = !document.hidden;
      app.timeScale = document.hidden ? 0 : 1;
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    const pickCard = (clientX: number, clientY: number): CardHit | null => {
      if (cards.length === 0) return null;
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const from = cameraComponent.screenToWorld(sx, sy, cameraComponent.nearClip);
      const to = cameraComponent.screenToWorld(sx, sy, cameraComponent.farClip);
      const inv = new pc.Mat4();
      const localFrom = new pc.Vec3();
      const localTo = new pc.Vec3();
      let best: CardHit | null = null;
      let bestT = Number.POSITIVE_INFINITY;

      for (const card of cards) {
        inv.copy(card.face.getWorldTransform()).invert();
        inv.transformPoint(from, localFrom);
        inv.transformPoint(to, localTo);
        const dy = localTo.y - localFrom.y;
        if (Math.abs(dy) < 1e-6) continue;
        const t = -localFrom.y / dy;
        if (t < 0 || t >= bestT) continue;
        const x = localFrom.x + (localTo.x - localFrom.x) * t;
        const z = localFrom.z + (localTo.z - localFrom.z) * t;
        const uv = cardUvFromLocal(x, z);
        if (!uv) continue;
        bestT = t;
        const linked = Boolean(projectsRef.current[card.index]?.linkUrl);
        best = {
          index: card.index,
          play: linked && uvHitsPlayButton(uv.u, uv.v),
        };
      }
      return best;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!interactiveRef.current) return;
      dragging = true;
      moved = false;
      dragStartX = event.clientX;
      dragStartValue = current;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        if (!interactiveRef.current) {
          canvas.style.cursor = "default";
          return;
        }
        const hover = pickCard(event.clientX, event.clientY);
        canvas.style.cursor = hover ? (hover.play ? "pointer" : "grab") : "default";
        return;
      }
      const dx = event.clientX - dragStartX;
      if (Math.abs(dx) > 8) moved = true;
      const list = projectsRef.current;
      current = dragStartValue - dx / 280;
      if (list.length > 0) {
        while (current < 0) current += list.length;
        while (current >= list.length) current -= list.length;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      const list = projectsRef.current;
      if (list.length === 0) return;
      if (!moved) {
        const picked = pickCard(event.clientX, event.clientY);
        if (picked) {
          if (picked.play) {
            onInspectRef.current(picked.index, "open");
            onActivateRef.current(picked.index);
            return;
          }
          onInspectRef.current(picked.index);
          return;
        }
        onCollapseRef.current();
        return;
      }
      const snapped = nearestIndex(current, list.length);
      onSelectRef.current(snapped);
    };

    const wheelNav = createWheelNavState();
    const onWheel = (event: WheelEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-portfolio-scroll]")
      ) {
        return;
      }
      if (!interactiveRef.current) return;
      event.preventDefault();
      const list = projectsRef.current;
      if (list.length === 0) return;
      const step = wheelStep(wheelNav, event, event.timeStamp);
      if (step === 0) return;
      const next = nearestIndex(selectedRef.current, list.length) + step;
      onSelectRef.current(nearestIndex(next, list.length));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    const gridOffset = new pc.Vec2();
    app.on("update", (dt: number) => {
      const list = projectsRef.current;
      if (!dragging) {
        const target = selectedRef.current;
        const diff = wrapToward(current, target, list.length);
        current += diff * Math.min(1, dt * 7.5);
      }
      const expandTarget = expandedRef.current ? 1 : 0;
      expandCurrent += (expandTarget - expandCurrent) * Math.min(1, dt * 8.5);
      applyLayout(current, expandCurrent);

      const t = performance.now() * 0.001;
      ringMat.emissiveIntensity = 1.45 + Math.sin(t * 0.9) * 0.25;
      ringMatSoft.emissiveIntensity = 0.75 + Math.sin(t * 0.7 + 1) * 0.18;
      runnerMat.emissiveIntensity = 1.7 + Math.sin(t * 1.6) * 0.35;
      beamMat.emissiveIntensity = 0.95 + Math.sin(t * 0.55 + 0.8) * 0.2;
      tickMat.emissiveIntensity = 1.15 + Math.sin(t * 0.8) * 0.2;
      for (const material of pulseMats) material.update();

      tickRing.setLocalEulerAngles(0, t * 6.5, 0);
      gearRing.setLocalEulerAngles(0, t * -11, 0);
      innerRing.setLocalEulerAngles(0, t * -4.2, 0);

      runners.forEach((runner, index) => {
        const lane = index % 2 === 0 ? CARD_RADIUS : DECK_RADIUS - 0.08;
        const angle =
          t * (0.18 + (index % 3) * 0.04) + (index / runners.length) * Math.PI * 2;
        runner.setLocalPosition(Math.sin(angle) * lane, 0.18, Math.cos(angle) * lane);
        runner.setLocalEulerAngles(0, (angle * 180) / Math.PI, 0);
      });

      gridOffset.set(t * 0.01, t * 0.007);
      gridMat.emissiveMapOffset = gridOffset;
      gridMat.update();

      fill.setPosition(Math.sin(t * 0.28) * 1.1, 2.55, 2.2 + Math.cos(t * 0.22) * 0.4);

      const portrait = canvas.clientHeight > canvas.clientWidth * 1.05;
      const rig = cameraRig(expandCurrent, portrait);
      const sway = (interactiveRef.current ? 0.05 : 0.02) * (1 - expandCurrent * 0.7);
      camera.setPosition(
        Math.sin(t * 0.12) * sway,
        rig.y + Math.sin(t * 0.08) * 0.015,
        rig.z,
      );
      camera.lookAt(0, rig.lookY, -0.2);
    });

    app.start();

    return () => {
      rebuildRef.current = null;
      paintFocusRef.current = null;
      destroyed = true;
      clearCards();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("wheel", onWheel, true);
      app.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="portfolio-canvas" />;
}

function wrapToward(current: number, target: number, count: number) {
  if (count <= 0) return 0;
  let diff = target - current;
  while (diff > count / 2) diff -= count;
  while (diff < -count / 2) diff += count;
  return diff;
}
