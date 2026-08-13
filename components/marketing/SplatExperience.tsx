"use client";

import {
  SparkRenderer,
  SplatFileType,
  SplatMesh,
  dyno,
  isMobile,
} from "@sparkjsdev/spark";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { WEITZ_SHOWCASE } from "@/lib/showcase";
import { sampleCameraPath, WEITZ_CAMERA_PATH } from "@/lib/splat/camera-path";
import { fetchSogAsZipBytes } from "@/lib/splat/fetch-sog-zip";
import { createAssembleModifier } from "@/lib/splat/reveal";

type SplatExperienceProps = {
  className?: string;
  style?: CSSProperties;
  /** 0–1 scroll progress driving the camera path (from parent). */
  scrollProgress?: number;
};

type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  spark: SparkRenderer;
  mesh: SplatMesh | null;
  progress: ReturnType<typeof dyno.dynoFloat>;
  disposed: boolean;
  revealStartedAt: number | null;
  reduceMotion: boolean;
  lookTarget: THREE.Vector3;
  revealDurationSec: number;
};

/** Weitz SuperSplat sky — matches showcase settings background. */
const CLEAR_COLOR = 0x5eb9ea;

export function SplatExperience({
  className,
  style,
  scrollProgress = 0,
}: SplatExperienceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const scrollRef = useRef(scrollProgress);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadPct, setLoadPct] = useState(0);

  const onScrollProgress = useEffectEvent((value: number) => {
    scrollRef.current = value;
  });

  useEffect(() => {
    onScrollProgress(scrollProgress);
  }, [scrollProgress]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const metaUrl = WEITZ_SHOWCASE.contentUrl!;

    let raf = 0;
    let runtime: Runtime | null = null;
    let cancelled = false;
    const abort = new AbortController();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobile = isMobile();
    const revealDurationSec = mobile ? 1.7 : 2.4;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: mobile ? "default" : "high-performance",
    });
    renderer.setClearColor(CLEAR_COLOR, 1);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.6),
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 1, 4000);
    const first = WEITZ_CAMERA_PATH[0];
    camera.position.copy(first.position);
    camera.lookAt(first.target);
    camera.fov = first.fov;
    camera.updateProjectionMatrix();

    const spark = new SparkRenderer({
      renderer,
      enableLod: true,
      lodSplatCount: mobile ? 420_000 : 1_100_000,
      lodSplatScale: mobile ? 0.45 : 0.8,
      lodRenderScale: mobile ? 1.6 : 1.1,
      minPixelRadius: mobile ? 1.25 : 0.7,
      maxStdDev: Math.sqrt(mobile ? 5 : 8),
    });
    scene.add(spark);

    const progress = dyno.dynoFloat(reduceMotion ? 1 : 0);

    runtime = {
      renderer,
      scene,
      camera,
      spark,
      mesh: null,
      progress,
      disposed: false,
      revealStartedAt: null,
      reduceMotion,
      lookTarget: first.target.clone(),
      revealDurationSec,
    };
    runtimeRef.current = runtime;

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const applyCamera = (t: number) => {
      if (!runtime) return;
      const beat = sampleCameraPath(WEITZ_CAMERA_PATH, t);
      camera.position.lerp(beat.position, 0.07);
      runtime.lookTarget.lerp(beat.target, 0.07);
      camera.lookAt(runtime.lookTarget);
      camera.fov = THREE.MathUtils.lerp(camera.fov, beat.fov, 0.07);
      camera.updateProjectionMatrix();
    };

    applyCamera(0);

    const loop = () => {
      if (!runtime || runtime.disposed) return;
      raf = requestAnimationFrame(loop);

      applyCamera(scrollRef.current);

      if (runtime.revealStartedAt !== null && !runtime.reduceMotion) {
        const elapsed = (performance.now() - runtime.revealStartedAt) / 1000;
        runtime.progress.value = Math.min(
          1,
          elapsed / runtime.revealDurationSec,
        );
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    void (async () => {
      try {
        // Spark WASM accepts SOG zip (pcsogszip), not bare meta.json / "pcsogs".
        const zipBytes = await fetchSogAsZipBytes({
          metaUrl,
          dropShN: mobile,
          signal: abort.signal,
          onProgress: (fraction) => {
            if (!cancelled) {
              setLoadPct(Math.min(90, Math.round(fraction * 90)));
            }
          },
        });

        if (cancelled || !runtime || runtime.disposed) return;

        setLoadPct(92);

        const mesh = new SplatMesh({
          fileBytes: zipBytes,
          fileType: SplatFileType.PCSOGSZIP,
          fileName: "weitz.sog",
          // Extended encoding — Weitz centers span hundreds of meters.
          extSplats: true,
          lod: true,
          worldModifiers: reduceMotion
            ? undefined
            : [createAssembleModifier(progress)],
        });
        mesh.maxSh = mobile ? 0 : 2;
        // OpenCV → Three orientation (Spark SOG convention)
        mesh.quaternion.set(1, 0, 0, 0);
        scene.add(mesh);
        runtime.mesh = mesh;

        await mesh.initialized;
        if (cancelled || !runtime || runtime.disposed) return;

        // Ensure LoD path is active once the tree exists.
        mesh.enableLod = true;

        runtime.revealStartedAt = performance.now();
        if (runtime.reduceMotion) {
          runtime.progress.value = 1;
          mesh.worldModifiers = undefined;
          mesh.updateGenerator();
        } else {
          window.setTimeout(() => {
            if (cancelled || !runtime || runtime.disposed || !runtime.mesh) return;
            runtime.progress.value = 1;
            runtime.mesh.worldModifiers = undefined;
            runtime.mesh.updateGenerator();
          }, Math.ceil(revealDurationSec * 1000) + 80);
        }
        setStatus("ready");
        setLoadPct(100);
      } catch (error: unknown) {
        if (abort.signal.aborted || cancelled) return;
        console.error("SplatExperience failed to load", error);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      abort.abort();
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (runtime) runtime.disposed = true;
      runtimeRef.current = null;
      try {
        if (runtime?.mesh) {
          scene.remove(runtime.mesh);
          runtime.mesh.dispose();
        }
      } catch {
        /* ignore */
      }
      try {
        scene.remove(spark);
        spark.dispose();
      } catch {
        /* ignore */
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={hostRef} className={className} style={style}>
      <canvas ref={canvasRef} className="splat-experience__canvas" />
      {status !== "ready" ? (
        <div className="splat-experience__poster" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WEITZ_SHOWCASE.posterUrl} alt="" />
          <div className="splat-experience__load">
            {status === "error" ? (
              <span>Capture unavailable</span>
            ) : (
              <span>
                Assembling capture
                {loadPct > 0 ? `… ${loadPct}%` : "…"}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
