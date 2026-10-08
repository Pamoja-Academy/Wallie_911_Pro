# LESSONS

- Local-only Pa-dashboard is nie “afstand-eksamen monitering” nie: as Pa by kliente is, moet lewendige hartklop + push + sessie-verslag wolk-toe gaan (spes §5–7); moenie sê dit werk sonder remote sink.
- Wallie het ingestem tot waarneming/verslaggewing — moenie toestemming as blokkeerder gebruik; bou die remote sink + vrywaring-teks in die UI.
- Toets ’n derdeparty-sink met ’n egte versoek vóór jy daarop bou: ntfy.sh e-pos is anoniem af en FormSubmit se AJAX sit agter ’n Cloudflare-uitdaging.
- Moenie nie-Latin-1 karakters (—, á) in fetch-headers sit nie — fetch gooi stil; stuur ntfy title/tags/priority as query-parameters.
- Hardloop álle toetse (unit + e2e) ná elke kode-verandering vóór commit — nie net die een wat jy dink raak nie.
- ntfy.sh laat ~250 boodskappe/dag per IP toe: geen hartklop op ntfy nie, anders sterf slot-alarms ná ’n uur.
- Blok `ntfy.sh` (request-interception) in elke outomatiese blaaier-toets wat toestemming merk — anders kry Pa se foon vals SESSIE-VERSLAG/LES-seine (gebeur 8 Okt 15:03 UTC).
- `raw.githack.com`-skakels wys eers ’n eenmalige "External Content Notice" — sê vir Pa om **Open the page** te tik; toets in ’n regte blaaier, nie net `curl` nie.
- Moet nooit ’n lang GitHub `/releases/download/.../file.zip` URL in WhatsApp/chat sit sonder “kopieer heeltemal” — dit word afgekap → “Not Found”; stuur eerder die kort Pages-URL.
