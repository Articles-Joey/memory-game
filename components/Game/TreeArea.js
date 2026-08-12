import { useMemo } from "react";
import Tree from "./Tree";
import { useStore } from "@/hooks/useStore";

function createRandomGenerator(seed) {
    let value = seed;

    return () => {
        value += 1;
        return (Math.sin(value) + 1) / 2;
    };
}

export default function TreeArea({ inner = 50, outer = 150, count = 200 }) {

    const graphicsQuality = useStore(state => state.graphicsQuality)
    const treeCount = graphicsQuality === "Low"
        ? 50
        : graphicsQuality === "Medium"
            ? 100
            : count;

    const trees = useMemo(() => {
        const seed = inner * 31 + outer * 17 + treeCount * 13
            + (graphicsQuality === "Low" ? 1 : graphicsQuality === "Medium" ? 2 : 3);
        const random = createRandomGenerator(seed);

        return [...Array(treeCount)].map((_, i) => {
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
                rotation: rotation
            };
        });
    }, [inner, outer, treeCount, graphicsQuality]);

    return (
        <group>
            {trees.map((tree) => (
                <Tree 
                    key={tree.id} 
                    position={tree.position} 
                    scale={tree.scale} 
                    rotation={tree.rotation}
                />
            ))}
        </group>
    );
}