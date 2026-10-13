import { useCallback, useEffect, useRef, useState } from "react";

function getMoveAngle(moveForward, moveBackward, moveRight, moveLeft) {
    if (moveForward && moveRight) return 135;
    if (moveForward && moveLeft) return 225;
    if (moveBackward && moveRight) return 45;
    if (moveBackward && moveLeft) return -45;
    if (moveRight) return 90;
    if (moveLeft) return -90;
    if (moveForward) return 180;
    if (moveBackward) return 0;
    return null;
}

function actionByKey(key) {
    const keyActionMap = {
        KeyW: "moveForward",
        KeyS: "moveBackward",
        KeyA: "moveLeft",
        KeyD: "moveRight",
        ArrowUp: "moveForward",
        ArrowDown: "moveBackward",
        ArrowLeft: "moveLeft",
        ArrowRight: "moveRight",
        Space: "jump",
        ShiftLeft: "shift",
        KeyC: "crouch",
        KeyV: "cameraView",
        Digit1: "dirt",
        Digit2: "grass",
        Digit3: "glass",
        Digit4: "wood",
        Digit5: "log",
    };
    return keyActionMap[key];
}

export const useKeyboard = () => {
    const pressedKeys = useRef(new Set());
    const [actions, setActions] = useState({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        lastMove: 0,
        jump: false,
        shift: false,
        crouch: false,
        cameraView: false,
        dirt: false,
        grass: false,
        glass: false,
        wood: false,
        log: false,
    });

    const handleKeyDown = useCallback((e) => {
        const action = actionByKey(e.code);
        if (action) {
            if (e.code.startsWith("Arrow")) e.preventDefault();
            pressedKeys.current.add(e.code);
            setActions((prev) => {
                const next = {
                    ...prev,
                    [action]: true,
                };
                const lastMove = getMoveAngle(
                    next.moveForward,
                    next.moveBackward,
                    next.moveRight,
                    next.moveLeft,
                );

                return lastMove === null ? next : { ...next, lastMove };
            });
        }
    }, []);

    const handleKeyUp = useCallback((e) => {
        const action = actionByKey(e.code);
        if (action) {
            pressedKeys.current.delete(e.code);
            const stillPressed = [...pressedKeys.current].some(
                (code) => actionByKey(code) === action,
            );
            setActions((prev) => {
                const next = {
                    ...prev,
                    [action]: stillPressed,
                };
                const lastMove = getMoveAngle(
                    next.moveForward,
                    next.moveBackward,
                    next.moveRight,
                    next.moveLeft,
                );

                return lastMove === null ? next : { ...next, lastMove };
            });
        }
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return actions;
};
