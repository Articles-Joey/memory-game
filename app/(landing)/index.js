"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoIcon from "@mui/icons-material/Info";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PaletteIcon from "@mui/icons-material/Palette";
import { GamepadKeyboard, PieMenu } from "@articles-media/articles-gamepad-helper";
import PageTemplateLandingPage from "@articles-media/articles-dev-box/PageTemplateLandingPage";
import { useStore } from "@/hooks/useStore";
import { useSocketStore } from "@/hooks/useSocketStore";

const LandingBackgroundAnimation = dynamic(
    () => import("@/components/Game/LandingBackgroundAnimation"),
    { ssr: false },
);

export default function LobbyPage() {
    const darkMode = useStore((state) => state.darkMode);
    const nicknameKeyboard = useStore((state) => state.nicknameKeyboard);

    const pieOptions = [
        {
            label: "Settings",
            Icon: SettingsIcon,
            callback: () => useStore.getState().setShowSettingsModal((previous) => !previous),
        },
        {
            label: "Go Back",
            Icon: ArrowBackIcon,
            callback: () => window.history.back(),
        },
        {
            label: "Credits",
            Icon: InfoIcon,
            callback: () => useStore.getState().setShowCreditsModal(true),
        },
        {
            label: "Game Launcher",
            Icon: SportsEsportsIcon,
            callback: () => {
                window.location.href = "https://games.articles.media";
            },
        },
        {
            label: `${darkMode ? "Light" : "Dark"} Mode`,
            Icon: PaletteIcon,
            callback: () => useStore.getState().toggleDarkMode(),
        },
    ];

    return (
        <Box
            sx={{
                position: "relative",
                isolation: "isolate",
                "& .landing-page": {
                    flexGrow: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                },
                "& .servers": {
                    display: "grid",
                    gap: "5px",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                },
                "& .server": {
                    p: "0.5rem",
                    border: "1px solid rgba(0,0,0,0.25)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                },
                "& .ad-wrap": {
                    mt: "1rem",
                    "@media (min-width: 992px)": {
                        mt: 0,
                        display: "block",
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                    },
                },
                "& .background-wrap": {
                    position: "fixed",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: -1,
                    "& img": { filter: "blur(4px)", width: "100%", height: "100%" },
                },
            }}
        >
            <Suspense>
                <GamepadKeyboard
                    disableToggle
                    active={nicknameKeyboard}
                    onFinish={(text) => {
                        useStore.getState().setNickname(text);
                        useStore.getState().setNicknameKeyboard(false);
                    }}
                    onCancel={() => useStore.getState().setNicknameKeyboard(false)}
                />
                {/* PieMenu renders React nodes in labels, so put the icons there. */}
                <PieMenu
                    options={pieOptions.map(({ label, Icon, callback }) => ({
                        label: (
                            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                                <Icon fontSize="small" />
                                {label}
                            </Box>
                        ),
                        callback,
                    }))}
                    onFinish={(event) => event.callback?.()}
                />
            </Suspense>

            <PageTemplateLandingPage
                useSocketStore={useSocketStore}
                useStore={useStore}
                Link={Link}
                useRouter={useRouter}
                logoImage="img/icon.png"
                LandingBackgroundAnimation={<LandingBackgroundAnimation />}
                heroOverride={
                    <Box sx={{ mb: "1rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
                        <Image
                            src="/img/icon.png"
                            alt="Logo"
                            loading="eager"
                            width={200}
                            height={200}
                            style={{ objectFit: "contain" }}
                        />
                        <Box
                            sx={{
                                fontSize: "2.5rem",
                                fontWeight: 900,
                                WebkitTextStroke: "2px #f4dfba",
                                animation: "hero-scale-pulse 2s infinite ease-in-out",
                                mt: "-2rem",
                                "@keyframes hero-scale-pulse": {
                                    "0%, 100%": { transform: "scale(1)" },
                                    "50%": { transform: "scale(1.5)" },
                                },
                            }}
                        >
                            <Box component="span" sx={{ color: "#54b88b" }}>Mem</Box>
                            <Box component="span" sx={{ color: "#656b99" }}>ory</Box>
                            {" "}
                            <Box component="span" sx={{ color: "#ffb419" }}>Ga</Box>
                            <Box component="span" sx={{ color: "#f94567" }}>me</Box>
                        </Box>
                    </Box>
                }
                backgroundImage={darkMode ? "/img/dark-preview.webp" : "/img/preview.webp"}
                singlePlayerConfig={{
                    attachServerType: "single-player",
                }}
                multiplayerConfig={{
                    type: "WebSocket",
                    comingSoon: true,
                    defaultServers: 2,
                    privateServerSupport: false,
                    onlinePlayersTemplate: "2.0",
                }}
                brandingTextClass="jaro-primary"
            />
        </Box>
    );
}
