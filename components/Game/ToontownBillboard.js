import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { DoubleSide, Vector3 } from "three";
import { useStore } from "@/hooks/useStore";

export default function ToontownBillboard({
    textureUrl,
    height,
    width,
    name = "toon-billboard",
    ...props
}) {
    const group = useRef();
    const texture = useTexture(textureUrl);
    const darkMode = useStore((state) => state.darkMode);
    const brightness = darkMode ? 0.35 : 1;
    const aspect = texture.image.width / texture.image.height;
    const imageHeight = height ?? (width === undefined ? 26 : width / aspect);
    const imageWidth = width ?? imageHeight * aspect;
    const points = useMemo(
        () => ({ camera: new Vector3(), image: new Vector3() }),
        [],
    );

    // Follow the latest OrbitControls position while keeping the image upright.
    useFrame(({ camera }) => {
        const root = group.current;
        if (!root) return;
        camera.getWorldPosition(points.camera);
        root.getWorldPosition(points.image);
        const dx = points.camera.x - points.image.x;
        const dz = points.camera.z - points.image.z;
        if (dx * dx + dz * dz < 1e-8) return;
        root.lookAt(points.camera.x, points.image.y, points.camera.z);
    }, -0.5);

    return (
        <group
            ref={group}
            {...props}
        >
            <mesh
                name={name}
                position={[0, imageHeight / 2, 0]}
                castShadow={false}
                receiveShadow={false}
            >
                <planeGeometry args={[imageWidth, imageHeight]} />
                <meshBasicMaterial
                    map={texture}
                    color={[brightness, brightness, brightness]}
                    side={DoubleSide}
                    alphaTest={0.5}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}
