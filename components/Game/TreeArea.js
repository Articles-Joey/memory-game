import { useMemo } from "react";
import Tree from "./Tree";
import { useStore } from "@/hooks/useStore";

export default function TreeArea({ inner = 50, outer = 150, count = 200 }) {

    const graphicsQuality = useStore(state => state.graphicsQuality)

    const trees = useMemo(() => {

        if (graphicsQuality === "Low") {
            count = 50;
        }

        if (graphicsQuality === "Medium") {
            count = 100;
        }

        return [...Array(count)].map((_, i) => {
            // Generate a random angle
            const angle = Math.random() * Math.PI * 2;
            
            // Random distance between inner and outer radius
            const distance = inner + Math.random() * (outer - inner);
            
            // Calculate coordinates
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Random scale between 0.5 and 1.5
            const scale = 0.5 + Math.random() * 1.5;
            
            // Random rotation
            const rotation = [0, Math.random() * Math.PI * 2, 0];

            return {
                id: i,
                position: [x, 0, z],
                scale: scale,
                rotation: rotation
            };
        });
    }, [inner, outer, count, graphicsQuality]);

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