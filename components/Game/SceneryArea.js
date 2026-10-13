import { useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import createSeededRandom from "@/util/createSeededRandom";
import Bush, { BUSH_RADIUS } from "./Bush";
import Rock, { ROCK_RADIUS } from "./Rock";
import { DEFAULT_TERRAIN } from "./terrain";

export default function SceneryArea({
    seed = "memory-forest-1",
    bushCount = 80,
    rockCount = 55,
    innerBounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 },
    outerRadius = 100,
    clearance = 2,
    spacing = 0.75,
    getTerrainHeight = DEFAULT_TERRAIN.getHeight,
}) {
    const graphicsQuality = useStore((state) => state.graphicsQuality);
    const { minX, maxX, minZ, maxZ } = innerBounds;

    const objects = useMemo(() => {
        const placed = [];
        if (
            ![
                minX,
                maxX,
                minZ,
                maxZ,
                outerRadius,
                clearance,
                spacing,
                bushCount,
                rockCount,
            ].every(Number.isFinite) ||
            minX >= maxX ||
            minZ >= maxZ ||
            outerRadius <= 0
        )
            return placed;

        const fenceMargin = Math.max(0, clearance);
        const objectSpacing = Math.max(0, spacing);
        for (const [type, requestedCount, footprint] of [
            ["bush", bushCount, BUSH_RADIUS],
            ["rock", rockCount, ROCK_RADIUS],
        ]) {
            const random = createSeededRandom(`${seed}:${type}:placement`);
            const count = Math.max(0, Math.floor(requestedCount));
            let accepted = 0;

            // Bounded attempts also handle configurations with too little available space.
            for (
                let attempt = 0;
                accepted < count && attempt < count * 120;
                attempt++
            ) {
                const scale =
                    type === "bush"
                        ? 0.8 + random() * 0.8
                        : 0.55 + random() * 1.1;
                const radius = footprint * scale;
                const spawnRadius = outerRadius - fenceMargin - radius;
                if (spawnRadius <= 0) continue;
                const angle = random() * Math.PI * 2;
                const distance = Math.sqrt(random()) * spawnRadius;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                const padding = fenceMargin + radius;

                // Exclude the inner fence plus each object's entire footprint.
                if (
                    x > minX - padding &&
                    x < maxX + padding &&
                    z > minZ - padding &&
                    z < maxZ + padding
                )
                    continue;
                if (
                    placed.some(
                        (other) =>
                            Math.hypot(x - other.x, z - other.z) <
                            radius + other.radius + objectSpacing,
                    )
                )
                    continue;

                placed.push({
                    id: `${type}-${accepted}`,
                    type,
                    x,
                    z,
                    radius,
                    scale,
                    rotation: random() * Math.PI * 2,
                    seed: `${seed}:${type}:${accepted}`,
                    position: [x, getTerrainHeight(x, z) - 0.08, z],
                });
                accepted++;
            }
        }
        return placed;
    }, [
        seed,
        bushCount,
        rockCount,
        minX,
        maxX,
        minZ,
        maxZ,
        outerRadius,
        clearance,
        spacing,
        getTerrainHeight,
    ]);

    // Generate the full layout first. Quality only hides a stable subset of it.
    const visibleObjects = useMemo(() => {
        const fraction =
            graphicsQuality === "Low"
                ? 0.3
                : graphicsQuality === "Medium"
                  ? 0.6
                  : 1;
        return ["bush", "rock"].flatMap((type) => {
            const items = objects.filter((object) => object.type === type);
            return items.slice(0, Math.ceil(items.length * fraction));
        });
    }, [objects, graphicsQuality]);

    return (
        <group>
            {visibleObjects.map((object) => {
                const Component = object.type === "bush" ? Bush : Rock;
                return (
                    <Component
                        key={object.id}
                        seed={object.seed}
                        position={object.position}
                        rotation={[0, object.rotation, 0]}
                        scale={object.scale}
                    />
                );
            })}
        </group>
    );
}
