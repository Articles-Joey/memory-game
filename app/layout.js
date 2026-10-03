import { Suspense } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import AppThemeProvider from "@/components/AppThemeProvider";
import SocketLogicHandler from "@/components/Handlers/SocketLogicHandler";
import SinglePlayerHandler from "@/components/Handlers/SinglePlayerHandler";
import LayoutClient from "./layout-client";
import packageInfo from "@/package.json";

import "@articles-media/articles-gamepad-helper/dist/articles-gamepad-helper.css";

export const metadata = {
    title: "Memory Game | Articles Media",
    description: packageInfo.description,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                    <AppThemeProvider>
                        <LayoutClient />
                        <Suspense>
                            <SinglePlayerHandler />
                            <SocketLogicHandler />
                        </Suspense>
                        {children}
                    </AppThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
