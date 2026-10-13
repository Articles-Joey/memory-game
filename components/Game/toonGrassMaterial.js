import {
    CanvasTexture,
    Color,
    LinearFilter,
    LinearMipmapLinearFilter,
    MeshStandardMaterial,
    RepeatWrapping,
    SRGBColorSpace,
} from "three";
import createSeededRandom from "@/util/createSeededRandom";

// 0 = none, 0.5 = fewer, 1 = current density, 2 = roughly twice as many.
const sketchDensity = 3;

function createGrassSketchTexture() {
    const resolution = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = resolution;
    const context = canvas.getContext("2d");
    const random = createSeededRandom("toontown-grass-sketch-1");
    const density = Math.max(0, sketchDensity);
    const cells = Math.max(1, Math.ceil(10 * Math.sqrt(density)));
    // Increase the number of tufts without changing individual sketch sizes.
    const spawnChance = Math.min(1, (72 * density) / (cells * cells));
    const cellSize = resolution / cells;
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let row = 0; row < cells; row++) {
        for (let column = 0; column < cells; column++) {
            if (random() < 1 - spawnChance) continue;
            const x = (column + 0.15 + random() * 0.7) * cellSize;
            const y = (row + 0.15 + random() * 0.7) * cellSize;
            const angle = random() * Math.PI * 2;
            const tuftHeight = 22 + random() * 26;
            const tuftWidth = 18 + random() * 18;
            const lineWidth = 1.7 + random() * 1.2;
            const blades = Array.from(
                { length: 3 + Math.floor(random() * 3) },
                (_, index) => ({
                    spread:
                        (index - 2) * tuftWidth * 0.24 + (random() - 0.5) * 5,
                    height: tuftHeight * (0.6 + random() * 0.4),
                    bend: (random() - 0.5) * 10,
                }),
            );

            // Draw matching copies at the tile edges to keep the repeat seamless.
            for (const offsetX of [-resolution, 0, resolution]) {
                for (const offsetY of [-resolution, 0, resolution]) {
                    context.save();
                    context.translate(x + offsetX, y + offsetY);
                    context.rotate(angle);
                    context.lineWidth = lineWidth;
                    context.strokeStyle = "rgba(28, 76, 32, 0.8)";
                    for (const blade of blades) {
                        context.beginPath();
                        context.moveTo(blade.spread * 0.12, 0);
                        context.quadraticCurveTo(
                            blade.spread * 0.55 + blade.bend,
                            -blade.height * 0.55,
                            blade.spread,
                            -blade.height,
                        );
                        context.stroke();
                    }
                    // One lighter stroke keeps each tuft from becoming a dark stamp.
                    context.strokeStyle = "rgba(147, 183, 94, 0.7)";
                    context.lineWidth = lineWidth * 0.8;
                    context.beginPath();
                    context.moveTo(2, -2);
                    context.quadraticCurveTo(
                        7,
                        -tuftHeight * 0.45,
                        5,
                        -tuftHeight * 0.78,
                    );
                    context.stroke();
                    context.restore();
                }
            }
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.anisotropy = 8;
    return texture;
}

export function createToonGrassMaterial() {
    const sketchTexture = createGrassSketchTexture();

    const material = new MeshStandardMaterial({
        roughness: 1,
        metalness: 0,
        emissive: "#ffffff",
        emissiveIntensity: 0.18,
    });
    material.name = "toontown-grass";
    const uniforms = {
        // Generate the smooth grass source in the shader instead of sampling grass.png.
        toonGrassDark: { value: new Color("#2a8233") },
        toonGrassLight: { value: new Color("#3a9842") },
        toonGrassSketch: { value: sketchTexture },
        toonGrassSketchStrength: { value: 0.42 },
    };
    material.userData.sketchTexture = sketchTexture;
    material.userData.toonGrassUniforms = uniforms;

    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
            .replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                varying vec3 vToonGrassPosition;
            `,
            )
            .replace(
                "#include <begin_vertex>",
                /* glsl */ `
                #include <begin_vertex>
                vToonGrassPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
            `,
            );
        shader.fragmentShader = shader.fragmentShader
            .replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                varying vec3 vToonGrassPosition;
                uniform sampler2D toonGrassSketch;
                uniform float toonGrassSketchStrength;
                uniform vec3 toonGrassDark;
                uniform vec3 toonGrassLight;

                float toonGrassHash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                float toonGrassNoise(vec2 p) {
                    vec2 cell = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(toonGrassHash(cell), toonGrassHash(cell + vec2(1.0, 0.0)), f.x),
                        mix(toonGrassHash(cell + vec2(0.0, 1.0)), toonGrassHash(cell + vec2(1.0, 1.0)), f.x),
                        f.y
                    );
                }
            `,
            )
            .replace(
                "#include <color_fragment>",
                /* glsl */ `
                #include <color_fragment>
                vec2 groundPosition = vToonGrassPosition.xz;
                // Smooth painted color at two world-space scales, with no raster
                // base texture to become pixelated when the camera moves closer.
                float broadPatches = toonGrassNoise(groundPosition * 0.075);
                float softVariation = toonGrassNoise(groundPosition * 0.32);
                float shade = smoothstep(0.15, 0.85, broadPatches * 0.65 + softVariation * 0.35);
                vec3 grassSource = mix(toonGrassDark, toonGrassLight, shade);
                diffuseColor.rgb *= grassSource;

                // Two differently sized, rotated layers conceal the repeating tile.
                vec4 sketch = texture2D(toonGrassSketch, groundPosition / 16.0);
                vec4 secondarySketch = texture2D(toonGrassSketch, vec2(-groundPosition.y, groundPosition.x) / 27.0 + vec2(0.37, 0.61));
                float cameraDistance = length(vViewPosition);
                float detailFade = 1.0 - smoothstep(45.0, 130.0, cameraDistance);
                diffuseColor.rgb = mix(diffuseColor.rgb, sketch.rgb, sketch.a * toonGrassSketchStrength * detailFade);
                diffuseColor.rgb = mix(diffuseColor.rgb, secondarySketch.rgb, secondarySketch.a * toonGrassSketchStrength * 0.35 * detailFade);
            `,
            )
            .replace(
                "#include <emissivemap_fragment>",
                /* glsl */ `
                #include <emissivemap_fragment>
                // Tint the soft shadow fill with the generated grass and ink.
                totalEmissiveRadiance *= diffuseColor.rgb;
            `,
            );
    };
    material.customProgramCacheKey = () =>
        "memory-game-toontown-grass-procedural-sketch-v3";
    return material;
}
