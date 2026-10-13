import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { FrontSide } from "three";
import { useStore } from "@/hooks/useStore";
import {
    HILL_LAYERS,
    createHillsVistaUniforms,
    hillsVistaVertexShader,
    hillsVistaFragmentShader,
} from "./hillsVistaShader";

// EDIT HILL DISTANCES HERE (world units from the scene center).
// These four rings are used when toontownMode is false. The sky follows the largest radius.
export const HILL_RING_RADII = {
    foreground: 200,
    meadow: 250,
    ridge: 300,
    distance: 350,
};

// Radians per second: nearer hills move faster. Use 0 to stop a layer, or a negative value to reverse it.
const HILL_RING_ROTATION_SPEEDS_BASE = 0.03;
export const HILL_RING_ROTATION_SPEEDS = {
    foreground: HILL_RING_ROTATION_SPEEDS_BASE * 1.2,
    meadow: HILL_RING_ROTATION_SPEEDS_BASE * 0.8,
    ridge: HILL_RING_ROTATION_SPEEDS_BASE * 0.5,
    distance: HILL_RING_ROTATION_SPEEDS_BASE * 0.2,
};

// Toontown mode uses the original, single image ring instead.
export const TOONTOWN_HILL_RADIUS = 170;

function ImageHillsRing({ segments = 8, imageHeight = 10, radius = 30 }) {
    const images = [
        "/img/toontown/BG5_1.png",
        "/img/toontown/BG5_2.png",
        "/img/toontown/BG5_3.png",
    ];

    const textures = useTexture(images);

    // Auto-calculate width to fit the segment size of the circle's circumference
    // (circumference / segments) * a small overlap factor (1.05) to prevent gaps
    const segmentWidth = ((2 * Math.PI * radius) / segments) * 1.1;

    return (
        <group>
            {[...Array(segments)].map((_, index) => {
                const texture = textures[index % textures.length];
                const angle = (index / segments) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                // Draw the transparent backdrop before trees, regardless of camera angle.
                return (
                    <mesh
                        key={index}
                        position={[x, imageHeight / 2, z]}
                        rotation={[0, -angle - Math.PI / 2, 0]}
                        renderOrder={-1}
                    >
                        <planeGeometry args={[segmentWidth, imageHeight]} />
                        <meshBasicMaterial
                            map={texture}
                            transparent={true}
                            side={FrontSide}
                            depthWrite={false}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

function ShaderHillsRing({
    segments = 40,
    imageHeight = 10,
    layerRadii = HILL_RING_RADII,
    layerHeightGrowth = 0.16,
    autoRotate = false,
    rotationSpeeds = HILL_RING_ROTATION_SPEEDS,
}) {
    const ringRefs = useRef({});
    const darkMode = useStore((state) => state.darkMode);
    const panelCount = Math.max(5, Math.floor(segments));
    const buriedFraction = 0.08;

    useFrame((_, delta) => {
        // Pausing preserves each ring's angle so toggling back on resumes smoothly.
        if (!autoRotate) return;
        const step = Math.min(delta, 0.2);
        for (const { name } of HILL_LAYERS) {
            const group = ringRefs.current[name];
            if (!group) continue;
            const speed =
                rotationSpeeds[name] ?? HILL_RING_ROTATION_SPEEDS[name];
            group.rotation.y =
                (group.rotation.y + speed * step) % (Math.PI * 2);
        }
    });

    // Sort by actual distance so independent radius edits preserve transparency ordering.
    const rings = useMemo(
        () =>
            HILL_LAYERS.map((layer, layerIndex) => {
                const layerRadius =
                    layerRadii[layer.name] ?? HILL_RING_RADII[layer.name];
                const layerHeight =
                    imageHeight * (1 + layerIndex * layerHeightGrowth);
                const vistaUniforms = createHillsVistaUniforms(layer, darkMode);

                return {
                    name: layer.name,
                    radius: layerRadius,
                    height: layerHeight * (1 + buriedFraction),
                    // Tangent planes meet at their corners, with a tiny raster overlap.
                    width:
                        2 *
                        layerRadius *
                        Math.tan(Math.PI / panelCount) *
                        1.001,
                    panels: Array.from({ length: panelCount }, (_, index) => {
                        const angle = (index / panelCount) * Math.PI * 2;

                        return {
                            angle,
                            position: [
                                Math.cos(angle) * layerRadius,
                                (layerHeight * (1 - buriedFraction)) / 2,
                                Math.sin(angle) * layerRadius,
                            ],
                            uniforms: {
                                ...vistaUniforms,
                                uPanelAngle: { value: angle },
                                uRadius: { value: layerRadius },
                                uBuriedFraction: { value: buriedFraction },
                            },
                        };
                    }),
                };
            }).sort((a, b) => b.radius - a.radius),
        [panelCount, layerRadii, imageHeight, layerHeightGrowth, darkMode],
    );

    return (
        <group>
            {rings.map((ring, ringIndex) => (
                <group
                    key={ring.name}
                    name={`hills-${ring.name}`}
                    ref={(group) => {
                        ringRefs.current[ring.name] = group;
                    }}
                >
                    {ring.panels.map((panel, index) => (
                        <mesh
                            key={index}
                            position={panel.position}
                            rotation={[0, -panel.angle - Math.PI / 2, 0]}
                            renderOrder={ringIndex - rings.length}
                        >
                            <planeGeometry args={[ring.width, ring.height]} />
                            <shaderMaterial
                                uniforms={panel.uniforms}
                                vertexShader={hillsVistaVertexShader}
                                fragmentShader={hillsVistaFragmentShader}
                                transparent
                                side={FrontSide}
                                depthWrite={false}
                                toneMapped={false}
                            />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

export default function HillsImageRing({
    toontownRadius = TOONTOWN_HILL_RADIUS,
    ...props
}) {
    const toontownMode = useStore((state) => state.toontownMode);

    return toontownMode ? (
        <ImageHillsRing
            {...props}
            radius={toontownRadius}
        />
    ) : (
        <ShaderHillsRing {...props} />
    );
}
