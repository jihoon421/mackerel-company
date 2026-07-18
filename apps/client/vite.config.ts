import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType:'prompt', includeAssets:['icons/icon.svg'],
    manifest:{name:'고등어 회사: 오늘도 두 마리 출근',short_name:'고등어 회사',description:'1~2인 협동 심해 산업 생존 게임',theme_color:'#07171e',background_color:'#07171e',display:'standalone',orientation:'any',start_url:'/',icons:[{src:'/icons/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},
    workbox:{globPatterns:['**/*.{js,css,html,svg,png,webp,woff2}'],navigateFallback:'/index.html'}
  })],
  server:{host:true,proxy:{'/api':'http://localhost:3000','/health':'http://localhost:3000','/colyseus':{target:'ws://localhost:3000',ws:true}}},
  build:{target:'es2022',chunkSizeWarningLimit:1800,rollupOptions:{output:{manualChunks:{phaser:['phaser'],audio:['tone','howler'],react:['react','react-dom','zustand']}}}}
});
