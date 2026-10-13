import { useStore } from "@/hooks/useStore";
import FenceImageRing from "./FenceImageRing";
import FenceCircle from "./FenceCircle";

export default function OuterFence({
    radius = 100,
    segments = 64,
    imageHeight = 8,
    getTerrainHeight,
    ...modelProps
}) {
    const toontownMode = useStore((state) => state.toontownMode);

    return toontownMode ? (
        <FenceImageRing
            radius={radius}
            segments={segments}
            imageHeight={imageHeight}
            getTerrainHeight={getTerrainHeight}
        />
    ) : (
        <FenceCircle
            {...modelProps}
            radius={radius}
            segments={segments}
            getTerrainHeight={getTerrainHeight}
        />
    );
}
