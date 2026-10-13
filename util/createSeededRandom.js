export default function createSeededRandom(seed) {
    const text = String(seed);
    let state = 2166136261;
    for (let index = 0; index < text.length; index++) {
        state = Math.imul(state ^ text.charCodeAt(index), 16777619);
    }

    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let value = Math.imul(state ^ (state >>> 15), state | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}
