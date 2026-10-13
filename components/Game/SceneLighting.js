import { useThree } from "@react-three/fiber";

export const SUN_POSITION = [110, 180, 90];
const MOON_POSITION = [-90, 140, -60];
const SHADOW_EXTENT = 170;

export default function SceneLighting({ darkMode, graphicsQuality }) {
    const gl = useThree((state) => state.gl);
    const requestedSize =
        graphicsQuality === "Low"
            ? 1024
            : graphicsQuality === "Medium"
              ? 2048
              : 4096;
    const shadowMapSize = Math.min(
        requestedSize,
        gl.capabilities.maxTextureSize,
    );

    return (
        <>
            <ambientLight intensity={darkMode ? 0.06 : 0.12} />
            <hemisphereLight
                args={[
                    darkMode ? "#93acd5" : "#c2dbff",
                    darkMode ? "#172018" : "#4b5337",
                    darkMode ? 0.25 : 0.75,
                ]}
            />
            <directionalLight
                // Recreate the shadow target when quality changes its resolution.
                key={shadowMapSize}
                position={darkMode ? MOON_POSITION : SUN_POSITION}
                color={darkMode ? "#b8d0ff" : "#fff1d5"}
                intensity={darkMode ? 0.9 : 3}
                castShadow
                shadow-mapSize-width={shadowMapSize}
                shadow-mapSize-height={shadowMapSize}
                shadow-camera-left={-SHADOW_EXTENT}
                shadow-camera-right={SHADOW_EXTENT}
                shadow-camera-top={SHADOW_EXTENT}
                shadow-camera-bottom={-SHADOW_EXTENT}
                shadow-camera-near={1}
                shadow-camera-far={500}
                shadow-bias={-0.00005}
                shadow-normalBias={0.03}
                shadow-radius={2}
            />
            <directionalLight
                position={[-70, 60, -100]}
                color={darkMode ? "#8093c4" : "#c8dcff"}
                intensity={darkMode ? 0.1 : 0.2}
            />
        </>
    );
}
