import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

/* ============================================================
   リポジトリ名を変える場合は base を '/新しいリポジトリ名/' に変更。
   独自ドメインを使う場合は base: '/' にする。
   ============================================================ */
export default defineConfig({
  base: "/denki-tools/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "ogp.png"],
      manifest: {
        name: "電気設備の計算ツール集",
        short_name: "DenkiTools",
        description: "ケーブルラック占有率・荷重計算など、電気工事の実務計算を無料で。",
        lang: "ja",
        display: "standalone",
        background_color: "#F3F4F1",
        theme_color: "#22272B",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        /* Google Fonts をキャッシュしてオフラインでも表示 */
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-css",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        top: r("index.html"),
        rack: r("rack-checker/index.html"),
      },
    },
  },
});
