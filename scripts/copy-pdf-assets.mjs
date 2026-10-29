import {cp,mkdir,readFile} from 'node:fs/promises';
const {version}=JSON.parse(await readFile('node_modules/pdfjs-dist/package.json','utf8'));
const base='public/pdfjs/'+version+'/';
for(const dir of ['cmaps','standard_fonts','wasm']){
 await mkdir(base+dir,{recursive:true});
 await cp('node_modules/pdfjs-dist/'+dir,base+dir,{recursive:true});
}
await cp('node_modules/pdfjs-dist/build/pdf.worker.min.mjs',base+'pdf.worker.min.js');
