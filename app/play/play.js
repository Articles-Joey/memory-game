"use client";

import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import classNames from "classnames";
import useFullscreen from "@articles-media/articles-dev-box/useFullscreen";
import GameMenu from "@articles-media/articles-dev-box/GameMenu";
import LeftPanelContent from "@/components/UI/LeftPanel";
import { useStore } from "@/hooks/useStore";

const GameCanvas = dynamic(() => import("@/components/Game/GameCanvas"), {
    ssr: false,
});

export default function GamePage() {
    const showMenu = useStore((state) => state.showMenu);
    const sidebar = useStore((state) => state.sidebar);
    const sceneKey = useStore((state) => state.sceneKey);
    const { isFullscreen } = useFullscreen();

    return (
        <Box
            className={classNames(`${process.env.NEXT_PUBLIC_GAME_KEY}-game-page`, {
                "menu-open": showMenu,
                fullscreen: isFullscreen,
                "show-sidebar": sidebar,
            })}
            id={`${process.env.NEXT_PUBLIC_GAME_KEY}-game-page`}
            sx={{
                position: "relative",
                display: "flex",
                "&.sidebar-enabled": {
                    "@media (min-width: 992px)": {
                        "& .mobile-menu, & .menu-bar": { display: "none" },
                    },
                },
                "& .background": {
                    position: "fixed",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                    overflow: "hidden",
                    "& img": { filter: "blur(2px) brightness(0.8)", transform: "scale(1.05)" },
                },
                "& .container": { position: "relative", zIndex: 1 },
                "& .debug-info, & .game-info": {
                    width: 300,
                    flexShrink: 0,
                    height: "100vh",
                    "& .card, & .MuiCard-root": { height: "100%" },
                },
                "& .game": { p: "0.5rem 1rem", display: "flex", justifyContent: "center" },
                "& .game-panel": { width: "100%" },
                "& .controls-overlay": {
                    position: "fixed",
                    bottom: 0,
                    right: 0,
                    m: "1rem",
                    bgcolor: "rgba(0,0,0,0.75)",
                    width: 160,
                    height: 160,
                    zIndex: 3,
                    "& .fire-button, & .up-button, & .down-button, & .left-button, & .right-button": {
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                    },
                    "& .fire-button": { bgcolor: "red" },
                    "& .left-button": { transform: "translate(calc(-50% - 50px), -50%)" },
                    "& .right-button": { transform: "translate(calc(-50% + 50px), -50%)" },
                    "& .up-button": { transform: "translate(-50%, calc(-50% - 50px))" },
                    "& .down-button": { transform: "translate(-50%, calc(-50% + 50px))" },
                },
            }}
        >
            <GameMenu
                useStore={useStore}
                LeftPanelContent={LeftPanelContent}
                menuBarConfig={{ style: "Corner Button", menuBarButtonPosition: "Left" }}
                sidebarConfig={{ style: "Static Panel" }}
            />
            <Box
                className="canvas-wrap"
                sx={{
                    position: "relative",
                    width: "100vw",
                    height: "100vh",
                    "& canvas": {
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        left: 0,
                        top: 0,
                    },
                }}
            >
                <GameCanvas key={sceneKey} />
            </Box>
        </Box>
    );
}
