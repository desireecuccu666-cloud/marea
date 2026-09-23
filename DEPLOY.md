# Marea — guida per alle prime armi (pubblicazione online)

## ⚡ QUICK START — le 6 cose da fare (10-15 minuti)

Il progetto è già un repository git pronto (commit fatto). Non devi scrivere una riga di codice.

1. **GitHub** (github.com) → account → **+ → New repository** → `marea` → Create
2. **Neon** (neon.tech) → "Create new database" → Frankfurt → Free → copia la connection string
3. **Vercel** (vercel.com) → "Add New → Project" → importa `marea` da GitHub
4. In Vercel, sezione **Environment Variables** → `DATABASE_URL` = stringa di Neon → **Deploy**
5. Aspetta 2-3 min → **sei online** 🔥
6. Quando vuoi i soldi: **stripe.com** → aggiungi il tuo **IBAN** nel conto → API key →
   `STRIPE_SECRET_KEY` in Vercel → Redeploy

I dettagli completi, i comandi esatti e la risoluzione dei problemi sono qui sotto.
Tempo totale: ~40 minuti. **Costo iniziale: 0€. I soldi: i tuoi, sul tuo IBAN.**

---

## Gli account che ti servono (tutti gratuiti)

| Serve per | Dove | Tempo |
|---|---|---|
| Conservare il codice | github.com | 2 min |
| Database | neon.tech | 3 min |
| Far girare il sito | vercel.com | 2 min |
| I soldi (dopo) | stripe.com | 10 min |

Fai i 3 account (GitHub, Neon, Vercel) **tutti con la tua stessa email** e, quando ti chiedono
di accedere a Neon/Vercel, usa sempre "Accedi con GitHub". Così si collegano da soli.

---

## PASSO 1 — Node.js (solo se non ce l'hai)

1. Vai su **nodejs.org** → scarica la versione **LTS** → installa (tutto "Avanti/Next").
2. Apri il terminale (Mac: "Terminale"; Windows: cerca "Powershell") e scrivi:
   `node -v` → se esce un numero tipo `v20.x.x` sei a posto.

## PASSO 2 — I file del progetto sul tuo computer

Esporta/salva questo progetto (tutte le cartelle: `src`, `public`, i file `.json`…) in una
cartella chiamata **`marea`**.
⚠️ La cartella `node_modules` NON serve: se c'è, cancellala (si scarica da sola).

## PASSO 3 — GitHub (dove vive il codice)

1. GitHub → in alto a destra **"+**" → **New repository**
2. Name: `marea` → **Create repository** (niente readme, niente licenza, tutto "No").
3. Nel terminale, dentro la cartella `marea`, incolla UNA RIGA ALLA VOLTA:

```
git init
git add .
git commit -m "prima versione marea"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/marea.git
git push -u origin main
```

(nei due punti `TUO-UTENTE` metti il tuo nome utente GitHub)

> Se Git non è installato: Windows → git-scm.com; Mac → di solito è già presente.
> Se ti chiede una password: GitHub oggi chiede un "Personal Access Token" — quando capita,
> segui la loro guida "create token" (5 min) oppure usa il client GitHub Desktop
> (github.com/desktop, più visuale, adatto a chi è alle prime armi).

## PASSO 4 — Il database su Neon

1. **neon.tech** → "Sign up with GitHub" → **Create new database**
2. Name: `marea` · Região/Region: **Europe (Frankfurt)** · Plan: **Free** → Create
3. A sinistra **Connection Details** → copia la **pooled connection string**
   (inizia con `postgresql://nome:password@...neon.tech/marea?sslmode=require`)
4. 📌 **Salvala in un post-it**: serve tra poco. Contiene la password del database, non mostrarla a nessuno.

## PASSO 5 — Vercel (il sito vero)

1. **vercel.com** → "Sign up with GitHub" → **Add New…** → **Project**
2. Importa il repo `marea` → **Continue**
3. Ti chiede configurazioni: lascia tutto come rilevato (Next.js) →
4. **Environment Variables** ⭐ (questo è il passo che tutti dimenticano):
   - `DATABASE_URL` = la connection string di Neon
   - (facoltativo ora) `NEXT_PUBLIC_APP_URL` = l'URL che Vercel ti dà alla fine
