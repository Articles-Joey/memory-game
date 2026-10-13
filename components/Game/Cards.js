import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Image } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { MathUtils } from "three";
import { useHotkeys } from "react-hotkeys-hook";
import { useGameStore } from "@/hooks/useGameStore";
import { cloneDeep } from "lodash";
import { useStore } from "@/hooks/useStore";
import { useSearchParams } from "next/navigation";
import { useSocketStore } from "@/hooks/useSocketStore";
import CardGlow from "./CardGlow";

const CARD_ROWS = 4;
const CARD_COLUMNS = 8;
const CARD_SPACING_X = 6;
const CARD_SPACING_Z = 11;
const CARD_FLIP_DURATION = 0.45;
const CARD_MATCH_HOLD = 0.25;
const CARD_FADE_DURATION = 0.55;
const CARD_NUMBER_FONT_SIZE = 2.2;

function applyCardFade(group, opacity, animation) {
    group.visible = opacity > 0.001;
    group.traverse((object) => {
        if (!object.isMesh) return;
        if (!animation.shadows.has(object))
            animation.shadows.set(object, object.castShadow);
        object.castShadow = animation.shadows.get(object) && opacity > 0.02;
        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
        for (const material of materials) {
            if (!animation.materials.has(material)) {
                animation.materials.set(material, {
                    opacity: material.opacity,
                    transparent: material.transparent,
                    depthWrite: material.depthWrite,
                });
            }
            const original = animation.materials.get(material);
            const transparent = opacity < 1 || original.transparent;
            if (material.transparent !== transparent) {
                material.transparent = transparent;
                material.needsUpdate = true;
            }
            material.depthWrite = opacity < 1 ? false : original.depthWrite;
            material.opacity = original.opacity * opacity;
            // CardGlow has its own alpha uniform; Image and Text use material.opacity.
            if (material.uniforms?.uCardOpacity)
                material.uniforms.uCardOpacity.value = opacity;
        }
    });
}

function CardsBase() {
    const { matchPairs, setMatchPairs } = useGameStore((state) => ({
        matchPairs: state.gameState.matchPairs,
        setMatchPairs: state.setMatchPairs,
    }));

    useEffect(() => {
        if (!Array.isArray(matchPairs)) return;
        const cards = matchPairs.filter((obj) => obj.flipped);
        console.log("matchPairs matched check", cards);

        if (cards.length == 2) {
            const allMatchValuesSame = cards.every(
                (item) => item?.matchValue === cards[0]?.matchValue,
            );
            console.log(allMatchValuesSame);

            if (allMatchValuesSame) {
                let matchPairsCopy = cloneDeep(matchPairs);

                // let flippedCardsCount = matchPairs.filter(obj => obj.flipped)?.length

                matchPairsCopy = matchPairsCopy.map((obj) => {
                    if (obj.flipped) {
                        return {
                            ...obj,
                            matched: true,
                            flipped: false,
                        };
                    } else {
                        return obj;
                    }
                });

                setMatchPairs(matchPairsCopy);
            }
        }
    }, [matchPairs, setMatchPairs]);

    return (
        <group position={[0, 0, 0]}>
            {[...Array(CARD_ROWS)].map((obj, obj_row_i) => {
                return (
                    <group key={obj_row_i}>
                        {[...Array(CARD_COLUMNS)].map((obj, obj_col_i) => {
                            return (
                                <Card
                                    key={`${obj_row_i}-${obj_col_i}`}
                                    name={`${obj_row_i}-${obj_col_i}`}
                                    args={[5, 0.5, 10]}
                                    position={[
                                        (obj_col_i - (CARD_COLUMNS - 1) / 2) *
                                            CARD_SPACING_X,
                                        0.5,
                                        (obj_row_i - (CARD_ROWS - 1) / 2) *
                                            CARD_SPACING_Z,
                                    ]}
                                />
                            );
                        })}
                    </group>
                );
            })}
        </group>
    );
}

export const Cards = memo(CardsBase);

