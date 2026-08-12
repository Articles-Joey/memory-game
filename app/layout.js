import { Suspense } from 'react';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';

import "bootstrap/dist/css/bootstrap.min.css";

// import "./globals.css";
import "@/styles/index.scss";

import "@articles-media/articles-dev-box/dist/style.css";
import "@articles-media/articles-gamepad-helper/dist/articles-gamepad-helper.css";

import LayoutClient from './layout-client';
import SocketLogicHandler from '@/components/Handlers/SocketLogicHandler';
import SinglePlayerHandler from '@/components/Handlers/SinglePlayerHandler';

export const metadata = {
  title: "Memory Game | Articles Media",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">

      <head>

      </head>

      <body>
        
        <LayoutClient />

        <Suspense>
          <SinglePlayerHandler />
          <SocketLogicHandler />
        </Suspense>

        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
