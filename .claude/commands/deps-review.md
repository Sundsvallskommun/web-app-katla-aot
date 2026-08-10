---
description: Säkerhetsgenomgång av beroenden — hämta GitHub-varningar och åtgärda rotorsaken lokalt
---

Genomför en säkerhetsgenomgång av projektets beroenden och åtgärda öppna varningar. Arbeta enligt principen **rotorsak före resolutions** — en resolution är en tickande bomb som döljer att grundproblemet finns kvar.

## 1. Kartlägg

- Hämta öppna Dependabot-varningar: `gh api repos/{owner}/{repo}/dependabot/alerts --paginate` (filtrera `state=="open"`). Gruppera per paket, manifest (`frontend/` resp. `backend/`), severity och scope (runtime/development).
- Hämta öppna code scanning-varningar: `gh api "repos/{owner}/{repo}/code-scanning/alerts?state=open"`.
- Identifiera för varje sårbart paket: är det ett direkt beroende eller transitivt? Vid transitivt — vilken förälder drar in det (`grep` i yarn.lock) och tillåter förälderns versionsintervall den patchade versionen?

## 2. Åtgärda — i denna prioritetsordning

1. **Direkt beroende:** bumpa versionen i `package.json` (frontend och/eller backend).
2. **Transitivt, patchad version inom förälderns intervall:** ta bort paketets poster ur `yarn.lock` och kör `yarn install` så att det omresolveras. Inga resolutions behövs.
3. **Transitivt, exakt-pinnat av förälder:** bumpa föräldern om nyare version finns (gäller ofta `@sk-web-gui/*` — kolla `npm view <pkg> dependencies`).
4. **Sista utväg:** en snävt avgränsad resolution (`"paket": ">=x.y.z"`) — dokumentera i PR:en varför den behövs och vad som krävs för att ta bort den (t.ex. Express 5-migreringen för `qs`).

Passa också på att ta bort resolutions som blivit obsoleta (förälderns eget intervall når numera den patchade versionen).

## 3. Verifiera

Kör i **både** `frontend/` och `backend/`:

- `yarn type-check`
- `yarn build`
- `yarn lint`
- `yarn jest:coverage` (frontend) / `yarn test` (backend)

Kontrollera patchade versioner i lockfilerna. **Om `@xmldom/xmldom`, `xml-crypto`, `xml-encryption` eller `@node-saml/*` ändrats: flagga att SAML-inloggning måste testas manuellt i testmiljö före merge** — de ligger i signaturverifieringskedjan.

## 4. Leverera

- Skapa en branch och en PR mot `main` med en tabell: paket, från-version, till-version, vilka varningar som släcks.
- Lista varningar som INTE kunnat åtgärdas och varför, med förslag på väg framåt.
- Inga Co-Authored-By- eller genererat-av-rader i commits/PR.

$ARGUMENTS
