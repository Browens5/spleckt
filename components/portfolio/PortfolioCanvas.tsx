"use client";

import { useEffect, useRef } from "react";
import * as pc from "playcanvas";
import { carouselSlot, nearestIndex } from "@/lib/portfolio/carousel";
import type { PortfolioProject } from "@/lib/portfolio/types";
import { paintGridTexture, paintProjectCard } from "./cardTexture";

type CanvasProps = {
  projects: PortfolioProject[];
  selectedIndex: number;
  interactive: boolean;
  onSelect: (index: number) => void;
  onActivate: (index: number) => void;
};

type CardNode = {
  root: pc.Entity;
  glow: pc.Entity;
  index: number;
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
  material.update();
  return material;
}

function textureFromCanvas(device: pc.GraphicsDevice, canvas: HTMLCanvasElement, name: string) {
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

function cardMaterial(texture: pc.Texture) {
  const material = new pc.StandardMaterial();
  material.useLighting = false;
  material.diffuse = new pc.Color(0, 0, 0);
  material.emissive = new pc.Color(1, 1, 1);
  material.emissiveMap = texture;
  material.emissiveIntensity = 1.12;
  material.opacityMap = texture;
  material.blendType = pc.BLEND_PREMULTIPLIED;
  material.alphaTest = 0.04;
  material.cull = pc.CULLFACE_NONE;
  material.update();
  return material;
}

export function PortfolioCanvas({
  projects,
  selectedIndex,
  interactive,
  onSelect,
  onActivate,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectsRef = useRef(projects);
  const selectedRef = useRef(selectedIndex);
  const interactiveRef = useRef(interactive);
  const onSelectRef = useRef(onSelect);
  const onActivateRef = useRef(onActivate);
  const rebuildRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    projectsRef.current = projects;
    selectedRef.current = selectedIndex;
    interactiveRef.current = interactive;
    onSelectRef.current = onSelect;
    onActivateRef.current = onActivate;
  });

  useEffect(() => {
    rebuildRef.current?.();
  }, [projects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      },
    });
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    app.scene.ambientLight = new pc.Color(0.04, 0.08, 0.12);
    app.scene.fog.type = pc.FOG_NONE;

    const camera = new pc.Entity("camera");
    camera.addComponent("camera", {
      clearColor: new pc.Color(0.01, 0.025, 0.045),
      fov: 38,
      nearClip: 0.1,
      farClip: 80,
    });
    camera.setPosition(0, 2.05, 7.15);
    camera.lookAt(0, 1.15, 0);
    app.root.addChild(camera);
    const cameraComponent = camera.camera;
    if (!cameraComponent) {
      app.destroy();
      return;
    }

    const keyLight = new pc.Entity("key");
    keyLight.addComponent("light", {
      type: "directional",
      color: new pc.Color(0.55, 0.85, 1),
      intensity: 0.85,
    });
    keyLight.setEulerAngles(35, 12, 0);
    app.root.addChild(keyLight);

    const fill = new pc.Entity("fill");
    fill.addComponent("light", {
      type: "point",
      color: new pc.Color(0.2, 0.85, 1),
      intensity: 8,
      range: 18,
    });
    fill.setPosition(0, 3.2, 2.4);
    app.root.addChild(fill);

    let cameraFrame: pc.CameraFrame | null = null;
    try {
      cameraFrame = new pc.CameraFrame(app, cameraComponent);
      cameraFrame.rendering.toneMapping = pc.TONEMAP_ACES2;
      cameraFrame.rendering.samples = 2;
      cameraFrame.bloom.intensity = 0.045;
      cameraFrame.bloom.blurLevel = 12;
      cameraFrame.vignette.inner = 0.45;
      cameraFrame.vignette.outer = 1;
      cameraFrame.vignette.curvature = 0.6;
      cameraFrame.vignette.intensity = 0.55;
      cameraFrame.update();
    } catch {
      cameraFrame = null;
    }

    const cyan = new pc.Color(0.22, 0.9, 1);
    const deckMat = emissiveMaterial(new pc.Color(0.02, 0.05, 0.08), 0.6);
    const ringMat = emissiveMaterial(cyan, 2.4, 0.85, true);
    const ringMatSoft = emissiveMaterial(cyan, 1.3, 0.45, true);
    const pillarMat = emissiveMaterial(cyan, 1.6, 0.55, true);
    const darkMat = emissiveMaterial(new pc.Color(0.02, 0.04, 0.07), 0.4);

    const deck = new pc.Entity("deck");
    deck.addComponent("render", { type: "cylinder", material: deckMat });
    deck.setLocalScale(9.4, 0.08, 9.4);
    deck.setPosition(0, 0, 0.2);
    app.root.addChild(deck);

    const makeRing = (scale: number, y: number, material: pc.StandardMaterial) => {
      const ring = new pc.Entity("ring");
      ring.addComponent("render", { type: "torus", material });
      ring.setLocalScale(scale, 0.018, scale);
      ring.setPosition(0, y, 0.2);
      ring.setLocalEulerAngles(90, 0, 0);
      app.root.addChild(ring);
    };
    makeRing(8.8, 0.08, ringMat);
    makeRing(7.2, 0.07, ringMatSoft);
    makeRing(5.4, 0.09, ringMat);

    const gridTexture = textureFromCanvas(
      app.graphicsDevice,
      paintGridTexture(),
      "grid",
    );
    const gridMat = new pc.StandardMaterial();
    gridMat.useLighting = false;
    gridMat.diffuse = new pc.Color(0, 0, 0);
    gridMat.emissiveMap = gridTexture;
    gridMat.emissive = new pc.Color(1, 1, 1);
    gridMat.emissiveIntensity = 0.7;
    gridMat.update();
    const floor = new pc.Entity("floor");
    floor.addComponent("render", { type: "plane", material: gridMat });
    floor.setLocalScale(28, 1, 28);
    floor.setPosition(0, -0.02, 0);
    app.root.addChild(floor);

    for (const x of [-6.4, 6.4]) {
      const pillar = new pc.Entity("pillar");
      pillar.addComponent("render", { type: "box", material: pillarMat });
      pillar.setLocalScale(0.08, 7.5, 0.08);
      pillar.setPosition(x, 3.6, -4.8);
      app.root.addChild(pillar);
    }

    const lintel = new pc.Entity("lintel");
    lintel.addComponent("render", { type: "box", material: pillarMat });
    lintel.setLocalScale(13.2, 0.08, 0.08);
    lintel.setPosition(0, 7.2, -4.8);
    app.root.addChild(lintel);

    const backWall = new pc.Entity("wall");
    backWall.addComponent("render", { type: "box", material: darkMat });
    backWall.setLocalScale(22, 12, 0.2);
    backWall.setPosition(0, 4, -8.4);
    app.root.addChild(backWall);

    const cardsRoot = new pc.Entity("cards");
    app.root.addChild(cardsRoot);

    const cards: CardNode[] = [];
    const textures: pc.Texture[] = [];
    let current = selectedRef.current;
    let dragging = false;
    let dragStartX = 0;
    let dragStartValue = 0;
    let moved = false;
    let generation = 0;
    let destroyed = false;

    const clearCards = () => {
      for (const card of cards) {
        card.root.destroy();
      }
      cards.length = 0;
      for (const texture of textures) {
        texture.destroy();
      }
      textures.length = 0;
    };

    const rebuild = () => {
      generation += 1;
      const token = generation;
      const list = projectsRef.current;
      clearCards();
      if (list.length === 0) return;

      list.forEach((project, index) => {
        const root = new pc.Entity(`card-${project.id}`);
        const glow = new pc.Entity("glow");
        glow.addComponent("render", {
          type: "plane",
          material: ringMatSoft,
        });
        glow.setLocalEulerAngles(90, 0, 0);
        glow.setLocalScale(1.52, 1, 2.28);
        glow.setLocalPosition(0, 0, -0.03);
        root.addChild(glow);

        const face = new pc.Entity("face");
        face.addComponent("render", { type: "plane" });
        face.setLocalEulerAngles(90, 0, 0);
        face.setLocalScale(1.42, 1, 2.14);
        root.addChild(face);
        cardsRoot.addChild(root);
        cards.push({ root, glow, index });

        void paintProjectCard(project, index + 1, false).then(
          (painted) => {
            if (destroyed || token !== generation) return;
            const device = app.graphicsDevice;
            if (!device) return;
            let texture: pc.Texture;
            try {
              texture = textureFromCanvas(device, painted, `card-${project.id}`);
            } catch {
              return;
            }
            if (destroyed || token !== generation) {
              texture.destroy();
              return;
            }
            textures.push(texture);
            const material = cardMaterial(texture);
            if (face.render) {
              face.render.meshInstances.forEach((mesh) => {
                mesh.material = material;
              });
            }
          },
        );
      });
    };

    rebuildRef.current = rebuild;
    rebuild();

    const applyLayout = (value: number) => {
      const list = projectsRef.current;
      for (const card of cards) {
        const slot = carouselSlot(card.index, value, list.length);
        card.root.setPosition(slot.x, slot.y, slot.z);
        card.root.setLocalScale(slot.scale, slot.scale, slot.scale);
        card.root.setEulerAngles(0, slot.yaw, 0);
        card.glow.enabled = Math.abs(slot.delta) < 0.45;
      }
    };

    const onResize = () => app.resizeCanvas();
    window.addEventListener("resize", onResize);

    const pickIndex = (clientX: number, clientY: number) => {
      const list = projectsRef.current;
      if (list.length === 0) return null;
      const rect = canvas.getBoundingClientRect();
      let best = -1;
      let bestDist = 90;
      const screen = new pc.Vec3();
      for (const card of cards) {
        cameraComponent.worldToScreen(card.root.getPosition(), screen);
        const dx = screen.x - (clientX - rect.left);
        const dy = screen.y - (clientY - rect.top);
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = card.index;
        }
      }
      return best >= 0 ? best : null;
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
      if (!dragging) return;
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
        const picked = pickIndex(event.clientX, event.clientY);
        if (picked !== null) {
          onSelectRef.current(picked);
          if (picked === nearestIndex(current, list.length)) {
            onActivateRef.current(picked);
          }
          return;
        }
      }
      const snapped = nearestIndex(current, list.length);
      onSelectRef.current(snapped);
    };

    const onWheel = (event: WheelEvent) => {
      if (!interactiveRef.current) return;
      event.preventDefault();
      const list = projectsRef.current;
      if (list.length === 0) return;
      const next =
        nearestIndex(selectedRef.current, list.length) + (event.deltaY > 0 ? 1 : -1);
      onSelectRef.current(nearestIndex(next, list.length));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    app.on("update", (dt: number) => {
      const list = projectsRef.current;
      if (!dragging) {
        const target = selectedRef.current;
        const diff = wrapToward(current, target, list.length);
        current += diff * Math.min(1, dt * 7.5);
      }
      applyLayout(current);

      const t = performance.now() * 0.001;
      const sway = interactiveRef.current ? 0.12 : 0.04;
      camera.setPosition(Math.sin(t * 0.18) * sway, 2.05 + Math.sin(t * 0.11) * 0.04, 7.15);
      camera.lookAt(0, 1.18, 0.1);
    });

    app.start();

    return () => {
      rebuildRef.current = null;
      destroyed = true;
      clearCards();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      cameraFrame?.destroy();
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
