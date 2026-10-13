import {
    DataTexture,
    LinearFilter,
    LinearMipmapLinearFilter,
    NoColorSpace,
    RepeatWrapping,
    RGBAFormat,
    SRGBColorSpace,
} from "three";
import createSeededRandom from "@/util/createSeededRandom";

function hash(x, y, salt) {
    let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ salt;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function tileNoise(u, v, frequency, salt) {
    const x = u * frequency;
    const y = v * frequency;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const tx = x - ix;
    const ty = y - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = hash(ix % frequency, iy % frequency, salt);
    const b = hash((ix + 1) % frequency, iy % frequency, salt);
    const c = hash(ix % frequency, (iy + 1) % frequency, salt);
    const d = hash((ix + 1) % frequency, (iy + 1) % frequency, salt);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

function makeTexture(pixels, size, colorSpace) {
    const texture = new DataTexture(pixels, size, size, RGBAFormat);
    texture.colorSpace = colorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
    return texture;
}

export default function createStoneTextures(seed) {
    const size = 128;
    const random = createSeededRandom(`${seed}:stone`);
    const salts = Array.from({ length: 4 }, () =>
        Math.floor(random() * 4294967295),
    );
    const colorPixels = new Uint8Array(size * size * 4);
    const bumpPixels = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size;
            const v = y / size;
            const broad = tileNoise(u, v, 4, salts[0]);
            const grain = tileNoise(u, v, 20, salts[1]);
            const fine = tileNoise(u, v, 48, salts[2]);
            const grit = hash(x, y, salts[3]);
            const vein = Math.abs(
                Math.sin((u * 3 + v * 2 + broad * 0.3) * Math.PI * 2),
            );
            const fissure = Math.max(0, 1 - vein / 0.055);
            const mineral = grit > 0.92 ? 0.1 : grit < 0.08 ? -0.09 : 0;
            const tone = Math.max(
                0,
                Math.min(
                    1,
                    0.48 +
                        broad * 0.22 +
                        grain * 0.12 +
                        fine * 0.08 +
                        mineral -
                        fissure * 0.11,
                ),
            );
            const relief = Math.max(
                0,
                Math.min(
                    1,
                    broad * 0.2 +
                        grain * 0.4 +
                        fine * 0.25 +
                        grit * 0.15 -
                        fissure * 0.12,
                ),
            );
            const offset = (y * size + x) * 4;
            colorPixels[offset] = Math.round(tone * 255);
            colorPixels[offset + 1] = Math.round(tone * 0.99 * 255);
            colorPixels[offset + 2] = Math.round(tone * 0.96 * 255);
            colorPixels[offset + 3] = 255;
            const height = Math.round(relief * 255);
            bumpPixels[offset] = height;
            bumpPixels[offset + 1] = height;
            bumpPixels[offset + 2] = height;
            bumpPixels[offset + 3] = 255;
        }
    }

    return {
        map: makeTexture(colorPixels, size, SRGBColorSpace),
        bumpMap: makeTexture(bumpPixels, size, NoColorSpace),
    };
}