function Card({ args, position, name }) {
    const searchParams = useSearchParams();
    const params = Object.fromEntries(searchParams.entries());
    const { server } = params;

    const { matchPairs, setMatchPairs, addFlipCount } = useGameStore(
        (state) => ({
            matchPairs: state.gameState.matchPairs,
            setMatchPairs: state.setMatchPairs,
            addFlipCount: state.addFlipCount,
        }),
    );

    const socket = useSocketStore((state) => state.socket);

    const toontownMode = useStore((state) => state.toontownMode);
    const darkMode = useStore((state) => state.darkMode);
    const debug = useStore((state) => state.debug);
    const roundId = useGameStore((state) => state.gameState.roundId);

    const textColor = darkMode || toontownMode ? "white" : "black";
    const cardColor = toontownMode
        ? "#1d5579"
        : darkMode
          ? "#333333"
          : "#f9edcd";

    const [occupied, setOccupied] = useState(false);
    const visualsRef = useRef();
    const flipRef = useRef();
    const animationRef = useRef({
        initialized: false,
        roundId: null,
        matched: false,
        target: 0,
        start: 0,
        elapsed: CARD_FLIP_DURATION,
        matchElapsed: 0,
        materials: new WeakMap(),
        shadows: new WeakMap(),
    });

    const matchValueLookup = useMemo(() => {
        return Array.isArray(matchPairs)
            ? matchPairs.find((obj) => obj.flatLocation == name)
            : undefined;
    }, [matchPairs, name]);

    useFrame((_, delta) => {
        const visuals = visualsRef.current;
        const flip = flipRef.current;
        if (!visuals || !flip) return;
        const animation = animationRef.current;
        const matched = Boolean(matchValueLookup?.matched);
        // Match logic resets flipped; keep matched cards face-up through their exit.
        const target = matchValueLookup?.flipped || matched ? Math.PI : 0;
        if (
            !animation.initialized ||
            (animation.roundId != null && animation.roundId !== roundId)
        ) {
            animation.initialized = true;
            animation.target = target;
            animation.start = target;
            animation.elapsed = CARD_FLIP_DURATION;
            animation.matched = matched;
            animation.matchElapsed = matched
                ? CARD_FLIP_DURATION + CARD_MATCH_HOLD + CARD_FADE_DURATION
                : 0;
            flip.rotation.z = target;
        }
        animation.roundId = roundId;
        if (target !== animation.target) {
            animation.start = flip.rotation.z;
            animation.target = target;
            animation.elapsed = 0;
        }
        if (matched !== animation.matched) {
            animation.matched = matched;
            animation.matchElapsed = 0;
        }

        const step = Math.min(delta, 0.1);
        animation.elapsed = Math.min(
            CARD_FLIP_DURATION,
            animation.elapsed + step,
        );
        const progress = animation.elapsed / CARD_FLIP_DURATION;
        const angle = MathUtils.lerp(
            animation.start,
            animation.target,
            MathUtils.smoothstep(progress, 0, 1),
        );
        flip.rotation.z = angle;
        // Lift the rotating slab enough to avoid swinging its edge through the ground.
        flip.position.y =
            Math.max(
                0,
                (args[0] / 2) * Math.abs(Math.sin(angle)) +
                    (args[1] / 2) * Math.abs(Math.cos(angle)) -
                    args[1] / 2,
            ) +
            Math.sin(progress * Math.PI) * 0.18;

        // Both cards in a pair share this delay, including time for the second
        // card to complete its flip before either begins fading.
        if (matched) animation.matchElapsed += step;
        const fadeProgress = matched
            ? MathUtils.clamp(
                  (animation.matchElapsed -
                      CARD_FLIP_DURATION -
                      CARD_MATCH_HOLD) /
                      CARD_FADE_DURATION,
                  0,
                  1,
              )
            : 0;
        applyCardFade(
            visuals,
            1 - MathUtils.smoothstep(fadeProgress, 0, 1),
            animation,
        );
    });

    useHotkeys(
        ["Space", "Enter", "shift+Space", "shift+Enter"],
        () => {
            console.log("Flip called");

            if (
                occupied &&
                Array.isArray(matchPairs) &&
                matchValueLookup &&
                !matchValueLookup.matched
            ) {
                if (useGameStore.getState().gameState.status === "Game Over")
                    return;
                if (server) {
                    if (!socket?.connected) return;
                    socket.emit("game:memory-game:flip", {
                        name: name,
                        server: server,
                    });
                } else if (!useGameStore.getState().startSinglePlayerGame()) {
                    return;
                }

                addFlipCount();

                console.log("name", name);

                const matchPairsCopy = cloneDeep(matchPairs);

                const flippedCardsCount = matchPairs.filter(
                    (obj) => obj.flipped,
                )?.length;

                const matchPairsToFlip =
                    flippedCardsCount >= 2
                        ? matchPairsCopy.map((obj) => {
                              return {
                                  ...obj,
                                  flipped: false,
                              };
                          })
                        : matchPairsCopy;

                const nextMatchPairs = matchPairsToFlip.map((obj) => {
                    if (obj.flatLocation == name) {
                        return {
                            ...obj,
                            flipped: !obj.flipped,
                        };
                    } else {
                        return obj;
                    }
                });

                console.log("matchPairsCopy", nextMatchPairs);

                setMatchPairs(nextMatchPairs);

                // setFlipped(prev => !flipped)
            }
        },
        [
            matchPairs,
            occupied,
            matchValueLookup,
            server,
            socket,
            name,
            addFlipCount,
            setMatchPairs,
        ],
    );

    return (
        <RigidBody
            type="fixed"
            position={position}
            colliders={false}
            userData={{ name, isObstacle: true }}
        >
            <CuboidCollider
                args={[args[0] / 2, args[1] / 2, args[2] / 2]}
                sensor
                onIntersectionEnter={({ other }) => {
                    if (other.rigidBodyObject?.userData?.isPlayer)
                        setOccupied(true);
                }}
                onIntersectionExit={({ other }) => {
                    if (other.rigidBodyObject?.userData?.isPlayer)
                        setOccupied(false);
                }}
            />

            <group ref={visualsRef}>
                {debug && (
                    <Text
                        color={textColor}
                        fontSize={0.35}
                        anchorX="left"
                        anchorY="top"
                        position={[
                            -args[0] / 2 + 0.35,
                            args[1] / 2 + 0.06,
                            -args[2] / 2 + 0.5,
                        ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        {name}
                    </Text>
                )}
                {darkMode && (
                    <CardGlow
                        args={args}
                        active={occupied}
                    />
                )}
                {occupied && (
                    <mesh
                        castShadow
                        receiveShadow
                        rotation={[0, 0, 0]}
                    >
                        <boxGeometry args={[5.5, 0.25, 10.5]} />

                        <meshStandardMaterial color="gold" />
                    </mesh>
                )}

                {/* Nested mesh to allow card flip without flipping collider */}
                <mesh
                    ref={flipRef}
                    castShadow
                    receiveShadow
                >
                    {toontownMode ? (
                        <Image
                            url={`img/toontown/toontown-logo.svg`}
                            scale={[6, 3, 1]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.3, 0]}
                            transparent={true}
                            alt="Decorative logo"
                        />
                    ) : (
                        <Image
                            url={`img/icon.png`}
                            scale={3}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.3, 0]}
                            transparent={true}
                            alt="Decorative logo"
                        />
                    )}

                    {/* <Image
                            url={`${process.env.NEXT_PUBLIC_CDN}branding/logo.svg`}
                            scale={3}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.3, 0]}
                            transparent={true}
                        /> */}

                    {!toontownMode && (
                        <>
                            <Text
                                color={textColor}
                                rotation={[-Math.PI / 2, 0, 0]}
                                position={[0, 0.3, -2.25]}
                                scale={0.6}
                            >
                                Articles Media
                            </Text>
                            <Text
                                color={textColor}
                                rotation={[-Math.PI / 2, 0, 0]}
                                position={[0, 0.3, 2.25]}
                                scale={0.6}
                            >
                                Memory Match
                            </Text>
                        </>
                    )}

                    <Text
                        color={textColor}
                        fontSize={CARD_NUMBER_FONT_SIZE}
                        anchorX="center"
                        anchorY="middle"
                        position={[0, -args[1] / 2 - 0.06, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        scale={[-1, 1, 1]}
                    >
                        {matchValueLookup?.matchValue}
                    </Text>

                    <boxGeometry args={args} />

                    <meshStandardMaterial color={cardColor} />
                </mesh>
            </group>
        </RigidBody>
    );
}
