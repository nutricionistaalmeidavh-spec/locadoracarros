import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareMobile } from '../scripts/prepare-mobile.mjs';

test('mobile build: copia shell e módulos para www embutido', async () => {
  const root=await mkdtemp(path.join(tmpdir(),'locadora-mobile-'));
  await mkdir(path.join(root,'src','domain'),{recursive:true});
  await mkdir(path.join(root,'assets'),{recursive:true});
  await writeFile(path.join(root,'index.html'),'<html>ok</html>');
  await writeFile(path.join(root,'styles.css'),'body{}');
  await writeFile(path.join(root,'styles-p1.css'),'');
  await writeFile(path.join(root,'styles-p2.css'),'');
  await writeFile(path.join(root,'manifest.webmanifest'),'{}');
  await writeFile(path.join(root,'sw.js'),'');
  await writeFile(path.join(root,'src','domain','offline.mjs'),'export{}');
  await writeFile(path.join(root,'assets','icon.svg'),'<svg/>');
  const out=path.join(root,'mobile','www');
  const result=await prepareMobile({rootDir:root,outDir:out});
  assert.equal(result.filesCopied>=8,true);
  assert.equal(await readFile(path.join(out,'index.html'),'utf8'),'<html>ok</html>');
  assert.equal((await stat(path.join(out,'src','domain','offline.mjs'))).isFile(),true);
});
