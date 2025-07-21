import { createContext, createRef, forwardRef, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sky, useDetectGPU, useTexture, OrbitControls, Cylinder, QuadraticBezierLine, Text, Image } from "@react-three/drei";

import { NearestFilter, RepeatWrapping, TextureLoader, Vector3 } from "three";

import { Debug, Physics, useBox, useSphere } from "@react-three/cannon";
import { degToRad } from "three/src/math/MathUtils";
import Player from "./Player";
import { useHotkeys } from "react-hotkeys-hook";
import { useGameStore } from "@/hooks/useGameStore";
import { cloneDeep } from "lodash";

function CardsBase() {

    const {
        matchPairs,
        setMatchPairs,
    } = useGameStore(state => ({
        matchPairs: state.matchPairs,
        setMatchPairs: state.setMatchPairs
    }));

    useEffect(() => {

        let cards = matchPairs.filter(obj => obj.flipped)
        console.log("matchPairs matched check", cards)

        if (cards.length == 2) {
            const allMatchValuesSame = cards.every(item => item.matchValue === cards[0].matchValue);
            console.log(allMatchValuesSame)

            if (allMatchValuesSame) {

                let matchPairsCopy = cloneDeep(matchPairs)

                // let flippedCardsCount = matchPairs.filter(obj => obj.flipped)?.length

                matchPairsCopy = matchPairsCopy.map(obj => {

                    if (obj.flipped) {
                        return {
                            ...obj,
                            matched: true,
                            flipped: false
                        }
                    } else {
                        return obj
                    }

                })

                setMatchPairs(matchPairsCopy)

            }
        }

    }, [matchPairs]);

    return (
        <group position={[0, 0, 0]}>

            {[...Array(4)].map((obj, obj_row_i) => {
                return (
                    <group
                        key={obj_row_i}
                    // position={[
                    //     0,
                    //     0.5,
                    //     0 + (obj_row_i * 11),
                    // ]}
                    >

                        {[...Array(8)].map((obj, obj_col_i) => {
                            return (
                                <Card
                                    key={`${obj_row_i}-${obj_col_i}`}
                                    name={`${obj_row_i}-${obj_col_i}`}
                                    args={[5, 0.5, 10]}
                                    position={[
                                        0 + (obj_col_i * 6) - 20,
                                        0.5,
                                        0 + (obj_row_i * 11) - 20
                                    ]}
                                />
                            )
                        })}

                    </group>
                )
            })}

        </group>
    )

}

export const Cards = memo(CardsBase);

function Card({ args, position, name }) {

    const {
        matchPairs,
        setMatchPairs,
        addFlipCount
    } = useGameStore(state => ({
        matchPairs: state.matchPairs,
        setMatchPairs: state.setMatchPairs,
        addFlipCount: state.addFlipCount
    }));

    const [ref, api] = useBox(() => (
        {
            // mass: 0,
            // type: 'Static',
            isTrigger: true,
            args: args,
            position: position,
            userData: {
                name: name,
                isObstacle: true
            },
            onCollide: (e) => {

                console.log("A card was collided with", e)

                // const collidedObject = e.body?.userData;

                // if (collidedObject && collidedObject.name) {
                //     console.log(`A card was collided with: ${collidedObject.name}`);
                // } else {
                //     console.log("A card was collided with an object without a name");
                // }

            },
            onCollideBegin: (e) => {
                console.log("A player entered a card bounds")
                setOccupied(true)
            },
            onCollideEnd: (e) => {
                console.log("A player exited a card bounds")
                setOccupied(false)
            },
        })
    )

    useEffect(() => {
        api.userData = { name: name || "Obstacle" };
    }, [api, name]);

    const matchValueLookup = useMemo(() => {

        return matchPairs.find(obj => obj.flatLocation == name)

    }, [matchPairs, name]);

    const [flipped, setFlipped] = useState(false);

    const [occupied, setOccupied] = useState(false);

    useHotkeys(['Space'], () => {

        console.log("Space")

        if (
            occupied 
            && 
            !matchValueLookup?.matched
        ) {

            addFlipCount()

            console.log("name", name)

            let matchPairsCopy = cloneDeep(matchPairs)

            let flippedCardsCount = matchPairs.filter(obj => obj.flipped)?.length

            if (flippedCardsCount >= 2) {
                matchPairsCopy = matchPairsCopy.map(obj => {
                    return {
                        ...obj,
                        flipped: false
                    }

                })
            }

            matchPairsCopy = matchPairsCopy.map(obj => {

                if (obj.flatLocation == name) {
                    return {
                        ...obj,
                        flipped: !obj.flipped
                    }
                } else {
                    return obj
                }

            })

            console.log("matchPairsCopy", matchPairsCopy)

            setMatchPairs(matchPairsCopy)

            // setFlipped(prev => !flipped)

        }

    }, [matchPairs, occupied]);

    return (
        <mesh
            ref={ref}
            castShadow
            onClick={(e) => {
                // setFlipped(prev => !prev)
                // e.stopPropagation()
            }}
        >

            {!matchValueLookup?.matched &&
                <group>

                    {occupied &&
                        <mesh
                            rotation={[
                                0,
                                0,
                                0
                            ]}
                        >

                            <boxGeometry args={[5.5, 0.25, 10.5]} />

                            <meshStandardMaterial
                                color="gold"
                            />

                        </mesh>
                    }

                    {/* Nested mesh to allow card flip without flipping collider */}
                    <mesh
                        rotation={[
                            0,
                            0,
                            matchValueLookup?.flipped ? degToRad(180) : 0
                        ]}
                    >

                        <Image
                            url={`${process.env.NEXT_PUBLIC_CDN}branding/logo.svg`}
                            scale={3}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.3, 0]}
                            transparent={true}
                        />
                        <Text
                            color="black"
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.3, -2.25]}
                            scale={0.6}
                        >
                            Articles Media
                        </Text>
                        <Text
                            color="black"
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.3, 2.25]}
                            scale={0.6}
                        >
                            Memory Match
                        </Text>

                        <Text
                            color="black"
                            position={[0, -0.3, -1]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            scale={[-1, 1, 1]}
                        >
                            {name}
                        </Text>

                        <Text
                            color="black"
                            position={[0, -0.3, 1]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            scale={[-1, 1, 1]}
                        >
                            {matchValueLookup.matchValue}
                        </Text>

                        <boxGeometry args={args} />

                        <meshStandardMaterial
                            color="#f9edcd"
                        />

                    </mesh>

                </group>
            }

        </mesh>
    )

}