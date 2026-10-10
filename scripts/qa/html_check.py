"""CAPS-HTML-hek (gratis). Die NSS RTT-merkersblad gebruik ou HTML-attribute (bgcolor, align, font ...),
dus is 'n moderne W3C-valideerder die verkeerde maatstaf. Hierdie toets: (1) goed-gevormd: elke oop merker
word in die regte volgorde gesluit (nesting), (2) net merkers/attribute op die NSS-merkersblad-lys,
(3) attribuutname in Engels (vang DBE-vertaalfoute soos tipe=/teks=), (4) die item se HTML-antwoord bevat
elke 'moet_bevat'-fragment. Exit 1 by enige fout."""
import json,sys,re
from html.parser import HTMLParser
VOID={'br','hr','img','meta','link','input'}
TAGS={'html','head','title','body','h1','h2','h3','h4','h5','h6','p','br','hr','b','i','u','strong','em','font','center',
'img','a','ul','ol','li','dl','dt','dd','table','tr','td','th','caption','div','span','sub','sup','blockquote','pre','marquee','form','input','meta'}
ATTRS={'bgcolor','background','text','link','vlink','alink','align','valign','color','face','size','width','height','src','alt','border',
'href','target','name','type','start','cellpadding','cellspacing','colspan','rowspan','title','bordercolor','value','id','style','noshade','behavior','direction'}
class P(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.st=[]; s.err=[]
    def handle_starttag(s,t,a):
        if t not in TAGS: s.err.append(f'onbekende merker <{t}>')
        for k,_ in a:
            if k not in ATTRS: s.err.append(f'attribuut nie op NSS-merkersblad nie: {k}= (in <{t}>)')
        if t not in VOID: s.st.append(t)
    def handle_startendtag(s,t,a): s.handle_starttag(t,a); (s.st.pop() if t not in VOID and s.st and s.st[-1]==t else None)
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.st or s.st[-1]!=t: s.err.append(f'verkeerde nesting/sluiting by </{t}> (oop: {s.st[-3:]})')
        else: s.st.pop()
def check(code,must=()):
    p=P(); p.feed(code); p.close()
    e=list(p.err)+([f'nie gesluit nie: {p.st}'] if p.st else [])
    low=re.sub(r'\s+',' ',code.lower())
    for m in must:
        if re.sub(r'\s+',' ',m.lower()) not in low: e.append(f'antwoord bevat nie: {m}')
    return e
if __name__=='__main__':
    items=json.load(open(sys.argv[1],encoding='utf-8')); rep=[];fail=0
    for it in items:
        h=it.get('toets',{}).get('html')
        if h:
            e=check(h['kode'],h.get('moet_bevat',[])); fail+=bool(e); rep.append({'id':it['id'],'ok':not e,'foute':e})
    json.dump(rep,open('html_report.json','w'),ensure_ascii=False,indent=1)
    print(f'html-items: {len(rep)}, foute: {fail}'); sys.exit(1 if fail else 0)
