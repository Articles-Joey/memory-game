import { memo, useEffect, useMemo } from "react";
import { BufferAttribute, Color, IcosahedronGeometry } from "three";
import createSeededRandom from "@/util/createSeededRandom";
import createStoneTextures from "./stoneTexture";

export const ROCK_RADIUS = 1.5;

function createRockGeometry(seed) {
    const random = createSeededRandom(seed);
    const phase = random() * Math.PI * 2;
    const tint = new Color().setHSL(
        0.1,
        0.04 + random() * 0.06,
        0.32 + random() * 0.12,
    );
    const geometry = new IcosahedronGeometry(1, 1);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let index = 0; index < positions.count; index++) {
        const x = positions.getX(index);
        const y = positions.getY(index);
        const z = positions.getZ(index);
        // Use coordinates for noise so duplicate vertices still meet without cracks.
        const shape = 1 + Math.sin(x * 17 + y * 9 + z * 14 + phase) * 0.13;
        positions.setXYZ(
            index,
            x * shape * 1.2,
            Math.max(y * shape * 0.65, -0.35) + 0.35,
            z * shape * 0.9,
        );
        const shade = 0.85 + (Math.sin(x * 13 + z * 7 + phase) + 1) * 0.12;
        colors[index * 3] = tint.r * shade;
        colors[index * 3 + 1] = tint.g * shade;
        colors[index * 3 + 2] = tint.b * shade;
    }

    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
}

function Rock({ seed = 1, ...props }) {
    const geometry = useMemo(() => createRockGeometry(seed), [seed]);
    const textures = useMemo(() => createStoneTextures(seed), [seed]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useEffect(
        () => () => {
            textures.map.dispose();
            textures.bumpMap.dispose();
        },
        [textures],
    );

    return (
        <mesh
            {...props}
            geometry={geometry}
            castShadow
            receiveShadow
        >
            <meshStandardMaterial
                vertexColors
                flatShading
                map={textures.map}
                bumpMap={textures.bumpMap}
                bumpScale={0.07}
                roughness={1}
            />
        </mesh>
    );
}

export default memo(Rock);
