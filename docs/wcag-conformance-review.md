# WCAG 2.2 – konformitets- och gaprapport

Status: Teknisk nulägesgranskning, inte konformitetsintyg

Datum: 2026-08-12

Mål: WCAG 2.2 nivå AA

## Sammanfattning

Katla kan inte i nuläget beskrivas som helt WCAG 2.2 AA-anpassad. Granskningen har identifierat och åtgärdat flera konkreta semantik- och tangentbordsproblem i separata kodslices, men full konformitet gäller hela sidor och kompletta processer. Den kräver därför både automatiserad kontroll och dokumenterad manuell utvärdering i realistiska användarflöden.

Detta dokument är den kanoniska förvaltningsrapporten för kvarvarande konformitetsarbete. Komponenternas beteende och tester ägs fortsatt av respektive komponentmodul.

## Omfattning och metod

Granskningen omfattar statisk kodanalys och beteendetester för centrala navigations-, meny-, tabell-, notifierings-, filter- och JSON Schema-formulärkomponenter. Följande ingår inte ännu:

- komplett manuell tangentbordsgenomgång av alla sidor och processer;
- skärmläsartest på representativa kombinationer av operativsystem, webbläsare och hjälpmedel;
- visuell granskning vid 200 och 400 procents zoom samt smal viewport;
- kontrastmätning för alla tillstånd och färglägen;
- användartest med personer som använder hjälpmedel;
- ett kriterium-för-kriterium-protokoll med utfall, evidens, ägare och datum.

Automatiserade tester betraktas därför som regressionsskydd, inte som ensam konformitetsevidens.

## Reviewbara kodslices

### Tabellprimitiver

Ägare: ärendetabellen.

Genomfört och automatiskt verifierat:

- explicit `tbody` genom designsystemets `Table.Body`;
- en riktig, namngiven länk i stället för en klickbar och tabbfokuserbar tabellrad;
- annonserad initial laddningsstatus;
- beteendetest för länk, tabellstruktur och laddningsstatus.

Detta tar bort dubblerad tangentbordslogik och gör navigationens semantik entydig.

### Kontroll- och menysemantik

Ägare: respektive navigation-, meny-, filter- och notifieringskomponent.

Genomfört och automatiskt verifierat:

- riktiga länkar för navigationskontroller och flikar;
- funktionella tillgängliga namn på ikonknappar och menyutlösare;
- notifieringsantal, `aria-expanded` och `aria-controls`;
- radio-grupper för färgläge med gemensamt namn och översatta etiketter;
- dekorativa ikoner döljs för tillgänglighetsträdet;
- borttagning av positivt `tabIndex` från skip-länk;
- en enda interaktiv kontroll i mobilens ärendekort;
- beteendetester som skyddar de centrala kontrollkontrakten.

### JSON Schema-formulär

Ägare: JSON-formulärets gemensamma fält-, widget- och sanitiseringslager.

Genomfört och automatiskt verifierat:

- gemensam etikett-, hjälptext-, fel- och obligatoriskhetskoppling;
- native `fieldset`/`legend` för radiogrupper;
- korrekt `disabled`, `readonly`, fokus och invalid-status i berörda widgetar;
- SSR-säker länksanering utan renderingsberoende av `DOMParser`;
- fail-closed hantering av länkars `target` och säker `_blank`-presentation;
- språkneutral new-tab-indikering via i18next-resurs;
- beteende- och SSR-tester för dessa kontrakt.

## Kända gap som blockerar ett konformitetsintyg

### P1 – fullskärmslager saknar verifierat dialogkontrakt

Flera fullskärmslager och paneler behöver inventeras som en separat slice. För varje modal dialog måste initialt fokus, fokusfälla, Escape-stängning, inert bakgrund, ett synligt stängningssätt och återställning av fokus till den utlösande kontrollen verifieras. Att bara använda `role="dialog"` eller visa en panel visuellt är inte tillräckligt.

