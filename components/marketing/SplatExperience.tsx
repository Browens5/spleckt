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
import {
  DEFAULT_HOME_EXPERIENCE,
  parseHomeExperience,
  type HomeExperienceSettings,
} from "@/lib/home-experience";
import { WEITZ_SHOWCASE } from "@/lib/showcase";
import {
  meshOffsetForCenter,
  sampleOrbitCamera,
  SOG_ORIENTATION,
} from "@/lib/splat/camera-path";
import { fetchSogAsZipBytes } from "@/lib/splat/fetch-sog-zip";
import { buildOriginCloud } from "@/lib/splat/loading-cloud";
import {
  createAssembleModifier,
  createSwirlModifier,
} from "@/lib/splat/reveal";

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
  cloud: SplatMesh | null;
  progress: ReturnType<typeof dyno.dynoFloat>;
  loadProgress: ReturnType<typeof dyno.dynoFloat>;
  time: ReturnType<typeof dyno.dynoFloat>;
  assembleRadius: ReturnType<typeof dyno.dynoFloat>;
  disposed: boolean;
  revealStartedAt: number | null;
  reduceMotion: boolean;
  lookTarget: THREE.Vector3;
  revealDurationSec: number;
  startedAt: number;
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
  const [settings, setSettings] = useState<HomeExperienceSettings>(
    DEFAULT_HOME_EXPERIENCE,
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadPct, setLoadPct] = useState(0);

  const onScrollProgress = useEffectEvent((value: number) => {
    scrollRef.current = value;
  });

  useEffect(() => {
    onScrollProgress(scrollProgress);
  }, [scrollProgress]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/home-experience")
      .then((res) =>
        res.ok ? res.json() : { settings: DEFAULT_HOME_EXPERIENCE },
      )
      .then((data) => {
        if (cancelled) return;
        const next = parseHomeExperience(data.settings);
        setSettings((prev) =>
          JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
        );
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const revealDurationSec = mobile ? 1.8 : 2.6;

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
    const camera = new THREE.PerspectiveCamera(settings.scroll.fov, 1, 0.8, 4000);
    const first = sampleOrbitCamera(settings.scroll, 0);
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
    const loadProgress = dyno.dynoFloat(0);
    const time = dyno.dynoFloat(0);
    const assembleRadius = dyno.dynoFloat(settings.assembleRadius);

    const cloudCount = mobile ? 4200 : 12000;
    const cloud = reduceMotion
      ? null
      : new SplatMesh({
          constructSplats: (splats) => buildOriginCloud(splats, cloudCount),
          worldModifiers: [
            createSwirlModifier(time, loadProgress, assembleRadius),
          ],
        });
    if (cloud) {
      cloud.enableLod = false;
      scene.add(cloud);
    }

    runtime = {
      renderer,
      scene,
      camera,
      spark,
      mesh: null,
      cloud,
      progress,
      loadProgress,
      time,
      assembleRadius,
      disposed: false,
      revealStartedAt: null,
      reduceMotion,
      lookTarget: first.target.clone(),
      revealDurationSec,
      startedAt: performance.now(),
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
      const beat = sampleOrbitCamera(settings.scroll, t);
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

      runtime.time.value = (performance.now() - runtime.startedAt) / 1000;
      applyCamera(scrollRef.current);

      if (runtime.revealStartedAt !== null && !runtime.reduceMotion) {
        const elapsed = (performance.now() - runtime.revealStartedAt) / 1000;
        runtime.progress.value = Math.min(
          1,
          elapsed / runtime.revealDurationSec,
        );
        if (runtime.cloud) {
          runtime.cloud.opacity = Math.max(0, 1 - elapsed / 0.85);
          if (runtime.cloud.opacity <= 0.02) {
            runtime.cloud.visible = false;
          }
        }
      }

      try {
        renderer.render(scene, camera);
      } catch (error) {
        console.warn("SplatExperience render skipped", error);
      }
    };
    raf = requestAnimationFrame(loop);

    void (async () => {
      try {
        const zipBytes = await fetchSogAsZipBytes({
          metaUrl,
          dropShN: mobile,
          signal: abort.signal,
          onProgress: (fraction) => {
            if (cancelled || !runtime || runtime.disposed) return;
            runtime.loadProgress.value = fraction;
            setLoadPct(Math.min(90, Math.round(fraction * 90)));
          },
        });

        if (cancelled || !runtime || runtime.disposed) return;

        setLoadPct(92);
        runtime.loadProgress.value = 1;

        const mesh = new SplatMesh({
          fileBytes: zipBytes,
          fileType: SplatFileType.PCSOGSZIP,
          fileName: "weitz.sog",
          extSplats: true,
          lod: true,
          worldModifiers: reduceMotion
            ? undefined
            : [createAssembleModifier(progress, assembleRadius)],
        });
        mesh.maxSh = mobile ? 0 : 2;
        mesh.quaternion.copy(SOG_ORIENTATION);
        mesh.position.copy(meshOffsetForCenter(settings.center));
        scene.add(mesh);
        runtime.mesh = mesh;

        await mesh.initialized;
        if (cancelled || !runtime || runtime.disposed) return;

        mesh.enableLod = true;
        runtime.revealStartedAt = performance.now();
        if (runtime.reduceMotion) {
          runtime.progress.value = 1;
          mesh.worldModifiers = undefined;
          mesh.updateGenerator();
          if (runtime.cloud) runtime.cloud.visible = false;
        } else {
          window.setTimeout(() => {
            if (cancelled || !runtime || runtime.disposed || !runtime.mesh) {
              return;
            }
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
        if (runtime?.cloud) {
          scene.remove(runtime.cloud);
          runtime.cloud.dispose();
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
  }, [settings]);

  return (
    <div ref={hostRef} className={className} style={style}>
      <canvas ref={canvasRef} className="splat-experience__canvas" />
      {status === "error" ? (
        <div className="splat-experience__poster" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WEITZ_SHOWCASE.posterUrl} alt="" />
          <div className="splat-experience__load">
            <span>Capture unavailable</span>
          </div>
        </div>
      ) : status !== "ready" ? (
        <div className="splat-experience__load splat-experience__load--live">
          <span>
            Assembling capture
            {loadPct > 0 ? `… ${loadPct}%` : "…"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
