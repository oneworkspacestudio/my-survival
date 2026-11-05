import {parse,compileReact} from '@codedia/parser';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const src=new URL('../src/screens/',import.meta.url),out=new URL('../src/generated/',import.meta.url);
await mkdir(out,{recursive:true});
for(const name of (await readdir(src)).filter(x=>x.endsWith('.aui'))) await writeFile(new URL(name.replace('.aui','.tsx'),out),'// Generated from .aui. Do not edit.\n'+compileReact(parse(await readFile(new URL(name,src),'utf8'))));
