"""Collect license texts of shipped code, without copying module source or data."""
from pathlib import Path
import argparse
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--modules',required=True);p.add_argument('--go-license',required=True);a=p.parse_args()
module_list=Path(a.modules)
chunks=[]
for row in module_list.read_text(encoding='utf-8-sig').splitlines():
 parts=row.split('|')
 if len(parts)!=3 or not parts[2] or parts[0].endswith('/my-survival'):continue
 folder=Path(parts[2]);licenses=[p for p in folder.iterdir() if p.is_file() and p.name.lower() in ['license','license.txt','license.md','copying','notice','notice.txt']]
 for p in licenses:chunks.append(parts[0]+' '+parts[1]+' / '+p.name+'\n'+p.read_text(encoding='utf-8-sig',errors='replace'))
for module in ['react','react-dom','scheduler','lucide-react']:
 folder=root/'web/node_modules'/module
 for p in folder.iterdir():
  if p.is_file() and p.name.lower().startswith(('license','notice')):chunks.append(module+' / '+p.name+'\n'+p.read_text(encoding='utf-8-sig',errors='replace'))
go_license=Path(a.go_license)
chunks.append('Go runtime / LICENSE\n'+go_license.read_text())
assert len(chunks)>10
(root/'THIRD-PARTY-LICENSES.txt').write_text('\n\n'+'\n\n'.join(chunks),encoding='utf-8')
print('Collected',len(chunks),'licence texts')
