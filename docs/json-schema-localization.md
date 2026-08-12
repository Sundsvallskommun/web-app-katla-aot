# Språkstöd för JSON Schema-formulär

Status: Föreslaget kontrakt

Datum: 2026-08-12

## Syfte

Katla ska kunna visa ett JSON Schema-formulär på flera språk utan att språkvalet ändrar validering, schemaidentitet eller sparade verksamhetsuppgifter. Dokumentet avgränsar ägarskap och de invariants som en framtida implementation ska skydda.

Detta beslut aktiverar inte ett nytt språk. Det definierar kontraktet som ska vara uppfyllt innan ett språk läggs till.

## Nuläge

- Katla har locale-baserad routing och i18next, men endast `sv` är konfigurerat.
- JSON Schema och UI schema hämtas från JSON Schema-tjänsten. Schemat använder JSON Schema draft 2020-12.
- SupportManagement lagrar varje JSON-parameter som `key`, `value` och `schemaId`. Katlas genererade wire-typ använder `any` för `value`, så den verkliga rotvärdesgarantin måste komma från schemat och en validerad adapter, inte från TypeScript-typen.
- RJSF visar i dag `title`, `description`, enumetiketter och UI-schema-texter direkt från det hämtade schemat. Dessa texter är därför i praktiken svenska och inte kopplade till användarens locale.
- Valideringsmeddelanden och några formulärgemensamma texter går redan genom Katlas i18next-resurser.

## Jämförelse med web-app-draken-public

Katla och Draken använder samma grundidé, men implementationerna är inte utbytbara.

| Område | Katla | Draken public |
| --- | --- | --- |
| Språk | Endast `sv` | Endast `sv` |
| Schemakälla | JSON Schema-tjänsten, draft 2020-12 | JSON Schema-tjänsten, draft 2020-12 |
| Sparat kärnkontrakt | `key`, JSON-`value`, `schemaId` i ärendet | `key`, objekt-`value`, `schemaId` via en dedikerad JSON-parameter-endpoint |
| Uppdatering | Ingår i den bredare ärendeuppdateringen | Dedikerad PUT med `If-Match`/ETag och versionskontroll |
| Tillåtna rotvärden | SupportManagements wire-kontrakt beskriver ett generiskt JSON-värde; kontraktsadaptern bevarar objekt, arrayer och skalärer, medan Katlas aktuella visuella editor endast öppnar objekt | Drakens generella upstreamtyp är JSON, men den aktuella utrednings-endpointens skriv-DTO kräver objekt |
| Presentation | Svenska texter inbäddade i schema/UI schema | Svenska texter inbäddade i schema/UI schema |
| Lokaliseringslager för schema | Saknas | Saknas |

Draken är alltså en relevant referens för schemahämtning och versionsbunden data, men löser inte flerspråkighet. Drakens ETag-flöde visar dessutom en samtidighetsgaranti som Katlas breda ärendeuppdatering inte har; det ska hanteras som ett separat kontraktsbeslut och inte smygas in i språkimplementationen.

## Ägarskap

### JSON Schema-tjänsten

Äger:

- schemaidentitet, namn och version;
- valideringsregler och stabila maskinvärden;
- originaltext i `title` och `description`, som fungerar som fallback;
- UI-struktur som widgetval, ordning och sektionernas stabila id:n.

### SupportManagement

Äger den språkneutrala instansen:

```json
{
  "key": "avvikelse-plats-handelse",
  "schemaId": "2281_avvikelse-plats-handelse_1.0",
  "value": {
    "eventType": "DEVIATION"
  }
}
```

### Katlas frontend

Äger:

- vald locale och vanlig UI-översättning;
- en ren presentations-overlay för schemaannotationer;
- fallbackordning och kontrolltester för översättningar;
- tillgänglig rendering och testning på varje aktiverat språk.

Backendens schemaadapter returnerar efter kontraktshärdningen typade `schema`, `uiSchema` och `schemaId`. Ett framtida lokaliseringslager behöver dessutom typade `name` och `version`. Frontend får inte tolka version genom att dela upp schema-ID-strängen.

`name` och `version` är därmed ett uttryckligt nytt kontraktskrav inför lokaliseringslagret, inte ett påstående om dagens wire-format.

## Invariants

Följande regler är absoluta:

