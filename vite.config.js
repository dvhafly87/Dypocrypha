import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs';


const certPath = './auth/fullchain.pem';
const keyPath = './auth/privkey.pem';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window'  // 브라우저에서 global 대신 window 사용
  },
  server: {
    port: 1112,
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }
  }
})