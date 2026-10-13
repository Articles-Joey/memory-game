import { useFrame } from "@react-three/fiber";
import {
    BallCollider,
    RigidBody,
    useAfterPhysicsStep,
} from "@react-three/rapier";
import { Suspense, useEffect, useRef } from "react";
import { Vector3 } from "three";
import { useKeyboard } from "@/hooks/useKeyboard";

import { Model as SpacesuitModel } from "@/components/Models/Spacesuit";
import ModelToonCharacter from "@/components/Models/ModelToonCharacter";

import { useControllerStore } from "@/hooks/useControllerStore";
import { useGameStore } from "@/hooks/useGameStore";
import useControlsStore from "@/hooks/useTouchControlsStore";
import { useSocketStore } from "@/hooks/useSocketStore";

import { degToRad } from "three/src/math/MathUtils.js";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";

const JUMP_FORCE = 0;
const SPEED = 12;
const PLAYER_BOUNDARY = 29;

function clampPlayerCoordinate(value) {
    return Math.max(-PLAYER_BOUNDARY, Math.min(PLAYER_BOUNDARY, value));
}

let lastLocation;

function myToFixed(i, digits) {
    var pow = Math.pow(10, digits);

    return Math.floor(i * pow) / pow;
}

function Player() {
    const searchParams = useSearchParams();
    const params = Object.fromEntries(searchParams.entries());
    const { server } = params;

    const {
        teleport,
        setTeleport,
        setPlayerLocation,
        maxHeight,
        setMaxHeight,
        shift,
        setShift,
        addDistance,
    } = useGameStore();

    const toontownMode = useStore((state) => state.toontownMode);

    const { touchControls, setTouchControls } = useControlsStore();

    const { socket } = useSocketStore();

    const { controllerState } = useControllerStore();
    const ref = useRef();

    // Attach event listeners when the component mounts
    useEffect(() => {
        if (
            ref.current &&
            controllerState.axes &&
            Math.abs(controllerState?.axes[0]) > 0.3
        ) {
            if (controllerState?.axes[0] > 0) {
                ref.current.setTranslation({ x: -1, y: 5, z: 0 }, true);
            } else {
                ref.current.setTranslation({ x: 1, y: 5, z: 0 }, true);
            }
        }
    }, [controllerState]);

    useEffect(() => {
        if (teleport && ref.current) {
            console.log("Teleport has been called!", teleport);
            ref.current.setTranslation(
                {
                    x: clampPlayerCoordinate(teleport[0]),
                    y: teleport[1],
                    z: clampPlayerCoordinate(teleport[2]),
                },
                true,
            );
            ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            setTeleport(false);
        }
    }, [teleport, setTeleport]);

    const {
        moveBackward,
        moveForward,
        moveRight,
        moveLeft,
        jump,
        shift: isShifting,
        crouch,
        lastMove,
    } = useKeyboard();

    const isWalking = Boolean(
        moveLeft ||
        moveRight ||
        moveBackward ||
        moveForward ||
        touchControls.left ||
        touchControls.right ||
        touchControls.up ||
        touchControls.down,
    );
    const action = isWalking ? "Walk" : "Idle";

    const vel = useRef([0, 0, 0]);
    const pos = useRef([0, 0, 0]);

    useEffect(() => {
        console.log("Shift", isShifting);
        setShift(isShifting);
    }, [isShifting, setShift]);

    // Correct every physics step so running or a long frame cannot cross the boundary.
    useAfterPhysicsStep(() => {
        const body = ref.current;
        if (!body) return;
        const translation = body.translation();
        const x = clampPlayerCoordinate(translation.x);
        const z = clampPlayerCoordinate(translation.z);
        if (x === translation.x && z === translation.z) return;

        const velocity = body.linvel();
        body.setTranslation({ x, y: translation.y, z }, true);
        body.setLinvel(
            {
                x: (translation.x - x) * velocity.x > 0 ? 0 : velocity.x,
                y: velocity.y,
                z: (translation.z - z) * velocity.z > 0 ? 0 : velocity.z,
            },
            true,
        );
    });

    useFrame(() => {
        const body = ref.current;
        if (!body) return;

        const translation = body.translation();
        const velocity = body.linvel();
        pos.current = [translation.x, translation.y, translation.z];
        vel.current = [velocity.x, velocity.y, velocity.z];

        addDistance(0.1);

        // if (cameraMode == "Player") {
        //     camera.position.copy(new Vector3(0, pos.current[1], (pos.current[2] + 10)))
        //     camera.lookAt(new Vector3(0, pos.current[1], (pos.current[2] + 5)))
        // }

        let posX = 0;
        if (pos.current[0]) {
            posX = myToFixed(pos.current[0], 2);
        }

        // console.log(pos.current[1])
        let posY = 0;
        if (pos.current[1]) {
            posY = myToFixed(pos.current[1], 2);
        }

        let posZ = 0;
        if (pos.current[2]) {
            posZ = myToFixed(pos.current[2], 2);
        }

        // console.log(posX)

        let newLocation = new Vector3(posX, posY, posZ);

        if (JSON.stringify(lastLocation) !== JSON.stringify(newLocation)) {
            // console.log(newLocation, lastLocation)
            setPlayerLocation(newLocation);

            if (socket) {
                socket.emit("game:memory-game:move", {
                    server: server,
                    x: newLocation.x,
                    // y: newLocation.y,
                    z: newLocation.z,
                    action: action,
                    rotation: [0, degToRad(lastMove), 0],
                });
            }

            lastLocation = newLocation;
        }
        // else {
        //     console.log("location unchanged")
        // }

        if (pos.current[1] > maxHeight) {
            setMaxHeight(pos.current[1].toFixed(2));
        }

        const direction = new Vector3();

        const frontVector = new Vector3(
            0,
            0,
            (moveForward || touchControls.up ? -1 : 0) -
                (moveBackward || touchControls.down ? -1 : 0),
        );

        const sideVector = new Vector3(
            (moveLeft || touchControls.left ? 1 : 0) -
                (moveRight || touchControls.right ? 1 : 0),
            0,
            0,
        );

        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(SPEED * (shift ? 2 : 1));
        // .applyEuler(camera.rotation)

        // Stop outward movement at -29/+29 while allowing movement along the edge.
        let nextVelX = direction.x;
        let nextVelZ = direction.z;

        if (pos.current[0] <= -PLAYER_BOUNDARY && nextVelX < 0) nextVelX = 0;
        if (pos.current[0] >= PLAYER_BOUNDARY && nextVelX > 0) nextVelX = 0;
        if (pos.current[2] <= -PLAYER_BOUNDARY && nextVelZ < 0) nextVelZ = 0;
        if (pos.current[2] >= PLAYER_BOUNDARY && nextVelZ > 0) nextVelZ = 0;

        body.setLinvel({ x: nextVelX, y: velocity.y, z: nextVelZ }, true);

        if ((jump || touchControls.jump) && Math.abs(vel.current[1]) < 0.05) {
            console.log("Jump understood");

            body.setLinvel({ x: nextVelX, y: JUMP_FORCE, z: nextVelZ }, true);

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
                });
            }
        }
    });

    return (
        <RigidBody
            ref={ref}
            position={[0, 1.1, 0]}
            colliders={false}
            enabledRotations={[false, false, false]}
            userData={{ isPlayer: true }}
            ccd
        >
            <BallCollider
                args={[0.2]}
                mass={1}
                friction={0}
                restitution={0}
            />

            <Suspense fallback={null}>
                {toontownMode ? (
                    <ModelToonCharacter
                        position={[0, -0.2, 0]}
                        action={action}
                        isWalking={isWalking}
                        isSprinting={isWalking && shift}
                        rotation={[0, degToRad(lastMove), 0]}
                        // scale={0.5}
                    />
                ) : (
                    <SpacesuitModel
                        brightness={0.35}
                        scale={3}
                        position={[0, -0.2, 0]}
                        action={action}
                        rotation={[0, degToRad(lastMove), 0]}
                    />
                )}
            </Suspense>
        </RigidBody>
    );
}

export default Player;
