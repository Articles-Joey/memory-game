import { memo, Suspense, useRef } from "react";

import { Canvas } from "@react-three/fiber";
import { Sky, OrbitControls, Stats } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import Debug from "./Debug";
import Player from "./Player";
import { Cards } from "./Cards";
import TreeArea from "./TreeArea";
import { useStore } from "@/hooks/useStore";
import FenceSquare from "./FenceSquare";
import OuterFence from "./OuterFence";
import HillsImageRing, {
    HILL_RING_RADII,
    TOONTOWN_HILL_RADIUS,
} from "./HillsImageRing";
import { ModelToontownBetterSkybox } from "./ToontownBetterSkybox";
import GrassArea from "./GrassArea";
import GrassPlane, { TerrainGround } from "./GrassPlane";
import SceneryArea from "./SceneryArea";
import { createTerrain } from "./terrain";
import SocketPlayers from "./SocketPlayers";
import SceneLighting, { SUN_POSITION } from "./SceneLighting";
import OrbitCameraObstruction from "./OrbitCameraObstruction";

// Grass exclusion bounds match the inner picket fence (size 60, centered at X/Z = 0).
const FENCE_BOUNDS = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 };
const OUTER_FENCE_RADIUS = 100;
// Hill distances live in HillsImageRing.js; leave room for the sky and cloud rings behind them.
const SKY_RING_GAP = 25;
// Grass ends partway through the woods (trees extend out to radius 150).
const GRASS_OUTER_BOUNDS = { minX: -90, maxX: 90, minZ: -90, maxZ: 90 };
const GROUND_HEIGHT = 0.25;
// Change this seed to get a different repeatable bush/rock layout.
const SCENERY_SEED = "memory-forest-1";
const TERRAIN = createTerrain({
    seed: "memory-hills-1",
    groundHeight: GROUND_HEIGHT,
    flatRadius: 30,
    hillHeight: 1.4,
    flatBounds: FENCE_BOUNDS,
});

function GameCanvas({
    landingAnimationMode = false,
    cameraObstructionEnabled = true,
}) {
    const orbitControlsRef = useRef();
    const debug = useStore((state) => state.debug);
    const showStats = useStore((state) => state?.debugConfig?.showStats);
    const showPhysicsDebug = useStore(
        (state) => state?.debugConfig?.showPhysicsDebug,
    );
    const darkMode = useStore((state) => state.darkMode);
    const graphicsQuality = useStore((state) => state.graphicsQuality);
    const toontownMode = useStore((state) => state.toontownMode);
    const outerHillRadius = toontownMode
        ? TOONTOWN_HILL_RADIUS
        : Math.max(...Object.values(HILL_RING_RADII));
    const skyRingRadius = outerHillRadius + SKY_RING_GAP;

    return (
        <Canvas
            camera={{
                position: [0, 50, 30],
                fov: 50,
                far: Math.max(1000, skyRingRadius * 4),
            }}
            shadows={{ type: PCFShadowMap }}
            dpr={[
                1,
                graphicsQuality === "Low"
                    ? 1
                    : graphicsQuality === "Medium"
                      ? 1.5
                      : 2,
            ]}
            gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1 }}
        >
            {showPhysicsDebug && <axesHelper args={[5]} />}
            {showStats && <Stats className="stats-overlay" />}

            <OrbitControls
                ref={orbitControlsRef}
                target={[0, 5, 0]}
                // autoRotate={gameState?.status == 'In Lobby'}
            />
            <OrbitCameraObstruction
                enabled={cameraObstructionEnabled && !toontownMode}
                controlsRef={orbitControlsRef}
                getTerrainHeight={TERRAIN.getHeight}
                groundClearance={1.5}
                treePadding={0.8}
            />

            {/* <ControlsHandler /> */}

            <Sky sunPosition={darkMode ? [0, -10, 0] : SUN_POSITION} />

            <SceneLighting
                darkMode={darkMode}
                graphicsQuality={graphicsQuality}
            />

            <Suspense>
                <GrassPlane terrain={TERRAIN} />
                <TreeArea
                    minSafeArea={11}
                    getTerrainHeight={TERRAIN.getHeight}
                />
                <FenceSquare />
                <OuterFence
                    radius={OUTER_FENCE_RADIUS}
                    getTerrainHeight={TERRAIN.getHeight}
                />
                <group position={[0, GROUND_HEIGHT, 0]}>
                    <HillsImageRing
                        imageHeight={50}
                        layerHeightGrowth={0.08}
                        autoRotate={true}
                    />
                    <ModelToontownBetterSkybox
                        radius={skyRingRadius}
                        cloudsHeight={175}
                        // skyDomeHeight={skyRingRadius}
                        skyDomeHeight={100}
                        followCamera={false}
                    />
                </group>
                <SceneryArea
                    seed={SCENERY_SEED}
                    innerBounds={FENCE_BOUNDS}
                    outerRadius={OUTER_FENCE_RADIUS}
                    getTerrainHeight={TERRAIN.getHeight}
                />
                <GrassArea
                    innerBounds={FENCE_BOUNDS}
                    outerBounds={GRASS_OUTER_BOUNDS}
                    groundHeight={GROUND_HEIGHT}
                    getTerrainHeight={TERRAIN.getHeight}
                />
            </Suspense>

            <Suspense>
                <Debug debug={showPhysicsDebug}>
                    {landingAnimationMode !== true && (
                        <>
                            <Player />
                            <SocketPlayers />
                            <Cards />
                        </>
                    )}
                    <TerrainGround terrain={TERRAIN} />
                </Debug>
            </Suspense>
        </Canvas>
    );
}

export default memo(GameCanvas);
