"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import GameMenuPrimaryButtonGroup from "@articles-media/articles-dev-box/GameMenuPrimaryButtonGroup";
import { useStore } from "@/hooks/useStore";
import DebugPanel from "./DebugPanel";
import GameDetailsPanel from "./GameDetailsPanel";

function LeftPanelContent() {
    const debug = useStore((state) => state.debug);

    return (
        <Box sx={{ width: "100%" }}>
            <Card sx={{ bgcolor: "game.card", backgroundImage: "none", fontSize: "0.875rem", border: 1, borderColor: "divider" }}>
                <CardContent sx={{ p: 1, "&:last-child": { pb: 1 }, display: "flex", flexWrap: "wrap" }}>
                    <GameMenuPrimaryButtonGroup useStore={useStore} type="GameMenu" useRouter={useRouter} />
                </CardContent>
            </Card>
            <GameDetailsPanel />
            {debug && <DebugPanel />}
        </Box>
    );
}

export default memo(LeftPanelContent);
