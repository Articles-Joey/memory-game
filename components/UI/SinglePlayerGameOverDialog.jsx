"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { useGameStore } from "@/hooks/useGameStore";
import { useScoreStore } from "@/hooks/useScoreStore";
import ArticlesButton from "./Button";

function formatTime(seconds) {
    return (
        Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0") +
        ":" +
        Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0")
    );
}

function scoreTimestamp(playedAt) {
    const timestamp = typeof playedAt === "string" ? Date.parse(playedAt) : NaN;
    return Number.isFinite(timestamp) ? timestamp : null;
}

function formatScoreDate(playedAt) {
    const timestamp = scoreTimestamp(playedAt);
    return timestamp === null
        ? "Unknown"
        : new Date(timestamp).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          });
}

function closeDialog() {
    useGameStore.setState((state) => ({
        gameState: { ...state.gameState, resultDialogOpen: false },
    }));
}

function playAgain() {
    const store = useGameStore.getState();
    store.resetGameState();
    store.setTeleport([0, 1.1, 0]);
}

export function SinglePlayerScoreboard({
    highlightedResultId,
    onClose,
    onPlayAgain,
} = {}) {
    const leastFlipScores = useScoreStore((state) => state.leastFlipScores);
    const leastTimeScores = useScoreStore((state) => state.leastTimeScores);
    const recentScores = useScoreStore((state) => state.recentScores);
    const [view, setView] = useState("flips");
    const [sortBy, setSortBy] = useState("flips");
    const [sortDirection, setSortDirection] = useState("asc");
    const rows = useMemo(() => {
        const scores =
            view === "flips"
                ? leastFlipScores
                : view === "time"
                  ? leastTimeScores
                  : recentScores;
        return scores
            .filter(
                (score) =>
                    Number.isFinite(score?.time) &&
                    Number.isFinite(score?.flips),
            )
            .slice()
            .sort((a, b) => {
                let difference;
                if (sortBy === "playedAt") {
                    const aTimestamp = scoreTimestamp(a.playedAt);
                    const bTimestamp = scoreTimestamp(b.playedAt);
                    // Keep older records with no saved date at the end.
                    if (aTimestamp === null) return bTimestamp === null ? 0 : 1;
                    if (bTimestamp === null) return -1;
                    difference = aTimestamp - bTimestamp;
                } else {
                    difference = a[sortBy] - b[sortBy];
                }
                return sortDirection === "asc" ? difference : -difference;
            });
    }, [
        view,
        leastFlipScores,
        leastTimeScores,
        recentScores,
        sortBy,
        sortDirection,
    ]);

    const sort = (column) => {
        setSortDirection(
            sortBy === column && sortDirection === "asc" ? "desc" : "asc",
        );
        setSortBy(column);
    };

    return (
        <Box>
            <Tabs
                value={view}
                variant="fullWidth"
                onChange={(_, next) => {
                    setView(next);
                    setSortBy(next === "recent" ? "playedAt" : next);
                    setSortDirection(next === "recent" ? "desc" : "asc");
                }}
                aria-label="Saved results"
            >
                <Tab
                    value="flips"
                    label="Best flips"
                />
                <Tab
                    value="time"
                    label="Best time"
                />
                <Tab
                    value="recent"
                    label="Recent"
                />
            </Tabs>
            <Table
                size="small"
                aria-label="Saved game results"
            >
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === "time"}
                                direction={
                                    sortBy === "time" ? sortDirection : "asc"
                                }
                                onClick={() => sort("time")}
                            >
                                Time
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === "flips"}
                                direction={
                                    sortBy === "flips" ? sortDirection : "asc"
                                }
                                onClick={() => sort("flips")}
                            >
                                Flips
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortBy === "playedAt"}
                                direction={
                                    sortBy === "playedAt"
                                        ? sortDirection
                                        : "asc"
                                }
                                onClick={() => sort("playedAt")}
                            >
                                Date
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((score, index) => (
                        <TableRow
                            key={score.id || index}
                            selected={
                                Boolean(highlightedResultId) &&
                                score.id === highlightedResultId
                            }
                        >
                            <TableCell>{formatTime(score.time)}</TableCell>
                            <TableCell>{score.flips}</TableCell>
                            <TableCell>
                                {formatScoreDate(score.playedAt)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3}>
                                No completed games yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
            >
                Best lists keep five completed boards. Click Time or Flips
                to sort.
            </Typography> */}
            {(onClose || onPlayAgain) && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        mt: 2,
                    }}
                >
                    {onClose && (
                        <ArticlesButton onClick={onClose}>Close</ArticlesButton>
                    )}
                    {onPlayAgain && (
                        <ArticlesButton onClick={onPlayAgain}>
                            Play again
                        </ArticlesButton>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default function SinglePlayerGameOverDialog() {
    const result = useGameStore((state) => state.gameState.result);
    const open = useGameStore((state) => state.gameState.resultDialogOpen);

    return (
        <Dialog
            open={Boolean(open && result)}
            onClose={closeDialog}
            fullWidth
            maxWidth="sm"
            aria-labelledby="single-player-game-over-title"
        >
            <DialogTitle id="single-player-game-over-title">
                Game Over
            </DialogTitle>
            <DialogContent>
                <Typography
                    variant="h6"
                    sx={{ mb: 2 }}
                >
                    {result?.completed ? "Board cleared!" : "Time's up!"}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                        }}
                    >
                        <Typography color="text.secondary">Time</Typography>
                        <Typography variant="h4">
                            {formatTime(result?.time ?? 0)}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                        }}
                    >
                        <Typography color="text.secondary">Flips</Typography>
                        <Typography variant="h4">
                            {result?.flips ?? 0}
                        </Typography>
                    </Box>
                </Box>
                <Typography
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {result?.matchedPairs ?? 0} of {result?.totalPairs ?? 16}{" "}
                    pairs matched.
                </Typography>
                <SinglePlayerScoreboard
                    highlightedResultId={result?.id}
                    onClose={closeDialog}
                    onPlayAgain={playAgain}
                />
            </DialogContent>
        </Dialog>
    );
}
