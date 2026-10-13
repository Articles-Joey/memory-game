import { PlaneGeometry } from "three";
import createSeededRandom from "@/util/createSeededRandom";

export const TERRAIN_CELL_SIZE = 3;

function smoothstep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}

export function createTerrain({
    seed = "memory-hills-1",
    groundHeight = 0.25,
    flatRadius = 30,
    transitionWidth = 18,
    hillHeight = 1.4,
    flatBounds = null,
} = {}) {
    const random = createSeededRandom(seed);
    const phases = Array.from({ length: 4 }, () => random() * Math.PI * 2);

    const sampleHeight = (x, z) => {
        const distance = Math.hypot(x, z);
        if (distance <= flatRadius) return groundHeight;
        let blend = smoothstep((distance - flatRadius) / transitionWidth);

        // Keep the whole board and inner fence level, including the square's corners.
        if (flatBounds) {
            // Pad by one grid cell so triangles crossing the fence cannot tilt its interior.
            const dx = Math.max(
                flatBounds.minX - x - TERRAIN_CELL_SIZE,
                0,
                x - flatBounds.maxX - TERRAIN_CELL_SIZE,
            );
            const dz = Math.max(
                flatBounds.minZ - z - TERRAIN_CELL_SIZE,
                0,
                z - flatBounds.maxZ - TERRAIN_CELL_SIZE,
            );
            blend *= smoothstep(Math.hypot(dx, dz) / 10);
        }

        const hills =
            Math.sin(x * 0.055 + phases[0]) *
                Math.cos(z * 0.043 + phases[1]) *
                0.55 +
            Math.sin((x + z) * 0.08 + phases[2]) * 0.3 +
            Math.cos((x - z) * 0.12 + phases[3]) * 0.15;
        return groundHeight + hills * hillHeight * blend;
    };

    // Sample the same triangles as PlaneGeometry, so scenery and collision agree
    // with the rendered surface rather than an approximation of the hill function.
    const getHeight = (x, z) => {
        const x0 = Math.floor(x / TERRAIN_CELL_SIZE) * TERRAIN_CELL_SIZE;
        const z0 = Math.floor(z / TERRAIN_CELL_SIZE) * TERRAIN_CELL_SIZE;
        const u = (x - x0) / TERRAIN_CELL_SIZE;
        const v = (z - z0) / TERRAIN_CELL_SIZE;
        const b = sampleHeight(x0, z0 + TERRAIN_CELL_SIZE);
        const d = sampleHeight(x0 + TERRAIN_CELL_SIZE, z0);
        if (u + v <= 1) {
            const a = sampleHeight(x0, z0);
            return a + (d - a) * u + (b - a) * v;
        }
        const c = sampleHeight(x0 + TERRAIN_CELL_SIZE, z0 + TERRAIN_CELL_SIZE);
        return c + (b - c) * (1 - u) + (d - c) * (1 - v);
    };

    return { getHeight, groundHeight };
}

export const DEFAULT_TERRAIN = createTerrain();

export function createTerrainGeometry(
    size,
    terrain,
    { circular = false } = {},
) {
    // Even segment counts align the vertex grid with world zero at every quality.
    const segments = Math.max(2, Math.ceil(size / (TERRAIN_CELL_SIZE * 2)) * 2);
    const alignedSize = segments * TERRAIN_CELL_SIZE;
    const geometry = new PlaneGeometry(
        alignedSize,
        alignedSize,
        segments,
        segments,
    );
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    const insideCircle = circular ? new Uint8Array(positions.count) : null;
    const radius = size / 2;
    for (let index = 0; index < positions.count; index++) {
        let x = positions.getX(index);
        let z = positions.getZ(index);
        if (circular) {
            const distance = Math.hypot(x, z);
            insideCircle[index] = distance <= radius ? 1 : 0;
            if (distance > radius) {
                // Bring boundary vertices onto the circle, keeping the interior grid intact.
                x *= radius / distance;
                z *= radius / distance;
            }
            // Preserve the texture's world-space scale along the trimmed edge.
            uvs.setXY(index, x / alignedSize + 0.5, 0.5 - z / alignedSize);
        }
        positions.setXYZ(index, x, terrain.getHeight(x, z), z);
    }
    if (circular) {
        const sourceIndices = geometry.index.array;
        const indices = [];
        for (let index = 0; index < sourceIndices.length; index += 3) {
            const a = sourceIndices[index];
            const b = sourceIndices[index + 1];
            const c = sourceIndices[index + 2];
            // Discard exterior triangles so projected corners cannot overlap the rim.
            if (insideCircle[a] || insideCircle[b] || insideCircle[c]) {
                indices.push(a, b, c);
            }
        }
        geometry.setIndex(indices);
        uvs.needsUpdate = true;
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}
