// app/+html.tsx — Web HTML shell (Expo Router web only)
// NOTE: This file is ONLY used when web.output is "static" or "server".
// This project uses the default web.output "single" (SPA), which uses
// public/index.html as the template instead — keep the two in sync.
// Loads Google Fonts and sets global CSS for the web build.

import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#EC4899" />

        {/* Favicon + PWA */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AlmaMatcher" />
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          Plus Jakarta Sans — warm humanist sans (body / UI)
          Sora — geometric display (headlines / wordmark)
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Service worker */}
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`
        }} />

        {/* Expo Router internal reset */}
        <ScrollViewStyleReset />

        {/* Global overrides */}
        <style dangerouslySetInnerHTML={{
          __html: `
            *, *::before, *::after {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              box-sizing: border-box;
              -webkit-tap-highlight-color: transparent;
            }

            html, body, #root {
              height: 100%;
              height: 100dvh;
              overflow: hidden;
            }

            /* Desktop: keep the app a centered, mobile-width column instead of
               stretching forms/content to the full window width. */
            #root {
              max-width: 480px;
              margin: 0 auto;
              position: relative;
              box-shadow: 0 0 70px rgba(107,99,85,0.18);
            }

            body {
              margin: 0;
              padding: 0;
              background-color: #E7E0D4;
              font-family:
                'Plus Jakarta Sans',
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                Helvetica,
                Arial,
                sans-serif;
            }

            /* Apply Jakarta Sans to all RN Text on web */
            [data-testid], div, span, p, h1, h2, h3, h4, h5, h6 {
              font-family:
                'Plus Jakarta Sans',
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                Helvetica,
                Arial,
                sans-serif;
            }

            /* Thin scrollbars */
            ::-webkit-scrollbar { width: 4px; height: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #D4CEC3; border-radius: 2px; }
            ::-webkit-scrollbar-thumb:hover { background: #A8A29E; }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
