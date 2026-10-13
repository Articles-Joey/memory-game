import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/hooks/useStore";

export function ModelToontownBetterSkybox({
    radius = 250,
    cloudsHeight = 175,
    skyDomeHeight = radius,
    y = cloudsHeight / 2,
    cloudRadius = radius - 2,
    segments = 96,
    cloudRotationSpeed = 0.0125,
    followCamera = false,
    skyTextureUrl = "/img/toontown/middaysky.jpg",
    cloudTextureUrl = "/img/toontown/toontown_central_clouds.png",
    ...props
}) {
    const rootRef = useRef();
    const cloudRingRef = useRef();
    const skySource = useTexture(skyTextureUrl);
    const cloudSource = useTexture(cloudTextureUrl);

    const darkMode = useStore((state) => state.darkMode);

    const brightness = darkMode ? 0.25 : 1;
    const horizonY = y - cloudsHeight / 2;
    // skyDomeHeight is the top Y coordinate in this group's local space.
    // Stretch only Y so the horizon and horizontal radius stay fixed.
    const domeScaleY = Math.max(0.01, skyDomeHeight - horizonY) / radius;

    // Clone the cached assets so the sky and clouds own their texture settings.
    const { skyTexture, cloudTexture } = useMemo(() => {
        const skyTexture = skySource.clone();
        skyTexture.colorSpace = THREE.SRGBColorSpace;
        skyTexture.wrapS = THREE.ClampToEdgeWrapping;
        skyTexture.wrapT = THREE.ClampToEdgeWrapping;
        skyTexture.flipY = true;
        skyTexture.needsUpdate = true;

        const cloudTexture = cloudSource.clone();
        cloudTexture.colorSpace = THREE.SRGBColorSpace;
        cloudTexture.wrapS = THREE.RepeatWrapping;
        cloudTexture.wrapT = THREE.RepeatWrapping;
        // The original box repeated the clouds twice across each of its four walls.
        cloudTexture.repeat.set(8, 1);
        cloudTexture.offset.set(0, 0);
        cloudTexture.flipY = false;
        cloudTexture.needsUpdate = true;

        return { skyTexture, cloudTexture };
    }, [skySource, cloudSource]);

    useEffect(
        () => () => {
            skyTexture.dispose();
            cloudTexture.dispose();
        },
        [skyTexture, cloudTexture],
    );

    useFrame(({ camera }, delta) => {
        if (followCamera && rootRef.current) {
            rootRef.current.position.x = camera.position.x;
            rootRef.current.position.z = camera.position.z;
        }

        if (cloudRingRef.current) {
            cloudRingRef.current.rotation.y += cloudRotationSpeed * delta;
        }
    });

    return (
        <group
            ref={rootRef}
            {...props}
        >
            <mesh
                // Place the hemisphere's horizon at the bottom of the cloud ring.
                position={[0, horizonY, 0]}
                scale={[1, domeScaleY, 1]}
                renderOrder={-100}
                frustumCulled={false}
            >
                <sphereGeometry
                    args={[
                        radius,
                        segments,
                        Math.max(16, Math.floor(segments / 2)),
                        0,
                        Math.PI * 2,
                        0,
                        Math.PI / 2,
                    ]}
                />
                {/* Join the transparent pass after the atmospheric Sky, before clouds/hills. */}
                <meshBasicMaterial
                    map={skyTexture}
                    color={[brightness, brightness, brightness]}
                    side={THREE.BackSide}
                    transparent
                    depthWrite={false}
                    fog={false}
                    toneMapped={false}
                />
            </mesh>

            <mesh
                ref={cloudRingRef}
                position={[0, y, 0]}
                rotation={[Math.PI, 0, 0]}
                renderOrder={-99}
                frustumCulled={false}
            >
                <cylinderGeometry
                    args={[
                        cloudRadius,
                        cloudRadius,
                        cloudsHeight,
                        segments,
                        1,
                        true,
                    ]}
                />
                <meshBasicMaterial
                    map={cloudTexture}
                    color={[brightness, brightness, brightness]}
                    transparent
                    opacity={0.35}
                    alphaTest={0.08}
                    side={THREE.BackSide}
                    depthWrite={false}
                    fog={false}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

useTexture.preload("/img/toontown/middaysky.jpg");
useTexture.preload("/img/toontown/toontown_central_clouds.png");
