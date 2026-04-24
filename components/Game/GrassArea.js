import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DoubleSide, Object3D, ShaderMaterial } from "three";
import { useStore } from "@/hooks/useStore";

const vertexShader = /* glsl */`
    varying vec2 vUv;
    uniform float time;

    void main() {
        vUv = uv;
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);

        // Sway increases toward tip (vUv.y = 0 at base, 1 at tip)
        float swayAmount = vUv.y * vUv.y;
        float phaseOffset = worldPos.x * 0.7 + worldPos.z * 0.5;

        worldPos.x += sin(time * 1.5 + phaseOffset) * swayAmount * 0.25;
        worldPos.z += cos(time * 1.1 + phaseOffset) * swayAmount * 0.12;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const fragmentShader = /* glsl */`
    varying vec2 vUv;

    void main() {
        vec3 baseColor = vec3(0.08, 0.35, 0.08);
        vec3 tipColor  = vec3(0.38, 0.68, 0.18);
        vec3 color = mix(baseColor, tipColor, vUv.y);
        gl_FragColor = vec4(color, 1.0);
    }
`;

function createBladeGeometry() {
    const geometry = new BufferGeometry();
    const w = 0.05;
    const h = 0.8;

    // 5 verts: base-left, base-right, mid-left, mid-right, tip
    const positions = new Float32Array([
        -w,         0,       0,
         w,         0,       0,
        -w * 0.5,   h * 0.5, 0,
         w * 0.5,   h * 0.5, 0,
         0,         h,       0,
    ]);

    const uvs = new Float32Array([
        0,   0,
        1,   0,
        0,   0.5,
        1,   0.5,
        0.5, 1,
    ]);

    const indices = [0, 1, 2,  1, 3, 2,  2, 3, 4];

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

export default function GrassArea({ inner = 21, outer = 150, count = 16000 }) {

    const graphicsQuality = useStore(state => state.graphicsQuality);    

    const bladeCount = useMemo(() => {
        if (graphicsQuality === 'Low')    return Math.floor(count * 0.15);
        if (graphicsQuality === 'Medium') return Math.floor(count * 0.5);
        return count;
    }, [count, graphicsQuality]);

    const geometry = useMemo(() => createBladeGeometry(), []);

    const material = useMemo(() => new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { time: { value: 0 } },
        side: DoubleSide,
    }), []);

    const meshRef = useRef();

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const dummy = new Object3D();
        for (let i = 0; i < bladeCount; i++) {
            // Random position in the square annulus (outside inner, inside outer)
            let x, z;
            do {
                x = (Math.random() * 2 - 1) * outer;
                z = (Math.random() * 2 - 1) * outer;
            } while (Math.abs(x) < inner && Math.abs(z) < inner);

            dummy.position.set(x, 0, z);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.scale.setScalar(0.7 + Math.random() * 0.8);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [bladeCount, inner, outer]);

    useFrame(({ clock }) => {

        if (graphicsQuality === 'Low') return

        material.uniforms.time.value = clock.getElapsedTime();

    });

    if (graphicsQuality === 'Low') return

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, bladeCount]} frustumCulled />
    );
}