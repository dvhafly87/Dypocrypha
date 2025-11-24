import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'; 


const certPath = './auth/fullchain.pem';
const keyPath = './auth/privkey.pem';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1112,
    https: {
      key: fs.readFileSync(keyPath),       
      cert: fs.readFileSync(certPath)      
    }
  }
})