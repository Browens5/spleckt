import { dyno } from "@sparkjsdev/spark";
import type { GsplatModifier } from "@sparkjsdev/spark";

/**
 * Luma-style assemble: gaussians fly from a particle cloud around world
 * origin (0,0,0) into their capture positions as `progress` goes 0 → 1.
 */
export function createAssembleModifier(
  progress: ReturnType<typeof dyno.dynoFloat>,
  radius: ReturnType<typeof dyno.dynoFloat>,
): GsplatModifier {
  return dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => {
      const shader = new dyno.Dyno({
        inTypes: {
          gsplat: dyno.Gsplat,
          progress: "float",
          radius: "float",
        },
        outTypes: { gsplat: dyno.Gsplat },
        globals: () => [
          dyno.unindent(`
            float hash31(vec3 p) {
              return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
            }

            vec3 scatterDir(vec3 p) {
              float a = hash31(p) * 6.2831853;
              float b = hash31(p + vec3(17.2, 9.1, 3.4)) * 3.14159265;
              return normalize(vec3(sin(b) * cos(a), cos(b), sin(b) * sin(a)));
            }
          `),
        ],
        statements: ({ inputs, outputs }) =>
          dyno.unindentLines(`
            ${outputs.gsplat} = ${inputs.gsplat};
            float t = clamp(${inputs.progress}, 0.0, 1.0);
            vec3 dest = ${inputs.gsplat}.center;
            float h = hash31(dest + vec3(0.17, 4.1, 9.3));
            float delay = h * 0.42;
            float u = clamp((t - delay) / max(0.001, 1.0 - delay), 0.0, 1.0);
            float e = 1.0 - pow(1.0 - u, 3.0);

            float cloudR = max(0.5, ${inputs.radius});
            vec3 fromCloud = scatterDir(dest) * mix(cloudR * 0.28, cloudR, h);
            fromCloud.y += (h - 0.35) * cloudR * 0.18;

            ${outputs.gsplat}.center = mix(fromCloud, dest, e);

            float particle = mix(0.05, 0.16, h);
            ${outputs.gsplat}.scales = mix(vec3(particle), ${inputs.gsplat}.scales, e);

            float glow = mix(0.22, 1.0, e);
            ${outputs.gsplat}.rgba.a = ${inputs.gsplat}.rgba.a * glow;
            ${outputs.gsplat}.rgba.rgb = mix(
              ${inputs.gsplat}.rgba.rgb * vec3(1.2, 1.28, 1.22),
              ${inputs.gsplat}.rgba.rgb,
              e
            );
          `),
      });

      return {
        gsplat: shader.apply({
          gsplat,
          progress,
          radius,
        }).gsplat,
      };
    },
  );
}

/** Swirling origin cloud used while the capture downloads. */
export function createSwirlModifier(
  time: ReturnType<typeof dyno.dynoFloat>,
  loadProgress: ReturnType<typeof dyno.dynoFloat>,
  radius: ReturnType<typeof dyno.dynoFloat>,
): GsplatModifier {
  return dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => {
      const shader = new dyno.Dyno({
        inTypes: {
          gsplat: dyno.Gsplat,
          time: "float",
          loadProgress: "float",
          radius: "float",
        },
        outTypes: { gsplat: dyno.Gsplat },
        globals: () => [
          dyno.unindent(`
            float hash31(vec3 p) {
              return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
            }
          `),
        ],
        statements: ({ inputs, outputs }) =>
          dyno.unindentLines(`
            ${outputs.gsplat} = ${inputs.gsplat};
            vec3 p = ${inputs.gsplat}.center;
            float h = hash31(p);
            float t = ${inputs.time};
            float load = clamp(${inputs.loadProgress}, 0.0, 1.0);
            float cloudR = max(0.5, ${inputs.radius});

            float ang = t * mix(0.35, 1.05, h) + h * 6.2831853;
            float c = cos(ang);
            float s = sin(ang);
            vec3 spun = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
            spun.y += sin(t * 0.9 + h * 14.0) * cloudR * 0.04;

            // Pull inward as bytes arrive — the cloud “condenses”
            float pull = mix(1.15, 0.42, load);
            ${outputs.gsplat}.center = spun * pull * cloudR;

            float pulse = 0.72 + 0.28 * sin(t * 2.4 + h * 9.0);
            float size = mix(0.04, 0.11, h) * mix(1.35, 0.75, load) * pulse;
            ${outputs.gsplat}.scales = vec3(size);

            float a = mix(0.28, 0.95, load) * (0.55 + 0.45 * h);
            ${outputs.gsplat}.rgba.a = a;
            ${outputs.gsplat}.rgba.rgb = mix(
              vec3(0.55, 0.86, 0.95),
              vec3(0.96, 0.86, 0.62),
              h
            ) * (0.85 + 0.35 * load);
          `),
      });

      return {
        gsplat: shader.apply({
          gsplat,
          time,
          loadProgress,
          radius,
        }).gsplat,
      };
    },
  );
}
