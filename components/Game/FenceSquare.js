import { useMemo } from "react";
import { ModelKennyNLNatureFencePlanksDouble } from "@/components/Models/fence_planksDouble";
import { degToRad } from "three/src/math/MathUtils";

export default function FenceSquare({ size = 60 }) {
    // Each fence piece is roughly 2 units wide (based on standard Kenney kit sizing)
    // We'll calculate how many pieces we need per side.

    const fenceWidth = 7.45 * 0.9; // Adjust slightly to overlap/gap properly if needed

    const count = Math.ceil(size / fenceWidth);
    const offset = size / 2;

    const yPos = 0

    const fences = useMemo(() => {
        const items = [];
        for (let i = 0; i < count; i++) {
            const pos = (i * fenceWidth) - offset;

            // Top side
            items.push({ position: [pos, yPos, -offset], rotation: [0, 0, 0] });
            // Bottom side
            items.push({ position: [pos, yPos, offset], rotation: [0, 0, 0] });
            // Left side
            items.push({ position: [-offset, yPos, pos], rotation: [0, degToRad(90), 0] });
            // Right side
            items.push({ position: [offset, yPos, pos], rotation: [0, degToRad(90), 0] });
        }
        return items;
    }, [size, count, offset, fenceWidth]);

    return (
        <group position={[4, 0.5, 0]}>
            {fences.map((fence, i) => (
                <ModelKennyNLNatureFencePlanksDouble
                    key={i}
                    position={fence.position}
                    rotation={fence.rotation}
                    scale={7}
                />
            ))}
        </group>
    );
}