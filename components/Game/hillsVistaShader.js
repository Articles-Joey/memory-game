import { Color, Vector4 } from "three";

// Five compositions around one panorama. Profiles are [height, amplitude, frequency, phase].
// Each palette runs from the hazy backdrop to the saturated foreground.
const HILL_VISTAS = [
    {
        // Mint ridges and a broad emerald valley, inspired by BG5_3.
        profiles: [
            [0.7, 0.18, 1.15, 0.08],
            [0.48, 0.17, 0.85, 0.53],
            [0.31, 0.12, 1.1, 0.18],
            [0.16, 0.15, 0.9, 0.05],
        ],
        colors: ["#83cfa7", "#28be79", "#68ca35", "#18ae29"],
        darkColors: ["#3d5968", "#245246", "#3e632e", "#214d2e"],
        fieldColor: "#aedc59",
        darkFieldColor: "#52683a",
        fieldOpacity: 0.12,
    },
    {
        // Soft blue-green distance with warm pasture, inspired by BG5_1.
        profiles: [
            [0.67, 0.15, 0.9, 0.46],
            [0.47, 0.12, 1.25, 0.05],
            [0.33, 0.13, 0.85, 0.58],
            [0.15, 0.16, 1.0, 0.12],
        ],
        colors: ["#92cbb6", "#55bb77", "#a4cd43", "#20b632"],
        darkColors: ["#465f70", "#345b4b", "#596535", "#254f34"],
        fieldColor: "#c9c66b",
        darkFieldColor: "#6b6541",
        fieldOpacity: 0.72,
    },
    {
        // Lavender peaks over lime hills, inspired by BG5_2.
        profiles: [
            [0.7, 0.2, 0.82, 0.57],
            [0.49, 0.13, 1.1, 0.2],
            [0.34, 0.14, 0.95, 0.62],
            [0.17, 0.15, 1.1, 0.04],
        ],
        colors: ["#a9acd6", "#80c89a", "#b4db48", "#28ac36"],
        darkColors: ["#535877", "#3b5e52", "#5a6b35", "#285139"],
        fieldColor: "#d4df66",
        darkFieldColor: "#657342",
        fieldOpacity: 0.3,
    },
    {
        // Staggered sage ridges and rounded chartreuse pasture.
        profiles: [
            [0.68, 0.16, 1.35, 0.16],
            [0.48, 0.16, 0.9, 0.66],
            [0.32, 0.12, 1.25, 0.12],
            [0.16, 0.14, 0.85, 0.48],
        ],
        colors: ["#90cbb0", "#49b998", "#8ed149", "#18a83e"],
        darkColors: ["#415d68", "#2c5955", "#4c6437", "#244d3d"],
        fieldColor: "#c2d96a",
        darkFieldColor: "#586b45",
        fieldOpacity: 0.62,
    },
    {
        // A pale mint saddle behind overlapping jade slopes.
        profiles: [
            [0.69, 0.17, 1.0, 0.02],
            [0.5, 0.15, 1.2, 0.48],
            [0.3, 0.13, 0.8, 0.2],
            [0.16, 0.15, 1.15, 0.56],
        ],
        colors: ["#a2d6be", "#56c395", "#70ce58", "#1bb33f"],
        darkColors: ["#476470", "#345d52", "#42683e", "#285540"],
        fieldColor: "#b3da64",
        darkFieldColor: "#546b41",
        fieldOpacity: 0.38,
    },
];

// Ordered from the nearest physical ring to the farthest.
export const HILL_LAYERS = [
    { name: "foreground", profileIndex: 3, haze: 0.0, fields: false },
    { name: "meadow", profileIndex: 2, haze: 0.02, fields: true },
    { name: "ridge", profileIndex: 1, haze: 0.04, fields: false },
    { name: "distance", profileIndex: 0, haze: 0.13, fields: false },
];

