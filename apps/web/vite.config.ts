import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	base: "/", // <--- Tambahkan ini
	plugins: [
        tsconfigPaths(),
        tailwindcss(),
        tanstackStart({ ssr: false }),
        viteReact(),
	],
	build: {
        rollupOptions: {
            output: {
                // Memastikan semua assets punya path yang jelas
                assetFileNames: "assets/[name]-[hash][extname]",
                chunkFileNames: "assets/[name]-[hash].js",
                entryFileNames: "assets/[name]-[hash].js",
            },
        },
    },
	server: {
		port: 3001,
	},
});
