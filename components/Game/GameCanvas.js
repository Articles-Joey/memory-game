import { createContext, createRef, forwardRef, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sky, useDetectGPU, useTexture, OrbitControls, Cylinder, QuadraticBezierLine, Text, Image, Stats } from "@react-three/drei";

import { NearestFilter, RepeatWrapping, TextureLoader, Vector3 } from "three";

import { Debug, Physics, useBox, useSphere } from "@react-three/cannon";
import { degToRad } from "three/src/math/MathUtils";
import Player from "./Player";
// import { useHotkeys } from "react-hotkeys-hook";
import { Cards } from "./Cards";
import Tree from "./Tree";
import TreeArea from "./TreeArea";
import { ModelKennyNLNatureFencePlanksDouble } from "@/components/Models/fence_planksDouble";
import { useGameStore } from "@/hooks/useGameStore";
import { useStore } from "@/hooks/useStore";
import FenceSquare from "./FenceSquare";
import GrassArea from "./GrassArea";

const GrassPlane = () => {
    const graphicsQuality = useStore(state => state.graphicsQuality)
    const [colorMap, normalMap] = useTexture([
        '/textures/Grass/Poliigon_GrassPatchyGround_4585_BaseColor.jpg',
        '/textures/Grass/Poliigon_GrassPatchyGround_4585_Normal.png'
    ])

    let width
    let height

    let baseAmount = 300

    if (graphicsQuality == 'Low') {
        width = baseAmount
        height = baseAmount
    }
    if (graphicsQuality == 'Medium') {
        width = baseAmount * 2
        height = baseAmount * 2
    }
    if (graphicsQuality == 'High') {
        width = baseAmount * 3
        height = baseAmount * 3
    }

    [colorMap, normalMap].forEach((t) => {
        t.magFilter = NearestFilter;
        t.wrapS = RepeatWrapping
        t.wrapT = RepeatWrapping
        t.repeat.set(width / 10, height / 10)
    })

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry attach="geometry" args={[width, height]} />
                <meshStandardMaterial attach="material" map={colorMap} normalMap={normalMap} />
            </mesh>
        </>
    );
};

function GameCanvas(props) {

    const {
        debug,
    } = useGameStore(state => ({
        debug: state.debug,
    }));

    const darkMode = useStore(state => state.darkMode)

    let gameContent = (
        <>
            <Player />

            <Cards />

            <Ground />
        </>
    )

    let physicsContent
    if (debug) {
        physicsContent = (
            <Debug>
                {gameContent}
            </Debug>
        )
    } else {
        physicsContent = (
            gameContent
        )
    }

    return (
        <Canvas camera={{ position: [0, 50, 30], fov: 50 }}>

            {process.env.NODE_ENV === 'development' &&
                <>
                    <axesHelper args={[5]} />
                    <Stats />
                </>
            }

            <OrbitControls
            // autoRotate={gameState?.status == 'In Lobby'}
            />

            <Sky
                sunPosition={darkMode ?
                    [0, -10, 0]
                    :
                    [0, 10, 0]
                }
            />

            <ambientLight intensity={
                darkMode ?
                    0
                    :
                    3
            } />

            <directionalLight position={[10, 10, 5]} intensity={darkMode ? 0.3 : 0.8} castShadow />
            <directionalLight
                position={[0, 10, 0]}
                intensity={darkMode ? 0.5 : 0.4
                }
            />

            {/* <spotLight intensity={30000} position={[-50, 100, 50]} angle={5} penumbra={1} /> */}

            <GrassPlane />

            {/* Trees */}
            {/* <group>
                <group
                    position={[-45, 0, -30]}
                >
                    {[...Array(10)].map((item, item_i) => {
                        return (
                            <Tree
                                key={item_i}
                                position={[(item_i * 10), 0, 0]}
                            />
                        )
                    })}
                </group>

                <group
                    position={[-45, 0, 30]}
                >
                    {[...Array(10)].map((item, item_i) => {
                        return (
                            <Tree
                                key={item_i}
                                position={[(item_i * 10), 0, 0]}
                            />
                        )
                    })}
                </group>
            </group> */}

            <TreeArea />
            <FenceSquare />
            <GrassArea />

            {/* Fence */}
            {/* <group>
                <group
                    position={[-43, 0, -30]}
                >
                    {[...Array(10)].map((item, item_i) => {
                        return (
                            <ModelKennyNLNatureFencePlanksDouble
                                key={item_i}
                                position={[0, 0, (item_i * 6.5)]}
                                rotation={[0, degToRad(90), 0]}
                                scale={7}
                            />
                        )
                    })}
                </group>
                <group
                    position={[50, 0, -30]}
                >
                    {[...Array(10)].map((item, item_i) => {
                        return (
                            <ModelKennyNLNatureFencePlanksDouble
                                key={item_i}
                                position={[0, 0, (item_i * 6.5)]}
                                rotation={[0, degToRad(90), 0]}
                                scale={7}
                            />
                        )
                    })}
                </group>
            </group> */}

            <Physics>

                {physicsContent}

            </Physics>

        </Canvas>
    )
}

export default memo(GameCanvas)

function Ground() {

    const [ref, api] = useBox(() => ({
        mass: 0,
        type: 'Static',
        args: [100, 0.5, 100],
        position: [0, 0, 0],
    }))

    return (
        <mesh ref={ref} castShadow>
            {/* <boxGeometry args={[100, 0.5, 100]} /> */}
            {/* <BeachBall /> */}
            {/* <meshStandardMaterial color="#08e8de" /> */}
        </mesh>
    )

}