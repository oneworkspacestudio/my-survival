import argparse,hashlib,json,shutil,zipfile,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--out',required=True);p.add_argument('--source-commit');a=p.parse_args()
if a.source_commit:assert re.fullmatch('[a-f0-9]{40}',a.source_commit)
root=Path(__file__).resolve().parents[1];out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True);stage=out/'package';stage.mkdir(exist_ok=True)
for rel in ['README.md','LICENSE','NOTICE','THIRD-PARTY-LICENSES.txt','compatibility.json','docs/INTEGRATION.md','docs/ACCEPTANCE.md','docs/SOURCES.md']:
 target=stage/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/rel,target)
shutil.copy2(a.exe,stage/'MySurvival.exe');shutil.copy2(root/'dist/My-Survival-offline.html',stage/'My-Survival-offline.html')
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
offline=json.loads((root/'internal/webui/dist/offline-manifest.json').read_text());assert offline['bytes']<=20*1024*1024
manifest=dict(schema=1,id='survival',version='0.1.0-preview.1',candidate=not bool(a.source_commit),sourceCommit=a.source_commit,executableSHA256=sha(stage/'MySurvival.exe'),offlineBytes=offline['bytes'],offlineVersion=offline['version'],apphost='v0.3.0-preview.116',maximumPackageBytes=150*1024*1024)
(stage/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
files=[f for f in stage.rglob('*') if f.is_file()];size=sum(f.stat().st_size for f in files);assert size<=150*1024*1024
archive=out/('my-survival-0.1.0-preview.1-windows-amd64'+('' if a.source_commit else '-candidate')+'.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in files:z.write(f,f.relative_to(stage).as_posix())
(out/'checksums.json').write_text(json.dumps(dict(packageBytes=size,archiveBytes=archive.stat().st_size,sha256=sha(archive),portableBytes=(stage/'My-Survival-offline.html').stat().st_size),indent=2)+'\n')
print(json.dumps(dict(archive=str(archive),packageBytes=size,archiveBytes=archive.stat().st_size)))
