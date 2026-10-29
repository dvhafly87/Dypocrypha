import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
const base = '/absproxy/5173/';
export default defineConfig({
 plugins: [react()], base,
 define: {global:'window', 'import.meta.env.VITE_API_BASE_URL':JSON.stringify(base+'__backend'), 'import.meta.env.VITE_ROUTER_BASE':JSON.stringify(base)},
 server: {host:'127.0.0.1',port:5173,strictPort:true,
   hmr:{clientPort:8999,protocol:'wss'},
   proxy:{[base+'__backend']:{target:'http://127.0.0.1:8081',changeOrigin:true,ws:true,
    rewrite:p=>p.replace(base+'__backend',''),cookieDomainRewrite:'',cookiePathRewrite:base}}
 }
});
