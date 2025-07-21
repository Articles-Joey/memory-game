import { useFrame, useThree } from "@react-three/fiber"
import { useSphere } from "@react-three/cannon"
import { useGLTF, useAnimations, Text } from '@react-three/drei'
import { memo, useEffect, useRef, useState } from "react"
import { Vector3 } from "three"
import * as THREE from 'three';
import { useKeyboard } from "@/hooks/useKeyboard"

import { Model as SpacesuitModel } from "@/components/Models/Spacesuit";

import { useControllerStore } from '@/hooks/useControllerStore';
import { useControlsStore, useGameStore } from "@/hooks/useGameStore";

// import ClownfishModel from "./PlayerModels/Clownfish"
// import BoneFishModel from "./PlayerModels/BoneFish"
import { useLocalStorageNew } from "@/hooks/useLocalStorageNew"
import { degToRad } from "three/src/math/MathUtils.js"

const JUMP_FORCE = 0;
const SPEED = 12;

let lastLocation

function myToFixed(i, digits) {
    var pow = Math.pow(10, digits);

    return Math.floor(i * pow) / pow;
}

function Player(props) {

    // const { setPlayerData, teleportPlayer, setTeleportPlayer } = props;

    const {
        cameraMode, setCameraMode,
        teleport, setTeleport,
        setPlayerLocation,
        maxHeight, setMaxHeight,
        shift, setShift,
        addDistance,
        debug
    } = useGameStore()

    const {
        touchControls, setTouchControls
    } = useControlsStore()

    const { controllerState, setControllerState } = useControllerStore()

    const [character, setCharacter] = useLocalStorageNew("game:ocean-rings:character", {
        model: 'Clownfish',
        color: '#000000'
    })

    // Attach event listeners when the component mounts
    useEffect(() => {

        if (controllerState.axes && Math.abs(controllerState?.axes[0]) > 0.3) {

            if (controllerState?.axes[0] > 0) {
                api.position.set([-1, 5, 0]);
            } else {
                api.position.set([1, 5, 0]);
            }

        }

    }, [controllerState]);

    useEffect(() => {

        if (teleport) {

            console.log("Teleport has been called!", teleport)
            api.position.set(teleport[0], teleport[1], teleport[2]);
            setTeleport(false)

        }

    }, [teleport]);

    const { moveBackward, moveForward, moveRight, moveLeft, jump, shift: isShifting, crouch } = useKeyboard()

    const [action, setAction] = useState("Idle")
    const [lastMove, setLastMove] = useState(0);
    useEffect(() => {

        if (moveLeft || moveRight || moveBackward || moveForward) {
            setAction("Walk");
        }

        if (moveForward && moveRight) {
            setLastMove(135); // Forward + Right
        } else if (moveForward && moveLeft) {
            setLastMove(225); // Forward + Left
        } else if (moveBackward && moveRight) {
            setLastMove(45); // Backward + Right
        } else if (moveBackward && moveLeft) {
            setLastMove(-45); // Backward + Left
        } else if (moveRight) {
            setLastMove(90); // Right
        } else if (moveLeft) {
            setLastMove(-90); // Left
        } else if (moveForward) {
            setLastMove(180); // Forward
        } else if (moveBackward) {
            setLastMove(0); // Backward
        }

        if (!moveLeft && !moveRight && !moveBackward && !moveForward) {
            setAction("Idle");
        }

    }, [moveBackward, moveForward, moveRight, moveLeft])

    const { camera } = useThree()

    const [ref, api] = useSphere(() => ({
        mass: 1,
        args: [0.2],
        position: [0, 1.1, 0],
        onCollide: (e) => {

            console.log("Player collided with a card", e?.body)

        }
    }))

    const material = new THREE.MeshPhysicalMaterial({
        color: 'blue',
        opacity: 0,
        transparent: true,
    });

    const vel = useRef([0, 0, 0])
    useEffect(() => {
        api.velocity.subscribe((v) => vel.current = v)
    }, [api.velocity])

    const pos = useRef([0, 0, 0])

    const playerModelRef = useRef()

    useEffect(() => {

        api.position.subscribe((p) => pos.current = p)

        if (playerModelRef.current) {
            // Get the current position of the sphere from the physics API
            api.position.subscribe((position) => {

                playerModelRef.current.position.set(...position);

            });
        }

    }, [api.position])

    useEffect(() => {
        console.log("Shift", isShifting)
        setShift(isShifting)
    }, [isShifting])

    useFrame(() => {

        addDistance(0.1)

        // if (cameraMode == "Player") {
        //     camera.position.copy(new Vector3(0, pos.current[1], (pos.current[2] + 10)))
        //     camera.lookAt(new Vector3(0, pos.current[1], (pos.current[2] + 5)))
        // }

        let posX = 0
        if (pos.current[0]) {
            posX = myToFixed(pos.current[0], 2)
        }

        // console.log(pos.current[1])
        let posY = 0
        if (pos.current[1]) {
            posY = myToFixed(pos.current[1], 2)
        }

        let posZ = 0
        if (pos.current[2]) {
            posZ = myToFixed(pos.current[2], 2)
        }

        // console.log(posX)

        let newLocation = new Vector3(posX, posY, posZ)

        if (JSON.stringify(lastLocation) !== JSON.stringify(newLocation)) {
            // console.log(newLocation, lastLocation)
            setPlayerLocation(newLocation)
            lastLocation = newLocation
        }
        // else {
        //     console.log("location unchanged")
        // }

        if (pos.current[1] > maxHeight) {
            setMaxHeight(pos.current[1].toFixed(2))
        }

        const direction = new Vector3()

        const frontVector = new Vector3(
            0,
            0,
            (moveForward || touchControls.up ? -1 : 0) - (moveBackward || touchControls.down ? -1 : 0),
        )

        const sideVector = new Vector3(
            (moveLeft || touchControls.left ? 1 : 0) - (moveRight || touchControls.right ? 1 : 0),
            0,
            0,
        )

        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(SPEED * (shift ? 2 : 1))
        // .applyEuler(camera.rotation)

        api.velocity.set(direction.x, 0, direction.z)

        if ((jump || touchControls.jump) && Math.abs(vel.current[1]) < 0.05) {

            console.log("Jump understood")

            api.velocity.set(vel.current[0], JUMP_FORCE, vel.current[2])

            if (
                touchControls.jump
                // ||
                // touchControls.left
                // ||
                // touchControls.right
            ) {
                setTouchControls({
                    ...touchControls,
                    jump: false,
                    // left: false,
                    // right: false
                })
            }
        }

    })

    return (
        <group>

            <group
                ref={playerModelRef}
            >
                <SpacesuitModel
                    scale={3}
                    position={[0, -1, 0]}
                    action={action}
                    rotation={[0, degToRad(lastMove), 0]}
                />
            </group>

            <mesh
                ref={ref}
                // {...props}
                // position={position}
                material={material}
            >
                {!debug && <sphereGeometry args={[1, 32, 32]} />}

                {/* {character.model == 'Clownfish' && <ClownfishModel rotation={[0, Math.PI / 1, 0]} />}
                {character.model == 'Bone Fish' && <BoneFishModel rotation={[0, -Math.PI / 2, 0]} />} */}

                {/* <Text
                    color="black" position={[0, -0.7, 0]} scale={0.3} anchorX="center" anchorY="middle"
                >
                    Player ({character.model})
                </Text> */}

            </mesh>

        </group>
    )
}

export default Player