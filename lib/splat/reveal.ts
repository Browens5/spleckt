import { dyno } from "@sparkjsdev/spark";
import type { GsplatModifier } from "@sparkjsdev/spark";

/**
 * One-shot assemble reveal: splats start as scattered spherical particles
 * and coalesce into the capture as `progress` goes 0 → 1.
 */
export function createAssembleModifier(
  progress: ReturnType<typeof dyno.dynoFloat>,
): GsplatModifier {
  return dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => {
      const shader = new dyno.Dyno({
        inTypes: {
          gsplat: dyno.Gsplat,
          progress: "float",
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
            // Ease out cubic — settles hard into the final form
            float e = 1.0 - pow(1.0 - t, 3.0);

            vec3 origin = ${inputs.gsplat}.center;
            float h = hash31(origin);
            float radius = mix(18.0, 55.0, h);
            vec3 dispersed = origin + scatterDir(origin) * radius * (1.0 - e)
              + vec3(0.0, (1.0 - e) * (8.0 + h * 14.0), 0.0);

            ${outputs.gsplat}.center = mix(dispersed, origin, e);

            float particle = mix(0.045, 0.12, h);
            vec3 particleScale = vec3(particle);
            ${outputs.gsplat}.scales = mix(particleScale, ${inputs.gsplat}.scales, e);

            float glow = mix(0.15, 1.0, e);
            ${outputs.gsplat}.rgba.a = ${inputs.gsplat}.rgba.a * glow;
            ${outputs.gsplat}.rgba.rgb = mix(
              ${inputs.gsplat}.rgba.rgb * vec3(1.15, 1.25, 1.2),
              ${inputs.gsplat}.rgba.rgb,
              e
            );
          `),
      });

      return {
        gsplat: shader.apply({
          gsplat,
          progress,
        }).gsplat,
      };
    },
  );
}
