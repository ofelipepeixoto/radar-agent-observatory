// Build only explicit public fixture assets; never copy server, docs, credentials or checkout state.
import {mkdir,rm,copyFile} from 'node:fs/promises';
const files=['index.html','src/app.mjs','src/load.mjs','src/contract.mjs','src/relations.mjs','src/style.css',
  'fixtures/synthetic.json','fixtures/historical.json','fixtures/empty.json','fixtures/invalid.json'];
const root=new URL('../',import.meta.url),out=new URL('dist/',root);
await rm(out,{recursive:true,force:true});
for(const file of files){const target=new URL(file,out);await mkdir(new URL('.',target),{recursive:true});await copyFile(new URL(file,root),target);}
console.log(`STATIC_SYNTHETIC_BUILD_OK ${files.length} allowlisted files`);
