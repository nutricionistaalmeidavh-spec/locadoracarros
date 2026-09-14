import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES=['index.html','styles.css','styles-p1.css','styles-p2.css','manifest.webmanifest','sw.js','src','assets'];

async function countFiles(target){
  const entry=await stat(target);
  if(entry.isFile()) return 1;
  const { readdir }=await import('node:fs/promises');
  const names=await readdir(target);
  let count=0;
  for(const name of names) count+=await countFiles(path.join(target,name));
  return count;
}

export async function prepareMobile({rootDir,outDir}={}){
  const scriptDir=path.dirname(fileURLToPath(import.meta.url));
  const root=path.resolve(rootDir??path.join(scriptDir,'..'));
  const out=path.resolve(outDir??path.join(root,'mobile','www'));
  await rm(out,{recursive:true,force:true});
  await mkdir(out,{recursive:true});
  let filesCopied=0;
  for(const item of FILES){
    const source=path.join(root,item);
    const destination=path.join(out,item);
    await cp(source,destination,{recursive:true});
    filesCopied+=await countFiles(destination);
  }
  return {outDir:out,filesCopied};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await prepareMobile();
  console.log(`Mobile shell preparado em ${result.outDir} (${result.filesCopied} arquivos).`);
}
