import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, MathUtils, Vector2 } from "three";

const ignoreRaycast = () => null;
const vertexShader = /* glsl */ `
    varying vec2 vGlowUv;
    void main() {
        vGlowUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const fragmentShader = /* glsl */ `
    uniform vec2 uCardHalfSize;
    uniform vec2 uPlaneSize;
    uniform vec3 uGlowColor;
    uniform float uGlowStrength;
    uniform float uGlowWidth;
    uniform float uCardOpacity;
    varying vec2 vGlowUv;

    void main() {
        vec2 p = (vGlowUv - 0.5) * uPlaneSize;
        vec2 q = abs(p) - uCardHalfSize + vec2(0.16);
        float edgeDistance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.16;
        if (edgeDistance < 0.0) discard;
        float glow = exp(-edgeDistance * 3.2 / uGlowWidth) * uGlowStrength * uCardOpacity;
        glow *= 1.0 - smoothstep(1.0, 1.4, edgeDistance);
        if (glow < 0.001) discard;
        gl_FragColor = vec4(uGlowColor, glow);
        #include <colorspace_fragment>
    }
`;

export default function CardGlow({ args, active = false }) {
    const materialRef = useRef();
    const [width, thickness, depth] = args;
    const colors = useMemo(
        () => ({ white: new Color("#ffffff"), gold: new Color("#ffd65a") }),
        [],
    );
    const uniforms = useMemo(
        () => ({
            uCardHalfSize: { value: new Vector2(width / 2, depth / 2) },
            uPlaneSize: { value: new Vector2(width + 2.8, depth + 2.8) },
            uGlowColor: { value: new Color("#ffffff") },
            uGlowStrength: { value: 0.14 },
            uGlowWidth: { value: 0.55 },
            uCardOpacity: { value: 1 },
        }),
        [width, depth],
    );

    useFrame((_, delta) => {
        const current = materialRef.current?.uniforms;
        if (!current) return;
        const step = Math.min(delta, 0.1);
        current.uGlowColor.value.lerp(
            active ? colors.gold : colors.white,
            1 - Math.exp(-12 * step),
        );
        current.uGlowStrength.value = MathUtils.damp(
            current.uGlowStrength.value,
            active ? 0.65 : 0.14,
            12,
            step,
        );
        current.uGlowWidth.value = MathUtils.damp(
            current.uGlowWidth.value,
            active ? 0.95 : 0.55,
            12,
            step,
        );
    });

    return (
        <mesh
            position={[0, -thickness / 2 + 0.03, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={ignoreRaycast}
        >
            <planeGeometry args={[width + 2.8, depth + 2.8]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                blending={AdditiveBlending}
                side={DoubleSide}
                depthWrite={false}
                toneMapped={false}
            />
        </mesh>
    );
}
