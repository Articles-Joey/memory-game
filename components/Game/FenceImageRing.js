import { useTexture } from "@react-three/drei";
import { DoubleSide } from "three";

export default function FenceImageRing({
    segments = 64,
    imageHeight = 8,
    radius = 25,
    shape = "circle",
    bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 },
    getTerrainHeight,
}) {
    const texture = useTexture("/img/toontown/fenceW_flower.png");
    const panelCount = Math.max(4, Math.floor(segments));
    const panelGroundHeight = (x, z, rotation, width) => {
        if (!getTerrainHeight) return 0;
        const dx = (Math.cos(rotation) * width) / 2;
        const dz = (-Math.sin(rotation) * width) / 2;
        // Sink the panel to the lowest ground sample so its bottom never floats.
        return (
            Math.min(
                getTerrainHeight(x, z),
                getTerrainHeight(x - dx, z - dz),
                getTerrainHeight(x + dx, z + dz),
            ) - 0.05
        );
    };

    if (shape === "square") {
        const { minX, maxX, minZ, maxZ } = bounds;
        const panelsPerSide = Math.ceil(panelCount / 4);
        const width = maxX - minX;
        const depth = maxZ - minZ;
        if (width <= 0 || depth <= 0) return null;

        const sides = [
            {
                start: [minX, minZ],
                step: [width / panelsPerSide, 0],
                rotation: 0,
                length: width,
            },
            {
                start: [minX, maxZ],
                step: [width / panelsPerSide, 0],
                rotation: 0,
                length: width,
            },
            {
                start: [minX, minZ],
                step: [0, depth / panelsPerSide],
                rotation: Math.PI / 2,
                length: depth,
            },
            {
                start: [maxX, minZ],
                step: [0, depth / panelsPerSide],
                rotation: Math.PI / 2,
                length: depth,
            },
        ];

        return (
            <group>
                {sides.flatMap((side, sideIndex) =>
                    Array.from({ length: panelsPerSide }, (_, index) => {
                        const x = side.start[0] + side.step[0] * (index + 0.5);
                        const z = side.start[1] + side.step[1] * (index + 0.5);
                        const width = (side.length / panelsPerSide) * 1.02;
                        return (
                            <mesh
                                key={`${sideIndex}-${index}`}
                                position={[
                                    x,
                                    imageHeight / 2 +
                                        panelGroundHeight(
                                            x,
                                            z,
                                            side.rotation,
                                            width,
                                        ),
                                    z,
                                ]}
                                rotation={[0, side.rotation, 0]}
                            >
                                <planeGeometry args={[width, imageHeight]} />
                                <meshBasicMaterial
                                    map={texture}
                                    side={DoubleSide}
                                    alphaTest={0.5}
                                />
                            </mesh>
                        );
                    }),
                )}
            </group>
        );
    }

    // Tangent panels meet at the ring's corners; a little overlap hides seams.
    const segmentWidth = 2 * radius * Math.tan(Math.PI / panelCount) * 1.02;

    return (
        <group>
            {Array.from({ length: panelCount }, (_, index) => {
                const angle = (index / panelCount) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const rotation = -angle - Math.PI / 2;

                return (
                    <mesh
                        key={index}
                        position={[
                            x,
                            imageHeight / 2 +
                                panelGroundHeight(x, z, rotation, segmentWidth),
                            z,
                        ]}
                        rotation={[0, rotation, 0]}
                    >
                        <planeGeometry args={[segmentWidth, imageHeight]} />
                        <meshBasicMaterial
                            map={texture}
                            side={DoubleSide}
                            alphaTest={0.5}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}