5. **Deploy** → aspetta 2-3 minuti → 🎉 il tuo sito è online su un link tipo
   `https://marea-xyz.vercel.app`

## PASSO 6 — Creare le tabelle nel database (una sola volta)

Nel terminale, dentro la cartella `marea`:

1. Crea un file `.env` con dentro SOLO questa riga:
   `DATABASE_URL=la-stringa-di-neon`
2. Incolla:
   ```
   npm install
   npx drizzle-kit push
   ```
   Se vedi `Changes applied` sei a posto. **I dati di esempio si creano da soli al primo login.**

## PASSO 7 — Prova!

Apri il link Vercel → **"Entra come ospite demo"**
(conto demo: `demo@marea.app` / password `marea123`).
Se vedi la community con le stanze: **fatto, sei online.**

---

## PASSO 8 — Il tuo dominio (facoltativo, ~10€)

1. Compra `marea.it` / `marea.com` dove preferisci (Namecheap, Aruba, GoDaddy…)
2. Vercel → progetto → **Domains** → incolla il dominio → Vercel ti dice quali DNS impostare
   (di solito: punto A o CNAME) → fai copia-incola nel pannello del dominio
3. In 10-60 minuti il dominio funziona, con HTTPS (lucchetto) automatico.

## PASSO 9 — I soldi: Stripe + il tuo IBAN

1. **stripe.com** → crea account (in molti paesi UE funziona anche come privato; per volumi
   seri serve la partita IVA — Stripe ti guida in italiano)
2. Dashboard Stripe → **Riporti (Reporting) → Conto → Aggiungi conto** →
   **qui inserisci il tuo IBAN**. I pagamenti ricevuti arrivano lì (commissione Stripe ~1,5-2%)
3. **Developers → API keys** → copia la **chiave segreta** (`sk_test_...` per provare con carte
   di test, poi `sk_live_...` per i soldi veri)
4. Vercel → progetto → **Settings → Environment Variables** → aggiungi:
   `STRIPE_SECRET_KEY` = la chiave
5. **Deploy** di nuovo (Settings → Deployments → Redeploy)
6. Finito: Marea+, Prima Posizione 5€, mance e Salotto d'Oro diventano pagamenti veri.
   Senza la chiave, restano simulati (perfetto per farti dare un giro da amici).

> Prova le carte di test Stripe: `4242 4242 4242 4242`, scadenza `12/30`, CVC `123`.

---

## Quando modifichi il codice in futuro

```
git add .
git commit -m "cosa ho cambiato"
git push
```
Vercel rileva il push e **rifa' il deploy da sola** (1-2 min). Le variabili d'ambiente non si toccano.

## Errori tipici da principiante e come risolverli

| Problema | Causa | Rimedio |
|---|---|---|
| Sito bianco/errore dopo un cambio | mancata variabile o errore di codice | Vercel → progetto → tab **Deployments** → guarda gli errori; console del browser (F12) |
| `DATABASE_URL is required` | variabile non salvata o salvata male | Vercel → Settings → Environment Variables → ricontrolla → **Redeploy** |
| Cambi la stringa di Neon (reset) | i vecchi dati spariscono | ricopia la nuova stringa in Vercel + nel `.env` locale → `npx drizzle-kit push` |
| `ECONNREFUSED` locale | Node/Postgres locale non parte | per la produzione non ti serve: basta Neon |
| Ho pushato la password? | `.env` caricato su GitHub | GitHub → Settings → Secrets: ruota subito le password di Neon e Stripe, e usa `.gitignore` (già incluso) |

## Checklist sicurezza PRIMA di invitarci gente (importante)

- [ ] Pagina privacy + termini (GDPR) — ti servono appena ci sono utenti reali
- [ ] Email di verifica reali (oggi in demo il codice è mostrato in pagina): usa Resend o
      Postmark (gratuiti all'inizio)
- [ ] Con gli spazi 13-17 attivi servono regole extra per i minori (DSA + legge italiana)
- [ ] Stripe: passa dalla chiave `sk_test` a `sk_live` solo quando sei pronto a incassare
- [ ] Backup: Neon li fa automaticamente; controlla che siano attivi
