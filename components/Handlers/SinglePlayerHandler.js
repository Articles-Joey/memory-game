"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import { useGameStore, generateMatchPairs } from "@/hooks/useGameStore";
import { useScoreStore } from "@/hooks/useScoreStore";
import SinglePlayerGameOverDialog from "@/components/UI/SinglePlayerGameOverDialog";

function elapsedSeconds(gameState, now = Date.now()) {
    return Number.isFinite(gameState.startedAt)
        ? Math.max(0, Math.floor((now - gameState.startedAt) / 1000))
        : (gameState.timer ?? 0);
}

function timeLimit(gameState) {
    return Number.isFinite(gameState.maxTime) && gameState.maxTime > 0
        ? gameState.maxTime
        : Infinity;
}

function finishRound(simulatedResult = null) {
    const store = useGameStore.getState();
    const current = store.gameState;
    if (
        !simulatedResult &&
        (current.status !== "In Progress" || current.result)
    )
        return;
    const cards = Array.isArray(current.matchPairs) ? current.matchPairs : [];
    const completed =
        Boolean(simulatedResult) ||
        (cards.length > 0 && cards.every((card) => card.matched));
    const now = Date.now();
    const result = {
        id:
            simulatedResult && current.result
                ? crypto.randomUUID()
                : current.roundId || crypto.randomUUID(),
        time:
            simulatedResult?.time ??
            Math.min(elapsedSeconds(current, now), timeLimit(current)),
        flips: simulatedResult?.flips ?? current.flipCount ?? 0,
        matchedPairs: Math.floor(
            (simulatedResult
                ? cards.length
                : cards.filter((card) => card.matched).length) / 2,
        ),
        totalPairs: Math.floor(cards.length / 2),
        completed,
        playedAt: new Date(now).toISOString(),
    };
    // Mark the round finished before notifying either store, preventing duplicate saves.
    store.setGameState({
        ...current,
        status: "Game Over",
        roundId: result.id,
        timer: result.time,
        flipCount: result.flips,
        ...(simulatedResult && {
            startedAt: now - result.time * 1000,
            matchPairs: cards.map((card) => ({
                ...card,
                matched: true,
                flipped: false,
            })),
            flippedCards: [],
        }),
        endedAt: now,
        result,
        resultDialogOpen: true,
    });
    const scores = useScoreStore.getState();
    scores.addMaxScore(result);
    scores.addRecentScore(result);
}

export function forceSinglePlayerGameOver() {
    if (process.env.NODE_ENV !== "development") return;
    const current = useGameStore.getState().gameState;
    if (!current.players?.some((player) => player.id === "local")) return;
    const cards = Array.isArray(current.matchPairs) ? current.matchPairs : [];
    if (!cards.length) return;
    const limit = timeLimit(current);
    const maxSeconds = Number.isFinite(limit)
        ? Math.max(1, Math.floor(limit))
        : 180;
    const minimumFlips = Math.ceil(cards.length / 2) * 2;
    finishRound({
        time: 1 + Math.floor(Math.random() * maxSeconds),
        flips:
            minimumFlips +
            2 * Math.floor(Math.random() * (cards.length * 2 + 1)),
    });
}

export default function SinglePlayerHandler() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isSinglePlayer = pathname === "/play" && !searchParams.get("server");
    const nickname = useStore((state) => state.nickname);
    const status = useGameStore((state) => state.gameState.status);
    const playersLength = useGameStore(
        (state) => state.gameState.players?.length ?? 0,
    );
    const matchPairs = useGameStore((state) => state.gameState.matchPairs);
    const playerLocation = useGameStore((state) => state.playerLocation);

    useEffect(() => {
        if (!isSinglePlayer) return;
        const store = useGameStore.getState();
        const current = store.gameState;
        if (current.players?.some((player) => player.id === "local")) return;
        store.setGameState({
            ...current,
            players: [{ id: "local", nickname, health: 5 }],
            status: "In Lobby",
            timer: 0,
            flipCount: 0,
            maxTime: current.maxTime ?? 150,
            matchPairs:
                !current.players?.length &&
                Array.isArray(current.matchPairs) &&
                current.matchPairs.length
                    ? current.matchPairs
                    : generateMatchPairs(4, 8),
            roundId: crypto.randomUUID(),
            startedAt: null,
            endedAt: null,
            result: null,
            resultDialogOpen: false,
        });
    }, [isSinglePlayer, nickname, playersLength, status]);

    useEffect(() => {
        if (!isSinglePlayer || !playerLocation) return;
        const store = useGameStore.getState();
        const current = store.gameState;
        if (!current.players?.length) return;
        store.setGameState({
            ...current,
            players: current.players.map((player) =>
                player.id === "local"
                    ? { ...player, position: playerLocation, rotation: 0 }
                    : player,
            ),
        });
    }, [isSinglePlayer, playerLocation, playersLength]);

    useEffect(() => {
        if (!isSinglePlayer || status !== "In Progress") return;
        const tick = () => {
            const store = useGameStore.getState();
            const current = store.gameState;
            if (current.status !== "In Progress" || current.result) return;
            const elapsed = elapsedSeconds(current);
            const completed =
                current.matchPairs?.length > 0 &&
                current.matchPairs.every((card) => card.matched);
            if (completed || elapsed >= timeLimit(current)) {
                finishRound();
            } else if (elapsed !== current.timer) {
                store.setGameState({ ...current, timer: elapsed });
            }
        };
        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [isSinglePlayer, status]);

    useEffect(() => {
        if (
            isSinglePlayer &&
            status === "In Progress" &&
            Array.isArray(matchPairs) &&
            matchPairs.length > 0 &&
            matchPairs.every((card) => card.matched)
        )
            finishRound();
    }, [isSinglePlayer, status, matchPairs]);

    return isSinglePlayer ? <SinglePlayerGameOverDialog /> : null;
}