export function createHillsVistaUniforms(layer, darkMode = false) {
    const { profileIndex, haze, fields } = layer;

    return {
        uProfiles: {
            value: HILL_VISTAS.map(
                (vista) => new Vector4(...vista.profiles[profileIndex]),
            ),
        },
        uColors: {
            value: HILL_VISTAS.map(
                (vista) =>
                    new Color(
                        (darkMode ? vista.darkColors : vista.colors)[
                            profileIndex
                        ],
                    ),
            ),
        },
        uHaze: { value: haze },
        uHazeColor: { value: new Color(darkMode ? "#53637d" : "#ffffff") },
        uFields: { value: fields ? 1 : 0 },
        uFieldColors: {
            value: HILL_VISTAS.map(
                (vista) =>
                    new Color(
                        darkMode ? vista.darkFieldColor : vista.fieldColor,
                    ),
            ),
        },
        uFieldOpacities: {
            value: HILL_VISTAS.map((vista) => vista.fieldOpacity),
        },
    };
}

export const hillsVistaVertexShader = /* glsl */ `
    varying vec2 vPanelPosition;
    varying vec2 vUv;

    void main() {
        vPanelPosition = position.xy;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const hillsVistaFragmentShader = /* glsl */ `
    uniform float uPanelAngle;
    uniform float uRadius;
    uniform float uBuriedFraction;
    uniform vec4 uProfiles[5];
    uniform vec3 uColors[5];
    uniform float uHaze;
    uniform vec3 uHazeColor;
    uniform float uFields;
    uniform vec3 uFieldColors[5];
    uniform float uFieldOpacities[5];

    varying vec2 vPanelPosition;
    varying vec2 vUv;

    const float TAU = 6.28318530718;

    float hillHeight(vec4 profile, float x) {
        float phase = TAU * (x * profile.z + profile.w);
        float rolling = 0.76 * cos(phase) + 0.24 * sin(phase * 1.7 + 0.8);
        return profile.x + profile.y * rolling;
    }

    float joinedHeight(vec4 current, vec4 next, float x, float blend) {
        return mix(hillHeight(current, x), hillHeight(next, x - 1.0), blend);
    }

    float hillMask(float height, float y, float aa) {
        return 1.0 - smoothstep(height - aa, height + aa, y);
    }

    vec3 hillColor(vec3 color, float y, float height, float haze) {
        float rise = clamp(y / max(height, 0.001), 0.0, 1.0);
        // Broad, quiet colour washes keep the hills flat and illustrated.
        return mix(color * 0.86, mix(color, uHazeColor, haze), rise);
    }

    void main() {
        // Sample by angle in the ring, not by each plane's UV: all panel joins
        // and the final 360-degree wrap share the same continuous composition.
        float angle = uPanelAngle + atan(vPanelPosition.x, uRadius);
        float sector = fract(angle / TAU) * 5.0;
        float x = fract(sector);
        int current = int(floor(sector));
        int next = int(mod(floor(sector) + 1.0, 5.0));
        float blend = smoothstep(0.76, 1.0, x);
        float y = vUv.y * (1.0 + uBuriedFraction) - uBuriedFraction;

        float height = joinedHeight(uProfiles[current], uProfiles[next], x, blend);

        // Differentiate continuous heights rather than the wrapping sector coordinate.
        float aa = max(fwidth(y - height), 0.0005);
        float alpha = hillMask(height, y, aa);
        vec3 color = hillColor(mix(uColors[current], uColors[next], blend), y, height, uHaze);

        // Only the meadow ring carries the curved pasture accents.
        if (uFields > 0.5) {
            vec2 fieldUv = vec2((x - 0.46) / 0.34, (y - height + 0.07) / 0.12);
            float fieldDistance = dot(fieldUv, fieldUv);
            float fieldAA = max(fwidth(fieldDistance), 0.015);
            float field = 1.0 - smoothstep(1.0 - fieldAA, 1.0 + fieldAA, fieldDistance);
            field *= 1.0 - smoothstep(0.68, 0.76, x);
            vec3 fieldColor = mix(uFieldColors[current], uFieldColors[next], blend);
            float fieldOpacity = mix(uFieldOpacities[current], uFieldOpacities[next], blend);
            color = mix(color, fieldColor, field * fieldOpacity);
        }

        // Each material now contains one hill silhouette on its own physical ring.
        if (alpha < 0.001) discard;
        gl_FragColor = vec4(color, alpha);
        #include <colorspace_fragment>
    }
`;
