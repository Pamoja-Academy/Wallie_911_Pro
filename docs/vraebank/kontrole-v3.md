# V3-skryfwerk-vraebank: herkoms en kontrole (11 Okt 2026)

## Herkoms
- Engels (7 items): geskryf met die Anthropic Batch API (claude-opus-5-5), een hoofbondel en een regstelbondel; daarna 6 klein handwysigings (formaat-kontrolelys, beplanning, verduideliking by eng-v3-A1 en eng-v3-C2).
- Afrikaans (7 items): geskryf met die Anthropic Batch API (claude-opus-5-5), een hoofbondel en een regstelbondel.
  - afr-v3-B1 en afr-v3-B4: volledig deur die model geskryf.
  - afr-v3-A1, afr-v3-A2, afr-v3-B2, afr-v3-B3 en afr-v3-B5: die model se uitset is afgesny (tokenlimiet). Die vraag, beplanning, formaat-kontrolelys en die eerste deel van die voorbeeldantwoord is die model se teks; die res van die voorbeeldantwoord, die verduideliking, nasienriglyn, bron en woordtelling-merkers is met die hand voltooi.
  - Ná die kontroleerders: klein handwysigings by A1, A2, B1, B2 en B3 (kontrolelys, opdrag, woordtelling-merker, een tydsverwysing, een sin). Elke wysiging is aangeteken.
  - 11 Okt 13:15, op Hanno se versoek (sonder enige modeloproep): afr-v3-B5 het 'n nuwe onderwerp gekry (sonkragligte in donker strate, verslag aan die buurtvereniging) omdat B4 en B5 albei oor 'n groentetuin gegaan het. Die opdrag, beplanning, voorbeeldantwoord, verduideliking en woordtelling is met die hand herskryf. Name is ook aangepas sodat geen naam in meer as een item voorkom nie (afr-v3-B5; eng-v3-A3: Kagiso en Bongani; eng-v3-B1: Naledi Khumalo).

## Vrystellingshek (item_gate_v3.py, al 14 items, volle lopie)
0 foute. Dit kontroleer: skema, bron en ankers letterlik op die DBE-bladsy, mengsel (EN A3/B2/C2, AF A2/B5), spelling (hunspell en_ZA/af_ZA met toelaatlys), geen 12 of meer opeenvolgende woorde uit die DBE-vraestel of -memo nie, punte gelyk aan die rubriek, woordtelling binne die grense, punte/woorde/tyd/rubriek per afdeling, net toegelate vakke, kontrolelys 4+ en beplanning 2–5.

Woordtellings: eng-v3-A1 281, A2 280, A3 278, B1 139, B2 139, C1 92, C2 93; afr-v3-A1 437, A2 431, B1 187, B2 184, B3 197, B4 196, B5 190.

## Onafhanklike kontroleerders (blind, via HF-router)
Engels (finale ronde): gpt-oss-120b struktuur 7/7 OK; GLM-5.3 7/7 OK; DeepSeek V4.1 Flash 5/7 OK (A2 en A3 AFWYKING, punte steeds in die Knap-tot-Uitsonderlik-band).

Afrikaans (finale stand; punte = die kontroleerder se eie nasien van die voorbeeldantwoord):

| item | gpt-oss struktuur | GLM-5.3 | DeepSeek V4.1 Flash |
|---|---|---|---|
| afr-v3-A1 | OK | OK 27 / 14 / 5 | OK 23 / 12 / 5 |
| afr-v3-A2 | OK | OK 27 / 14 / 5 | OK 28 / 14 / 5 |
| afr-v3-B1 | OK | OK 15 / 10 | AFWYKING 14 / 10 |
| afr-v3-B2 | OK | OK 15 / 10 | OK 14 / 9 |
| afr-v3-B3 | OK | OK 15 / 10 | AFWYKING 12 / 9 |
| afr-v3-B4 | OK | OK 14 / 9 | OK 14 / 9 |
| afr-v3-B5 | OK | OK 15 / 10 | OK 15 / 10 |

DeepSeek se AFWYKING by afr-v3-B1 (eerste ronde) het gegaan oor die adres "regs bo" (in gewone teks kan dit nie regs staan nie), die 2.X-nommering (die app se konvensie) en die woordtelling-merker (reggestel). By afr-v3-B3 is die bevinding (wie die gesprek begin) ná die ronde in die opdrag reggestel en daarna net deur GLM-5.3 herkontroleer (OK).

Let wel: die kontroleerderpunte vir afr-v3-B5 in die tabel geld vir die vorige weergawe (groentetuin). Die nuwe B5 is net deur die vrystellingshek (0 foute) en 'n handnasien gekontroleer, nie weer deur die modelle nie. Die naamveranderings by eng-v3-A3 en eng-v3-B1 verander niks anders aan daardie items nie.
