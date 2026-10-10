"""Wallie 911 – RTT V1 vraebank: deterministiese vrystellingshek (gratis).
Gebruik: python3 item_gate.py <items.json> <corpus_dir> [--slots ../rtt-v1-slots.json]
         python3 item_gate.py <items.json> NONE   (CI/publieke repo: geen korpus, G2/G3/G6 oorgeslaan)
gate_report.json word in die huidige gids geskryf (gitignored).
Faal (exit 1) by ENIGE fout. Toetse:
 G1 skema   G2 bron bestaan + bladsy bestaan   G3 anker-aanhalings staan letterlik op daardie bladsy (vraag + memo)
 G4 kognitiewe en onderwerp-mengsel (9/12/9; 8/10/6/4/2)   G5 Afrikaanse spelling (hunspell af_ZA; Engelse
 sagteware-terme tussen enkel-aanhalingstekens/backticks/kode word oorgeslaan)   G6 geen lang letterlike oorname
 van DBE-teks (>=12 opeenvolgende woorde) in vraag/verduideliking (kopiereg: 'gemodelleer op')
 G7 formules in LibreOffice   G8 HTML (NSS-merkersblad + nesting)   G9 SQL-ekwivalent in SQLite
 G10 punte: item.punte == som van nasienriglyn-punte."""
import json,sys,os,re,subprocess,collections
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0,os.path.dirname(__file__))
import html_check,sql_check
REQ={'id':str,'vak':str,'vraestel':int,'onderwerp':str,'vlak':int,'tipe':str,'punte':int,'vraag':str,'antwoord':str,
     'verduideliking':str,'nasienriglyn':list,'bron':dict,'toets':dict}
TOP={'woordverwerking':8,'sigblad':10,'databasis':6,'html':4,'algemeen':2}; LVL={1:9,2:12,3:9}
TIPES={'formule','stappe','kode','kort','meerkeuse'}
norm=lambda s:re.sub(r'\s+',' ',s.replace('’',"'").replace('‘',"'")).strip().lower()
EXT=r"(?:jpe?g|png|gif|bmp|svg|html?|css|js|docx?|xlsx?|accdb|mdb|csv|txt|pdf|rtf|pptx?|odt|ods)"
PROD={'Access','Excel','Word','PowerPoint','Writer','Calc','Base','Impress','Notepad','Windows','LibreOffice','Office','Microsoft','Chrome','Edge','Firefox'}
def strip_terms(s):
    # G5 v2: lêername (ClubBadge.jpg, Resepte.docx) en kaal lêeruitbreidings (jpg, .png, jpg-lêer)
    s=re.sub(r"\b[\w-]+\."+EXT+r"\b",' ',s,flags=re.I)
    s=re.sub(r"(?<![\w])\.?"+EXT+r"(?=-|\b)(-)?",' ',s,flags=re.I)
    # merker/simbool gevolg deur koppelteken-samestelling: <hr>-merker, #-tekens, &-teken, <>-teken -> merker/tekens/teken
    s=re.sub(r"(?:<[^<>]*>|[#&<>=+*/%$]+)-(?=\w)",' ',s)
    # weglatingskoppelteken (beletselteken) voor 'en'/'of': "oop- en sluitmerker" -> "oop en sluitmerker"
    s=re.sub(r"(\w)-(?=\s+(?:en|of)\s)",r"\1",s)
    # aanhaling/kode gevolg deur koppelteken-samestelling: 'Fiction'-boeke -> boeke
    s=re.sub(r"('[^'\s][^']*'|`[^`]*`)-(?=\w)",' ',s)
    # identifiseerders: CamelCase/lowerCamel (tblEntries, EntryFee, qryFees), ook met -samestelling
    s=re.sub(r"\b(?:[a-z]+[A-Z]|[A-Z][a-z0-9]+[A-Z])[A-Za-z0-9_]*-?",' ',s)
    s=re.sub(r"\b[A-Za-z]+_[A-Za-z0-9_]+\b",' ',s)
    s=re.sub(r"\b("+'|'.join(PROD)+r")\b(-)?",' ',s)
    s=re.sub(r"\b[A-Z][A-Za-z0-9]*-(?=[a-z])"," ",s)
    s=re.sub(r"(^|[\s(\u201c\"])'n\s",r"\1n_lw ",s)   # ook "('n heelgetal"
    s=re.sub(r"\b[A-Za-z]*[A-Z]{2,}[A-Za-z]*(-\w+)?",' ',s)
    s=re.sub(r"`[^`]*`|'[^']*'|\"[^\"]*\"|<[^>]*>|=[A-Z][A-Za-z0-9_.,:$!()\"<>=*&% -]*|\[[^\]]*\]",' ',s)
    s=re.sub(r"\b[a-z]+=",' ',s)            # HTML-attribuut voor '=' (alt=, title=)
    s=re.sub(r"(?<!\w)[-–→]+(?!\w)",' ',s)   # los koppeltekens/pyle
    return s
def spell(text,allow):
    words=subprocess.run(['hunspell','-d','af_ZA','-l'],input=strip_terms(text),capture_output=True,text=True).stdout.split()
    return sorted({w for w in words if w!='n_lw' and w.lower() not in allow and not re.search(r'\d',w) and not w.isupper()})
