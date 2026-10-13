import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import {
    LinearFilter,
    NoColorSpace,
    RepeatWrapping,
    SRGBColorSpace,
} from "three";
import { useStore } from "@/hooks/useStore";
import { createTerrainGeometry, DEFAULT_TERRAIN } from "./terrain";
import { createToonGrassMaterial } from "./toonGrassMaterial";

export default function GrassPlane({
    terrain = DEFAULT_TERRAIN,
    radius = 200,
}) {
    const graphicsQuality = useStore((state) => state.graphicsQuality);
    const toontownMode = useStore((state) => state.toontownMode);

    const size =
        graphicsQuality === "Low"
            ? radius * 2
            : graphicsQuality === "Medium"
              ? radius * 3
              : radius * 4;

    const geometry = useMemo(
        () => createTerrainGeometry(size, terrain, { circular: true }),
        [size, terrain],
    );
    useEffect(() => () => geometry.dispose(), [geometry]);

    return (
        <mesh
            geometry={geometry}
            receiveShadow
        >
            {toontownMode ? (
                <ToonGrassMaterial />
            ) : (
                <RealisticGrassMaterial size={size} />
            )}
        </mesh>
    );
}

function ToonGrassMaterial() {
    const material = useMemo(() => createToonGrassMaterial(), []);
    useEffect(
        () => () => {
            material.userData.sketchTexture.dispose();
            material.dispose();
        },
        [material],
    );
    return (
        <primitive
            object={material}
            attach="material"
        />
    );
}

function RealisticGrassMaterial({ size }) {
    const [colorSource, normalSource] = useTexture([
        "/textures/Grass/Poliigon_GrassPatchyGround_4585_BaseColor.jpg",
        "/textures/Grass/Poliigon_GrassPatchyGround_4585_Normal.png",
    ]);
    const maps = useMemo(() => {
        const colorMap = colorSource.clone();
        const normalMap = normalSource.clone();
        colorMap.colorSpace = SRGBColorSpace;
        normalMap.colorSpace = NoColorSpace;
        for (const texture of [colorMap, normalMap]) {
            texture.magFilter = LinearFilter;
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            texture.repeat.set(size / 10, size / 10);
            texture.needsUpdate = true;
        }
        return { colorMap, normalMap };
    }, [colorSource, normalSource, size]);

    useEffect(
        () => () => {
            maps.colorMap.dispose();
            maps.normalMap.dispose();
        },
        [maps],
    );

    return (
        <meshStandardMaterial
            map={maps.colorMap}
            normalMap={maps.normalMap}
            roughness={0.95}
        />
    );
}

export function TerrainGround({ terrain = DEFAULT_TERRAIN, size = 102 }) {
    // Cover the playable area and nearby hills without simulating the distant backdrop.
    const geometry = useMemo(
        () => createTerrainGeometry(size, terrain),
        [size, terrain],
    );
    const args = useMemo(
        () => [geometry.attributes.position.array, geometry.index.array],
        [geometry],
    );
    useEffect(() => () => geometry.dispose(), [geometry]);

    return (
        <RigidBody
            type="fixed"
            colliders={false}
        >
            <TrimeshCollider
                args={args}
                friction={0}
                restitution={0}
            />
        </RigidBody>
    );
}
