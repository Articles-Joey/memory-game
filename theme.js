"use client";

import { Roboto } from "next/font/google";
import { createTheme } from "@mui/material/styles";
import { bootstrapCompatibilityTheme } from "@articles-media/articles-dev-box/bootstrapCompatibilityTheme";

const roboto = Roboto({
    weight: ["300", "400", "500", "700"],
    subsets: ["latin"],
    display: "swap",
});

export function createAppTheme(mode = "dark") {
    const dark = mode === "dark";
    const cardBackground = dark ? "#313131" : "#fff";

    return createTheme({
        cssVariables: true,
        palette: {
            mode,
            primary: { main: "#f9edcd" },
            game: { card: cardBackground },
        },
        typography: { fontFamily: roboto.style.fontFamily },
        components: {
            MuiButton: {
                styleOverrides: { root: { fontSize: "0.75rem" } },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        variants: [{
                            props: { severity: "info" },
                            style: { backgroundColor: "#60a5fa" },
                        }],
                    },
                },
            },
            MuiCssBaseline: {
                // Dev-box 2.0 supplies its internal utilities through MUI.
                styleOverrides: (muiTheme) => ({
                    ...bootstrapCompatibilityTheme.MuiCssBaseline.styleOverrides(muiTheme),
                    ":root": {
                        "--card-background-override": cardBackground,
                        "--articles-card-font-color": dark ? "#fff" : "#212529",
                        "--articles-theme-primary": dark ? "rgba(249,237,205,0.25)" : "#f9edcd",
                        "--articles-primary-color": "#adafb3",
                        "--articles-primary-color-rgb": "173,175,179",
                        "--articles-primary-color-opacity-half": "rgba(173,175,179,0.5)",
                        "--articles-secondary-color": "#f9edcd",
                        "--articles-secondary-color-rgb": "249,237,205",
                        "--articles-secondary-color-opacity-half": "rgba(249,237,205,0.5)",
                        "--background-color": dark ? "rgba(49,49,49,0.75)" : "rgba(218,224,230,0.5)",
                        "--card-background": cardBackground,
                        "--card-background-item": dark ? "#232323" : "#ebebeb",
                        "--card-background-75": dark ? "rgba(49,49,49,0.75)" : "rgba(255,255,255,0.75)",
                        "--card-background-50": dark ? "rgba(49,49,49,0.5)" : "rgba(255,255,255,0.5)",
                        "--articles-news-and-proposals-modal-width": "1500px",
                    },
                    ".stats-overlay": {
                        position: "fixed",
                        top: 0,
                        right: "0 !important",
                        left: "initial !important",
                        zIndex: 4,
                    },
                }),
            },
        },
    });
}

export default createAppTheme();
