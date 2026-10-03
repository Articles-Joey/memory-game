"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TerminalIcon from "@mui/icons-material/Terminal";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { useGameStore } from "@/hooks/useGameStore";
import { useStore } from "@/hooks/useStore";
import ArticlesButton from "./Button";

export default function DebugPanel() {
    const matchPairs = useGameStore((state) => state.gameState.matchPairs);
    const timer = useGameStore((state) => state.gameState.timer);
    const flipCount = useGameStore((state) => state.gameState.flipCount);
    const resetGameState = useGameStore((state) => state.resetGameState);
    const reloadScene = useStore((state) => state.reloadScene);
    const flippedCards = useMemo(() => matchPairs?.filter((card) => card.flipped), [matchPairs]);

    return (
        <Card sx={{ bgcolor: "game.card", backgroundImage: "none", fontSize: "0.875rem", border: 1, borderColor: "divider" }}>
            <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Box sx={{ fontSize: "0.875em", color: "text.secondary" }}>Debug Controls</Box>
                <Box sx={{ border: 1, borderColor: "divider", p: 1 }}>
                    <Box sx={{ fontSize: "0.875em" }}>Timer: {timer}</Box>
                    <Box sx={{ fontSize: "0.875em" }}>Flip Count: {flipCount}</Box>
                    <Box sx={{ fontSize: "0.875em" }}>Flipped:</Box>
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                        {flippedCards?.map((card) => (
                            <Chip key={card.flatLocation} label={card.flatLocation} size="small" sx={{ bgcolor: "#212529", color: "#fff", border: "1px solid #000" }} />
                        ))}
                    </Box>
                </Box>
                <Box sx={{ fontSize: "0.875em", border: 1, borderColor: "divider", p: 1, display: "flex", flexWrap: "wrap" }}>
                    <ArticlesButton small sx={{ width: "50%" }} onClick={reloadScene} startIcon={<RestartAltIcon />}>
                        Reload Game
                    </ArticlesButton>
                    <ArticlesButton small sx={{ width: "50%" }} onClick={() => console.log(useGameStore.getState().gameState)} startIcon={<TerminalIcon />}>
                        Log Game
                    </ArticlesButton>
                    <ArticlesButton small sx={{ width: "50%" }} onClick={resetGameState} startIcon={<DeleteSweepIcon />}>
                        Reset Game
                    </ArticlesButton>
                </Box>
            </CardContent>
        </Card>
    );
}
