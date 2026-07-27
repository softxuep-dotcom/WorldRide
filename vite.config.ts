import { defineConfig } from "vite";

type GamePlatform = "web" | "poki" | "crazygames";

const PLATFORM_SDK: Partial<Record<GamePlatform, string>> = {
  poki: "https://game-cdn.poki.com/scripts/v2/poki-sdk.js",
  crazygames: "https://sdk.crazygames.com/crazygames-sdk-v3.js",
};

export default defineConfig(({ mode }) => {
  const platform = getPlatform(mode);
  const sdk = PLATFORM_SDK[platform];

  return {
    base: platform === "web" ? "/WorldRide/" : "./",
    build: {
      outDir: platform === "web" ? "dist" : `dist-${platform}`,
    },
    define: {
      __GAME_PLATFORM__: JSON.stringify(platform),
    },
    plugins: sdk
      ? [
          {
            name: "platform-sdk",
            transformIndexHtml: {
              order: "pre",
              handler(html: string) {
                return html.replace(
                  "</head>",
                  `    <script src="${sdk}"></script>\n  </head>`,
                );
              },
            },
          },
        ]
      : [],
  };
});

function getPlatform(mode: string): GamePlatform {
  if (mode === "poki" || mode === "crazygames") {
    return mode;
  }
  return "web";
}
