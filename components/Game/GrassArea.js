import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
    BufferAttribute,
    BufferGeometry,
    Color,
    DoubleSide,
    MeshStandardMaterial,
    Object3D,
} from "three";
import { useStore } from "@/hooks/useStore";

const grassProjection = /* glsl */ `
    vec4 grassWorldPosition = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
        grassWorldPosition = instanceMatrix * grassWorldPosition;
    #endif
    grassWorldPosition = modelMatrix * grassWorldPosition;

    // Sway increases toward the tip; shadow lookups use this animated position too.
    float swayAmount = vGrassHeight * vGrassHeight;
    float phaseOffset = grassWorldPosition.x * 0.7 + grassWorldPosition.z * 0.5;
    grassWorldPosition.x += sin(grassTime * 1.5 + phaseOffset) * swayAmount * 0.25;
    grassWorldPosition.z += cos(grassTime * 1.1 + phaseOffset) * swayAmount * 0.12;

    vec4 mvPosition = viewMatrix * grassWorldPosition;
    gl_Position = projectionMatrix * mvPosition;
`;

function createGrassMaterial() {
    const uniforms = {
        grassTime: { value: 0 },
        grassBaseColor: { value: new Color("#25451c") },
        grassTipColor: { value: new Color("#4b7333") },
    };
    const material = new MeshStandardMaterial({
        side: DoubleSide,
        roughness: 1,
        metalness: 0,
    });
    material.userData.grassUniforms = uniforms;

    // Keep Three's lighting, shadow filtering, tone mapping, and color conversion.
    // Only customize the blade gradient and wind displacement.
    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
            .replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                uniform float grassTime;
                varying float vGrassHeight;
            `,
            )
            .replace(
                "#include <begin_vertex>",
                /* glsl */ `
                #include <begin_vertex>
                vGrassHeight = uv.y;
            `,
            )
            .replace("#include <project_vertex>", grassProjection)
            .replace(
                "#include <worldpos_vertex>",
                "vec4 worldPosition = grassWorldPosition;",
            );
        shader.fragmentShader = shader.fragmentShader
            .replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                uniform vec3 grassBaseColor;
                uniform vec3 grassTipColor;
                varying float vGrassHeight;
            `,
            )
            .replace(
                "#include <color_fragment>",
                /* glsl */ `
                #include <color_fragment>
                diffuseColor.rgb *= mix(grassBaseColor, grassTipColor, vGrassHeight);
            `,
            );
    };
    material.customProgramCacheKey = () => "memory-game-grass-standard-v1";
    return material;
}

