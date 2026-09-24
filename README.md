# 🌊 Marea — la community internazionale

> Chat in tempo reale, stanze, match per interessi, sfoghi e marketplace.
> Nickname pubblico, identità verificata in privato. Spazi separati per età (13-17 / 18+).

**Sito live → https://marea-seven-phi.vercel.app** (prova con "Entra come ospite demo")

## Cosa c'è dentro

- **Chat live in tempo reale** (SSE): messaggi, "sta scrivendo…", contatori online, stanze globali, per lingua, gaming, sfoghi, **Live Anonimi** (nick casuale) e stanza premium a pass
- **Spazi per età verificati privatamente**: i gruppi 13-17 e 18+ non si mescolano mai — chat, match, videochiamate e acquisti separati
- **Match per interessi** dichiarati e opt-in, con reazioni e mini-chat
- **Videochiamate 1:1** con consenso camera, niente registrazioni
- **Messaggi vocali** reali (microfono)
- **Moderazione forte + bot dichiarati**: filtri per lingua, anti-truffa, report e blocco
- **Marketplace** con recensioni, protezione acquirenti e commissione 10%
- **Classifica live** con "Prima Posizione" a 5€/24h, **mance**, **Marea+** (abbonamento), **stanza premium**
- **Pagamenti Stripe** (test/live) con riconoscimento automatico anche se il redirect salta
- **5 lingue** (IT/EN/ES/FR/DE) con selettore istantaneo
- **Suoni**: effetti UI + onde marine ambientali, mute persistente

## Stack

Next.js 16 (App Router) · PostgreSQL · Drizzle ORM · SSE (Server-Sent Events) · Stripe Checkout · WebAudio · Tailwind CSS 4

## Avvio locale

```
npm install
# .env → DATABASE_URL=<postgres>
npm run dev
```

Le tabelle e i dati di esempio si creano da soli al primo accesso.

---

Costruito con cura. 🔒 I dati non si vendono, mai.
