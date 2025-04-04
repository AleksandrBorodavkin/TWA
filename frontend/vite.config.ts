import {defineConfig, loadEnv} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';
import path from "node:path";

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: env.VITE_BASE_PATH || '/',
        mode: env.VITE_ENV || 'development',
        plugins: [
            react(),
            tsconfigPaths(),
            mkcert(),
        ],
        build: {
            outDir: path.resolve(__dirname, env.VITE_OUT_DIR || 'dist-frontend'),
            sourcemap: mode !== 'production',
        },
        publicDir: './public',
        // esbuild: {
        //     sourcemap: true,
        // },
        server: {
            host: true,
        },
    };
});


