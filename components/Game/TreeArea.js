import { useMemo } from "react";
import Tree from "./Tree";
import ToontownTree from "./ToontownTree";
import { useStore } from "@/hooks/useStore";

function createRandomGenerator(seed) {
    let value = seed;

    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function constrainToRing(position, inner, outer, fallbackAngle) {
    const radius = Math.hypot(position[0], position[2]);
    const boundedRadius = Math.max(inner, Math.min(outer, radius));
    if (radius === 0) {
        position[0] = Math.cos(fallbackAngle) * boundedRadius;
        position[2] = Math.sin(fallbackAngle) * boundedRadius;
    } else if (radius !== boundedRadius) {
        position[0] *= boundedRadius / radius;
        position[2] *= boundedRadius / radius;
    }
}

// Resolve in stable spawn order; never consume the layout's seeded random stream.
export function separateTreePositions(trees, inner, outer, minSafeArea) {
    const spacing = Number.isFinite(minSafeArea) ? Math.max(0, minSafeArea) : 0;
    if (spacing === 0) return trees;
    if (
        !Number.isFinite(inner) ||
        !Number.isFinite(outer) ||
        outer < Math.max(0, inner)
    ) {
        return [];
    }

    const innerRadius = Math.max(0, inner);
    const placed = [];
    const pushSpacing = spacing + Math.max(1e-6, spacing * 1e-6);
    const isSafe = (position) =>
        placed.every(
            (other) =>
                Math.hypot(
                    position[0] - other.position[0],
                    position[2] - other.position[2],
                ) >= spacing,
        );

    for (const tree of trees) {
        const position = [...tree.position];
        const fallbackAngle = (tree.id + 1) * GOLDEN_ANGLE;
        constrainToRing(position, innerRadius, outer, fallbackAngle);

        // Push this tree out of earlier trees' safe areas, then repeat because
        // another push or the ring boundary can introduce a new collision.
        for (let pass = 0; pass < 64 && !isSafe(position); pass++) {
            for (const other of placed) {
                let dx = position[0] - other.position[0];
                let dz = position[2] - other.position[2];
                const distance = Math.hypot(dx, dz);
                if (distance >= spacing) continue;
                if (distance === 0) {
                    const angle = (tree.id - other.id) * GOLDEN_ANGLE;
                    dx = Math.cos(angle);
                    dz = Math.sin(angle);
                } else {
                    dx /= distance;
                    dz /= distance;
                }
                const push = pushSpacing - distance;
                position[0] += dx * push;
                position[2] += dz * push;
                constrainToRing(position, innerRadius, outer, fallbackAngle);
            }
        }

        // Crowded boundaries can trap the local pushes. Search reproducible
        // alternatives without changing the other trees or their appearance.
        const startAngle = Math.atan2(tree.position[2], tree.position[0]);
        const startFraction =
            outer === innerRadius
                ? 0
                : (Math.hypot(tree.position[0], tree.position[2]) -
                      innerRadius) /
                  (outer - innerRadius);
        for (let attempt = 1; attempt <= 256 && !isSafe(position); attempt++) {
            const angle = startAngle + attempt * GOLDEN_ANGLE;
            const fraction = (startFraction + attempt * 0.618033988749895) % 1;
            const radius = innerRadius + fraction * (outer - innerRadius);
            position[0] = Math.cos(angle) * radius;
            position[2] = Math.sin(angle) * radius;
        }

        // When the requested density cannot fit, keep a safe subset rather than
        // return overlapping trees or keep searching indefinitely.
        if (isSafe(position)) placed.push({ ...tree, position });
    }
    return placed;
}

export default function TreeArea({
    inner = 50,
    outer = 150,
    count = 200,
    minSafeArea = 0,
    getTerrainHeight,
}) {
    const graphicsQuality = useStore((state) => state.graphicsQuality);
    const toontownMode = useStore((state) => state.toontownMode);
    const TreeComponent = toontownMode ? ToontownTree : Tree;
    const treeCount =
        graphicsQuality === "Low"
            ? 50
            : graphicsQuality === "Medium"
              ? 100
              : count;

    const trees = useMemo(() => {
        const random = createRandomGenerator(
            inner * 31 + outer * 17 + treeCount * 13,
        );

        const candidates = [...Array(treeCount)].map((_, i) => {
            // Generate a random angle
            const angle = random() * Math.PI * 2;

            // Random distance between inner and outer radius
            const distance = inner + random() * (outer - inner);

            // Calculate coordinates
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            // Random scale between 0.5 and 1.5
            const scale = 0.5 + random() * 1.5;

            // Random rotation
            const rotation = [0, random() * Math.PI * 2, 0];

            return {
                id: i,
                position: [x, 0, z],
                scale: scale,
                rotation: rotation,
            };
        });
        return separateTreePositions(candidates, inner, outer, minSafeArea).map(
            (tree) => {
                const [x, , z] = tree.position;
                return {
                    ...tree,
                    position: [
                        x,
                        getTerrainHeight ? getTerrainHeight(x, z) : 0,
                        z,
                    ],
                };
            },
        );
    }, [inner, outer, treeCount, minSafeArea, getTerrainHeight]);

    return (
        <group>
            {trees.map((tree) => (
                <TreeComponent
                    key={tree.id}
                    {...(toontownMode
                        ? {
                              textureUrl:
                                  tree.id % 2 === 0
                                      ? "/img/toontown/tree_big.png"
                                      : "/img/toontown/tree_big_2.png",
                          }
                        : {})}
                    position={tree.position}
                    scale={tree.scale}
                    rotation={tree.rotation}
                />
            ))}
        </group>
    );
}
