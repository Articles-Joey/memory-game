import { memo, useEffect, useMemo } from "react";
import {
    BufferAttribute,
    BufferGeometry,
    Color,
    CylinderGeometry,
    DoubleSide,
    IcosahedronGeometry,
    Quaternion,
    Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import createSeededRandom from "@/util/createSeededRandom";
import { useStore } from "@/hooks/useStore";
import ToontownBillboard from "./ToontownBillboard";

export const BUSH_RADIUS = 1.6;
const LEAF_COLORS = ["#183b1d", "#1d4824", "#26552c", "#2c6032", "#315f31"];
const CORE_COLORS = ["#15351b", "#1b4020", "#224927", "#284f2c"];
const UP = new Vector3(0, 1, 0);

function colorGeometry(geometry, color) {
    geometry.deleteAttribute("uv");
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let index = 0; index < colors.length; index += 3) {
        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
    }
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return geometry;
}

function createLeafGeometry() {
    const geometry = new BufferGeometry();
    // A pointed leaf with a raised center vein and four angled surfaces.
    geometry.setAttribute(
        "position",
        new BufferAttribute(
            new Float32Array([
                0, 0, 0, -0.09, 0.12, 0, 0.09, 0.12, 0, 0, 0.135, 0.025, 0,
                0.28, 0,
            ]),
            3,
        ),
    );
    geometry.setIndex([0, 3, 1, 0, 2, 3, 1, 3, 4, 3, 2, 4]);
    const leaf = geometry.toNonIndexed();
    geometry.dispose();
    leaf.computeVertexNormals();
    return leaf;
}

function createBranch(start, end, radius) {
    const direction = new Vector3().subVectors(end, start);
    const indexed = new CylinderGeometry(
        radius * 0.55,
        radius,
        direction.length(),
        5,
    );
    const geometry = indexed.toNonIndexed();
    indexed.dispose();
    geometry.applyQuaternion(
        new Quaternion().setFromUnitVectors(UP, direction.normalize()),
    );
    geometry.translate(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2,
        (start.z + end.z) / 2,
    );
    return colorGeometry(geometry, new Color("#493823"));
}

function createBushGeometry(seed) {
    const random = createSeededRandom(seed);
    const parts = [];
    const lobes = [
        [0, 0.85, 0, 0.7],
        [-0.58, 0.52, 0.05, 0.5],
        [0.58, 0.52, -0.05, 0.5],
        [0.05, 0.52, -0.55, 0.5],
        [-0.05, 0.52, 0.55, 0.5],
    ];

    // Several short woody stems give the plant a shrub base rather than a tree trunk.
    parts.push(createBranch(new Vector3(0, 0, 0), new Vector3(0, 1, 0), 0.08));
    for (let index = 0; index < 7; index++) {
        const angle = (index / 7) * Math.PI * 2 + random() * 0.3;
        const reach = 0.45 + random() * 0.3;
        parts.push(
            createBranch(
                new Vector3(0, 0.08, 0),
                new Vector3(
                    Math.cos(angle) * reach,
                    0.55 + random() * 0.35,
                    Math.sin(angle) * reach,
                ),
                0.025 + random() * 0.015,
            ),
        );
    }

    // Dark, irregular foliage fills the interior behind the individual leaves.
    for (const [x, y, z, radius] of lobes) {
        const geometry = new IcosahedronGeometry(radius, 1);
        const positions = geometry.attributes.position;
        const phase = random() * Math.PI * 2;
        for (let index = 0; index < positions.count; index++) {
            const px = positions.getX(index);
            const py = positions.getY(index);
            const pz = positions.getZ(index);
            const irregularity =
                0.9 + Math.sin(px * 19 + py * 13 + pz * 17 + phase) * 0.08;
            positions.setXYZ(
                index,
                px * irregularity,
                py * irregularity * 0.85,
                pz * irregularity,
            );
        }
        geometry.rotateY(random() * Math.PI * 2);
        geometry.translate(x, y, z);
        geometry.computeVertexNormals();
        const color = new Color(
            CORE_COLORS[Math.floor(random() * CORE_COLORS.length)],
        );
        parts.push(colorGeometry(geometry, color));
    }

    const leafShape = createLeafGeometry();
    const alignment = new Quaternion();
    const twist = new Quaternion();
    const outward = new Vector3();
    const leafDirection = new Vector3();
    for (let index = 0; index < 400; index++) {
        const [x, y, z, radius] = lobes[index % lobes.length];
        const vertical = random() * 2 - 1;
        const angle = random() * Math.PI * 2;
        const horizontal = Math.sqrt(1 - vertical * vertical);
        outward.set(
            Math.cos(angle) * horizontal,
            vertical,
            Math.sin(angle) * horizontal,
        );
        leafDirection
            .set(outward.x, 0.65 + outward.y * 0.5, outward.z)
            .normalize();
        alignment.setFromUnitVectors(UP, leafDirection);
        twist.setFromAxisAngle(UP, random() * Math.PI * 2);
        const leaf = leafShape.clone();
        const size = 0.7 + random() * 0.4;
        leaf.scale(size * (0.8 + random() * 0.3), size, size);
        leaf.applyQuaternion(alignment.multiply(twist));
        leaf.translate(
            x + outward.x * radius * 0.95,
            y + outward.y * radius * 0.8,
            z + outward.z * radius * 0.95,
        );
        const color = new Color(
            LEAF_COLORS[Math.floor(random() * LEAF_COLORS.length)],
        );
        parts.push(colorGeometry(leaf, color));
    }
    leafShape.dispose();

    const geometry = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}

function ProceduralBush({ seed = 1, ...props }) {
    const geometry = useMemo(() => createBushGeometry(seed), [seed]);
    useEffect(() => () => geometry.dispose(), [geometry]);

    return (
        <mesh
            {...props}
            geometry={geometry}
            castShadow
            receiveShadow
        >
            <meshStandardMaterial
                vertexColors
                side={DoubleSide}
                roughness={0.95}
            />
        </mesh>
    );
}

function Bush({ seed = 1, ...props }) {
    const toontownMode = useStore((state) => state.toontownMode);
    return toontownMode ? (
        <ToontownBillboard
            {...props}
            name="toon-hedge"
            textureUrl="/img/toontown/hedge_oz.png"
            // Keep the hedge inside the footprint used by SceneryArea spacing.
            width={BUSH_RADIUS * 2}
        />
    ) : (
        <ProceduralBush
            seed={seed}
            {...props}
        />
    );
}

export default memo(Bush);
