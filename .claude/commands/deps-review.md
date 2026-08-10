---
description: Säkerhetsgranska beroenden och åtgärda rotorsaken lokalt
---

Genomför en säkerhetsgenomgång av projektets beroenden. Prioritera uppgraderingar av den komponent som äger problemet; använd endast en snävt avgränsad `resolution` när en transitiv förälder ännu inte kan uppgraderas.

## 1. Kartlägg

- Hämta öppna Dependabot-varningar med `gh api --paginate repos/{owner}/{repo}/dependabot/alerts` och filtrera `state == "open"`.
- Hämta öppna CodeQL-varningar med `gh api --paginate "repos/{owner}/{repo}/code-scanning/alerts?state=open"`.
- Gruppera fynden per paket, manifest (`frontend/` respektive `backend/`), severity och runtime/dev-scope.
- Spåra transitiva beroenden med `rg` i respektive `yarn.lock` och `yarn why <paket>`.
- Kontrollera aktuell direkt- och transitiv version med `npm view` innan ett versionsval görs.

## 2. Åtgärda i ägarordning

1. Uppgradera ett direkt sårbart beroende i rätt `package.json`.
2. Om beroendet är transitivt, uppgradera först den direkta föräldern som äger versionsintervallet.
3. Regenerera låsfilen med Yarn och granska att endast avsedda paket ändrades. Kopiera inte en låsfil mellan frontend och backend och handredigera inte integritetsvärden.
4. Om ingen kompatibel föräldraversion finns, använd en majorbegränsad `resolution` (exempelvis `^6.15.2`) och dokumentera ägare, orsak och villkor för borttagning.
5. Ta bort resolutions som blivit överflödiga efter föräldrauppgraderingen.

Ändra inte SAML-, inloggnings- eller API-beteende som en bieffekt av beroendeunderhåll. Om ett majorbyte kräver beteendeförändringar ska det göras och testas som en separat, reviewbar ändring.

## 3. Verifiera från ren installation

Kör `yarn install --frozen-lockfile` i både `backend/` och `frontend/`. Kör därefter:

### Backend

- `yarn lint:strict`
- `yarn format:check`
- `yarn type-check`
- `yarn test`
- `yarn build`
- `yarn audit --json`

### Frontend

- `yarn lint:strict`
- `yarn format:check`
- `yarn type-check`
- `yarn test:coverage`
- `yarn playwright install chromium`
- `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn build`
- `NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false yarn e2e`
- `yarn audit --json`

Kontrollera de patchade versionerna i låsfilerna och dokumentera eventuella upstream-varningar utan tillgänglig fix. Om `@xmldom/xmldom`, `xml-crypto`, `xml-encryption` eller `@node-saml/*` ändrats måste SAML-inloggning och logout dessutom verifieras manuellt i testmiljön före merge.

## 4. Leverera

- Redovisa paket, tidigare version, ny version, scope och vilka varningar som stängs.
- Lista kvarvarande fynd med skäl, riskbedömning och konkret nästa åtgärd.
- Håll commits avgränsade och använd inga `Co-Authored-By`- eller genererat-av-rader.

$ARGUMENTS
