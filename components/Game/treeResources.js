import {
    BufferAttribute,
    BufferGeometry,
    Color,
    MeshStandardMaterial,
} from "three";

const treeResources = new WeakMap();

// The original atlas places wood at V = 0.163–0.218 and foliage at
// V = 0.524–0.592. Split by this gap, rather than by height, because
// the trunk continues upward inside the foliage.
const WOOD_ATLAS_V_MAX = 0.35;

function extractGeometry(source, sourceIndices) {
    const geometry = new BufferGeometry();
    const vertices = [];
    const vertexMap = new Map();
    const indices = sourceIndices.map((sourceIndex) => {
        if (!vertexMap.has(sourceIndex)) {
            vertexMap.set(sourceIndex, vertices.length);
            vertices.push(sourceIndex);
        }
        return vertexMap.get(sourceIndex);
    });

    // Copy only used vertices, preserving the model's UVs and flat normals.
    for (const [name, attribute] of Object.entries(source.attributes)) {
        // getComponent decodes normalized attributes, so store those as floats.
        const ArrayType = attribute.normalized
            ? Float32Array
            : attribute.array.constructor;
        const values = new ArrayType(vertices.length * attribute.itemSize);
        vertices.forEach((sourceIndex, targetIndex) => {
            for (
                let component = 0;
                component < attribute.itemSize;
                component++
            ) {
                values[targetIndex * attribute.itemSize + component] =
                    attribute.getComponent(sourceIndex, component);
            }
        });
        geometry.setAttribute(
            name,
            new BufferAttribute(values, attribute.itemSize),
        );
    }
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}

export function splitTreeGeometry(source) {
    const uv = source.getAttribute("uv");
    if (!uv) throw new Error("The spruce tree needs its original atlas UVs.");

    const trunkIndices = [];
    const foliageIndices = [];
    const count = source.index?.count ?? source.getAttribute("position").count;
    for (let offset = 0; offset < count; offset += 3) {
        const triangle = [0, 1, 2].map(
            (corner) => source.index?.getX(offset + corner) ?? offset + corner,
        );
        const woodVertices = triangle.filter(
            (index) => uv.getY(index) < WOOD_ATLAS_V_MAX,
        ).length;
        if (woodVertices !== 0 && woodVertices !== 3) {
            throw new Error(
                "A tree triangle crosses the wood/foliage atlas boundary.",
            );
        }
        (woodVertices === 3 ? trunkIndices : foliageIndices).push(...triangle);
    }
    if (!trunkIndices.length || !foliageIndices.length) {
        throw new Error("The tree atlas must contain both wood and foliage.");
    }
    return {
        trunk: extractGeometry(source, trunkIndices),
        foliage: extractGeometry(source, foliageIndices),
    };
}

const treeShaderCommon = /* glsl */ `
    varying vec3 vTreePosition;
    varying vec3 vTreeNormal;

    float treeHash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    }

    float treeNoise(vec3 p) {
        vec3 cell = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(treeHash(cell), treeHash(cell + vec3(1, 0, 0)), f.x),
                mix(treeHash(cell + vec3(0, 1, 0)), treeHash(cell + vec3(1, 1, 0)), f.x), f.y),
            mix(mix(treeHash(cell + vec3(0, 0, 1)), treeHash(cell + vec3(1, 0, 1)), f.x),
                mix(treeHash(cell + vec3(0, 1, 1)), treeHash(cell + vec3(1, 1, 1)), f.x), f.y),
            f.z
        );
    }
`;

