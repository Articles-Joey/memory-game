"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useGameStore } from "@/hooks/useGameStore";

export default function GameDetailsPanel() {
    const players = useGameStore((state) => state.gameState.players);

    return (
        <Card sx={{ bgcolor: "game.card", backgroundImage: "none", border: 1, borderColor: "divider" }}>
            <CardContent>
                <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                    <RoundAndTimer />
                </Box>
                <Box>Players</Box>
                {players?.map((player, index) => (
                    <Box key={player.id ?? index} sx={{ border: 1, borderColor: "divider", p: 1, position: "relative" }}>
                        <Box sx={{ fontSize: "0.6rem", position: "absolute", top: 0, right: 0, bgcolor: "#000", color: "#fff", p: "0.1rem 0.3rem" }}>
                            ID: {player.id}
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>{player.nickname || "?"}</Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Box>{player.position?.x?.toFixed(2) || 0}, {player.position?.z?.toFixed(2) || 0}</Box>
                        </Box>
                    </Box>
                ))}
            </CardContent>
        </Card>
    );
}

function RoundAndTimer() {
    const timer = useGameStore((state) => state.gameState.timer);
    const flipCount = useGameStore((state) => state.gameState.flipCount);

    return (
        <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <Box>Time: {timer || 0}</Box>
            <Box>Flips: {flipCount || 0}</Box>
        </Box>
    );
}
