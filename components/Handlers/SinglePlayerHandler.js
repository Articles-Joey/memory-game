"use client";
// Attempting a socket server first architecture, but this component will handle the single player mode and local game state management.

import { v4 as uuidv4 } from 'uuid';
import { useEffect } from "react"
import { useStore } from "@/hooks/useStore"
import { useSocketStore } from "@/hooks/useSocketStore"
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/hooks/useGameStore";
// import { useCannonStore } from '@/hooks/useCannonStore';
import { useScoreStore } from '@/hooks/useScoreStore';

export default function SinglePlayerHandler() {

    const searchParams = useSearchParams()
    const params = Object.fromEntries(searchParams.entries());
    const { server, server_type } = params

    const socket = useSocketStore(state => state.socket)

    const nickname = useStore((state) => state.nickname)

    const gameState = useGameStore(state => state.gameState)
    const players = useGameStore(state => state.gameState.players)
    const status = useGameStore(state => state.gameState.status)
    const setGameState = useGameStore(state => state.setGameState)
    const flipCount = useGameStore(state => state.gameState.flipCount)
    const addTimer = useGameStore(state => state.addTimer)
    const generateMatchPairs = useGameStore(state => state.generateMatchPairs)

    // const setRandomGoalLocation = useCannonStore(state => state.setRandomGoalLocation);

    const playersLength = gameState?.players?.length || 0;

    // const playersTotalScore = players?.reduce((total, player) => total + (player.score || 0), 0) || 0;

    // useEffect(() => {

    //     if (server_type == "single-player") {

    //         setRandomGoalLocation();

    //     }

    // }, [playersTotalScore, setRandomGoalLocation, server_type])

    const playerLocation = useGameStore(state => state.playerLocation)

    useEffect(() => {

        if (playersLength == 0) return
        if (server) return

        const gameState = useGameStore.getState().gameState;
        setGameState({
            ...gameState,
            players: [
                ...gameState?.players?.map(p => {
                    if (p.id === 'local') {
                        return {
                            ...p,
                            position: playerLocation,
                            rotation: 0,
                        }
                    }
                    return p;
                }),
            ]
        })
    }, [
        playerLocation, playersLength, server, setGameState
    ])

    useEffect(() => {

        console.warn("SinglePlayerHandler - Player length check", status)

        if (
            (players?.length || 0) === 0
            &&
            status !== 'Game Over'
            &&
            !status
        ) {

            console.warn("No players found in game state, adding local player.")

            setGameState({
                players: [{
                    id: 'local',
                    nickname: nickname,
                    health: 5,
                }],
                status: 'In Lobby',
                timer: 0,
                flipCount: 0,
                // matchPairs: generateMatchPairs(4, 8),
                maxTime: process.env.NODE_ENV !== 'production' ? 10 : 60,
                // fallingItems: (() => {
                //     const items = [];
                //     for (let i = 0; i < 3; i++) {
                //         items.push(generateFallingItem(items));
                //     }
                //     return items;
                // })()
            });

        }

    }, [players?.length, status, nickname, setGameState, generateMatchPairs])

    useEffect(() => {

        console.warn("SinglePlayerHandler - Status change detected", status)

        let interval;

        if (status === "In Progress") {

            // const {
            //     position: myPosition,
            //     playerRotation: myRotation,
            //     action: myAction,
            //     projectiles: localProjectiles
            // } = useCannonStore.getState();

            // generateMoveSequence(gameState, setGameState);

            interval = setInterval(() => {
                const currentGameState = useGameStore.getState().gameState;

                if (currentGameState.status !== 'In Progress') {
                    clearInterval(interval);
                    return;
                }

                const currentGameTimer = currentGameState.timer ?? 0;

                const now = Date.now();

                if (
                    currentGameTimer
                    >=
                    currentGameState.maxTime
                    // 5
                ) {

                    if (
                        currentGameState.players?.[0]?.score &&
                        currentGameState.players?.[0]?.score > useScoreStore.getState().maxScore
                    ) {
                        useScoreStore.getState().setMaxScore(currentGameState.players?.[0]?.score || 0)
                    }

                    useScoreStore.getState().addRecentScore(currentGameState.players?.[0]?.score || 0)

                    setGameState({
                        ...currentGameState,
                        status: 'Game Over',
                        timer: 0
                    });

                    // useStore.getState().setShowGameOverModal({
                    //     rankings: [],
                    //     winner: {
                    //         nickname: "123",
                    //     }
                    // })

                } else {
                    setGameState({
                        ...currentGameState,
                        timer: currentGameTimer + 1,
                        // ...(currentGameState.fallingItems ?
                        //     {
                        //         fallingItems: currentGameState.fallingItems.reduce((acc, item) => {
                        //             if (now - item.spawnedAt > 5000) {
                        //                 acc.push(generateFallingItem(acc));
                        //             } else {
                        //                 // console.log("Not older", now - item.spawnedAt)
                        //                 acc.push(item);
                        //             }
                        //             return acc;
                        //         }, [])
                        //     }
                        //     :
                        //     {}
                        // ),
                    });
                }
            }, 1000);

        }

        return () => {
            if (interval) clearInterval(interval);
        };

    }, [status, setGameState])

    useEffect(() => {

        if (flipCount === 0) return

        const gameTimer = setInterval(() => {
            if (useGameStore.getState().gameState.flipCount > 0) {
                addTimer()
            }
        }, 1000)

        return () => clearInterval(gameTimer)

    }, [flipCount, addTimer])

    // if (server) {
    //     console.warn("Not single player mode, server param found:", server)
    //     return null;
    // }

}