"""Databasis-hek (gratis). Access-navrae kan nie op Linux loop nie; elke databasis-item gee daarom
(a) die Access-ontwerpaansig-antwoord (vir Wallie) en (b) 'n SQLite-ekwivalent + klein toetstabel +
verwagte rye. Ons voer (b) uit en vergelyk. Die kontroleerder (GPT-5.6 Sol) bevestig dat (a) en (b) dieselfde logika is."""
import json,sys,sqlite3
def run(t):
    c=sqlite3.connect(':memory:')
    for tb in t['tabelle']:
        cols=list(tb['rye'][0].keys())
        c.execute(f"create table {tb['naam']} ({','.join(cols)})")
        c.executemany(f"insert into {tb['naam']} values ({','.join('?'*len(cols))})",[tuple(r[k] for k in cols) for r in tb['rye']])
    got=[list(r) for r in c.execute(t['sqlite'])]
    return got,got==t['verwag']
if __name__=='__main__':
    items=json.load(open(sys.argv[1],encoding='utf-8')); rep=[];fail=0
    for it in items:
        t=it.get('toets',{}).get('sql')
        if t:
            got,ok=run(t); fail+=not ok; rep.append({'id':it['id'],'ok':ok,'kry':got,'verwag':t['verwag']})
    json.dump(rep,open('sql_report.json','w'),ensure_ascii=False,indent=1)
    print(f'sql-items: {len(rep)}, foute: {fail}'); sys.exit(1 if fail else 0)
