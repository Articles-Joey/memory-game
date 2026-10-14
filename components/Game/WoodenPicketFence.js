import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
    BoxGeometry,
    ConeGeometry,
    DataTexture,
    ExtrudeGeometry,
    LinearFilter,
    LinearMipmapLinearFilter,
    MeshStandardMaterial,
    Object3D,
    RepeatWrapping,
    RGBAFormat,
    Shape,
    SRGBColorSpace,
} from "three";

const POST_WIDTH = 0.42;
const PICKET_WIDTH = 0.28;
const PICKET_DEPTH = 0.1;
const RAIL_HEIGHT = 0.16;
const RAIL_DEPTH = 0.14;
const CAP_HEIGHT = 0.18;

function createWoodTexture() {
    const width = 128;
    const height = 512;
    const pixels = new Uint8Array(width * height * 4);
    const knots = [
        [0.28, 0.32],
        [0.72, 0.76],
    ];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const u = x / width;
            const v = y / height;
            const flow =
                u * 42 + Math.sin(v * 10 + u * 5) * 0.7 + Math.sin(v * 3) * 1.6;
            let grain =
                Math.sin(flow * Math.PI * 2) * 0.035 +
                Math.sin(flow * 17.9) * 0.016;

            for (const [knotX, knotY] of knots) {
                const radiusSquared =
                    (u - knotX) ** 2 * 10 + (v - knotY) ** 2 * 130;
                grain +=
                    Math.sin(Math.sqrt(radiusSquared) * 28) *
                    Math.exp(-radiusSquared * 2) *
                    0.075;
                grain -= Math.exp(-radiusSquared * 60) * 0.14;
            }

            const noise = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
            grain += noise * 0.012;
            const offset = (y * width + x) * 4;
            pixels[offset] = Math.round((0.66 + grain) * 255);
            pixels[offset + 1] = Math.round((0.43 + grain * 0.8) * 255);
            pixels[offset + 2] = Math.round((0.23 + grain * 0.5) * 255);
            pixels[offset + 3] = 255;
        }
    }

    const texture = new DataTexture(pixels, width, height, RGBAFormat);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

function createWoodMaterial(texture) {
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.9 });
    material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            "#include <uv_vertex>",
            `#include <uv_vertex>
            #if defined(USE_MAP) && defined(USE_INSTANCING)
                // Each plank's position seeds a stable texture rotation and offset.
                float woodSeed = dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719));
                vec3 woodRandom = fract(sin(vec3(woodSeed, woodSeed + 17.0, woodSeed + 43.0)) * 43758.5453);
                float woodAngle = woodRandom.x * 6.28318530718;
                float woodCos = cos(woodAngle);
                float woodSin = sin(woodAngle);
                vMapUv = mat2(woodCos, woodSin, -woodSin, woodCos)
                    * (vMapUv - vec2(0.5)) + vec2(0.5) + woodRandom.yz;
            #endif`,
        );
    };
    material.customProgramCacheKey = () => "wooden-picket-fence-random-uv-v1";
    return material;
}

function createPicketGeometry(height) {
    const halfWidth = PICKET_WIDTH / 2;
    const shoulderHeight = height - PICKET_WIDTH * 0.65;
    const shape = new Shape();
    shape.moveTo(-halfWidth, 0);
    shape.lineTo(halfWidth, 0);
    shape.lineTo(halfWidth, shoulderHeight);
    shape.lineTo(0, height);
    shape.lineTo(-halfWidth, shoulderHeight);
    shape.closePath();

    const geometry = new ExtrudeGeometry(shape, {
        depth: PICKET_DEPTH,
        bevelEnabled: false,
        steps: 1,
    });
    geometry.translate(0, 0, -PICKET_DEPTH / 2);
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    const uvs = geometry.getAttribute("uv");
    for (let index = 0; index < positions.count; index++) {
        const u =
            Math.abs(normals.getZ(index)) > 0.5
                ? (positions.getX(index) + halfWidth) / PICKET_WIDTH
                : (positions.getZ(index) + PICKET_DEPTH / 2) / PICKET_DEPTH;
        uvs.setXY(index, u, positions.getY(index) / height);
    }
    uvs.needsUpdate = true;
    return geometry;
}

