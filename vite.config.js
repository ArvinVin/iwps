import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{output:{manualChunks:{'three-engine':['three'],'react-core':['react','react-dom']}}}}});