Acceptans:

- en gemensam dialogägare eller designsystemsprimitiv används;
- beteendetester verifierar initialt fokus, Tab/Shift+Tab, Escape och fokusåterställning;
- manuell skärmläsar- och tangentbordskontroll dokumenteras.

### P1 – komplett tangentbords- och skärmläsarprocess saknas

Registrera ärende, filtrera/sortera, öppna och uppdatera ärende, notifieringar, session/logout samt fel- och konfliktflöden behöver köras från början till slut utan mus.

Acceptans:

- alla funktioner kan genomföras med tangentbord;
- fokusordning, fokusindikering och dynamiska meddelanden dokumenteras;
- testprotokollet anger hjälpmedel, webbläsare, version, testare och datum.

### P1 – visuell och responsiv verifiering är ofullständig

Kontrast, textförstoring, reflow, textavstånd, orientering och färgoberoende behöver granskas på båda färglägena och i alla viktiga tillstånd, inklusive fel, fokus, disabled och hover.

Acceptans:

- mätresultat och skärmbilder länkas per berört kriterium;
- avvikelser får ägare, prioritet och regressionstest där det är möjligt.

### P2 – språkstöd måste tillgänglighetstestas per locale

När ett andra språk aktiveras måste dokumentets `lang`, locale-routing, långa etiketter, felmeddelanden, uppläsning och reflow verifieras på varje språk. JSON Schema-översättningar får endast ändra presentation; värden, egenskapsnamn, enumvärden, schema-ID och valideringsregler ska förbli identiska.

Acceptans:

- samma verksamhetsdata serialiseras identiskt för varje locale;
- tillgängliga namn och beskrivningar är fullständiga och begripliga på respektive språk;
- automatiserade tester körs per locale och kompletteras manuellt.

### P2 – löpande regressionsgrind behöver formaliseras

CI bör köra typkontroll, lint, komponenttester, produktionsbygge och en automatiserad tillgänglighetskontroll på representativa sidor. Resultatet ska följas upp, men verktygsresultatet får inte ensamt användas för att hävda konformitet.

## Rekommenderad evidensmatris

Förvalta en rad per WCAG-kriterium med minst följande fält:

| Fält | Innehåll |
| --- | --- |
| Kriterium | Nummer, namn och nivå |
| Omfattning | Berörda sidor, komponenter och processer |
| Utfall | Godkänd, underkänd, ej testad eller ej tillämplig |
| Evidens | Test, skärmbild, mätning eller protokoll |
| Metod | Automatisk, manuell eller båda |
| Miljö | Webbläsare, OS, hjälpmedel och version |
| Ägare | Ansvarigt team eller komponentägare |
| Datum | Senaste verifiering och nästa omtest |
| Avvikelse | Länk till issue/PR och planerad åtgärd |

## Definition of done för WCAG 2.2 AA

Katla får beskrivas som WCAG 2.2 AA-konform först när:

1. samtliga sidor och kompletta processer i definierad omfattning har utvärderats;
2. varje tillämpligt A- och AA-kriterium har dokumenterad evidens utan öppet blockerande fel;
3. tangentbord, skärmläsare, zoom/reflow, kontrast och dynamiska tillstånd har testats manuellt;
4. automatiserade regressionstester och en återkommande manuell omtestprocess finns;
5. undantag, tredjepartsberoenden och eventuella partiella konformitetsuttalanden är juridiskt och verksamhetsmässigt granskade;
6. rapporten anger version/commit, testmiljö, datum, ansvarig och giltighetsperiod.

## Referenser

- W3C, Web Content Accessibility Guidelines (WCAG) 2.2: <https://www.w3.org/TR/WCAG22/>
- WAI-ARIA Authoring Practices, Modal Dialog Pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- W3C WAI, Evaluating Web Accessibility Overview: <https://www.w3.org/WAI/test-evaluate/>