def main():
    skip=set(); 
    for a in sys.argv:
        if a.startswith('--skip='): skip=set(a[7:].split(','))
    corpus_ok=sys.argv[2]!='NONE' and os.path.isdir(sys.argv[2])
    if not corpus_ok: skip|={'G2','G3','G6'}
    items=json.load(open(sys.argv[1],encoding='utf-8')); corpus=sys.argv[2]
    allow={w.strip().lower() for w in open(os.path.join(os.path.dirname(__file__),'af_allow.txt'),encoding='utf-8') if w.strip()}
    errs=collections.defaultdict(list); ids=set()
    for it in items:
        i=it.get('id','?')
        for k,t in REQ.items():
            if not isinstance(it.get(k),t) or (t in (str,list,dict) and not it.get(k)): errs[i].append(f'G1 veld ontbreek/verkeerd: {k}')
        if i in ids: errs[i].append('G1 dubbele id')
        ids.add(i)
        if it.get('tipe') not in TIPES: errs[i].append(f"G1 tipe onbekend: {it.get('tipe')}")
        b=it.get('bron',{})
        for k in ('verwysing','vraestel_leer','bladsy','memo_leer','memo_bladsy','anker_vraag','anker_memo'):
            if not b.get(k): errs[i].append(f'G2 bron.{k} ontbreek')
        if not re.match(r'^DBE (Nov|Junie|Feb/Mrt) 20\d\d V1 V\d+(\.\d+){1,2}$',b.get('verwysing','')): errs[i].append(f"G2 verwysingformaat: {b.get('verwysing')}")
        for f,p,a,tag in ((b.get('vraestel_leer'),b.get('bladsy'),b.get('anker_vraag'),'vraag'),(b.get('memo_leer'),b.get('memo_bladsy'),b.get('anker_memo'),'memo')):
            if not f: continue
            pg=os.path.join(corpus,f.replace('.pdf',''),f'p{int(p or 0):02d}.txt')
            if not os.path.exists(pg): errs[i].append(f'G2 bron/bladsy bestaan nie: {f} b.{p}'); continue
            if a and norm(a) not in norm(open(pg,encoding='utf-8').read()): errs[i].append(f'G3 {tag}-anker nie letterlik op {f} b.{p} nie: "{a[:60]}"')
            if a and len(a)<20: errs[i].append(f'G3 {tag}-anker te kort (<20 karakters)')
        # G6 letterlike oorname
        src=norm(' '.join(open(os.path.join(corpus,b['vraestel_leer'].replace('.pdf',''),f"p{int(b['bladsy']):02d}.txt"),encoding='utf-8').read().split())) if b.get('vraestel_leer') and os.path.exists(os.path.join(corpus,b['vraestel_leer'].replace('.pdf',''),f"p{int(b.get('bladsy') or 0):02d}.txt")) else ''
        for fld in ('vraag','verduideliking'):
            w=norm(it.get(fld,'')).split()
            for k in range(len(w)-11):
                if ' '.join(w[k:k+12]) in src: errs[i].append(f'G6 {fld}: >=12 woorde letterlik uit DBE-vraestel'); break
        bad=[] if 'G5' in skip else spell(' '.join([it.get('vraag',''),it.get('verduideliking','')]+[str(x.get('kriterium','')) for x in it.get('nasienriglyn',[])]),allow)
        if bad: errs[i].append(f'G5 spelling (af_ZA): {bad}')
        if sum(int(x.get('punte',0)) for x in it.get('nasienriglyn',[]))!=it.get('punte'): errs[i].append('G10 punte stem nie met nasienriglyn nie')
        if it.get('onderwerp')=='sigblad' and 'formule' not in it.get('toets',{}): errs[i].append('G7 sigblad-item sonder formuletoets')
        if it.get('onderwerp')=='html' and 'html' not in it.get('toets',{}): errs[i].append('G8 html-item sonder html-toets')
        if it.get('onderwerp')=='databasis' and it.get('tipe')=='formule' and 'sql' not in it.get('toets',{}): errs[i].append('G9 navraag-item sonder SQL-toets')
    partial='--partial' in sys.argv
    c1=collections.Counter(x.get('onderwerp') for x in items); c2=collections.Counter(x.get('vlak') for x in items)
    if not partial and dict(c1)!=TOP: errs['_mengsel'].append(f'G4 onderwerpe {dict(c1)} != {TOP}')
    if not partial and dict(c2)!=LVL: errs['_mengsel'].append(f'G4 vlakke {dict(c2)} != {LVL}')
    for it in items:
        t=it.get('toets',{})
        if 'html' in t:
            e=html_check.check(t['html']['kode'],t['html'].get('moet_bevat',[])); errs[it['id']]+= [f'G8 {x}' for x in e]
        if 'sql' in t:
            got,ok=sql_check.run(t['sql']);
            if not ok: errs[it['id']].append(f'G9 SQLite kry {got} verwag {t["sql"]["verwag"]}')
    if 'G7' not in skip and any('formule' in it.get('toets',{}) for it in items):
        import formula_check
        for it in items:
            if 'formule' in it.get('toets',{}):
                for r in formula_check.run(it):
                    if not r['ok']: errs[it['id']].append(f"G7 {r['sel']} {r['formule']} kry {r['kry']} verwag {r['verwag']}")
    errs={k:[e for e in v if e[:3].rstrip() not in skip and e[:2] not in skip] for k,v in errs.items()}
    errs={k:v for k,v in errs.items() if v}
    if skip: print('OORGESLAAN (moet elders loop):',sorted(skip))
    json.dump({'items':len(items),'oorgeslaan':sorted(skip),'foute':errs},open('gate_report.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
    print(f"items: {len(items)}  items met foute: {len(errs)}  totale foute: {sum(map(len,errs.values()))}")
    for k,v in errs.items(): print(' ',k,'|','; '.join(v)[:400])
    sys.exit(1 if errs else 0)
if __name__=='__main__': main()