function createTreeMaterial(kind, geometry) {
    const bark = kind === "bark";
    const material = new MeshStandardMaterial({
        roughness: bark ? 0.98 : 0.94,
        metalness: 0,
        // A small fill keeps bark and canopy undersides readable in deep shadow.
        emissive: bark ? "#59412e" : "#36563a",
        emissiveIntensity: bark ? 0.06 : 0.22,
    });
    material.name = bark ? "tree-bark" : "tree-foliage";
    const uniforms = {
        treeDarkColor: { value: new Color(bark ? "#70513b" : "#2e6445") },
        treeLightColor: { value: new Color(bark ? "#a0825a" : "#71985b") },
        treeMinY: { value: geometry.boundingBox.min.y },
        treeHeight: {
            value: Math.max(
                geometry.boundingBox.max.y - geometry.boundingBox.min.y,
                0.001,
            ),
        },
    };
    material.userData.treeUniforms = uniforms;

    // Extend the standard shader to retain scene lights, shadows and tone mapping.
    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
            .replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                varying vec3 vTreePosition;
                varying vec3 vTreeNormal;
            `,
            )
            .replace(
                "#include <begin_vertex>",
                /* glsl */ `
                #include <begin_vertex>
                vTreePosition = position;
                vTreeNormal = normal;
            `,
            );
        shader.fragmentShader = shader.fragmentShader
            .replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                uniform vec3 treeDarkColor;
                uniform vec3 treeLightColor;
                uniform float treeMinY;
                uniform float treeHeight;
                ${treeShaderCommon}
            `,
            )
            .replace(
                "#include <color_fragment>",
                /* glsl */ `
                #include <color_fragment>
                ${
                    bark
                        ? /* glsl */ `
                    float broadGrain = treeNoise(vTreePosition * vec3(2.0, 0.28, 2.0));
                    // Uneven, elongated fibers avoid repeating dark zebra stripes.
                    vec3 grainPosition = vTreePosition;
                    grainPosition.xz += vec2(broadGrain - 0.5) * 0.12;
                    float fibers = treeNoise(grainPosition * vec3(11.0, 0.7, 11.0));
                    float detailFade = 1.0 - smoothstep(0.25, 1.0, length(fwidth(grainPosition * 11.0)));
                    float fissures = smoothstep(0.68, 0.88, fibers) * detailFade;
                    float woodShade = clamp(0.48 + broadGrain * 0.3 + (fibers - 0.5) * 0.16 * detailFade - fissures * 0.16, 0.0, 1.0);
                    float ringPhase = length(vTreePosition.xz) * 22.0 + broadGrain * 1.5;
                    float ringFade = 1.0 - smoothstep(0.5, 2.0, fwidth(ringPhase));
                    float rings = 0.62 + sin(ringPhase) * 0.065 * ringFade;
                    float endGrain = smoothstep(0.65, 0.95, abs(normalize(vTreeNormal).y));
                    diffuseColor.rgb *= mix(treeDarkColor, treeLightColor, mix(woodShade, rings, endGrain));
                `
                        : /* glsl */ `
                    float heightShade = clamp((vTreePosition.y - treeMinY) / treeHeight, 0.0, 1.0);
                    float branchClusters = treeNoise(vTreePosition * vec3(0.75, 1.1, 0.75));
                    // Follow the spruce's sloping tiers with fine, stretched needle clusters.
                    vec3 needlePosition = vTreePosition;
                    needlePosition.y += length(vTreePosition.xz) * 0.65;
                    float needles = treeNoise(needlePosition * vec3(13.0, 2.2, 13.0));
                    float detailFade = 1.0 - smoothstep(0.25, 1.0, length(fwidth(needlePosition * 13.0)));
                    float upwardFace = smoothstep(-0.2, 0.65, normalize(vTreeNormal).y);
                    float canopyShade = clamp(0.3 + heightShade * 0.28 + upwardFace * 0.12 + (branchClusters - 0.5) * 0.18, 0.0, 1.0);
                    diffuseColor.rgb *= mix(treeDarkColor, treeLightColor, canopyShade);
                    diffuseColor.rgb *= 1.0 + (needles - 0.5) * 0.16 * detailFade;
                `
                }
            `,
            );
    };
    material.customProgramCacheKey = () => `memory-game-tree-${kind}-v2`;
    return material;
}

export function getTreeResources(source) {
    if (!treeResources.has(source)) {
        const { trunk, foliage } = splitTreeGeometry(source);
        treeResources.set(source, {
            trunk,
            foliage,
            barkMaterial: createTreeMaterial("bark", trunk),
            foliageMaterial: createTreeMaterial("foliage", foliage),
        });
    }
    return treeResources.get(source);
}
