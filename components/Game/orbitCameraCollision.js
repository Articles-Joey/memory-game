import {
    BufferGeometry,
    DoubleSide,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    Quaternion,
    Raycaster,
    Vector3,
} from "three";

export function createOrbitCameraCollisionState() {
    const geometry = new BufferGeometry();
    const material = new MeshBasicMaterial({ side: DoubleSide });
    return {
        camera: null,
        controls: null,
        desiredDistance: 0,
        appliedDistance: 0,
        direction: new Vector3(),
        desiredDirection: new Vector3(),
        appliedDirection: new Vector3(),
        inputRotation: new Quaternion(),
        right: new Vector3(),
        up: new Vector3(),
        origin: new Vector3(),
        sample: new Vector3(),
        raycaster: new Raycaster(),
        // A scratch mesh casts both sides without modifying visible tree materials.
        proxy: new Mesh(geometry, material),
        intersections: [],
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}

function terrainDistance(
    target,
    direction,
    distance,
    getHeight,
    clearance,
    sample,
) {
    if (!getHeight) return distance;
    const isClear = (along) => {
        sample.copy(target).addScaledVector(direction, along);
        return sample.y >= getHeight(sample.x, sample.z) + clearance;
    };

    // Scan outward so a hill between the target and camera also blocks the view.
    // Bound the sample count for very large user zoom distances.
    const steps = Math.min(1024, Math.max(1, Math.ceil(distance)));
    let previous = 0;
    for (let step = 1; step <= steps; step++) {
        const along = (distance * step) / steps;
        if (isClear(along)) {
            previous = along;
            continue;
        }
        let low = previous;
        let high = along;
        for (let iteration = 0; iteration < 12; iteration++) {
            const middle = (low + high) / 2;
            if (isClear(middle)) low = middle;
            else high = middle;
        }
        return low;
    }
    return distance;
}

const CAMERA_RAYS = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
];

export function findOrbitCameraDistance(
    {
        camera,
        target,
        direction,
        desiredDistance,
        obstacles,
        getTerrainHeight,
        groundClearance = 1.5,
        cameraRadius = 0.5,
        treePadding = 0.8,
    },
    state,
) {
    let safeDistance = desiredDistance;
    const { raycaster, proxy, intersections, origin, right, up } = state;
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    raycaster.near = 0.01;

    // Side rays give the camera some width, avoiding branches clipping its edges.
    for (const [horizontal, vertical] of CAMERA_RAYS) {
        origin
            .copy(target)
            .addScaledVector(right, horizontal * cameraRadius)
            .addScaledVector(up, vertical * cameraRadius);
        raycaster.set(origin, direction);
        raycaster.far = safeDistance + treePadding;
        intersections.length = 0;
        for (const obstacle of obstacles) {
            proxy.geometry = obstacle.geometry;
            proxy.matrixWorld.copy(obstacle.matrixWorld);
            proxy.raycast(raycaster, intersections);
        }
        for (const hit of intersections) {
            safeDistance = Math.max(
                0,
                Math.min(safeDistance, hit.distance - treePadding),
            );
        }
    }

    return terrainDistance(
        target,
        direction,
        safeDistance,
        getTerrainHeight,
        Math.max(groundClearance, cameraRadius),
        state.sample,
    );
}

export function updateOrbitCameraCollision(
    {
        camera,
        controls,
        obstacles,
        getTerrainHeight,
        delta,
        enabled = true,
        minDistance = 2,
        groundClearance = 1.5,
        cameraRadius = 0.5,
        treePadding = 0.8,
        moveInSpeed = 14,
        moveOutSpeed = 4,
    },
    state,
) {
    const target = controls.target;
    const currentDistance = camera.position.distanceTo(target);
    if (currentDistance < 1e-6) return;
    state.direction.subVectors(camera.position, target).normalize();

    if (state.camera !== camera || state.controls !== controls) {
        state.camera = camera;
        state.controls = controls;
        state.desiredDistance = currentDistance;
        state.appliedDistance = currentDistance;
        state.desiredDirection.copy(state.direction);
    } else if (state.appliedDistance > 1e-6) {
        // OrbitControls dolly input scales the current radius. Apply that same
        // change to the remembered unobstructed radius, excluding our animation.
        const zoomRatio = currentDistance / state.appliedDistance;
        if (Math.abs(zoomRatio - 1) > 1e-6) state.desiredDistance *= zoomRatio;
        // Preserve the user's orbit angle while a temporary ground correction
        // raises the camera. Only apply changes made since the last frame.
        state.inputRotation.setFromUnitVectors(
            state.appliedDirection,
            state.direction,
        );
        state.desiredDirection.applyQuaternion(state.inputRotation).normalize();
    }

    const minimum = Math.max(
        0.01,
        enabled ? minDistance : 0,
        controls.minDistance,
    );
    const maximum = Math.max(minimum, controls.maxDistance);
    state.desiredDistance = MathUtils.clamp(
        state.desiredDistance,
        minimum,
        maximum,
    );
    const safeDistance = enabled
        ? findOrbitCameraDistance(
              {
                  camera,
                  target,
                  direction: state.desiredDirection,
                  desiredDistance: state.desiredDistance,
                  obstacles,
                  getTerrainHeight,
                  groundClearance,
                  cameraRadius,
                  treePadding,
              },
              state,
          )
        : state.desiredDistance;
    const goal = Math.max(minimum, safeDistance);
    const speed = goal < currentDistance ? moveInSpeed : moveOutSpeed;
    const nextDistance = MathUtils.damp(
        currentDistance,
        goal,
        speed,
        Math.min(delta, 0.1),
    );
    camera.position
        .copy(target)
        .addScaledVector(state.desiredDirection, nextDistance);

    // A newly rotated camera must never dip into the terrain while easing in.
    if (enabled && getTerrainHeight) {
        camera.position.y = Math.max(
            camera.position.y,
            getTerrainHeight(camera.position.x, camera.position.z) +
                Math.max(groundClearance, cameraRadius),
        );
    }
    camera.lookAt(target);
    camera.updateMatrixWorld();
    state.appliedDistance = camera.position.distanceTo(target);
    state.appliedDirection.subVectors(camera.position, target).normalize();
}
