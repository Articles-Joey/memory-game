import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
    createOrbitCameraCollisionState,
    updateOrbitCameraCollision,
} from "./orbitCameraCollision";

export default function OrbitCameraObstruction({
    controlsRef,
    enabled = true,
    ...options
}) {
    const stateRef = useRef(null);
    const obstaclesRef = useRef([]);
    useEffect(() => {
        const state = createOrbitCameraCollisionState();
        stateRef.current = state;
        return () => {
            state.dispose();
            stateRef.current = null;
        };
    }, []);

    // Drei's OrbitControls runs at -1; correct its camera before the scene renders.
    useFrame(({ camera, scene }, delta) => {
        const controls = controlsRef.current;
        const state = stateRef.current;
        if (!state) return;
        if (!controls?.enabled) {
            state.controls = null;
            return;
        }
        const obstacles = obstaclesRef.current;
        obstacles.length = 0;
        if (enabled) {
            scene.updateMatrixWorld();
            scene.traverseVisible((object) => {
                if (object.isMesh && object.userData.cameraObstacle)
                    obstacles.push(object);
            });
        }
        updateOrbitCameraCollision(
            { camera, controls, obstacles, delta, enabled, ...options },
            state,
        );
    });

    return null;
}