1. `value`, `key`, `schemaId`, egenskapsnamn och enumvärden översätts aldrig.
2. Locale får endast påverka presentation. Den får inte ändra `type`, `required`, format, villkor, gränsvärden eller andra valideringsord.
3. Ett befintligt ärende valideras och visas mot sitt exakta sparade `schemaId`, även efter att en ny schemaversion har publicerats.
4. Saknat eller ogiltigt `schemaId` repareras inte genom att märka data med latest-versionen. Flödet ska stoppa explicit.
5. Samma formulärdata ska serialiseras identiskt oavsett aktiv locale.
6. En saknad översättning använder schemats inbäddade text. Maskinnycklar ska inte visas som om de vore färdiga användartexter utan ett uttryckligt fallbackbeslut.
7. Översättningslagret får inte mutera det hämtade schemaobjektet eller den cachade originalversionen.

## Föreslagen presentationsmodell

Översättningar läggs i ett eget i18next-namespace för schemaformulär. Uppslagningen binds till:

- schema `name`;
- exakt schema `version`;
- semantisk måltyp;
- stabil fältsökväg, enumvärde eller UI-sektions-id.

Exempel på struktur:

```json
{
  "schemas": {
    "avvikelse-plats-handelse": {
      "versions": {
        "1.0": {
          "schema": {
            "/properties/location/title": "Plats",
            "/properties/location/description": "Välj var händelsen inträffade"
          },
          "enums": {
            "/properties/eventType": {
              "DEVIATION": "Avvikelse"
            }
          },
          "ui": {
            "/location/ui:placeholder": "Välj plats"
          },
          "sections": {
            "event-information": "Information om händelsen"
          }
        }
      }
    }
  }
}
```

Enumetiketter knyts till det stabila `const`-värdet, aldrig till positionen i `oneOf`. UI-sektioner knyts till sektionens id, aldrig till arrayindex.

En framtida overlay-funktion ska vara ren och endast få ersätta en uttrycklig allowlist av presentationsegenskaper:

- schema: `title`, `description` och enumalternativens `title`;
- UI schema: hjälptext, placeholder, knapptext och sektionstitlar;
- inga valideringsnyckelord eller sparade värden.

## Fallback och versionshantering

Uppslagning sker i följande ordning:

1. översättning för exakt `name` + `version` + semantiskt mål;
2. text som finns i exakt hämtad schema-/UI-schema-version;
3. en generisk, översatt komponenttext där en sådan är definierad.

Det ska inte finnas en implicit fallback från en schemaversion till en annan. Om samma översättning ska återanvändas mellan versioner ska det göras synligt i resursfilen eller genom ett granskat genereringssteg. Därmed kan en schemaändring inte av misstag få en gammal etikett med ny betydelse.

## Acceptanskriterier för första nya språket

Innan exempelvis engelska aktiveras ska följande vara klart:

- backendens schemarespons har ett validerat, typat kontrakt för `schemaId`, `name`, `version`, schema och UI schema;
- presentations-overlayn är en separat, testad funktion som inte kan ändra valideringsord;
- alla hårdkodade användartexter i berörda flöden är flyttade till i18next;
- locale-väljare, routing, dokumentets `lang` och sessionsbeteende är definierade;
- översättningsansvarig, granskningsflöde och fallbackägare är utsedda;
- både aktuell och minst en historisk schemaversion har komplett språkgranskning;
- tillgänglighet testas med långa texter, tangentbord, skärmläsarnamn, felmeddelanden och zoom/reflow på båda språken.

## Obligatoriska kontraktstester

1. Svenska och engelska overlays på samma schema producerar samma valideringsresultat.
2. Samma inmatning på båda språken producerar identiska `key`, `schemaId` och `value`.
3. Ett enumvärde förblir exempelvis `DEVIATION` även när etiketten ändras.
4. En historisk parameter använder sin exakta schemaversion och sin versionsbundna översättning.
5. Saknad översättning faller tillbaka till schematext utan krasch eller dataändring.
6. Saknat schema-ID stoppar redigering och sparning; latest används inte som reparation.
7. Overlayn ignorerar eller avvisar försök att översätta andra nycklar än allowlisten.
8. Automatiserade tillgänglighetstester körs per aktiverad locale, men kompletteras med manuell tangentbords- och skärmläsargranskning.

## Medvetet utanför detta beslut

- införande av ett konkret andra språk;
- maskinöversättning eller val av översättningsplattform;
- samtidighetskontroll/ETag för uppdatering av JSON-parametrar;
- utökning av Katlas visuella, objektorienterade editor till array- eller skalära JSON-rötter (transport, serialisering och validering ska redan bevara dessa rotvärden);
- migrering av verksamhetsdata eller schema-ID:n;
- lokalisering inne i JSON Schema-tjänsten.

Om JSON Schema-tjänsten senare får ett officiellt, versionsbundet locale-kontrakt ska detta beslut omprövas. Fram till dess ska Katla inte skicka locale till tjänsten och anta att svaret är lokaliserat.