function createBladeGeometry() {
    const geometry = new BufferGeometry();
    const w = 0.05;
    const h = 0.8;

    // 5 verts: base-left, base-right, mid-left, mid-right, tip
    const positions = new Float32Array([
        -w,
        0,
        0,
        w,
        0,
        0,
        -w * 0.5,
        h * 0.5,
        0,
        w * 0.5,
        h * 0.5,
        0,
        0,
        h,
        0,
    ]);

    const uvs = new Float32Array([0, 0, 1, 0, 0, 0.5, 1, 0.5, 0.5, 1]);

    const indices = [0, 1, 2, 1, 3, 2, 2, 3, 4];

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

// inner/outer are square half-sizes; explicit bounds support an offset fence.
export default function GrassArea({
    inner = 30,
    outer = 90,
    innerBounds = { minX: -inner, maxX: inner, minZ: -inner, maxZ: inner },
    outerBounds = { minX: -outer, maxX: outer, minZ: -outer, maxZ: outer },
    count = 64000,
    groundHeight = 0.25,
    getTerrainHeight,
    clearance = 0.4,
}) {
    const graphicsQuality = useStore((state) => state.graphicsQuality);

    const bladeCount = useMemo(() => {
        if (graphicsQuality === "Low" || !Number.isFinite(count)) return 0;
        return Math.max(
            0,
            Math.floor(count * (graphicsQuality === "Medium" ? 0.5 : 1)),
        );
    }, [count, graphicsQuality]);

    const {
        minX: innerMinX,
        maxX: innerMaxX,
        minZ: innerMinZ,
        maxZ: innerMaxZ,
    } = innerBounds;
    const {
        minX: outerMinX,
        maxX: outerMaxX,
        minZ: outerMinZ,
        maxZ: outerMaxZ,
    } = outerBounds;

    const spawnAreas = useMemo(() => {
        if (
            ![
                innerMinX,
                innerMaxX,
                innerMinZ,
                innerMaxZ,
                outerMinX,
                outerMaxX,
                outerMinZ,
                outerMaxZ,
                clearance,
            ].every(Number.isFinite) ||
            innerMinX > innerMaxX ||
            innerMinZ > innerMaxZ
        )
            return [];

        // Include blade width and maximum wind sway so tips cannot cross either bound.
        const margin = Math.max(0.4, clearance);
        const minX = outerMinX + margin;
        const maxX = outerMaxX - margin;
        const minZ = outerMinZ + margin;
        const maxZ = outerMaxZ - margin;
        if (minX >= maxX || minZ >= maxZ) return [];

        const excludedMinX = Math.max(minX, Math.min(maxX, innerMinX - margin));
        const excludedMaxX = Math.max(minX, Math.min(maxX, innerMaxX + margin));
        const excludedMinZ = Math.max(minZ, Math.min(maxZ, innerMinZ - margin));
        const excludedMaxZ = Math.max(minZ, Math.min(maxZ, innerMaxZ + margin));

        // Four non-overlapping strips cover the outer square minus the inner square.
        // Sampling by area keeps density uniform and also handles very narrow bands.
        let totalArea = 0;
        return [
            [minX, excludedMinX, minZ, maxZ],
            [excludedMaxX, maxX, minZ, maxZ],
            [excludedMinX, excludedMaxX, minZ, excludedMinZ],
            [excludedMinX, excludedMaxX, excludedMaxZ, maxZ],
        ].flatMap(([x0, x1, z0, z1]) => {
            const area = (x1 - x0) * (z1 - z0);
            if (area <= 0) return [];
            totalArea += area;
            return [
                { minX: x0, maxX: x1, minZ: z0, maxZ: z1, endArea: totalArea },
            ];
        });
    }, [
        innerMinX,
        innerMaxX,
        innerMinZ,
        innerMaxZ,
        outerMinX,
        outerMaxX,
        outerMinZ,
        outerMaxZ,
        clearance,
    ]);

    const geometry = useMemo(() => createBladeGeometry(), []);

    const material = useMemo(() => createGrassMaterial(), []);

    const meshRef = useRef();

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || spawnAreas.length === 0) return;
        const dummy = new Object3D();
        const totalArea = spawnAreas[spawnAreas.length - 1].endArea;
        for (let i = 0; i < bladeCount; i++) {
            const sample = Math.random() * totalArea;
            const area =
                spawnAreas.find((region) => sample < region.endArea) ??
                spawnAreas[spawnAreas.length - 1];
            const x = area.minX + Math.random() * (area.maxX - area.minX);
            const z = area.minZ + Math.random() * (area.maxZ - area.minZ);

            dummy.position.set(
                x,
                getTerrainHeight ? getTerrainHeight(x, z) : groundHeight,
                z,
            );
            dummy.rotation.y = Math.random() * Math.PI * 2;
            // Blade heights range from 0.2 to 1.2 units (0.8 * heightScale).
            const heightScale = 0.25 + Math.random() * 1.25;
            const widthScale = 0.5 + Math.random() * 0.8;
            dummy.scale.set(widthScale, heightScale, widthScale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        // The geometry bounds do not include the shader's animated displacement.
        if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.4;
    }, [bladeCount, spawnAreas, groundHeight, getTerrainHeight]);

    useFrame(({ clock }) => {
        if (graphicsQuality === "Low") return;

        material.userData.grassUniforms.grassTime.value =
            clock.getElapsedTime();
    });

    if (bladeCount === 0 || spawnAreas.length === 0) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, bladeCount]}
            receiveShadow
            frustumCulled
        />
    );
}
