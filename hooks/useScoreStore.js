import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function isResult(result) {
    return (
        result &&
        typeof result === "object" &&
        Number.isFinite(result.time) &&
        result.time >= 0 &&
        Number.isFinite(result.flips) &&
        result.flips >= 0
    );
}

function bestFive(entries, metric) {
    const otherMetric = metric === "flips" ? "time" : "flips";
    return (Array.isArray(entries) ? entries : [])
        .filter((entry) => isResult(entry) && entry.completed !== false)
        .slice()
        .sort(
            (a, b) => a[metric] - b[metric] || a[otherMetric] - b[otherMetric],
        )
        .slice(0, 5);
}

function appendResult(entries, result) {
    const current = Array.isArray(entries) ? entries : [];
    return result.id && current.some((entry) => entry?.id === result.id)
        ? current
        : [...current, result];
}

function sameEntries(a, b) {
    return (
        a.length === b.length && a.every((entry, index) => entry === b[index])
    );
}

export const useScoreStore = create()(
    persist(
        (set) => ({
            _hasHydrated: false,
            setHasHydrated: (value) => set({ _hasHydrated: value }),
            // Retain the legacy scalar for existing consumers.
            maxScore: 0,
            setMaxScore: (value) => set({ maxScore: value }),
            // Compatibility alias: maxScores contains the best-flip records.
            maxScores: [],
            leastFlipScores: [],
            leastTimeScores: [],
            resetScores: () =>
                set({
                    maxScore: 0,
                    maxScores: [],
                    leastFlipScores: [],
                    leastTimeScores: [],
                    recentScores: [],
                }),
            addMaxScore: (result) => {
                if (!isResult(result) || result.completed === false) return;
                set((state) => {
                    const leastFlipScores = bestFive(
                        appendResult(state.leastFlipScores, result),
                        "flips",
                    );
                    const leastTimeScores = bestFive(
                        appendResult(state.leastTimeScores, result),
                        "time",
                    );
                    // Ties with identical metrics leave the existing five in place.
                    if (
                        sameEntries(leastFlipScores, state.leastFlipScores) &&
                        sameEntries(leastTimeScores, state.leastTimeScores)
                    )
                        return state;
                    return {
                        leastFlipScores,
                        leastTimeScores,
                        maxScores: leastFlipScores,
                    };
                });
            },
            recentScores: [],
            addRecentScore: (result) => {
                if (!isResult(result)) return;
                set((state) => {
                    const next = appendResult(state.recentScores, result);
                    return next === state.recentScores
                        ? state
                        : { recentScores: next.slice(-5) };
                });
            },
        }),
        {
            name: "game-score-store",
            version: 1,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                maxScore: state.maxScore,
                maxScores: state.maxScores,
                leastFlipScores: state.leastFlipScores,
                leastTimeScores: state.leastTimeScores,
                recentScores: state.recentScores,
            }),
            merge: (persisted, current) => {
                const saved = persisted || {};
                const leastFlipScores = bestFive(
                    saved.leastFlipScores ?? saved.maxScores,
                    "flips",
                );
                const leastTimeScores = bestFive(
                    saved.leastTimeScores ?? saved.maxScores,
                    "time",
                );
                return {
                    ...current,
                    ...saved,
                    leastFlipScores,
                    leastTimeScores,
                    maxScores: leastFlipScores,
                    recentScores: Array.isArray(saved.recentScores)
                        ? saved.recentScores.slice(-5)
                        : [],
                    _hasHydrated: current._hasHydrated,
                };
            },
            onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
        },
    ),
);

export function resetScores() {
    useScoreStore.getState().resetScores();
}
