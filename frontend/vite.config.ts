import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    mode: 'development',
    plugins: [
        // Allows using React dev server along with building a React application with Vite.
        // https://npmjs.com/package/@vitejs/plugin-react-swc
        react(),
        // Allows using the compilerOptions.paths property in tsconfig.json.
        // https://www.npmjs.com/package/vite-tsconfig-paths
        tsconfigPaths(),
        // Create a custom SSL certificate valid for the local machine.
        // https://www.npmjs.com/package/vite-plugin-mkcert
        mkcert(),
    ],
    build: {
        outDir: path.resolve(__dirname, 'dist-frontend'),
        sourcemap: true,
    },
    publicDir: './public',

    esbuild: {
        sourcemap: true,
        jsxDev: true, // Полезно для React разработки
    },
    server: {
        // Exposes your dev server and makes it accessible for the devices in the same network.
        host: true,
    },

});