function FenceInstances({ geometry, material, transforms }) {
    const ref = useRef();

    useLayoutEffect(() => {
        const mesh = ref.current;
        if (!mesh) return;
        const dummy = new Object3D();

        transforms.forEach(
            (
                { position, rotation = 0, tilt = 0, scale = [1, 1, 1] },
                index,
            ) => {
                dummy.position.set(...position);
                dummy.rotation.set(0, rotation, tilt);
                dummy.scale.set(...scale);
                dummy.updateMatrix();
                mesh.setMatrixAt(index, dummy.matrix);
            },
        );

        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
    }, [geometry, material, transforms]);

    // Shared geometry/materials belong to the fence; each mesh owns its instance buffers.
    useEffect(() => {
        const mesh = ref.current;
        return () => mesh?.dispose();
    }, [geometry, material, transforms.length]);

    return (
        <instancedMesh
            ref={ref}
            args={[geometry, material, transforms.length]}
            castShadow
            receiveShadow
            dispose={null}
        />
    );
}

export default function WoodenPicketFence({
    shape = "square",
    size = 60,
    radius = 25,
    segments,
    segmentWidth = 6,
    height = 4,
    picketSpacing = 0.45,
    position = [0, 0.25, 0],
    getTerrainHeight,
}) {
    const [offsetX, offsetY, offsetZ] = position;
    const resources = useMemo(() => {
        const texture = createWoodTexture();
        const railTexture = texture.clone();
        railTexture.center.set(0.5, 0.5);
        railTexture.rotation = Math.PI / 2;
        railTexture.repeat.set(1, 3);
        railTexture.needsUpdate = true;

        return {
            texture,
            railTexture,
            wood: createWoodMaterial(texture),
            railWood: createWoodMaterial(railTexture),
            picket: createPicketGeometry(height),
            box: new BoxGeometry(1, 1, 1),
            cap: new ConeGeometry(POST_WIDTH / Math.sqrt(2), CAP_HEIGHT, 4),
        };
    }, [height]);

    useEffect(
        () => () => {
            Object.values(resources).forEach((resource) => resource.dispose());
        },
        [resources],
    );

    const layout = useMemo(() => {
        const pickets = [];
        const rails = [];
        const posts = [];
        const caps = [];
        if (
            !Number.isFinite(segmentWidth) ||
            segmentWidth <= POST_WIDTH ||
            !Number.isFinite(picketSpacing) ||
            picketSpacing <= PICKET_WIDTH
        ) {
            return { pickets, rails, posts, caps };
        }

        const panels = [];
        if (shape === "circle") {
            if (
                !Number.isFinite(radius) ||
                radius <= POST_WIDTH ||
                (segments !== undefined &&
                    (!Number.isFinite(segments) || segments < 3))
            ) {
                return { pickets, rails, posts, caps };
            }

            const circumference = 2 * Math.PI * radius;
            const panelCount = Math.max(
                3,
                Math.min(
                    Math.floor(
                        segments ?? Math.ceil(circumference / segmentWidth),
                    ),
                    Math.floor(circumference / (POST_WIDTH * 2)),
                ),
            );

            for (let index = 0; index < panelCount; index++) {
                const angle = (index / panelCount) * Math.PI * 2;
                const endAngle =
                    (((index + 1) % panelCount) / panelCount) * Math.PI * 2;
                const start = [
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                ];
                const end = [
                    Math.cos(endAngle) * radius,
                    Math.sin(endAngle) * radius,
                ];
                const dx = end[0] - start[0];
                const dz = end[1] - start[1];
                const length = Math.hypot(dx, dz);

                // Chords share their end posts, closing the ring without overlapping panels.
                panels.push({
                    start,
                    direction: [dx / length, dz / length],
                    length,
                    rotation: Math.atan2(dz, -dx),
                    postRotation: Math.PI / 2 - angle,
                });
            }
        } else {
            if (!Number.isFinite(size) || size <= POST_WIDTH * 2) {
                return { pickets, rails, posts, caps };
            }

            // Preserve the original square layout and exact panel lengths.
            const segmentsPerSide = Math.min(
                Math.ceil(size / segmentWidth),
                Math.floor(size / (POST_WIDTH * 2)),
            );
            const length = size / segmentsPerSide;
            const halfSize = size / 2;
            const sides = [
                {
                    start: [-halfSize, -halfSize],
                    direction: [1, 0],
                    rotation: Math.PI,
                },
                {
                    start: [halfSize, -halfSize],
                    direction: [0, 1],
                    rotation: Math.PI / 2,
                },
                {
                    start: [halfSize, halfSize],
                    direction: [-1, 0],
                    rotation: 0,
                },
                {
                    start: [-halfSize, halfSize],
                    direction: [0, -1],
                    rotation: -Math.PI / 2,
                },
            ];
            sides.forEach(({ start, direction, rotation }) => {
                for (let segment = 0; segment < segmentsPerSide; segment++) {
                    panels.push({
                        start: [
                            start[0] + direction[0] * segment * length,
                            start[1] + direction[1] * segment * length,
                        ],
                        direction,
                        length,
                        rotation,
                        postRotation: 0,
                    });
                }
            });
        }

        // Terrain samples are world heights; instance transforms are local to the fence group.
        const groundAt = (x, z) =>
            getTerrainHeight
                ? getTerrainHeight(x + offsetX, z + offsetZ) - offsetY - 0.05
                : 0;
        const postHeight = height + 0.25;

        panels.forEach(
            ({ start, direction, length, rotation, postRotation }) => {
                const [postX, postZ] = start;
                const startGround = groundAt(postX, postZ);
                const endGround = groundAt(
                    postX + direction[0] * length,
                    postZ + direction[1] * length,
                );
                const clearLength = length - POST_WIDTH;
                const picketsPerSegment = Math.max(
                    1,
                    Math.floor(clearLength / picketSpacing),
                );
                const pitch = clearLength / picketsPerSegment;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);

                // Each panel owns its starting post; the next panel supplies the ending post.
                posts.push({
                    position: [postX, startGround + postHeight / 2, postZ],
                    rotation: postRotation,
                    scale: [POST_WIDTH, postHeight, POST_WIDTH],
                });
                caps.push({
                    position: [
                        postX,
                        startGround + postHeight + CAP_HEIGHT / 2,
                        postZ,
                    ],
                    rotation: postRotation + Math.PI / 4,
                });

                const centerX = postX + (direction[0] * length) / 2;
                const centerZ = postZ + (direction[1] * length) / 2;
                for (let picket = 0; picket < picketsPerSegment; picket++) {
                    const localX = -clearLength / 2 + (picket + 0.5) * pitch;
                    const x = centerX + cos * localX;
                    const z = centerZ - sin * localX;
                    pickets.push({
                        position: [x, groundAt(x, z), z],
                        rotation,
                    });
                }

                // Rails stay behind the pickets and slope between the two post bases.
                const railOffset = -(PICKET_DEPTH + RAIL_DEPTH) / 2;
                const tilt = Math.atan2(startGround - endGround, length);
                for (const railY of [height * 0.3, height * 0.7]) {
                    rails.push({
                        position: [
                            centerX + sin * railOffset,
                            (startGround + endGround) / 2 + railY,
                            centerZ + cos * railOffset,
                        ],
                        rotation,
                        tilt,
                        scale: [
                            clearLength / Math.cos(tilt),
                            RAIL_HEIGHT,
                            RAIL_DEPTH,
                        ],
                    });
                }
            },
        );

        return { pickets, rails, posts, caps };
    }, [
        shape,
        size,
        radius,
        segments,
        segmentWidth,
        height,
        picketSpacing,
        getTerrainHeight,
        offsetX,
        offsetY,
        offsetZ,
    ]);

    if (layout.posts.length === 0) return null;

    // Repeat the panel shapes with instancing so the entire fence takes four draw calls.
    return (
        <group position={position}>
            <FenceInstances
                geometry={resources.picket}
                material={resources.wood}
                transforms={layout.pickets}
            />
            <FenceInstances
                geometry={resources.box}
                material={resources.railWood}
                transforms={layout.rails}
            />
            <FenceInstances
                geometry={resources.box}
                material={resources.wood}
                transforms={layout.posts}
            />
            <FenceInstances
                geometry={resources.cap}
                material={resources.wood}
                transforms={layout.caps}
            />
        </group>
    );
}
