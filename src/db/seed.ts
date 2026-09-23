import { count, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "./index";
import * as s from "./schema";
import { hashPw } from "@/lib/auth";
import { ensureSchema } from "./bootstrap";

let seeding: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seeding) seeding = run().catch((e) => { seeding = null; throw e; });
  return seeding;
}

const ago = (mins: number) => new Date(Date.now() - mins * 60000);
const days = (n: number) => new Date(Date.now() - n * 864e5);
const PW = hashPw("marea123");
const anon = (l: string) => {
  const p = { it: "Anonimo", en: "Anon", es: "Anónimo", fr: "Anon", de: "Anonym" }[l] ?? "Anon";
  return `${p} #${1000 + Math.floor(Math.random() * 9000)}`;
};

type U = [id: string, nick: string, email: string, country: string, lang: string, group: string, bio: string, hue: number, interests: string[], verified: boolean, plus: boolean, isBot: boolean, createdDaysAgo: number];

const USERS: U[] = [
  ["u-onda", "Onda_Demo", "demo@marea.app", "IT", "it", "adult", "Curiosa. Amo le onde, i beat lo-fi e le chiacchiere notturne.", 174, ["music", "gaming", "travel", "art"], true, false, false, 40],
  ["u-kaito", "Kaito", "kaito@marea.app", "JP", "en", "adult", "Retro games, lo-fi beats, vending machines.", 205, ["gaming", "tech", "music"], true, true, false, 85],
  ["u-mara", "Mara_V", "mara@marea.app", "ES", "es", "adult", "Surfer. Fotografo il mare quando non fotografo gente.", 330, ["art", "travel", "photography"], true, false, false, 70],
  ["u-nino", "Nino", "nino@marea.app", "IT", "it", "adult", "Chitarrista di sera, studente di giorno.", 25, ["music", "sports", "food"], false, false, false, 55],
  ["u-elodie", "Elodie", "elodie@marea.app", "FR", "fr", "adult", "Designer che impara a non rimandare tutto.", 280, ["study", "art", "books"], true, true, false, 90],
  ["u-rio", "Rio", "rio@marea.app", "BR", "es", "adult", "Café bien cargado e fotografia di viaggio.", 15, ["travel", "photography", "sea"], false, false, false, 30],
  ["u-zef", "Zef", "zef@marea.app", "DE", "de", "adult", "Code bei Nacht, Playlist bei Tag.", 245, ["music", "tech"], false, false, false, 60],
  ["u-anouk", "Anouk", "anouk@marea.app", "NL", "fr", "adult", "Dancer, linguista, sempre in movimento.", 350, ["dance", "languages", "travel"], true, false, false, 45],
  ["u-theo", "Theo", "theo@marea.app", "GB", "en", "adult", "Speedruns, chitarrismo mediocre, playlist infinite.", 190, ["gaming", "tech", "music"], true, true, false, 75],
  ["u-luna", "Luna_9", "luna@marea.app", "IT", "it", "adult", "Astronoma dilettante, illustratrice per passione.", 260, ["art", "space", "books"], false, false, false, 20],
  ["u-vera", "Vera", "vera@marea.app", "AT", "de", "adult", "Läuferin. Bücher. Ruhe.", 100, ["sports", "books"], false, false, false, 35],
  ["u-nova", "Nova", "nova@marea.app", "IT", "it", "minor", "Gamer di giorno, sognatrice di notte.", 210, ["gaming", "music", "art"], true, false, false, 25],
  ["u-sky", "Sky", "sky@marea.app", "FR", "fr", "minor", "Je code le week-end, je joue toujours.", 150, ["gaming", "tech", "coding"], true, false, false, 30],
  ["u-rae", "Rae", "rae@marea.app", "ES", "es", "minor", "Danza, arte, y música a todo volumen.", 320, ["art", "dance", "music"], true, false, false, 18],
  ["u-ken", "Kenji", "ken@marea.app", "JP", "en", "minor", "Anime, arcade, and rainy afternoons.", 260, ["gaming", "music"], false, false, false, 22],
  ["u-brisa", "Brisa", "brisa@bot.marea.app", "IT", "it", "adult", "Bot della community Marea. Sono dichiarata, non invadente.", 168, ["sea"], true, false, true, 100],
  ["u-pixel", "Pixel", "pixel@bot.marea.app", "JP", "en", "adult", "Marea bot — gaming room. I win, you learn.", 200, ["gaming"], true, false, true, 100],
  ["u-porto", "Porto", "porto@bot.marea.app", "IT", "it", "adult", "Bot del porto. Le onde aspettano.", 20, ["sea"], true, false, true, 100],
  ["u-byte", "Byte", "byte@bot.marea.app", "GB", "en", "adult", "Marea bot — deep talks. Keep it kind.", 220, ["tech"], true, false, true, 100],
  ["u-noctis", "Noctis", "noctis@bot.marea.app", "IT", "it", "adult", "Bot della Marea Nera. 18+ o via. Sempre.", 280, ["sea"], true, false, true, 100],
  ["u-bolla", "Bolla", "bolla@bot.marea.app", "IT", "it", "minor", "Bot dei gruppi 13-17. Gioco e rispetto.", 190, ["gaming"], true, false, true, 95],
  ["u-coral", "Corallo", "corallo@bot.marea.app", "IT", "it", "minor", "Bot del gruppo 13-17. Qui si sta bene.", 335, ["art"], true, false, true, 95],
  ["u-assist", "Marea.Assist", "assist@bot.marea.app", "IT", "it", "adult", "Bot ufficiale di moderazione e benvenuto. Dichiarato.", 45, ["tech"], true, false, true, 120],
];

const ROOMS: [id: string, slug: string, name: string, desc: string, kind: string, language: string | null, group: string, isAdult: boolean, hue: number][] = [
  ["r-general", "maree", "Maree Generali", "La stanza globale degli adulti: parla con tutto il mondo.", "general", null, "adult", false, 174],
  ["r-gen13", "maree-1317", "Maree 13-17", "La stanza globale dei ragazzi. Spazio protetto, bot sempre presenti.", "general", null, "minor", false, 190],
  ["r-live18", "live-anonimi-18", "Live Anonimi 18+", "Chat live anonima: ogni messaggio ha un nome di onda casuale.", "live", null, "adult", false, 350],
  ["r-live13", "live-anonimi-1317", "Live Anonimi 13-17", "Live anonima dei ragazzi: parla senza nome, resta con i tuoi.", "live", null, "minor", false, 335],
  ["r-deep", "deep-talks", "Deep Talks", "Slow conversations. English only, no rush.", "general", "en", "adult", false, 220],
  ["r-mesa", "mesa-larga", "Mesa Larga", "Charla lenta en español. Café y marea.", "general", "es", "adult", false, 25],
  ["r-gaming", "gaming-zone-18", "Gaming Zone 18+", "Partite, speedrun e playlist. Qui si gioca con la testa.", "gaming", null, "adult", false, 205],
  ["r-gaming13", "gaming-zone-1317", "Gaming Zone 13-17", "Il salotto gaming dei ragazzi: partite e playlist.", "gaming", null, "minor", false, 210],
  ["r-vent", "porto-18", "Porto — Sfoghi 18+", "Spazio per sfogarsi con calma. Zero giudizio.", "vent", null, "adult", false, 20],
  ["r-vent13", "sfoghi-1317", "Sfoghi 13-17", "Spazio per sfogarsi, protetto e moderato dai bot.", "vent", null, "minor", false, 340],
  ["r-nera", "marea-nera", "Marea Nera 18+", "Spazio adulto. Verifica privata, moderazione forte.", "adult", null, "adult", true, 280],
  ["r-oro", "salotto-oro", "Salotto d'Oro 18+", "La stanza premium: eventi live, ospiti e chat del gruppo. Pass 24h.", "premium", null, "adult", false, 45],
];

type M = [id: string, room: string, user: string, text: string, minsAgo: number, kind?: string, flagged?: boolean, alias?: string];
const MSGS: M[] = [
  ["m01", "r-general", "u-assist", "Bot Marea attivo: moderazione automatica di link, parole e truffe. Sono dichiarato.", 600, "system"],
  ["m02", "r-general", "u-kaito", "buonasera da Tokyo, chi è sveglio?", 200],
  ["m03", "r-general", "u-onda", "ciao! da Roma, onda tranquilla stasera", 190],
  ["m04", "r-general", "u-mara", "buenas! vengo dal surf, qualcuno mi consiglia qualcosa da guardare?", 150],
  ["m05", "r-general", "u-nino", "la serie sui sommozzatori è top, giuro", 140],
  ["m06", "r-general", "u-elodie", "hello from Paris, first time here. be kind to each other ok?", 120],
  ["m07", "r-general", "u-brisa", "ogni mare ha le sue regole: qui si rispetta chi arriva dopo di te", 110],
  ["m08", "r-general", "u-zef", "gute nacht kommt später, noch code push", 90],
  ["m09", "r-general", "u-theo", "yo Zef, lag sulla build di stasera? io ci sono", 80],
  ["m10", "r-general", "u-rio", "offro account gratis, scrivimi subito su whatsapp: http://bit.ly/xx123", 60, "text", true],
  ["m11", "r-general", "u-assist", "Segnalazione automatica: link esterno nascosto alla community. Grazie alla moderazione.", 58],
  ["m12", "r-general", "u-luna", "che bello vedere la moderazione in azione, ci si sente al sicuro qui", 50],
  ["m13", "r-general", "u-onda", "concordo. il nickname basta e avanza", 45],

  ["m20", "r-gen13", "u-bolla", "Spazio 13-17: qui si gioca e si chatta. Io sono Bolla, bot della stanza.", 500, "system"],
  ["m21", "r-gen13", "u-nova", "ciao a tutti! da oggi sono qui, vengo dal gaming zone", 160],
  ["m22", "r-gen13", "u-sky", "bonjour! qualcuno vuole fare una partita stasera?", 150],
  ["m23", "r-gen13", "u-rae", "io parto, ma solo se c'è una playlist buona", 140],
  ["m24", "r-gen13", "u-ken", "io ci sono, ma la mia madre mi manda a letto alle 23:30", 130],
  ["m25", "r-gen13", "u-bolla", "regola d'oro: rispetto prima di tutto, e i bot ci guardano con cura", 120],

  ["m30", "r-live18", "u-brisa", "Live anonimi: ogni messaggio firma con un nome di onda casuale.", 500, "system"],
  ["m31", "r-live18", "u-kaito", "chi altro è alzato a quest'ora?", 95, "text", false, "Anon #2214"],
  ["m32", "r-live18", "u-elodie", "io, con una tazza di tè che fa rumore", 90, "text", false, "Anon #7731"],
  ["m33", "r-live18", "u-nino", "il tè alle 2 di notte è filosofia", 85, "text", false, "Anon #4102"],
  ["m34", "r-live18", "u-anouk", "qualcuno vuole una canzone per la playlist di stanotte?", 70, "text", false, "Anon #9915"],

  ["m40", "r-live13", "u-coral", "Live anonima 13-17: parla, gioca, resta con i tuoi.", 500, "system"],
  ["m41", "r-live13", "u-nova", "qualcuno ha la soluzione del livello 7?!", 80, "text", false, "Anon #3327"],
  ["m42", "r-live13", "u-sky", "sì sì, ma senza spoiler, solo un indizio", 75, "text", false, "Anon #8856"],
  ["m43", "r-live13", "u-ken", "l'indizio: guarda la mappa al contrario", 70, "text", false, "Anon #1543"],

  ["m50", "r-deep", "u-assist", "Deep Talks: one thread, one pace. The bot keeps it kind.", 500, "system"],
  ["m51", "r-deep", "u-theo", "what's a small thing that made you feel at home somewhere?", 100],
  ["m52", "r-deep", "u-kaito", "a vending machine that speaks English. sounds silly, isn't it", 95],
  ["m53", "r-deep", "u-byte", "the tide keeps time: what does yours sound like tonight?", 85],
  ["m54", "r-deep", "u-elodie", "my grandmother's kitchen. every city tastes like it now", 80],

  ["m60", "r-mesa", "u-assist", "Mesa Larga: charla lenta, sin prisa. Bot declarado.", 500, "system"],
  ["m61", "r-mesa", "u-mara", "buenas noches mesa, ¿quién más está con mate?", 90],
  ["m62", "r-mesa", "u-rio", "yo, con un café bien cargado. saludos desde Río", 85],
  ["m63", "r-mesa", "u-luna", "me río por no llorar con las playlists de esta semana", 75],

  ["m70", "r-gaming", "u-assist", "Regole della stanza: si gioca puliti. Bot dichiarato, anticheat attivo.", 500, "system"],
  ["m71", "r-gaming", "u-theo", "stasera serata Mario Kart, chi ha l'ispirazione giusta?", 170],
  ["m72", "r-gaming", "u-kaito", "io ci sono, ma niente power-up rubati o squalificato", 160],
  ["m73", "r-gaming", "u-pixel", "ogni stanza ha la sua marea: qui si gioca con la testa", 150],
  ["m74", "r-gaming", "u-nino", "partita alle 21 UTC? metto una playlist", 130],
  ["m75", "r-gaming", "u-luna", "arrivo io, ma poi devo studiare, scusate in anticipo", 120],

  ["m80", "r-gaming13", "u-bolla", "Gaming Zone 13-17: partite, playlist, zero pressioni.", 500, "system"],
  ["m81", "r-gaming13", "u-sky", "stasera duello di riflessi, si partecipa?", 140],
  ["m82", "r-gaming13", "u-nova", "partecipo, ma se perdo la colpa è del lag", 135],
  ["m83", "r-gaming13", "u-ken", "il lag è la nostra bandiera nazionale", 130],
  ["m84", "r-gaming13", "u-rae", "io faccio la spettatrice con la playlist", 125],

  ["m90", "r-vent", "u-assist", "Spazio sfoghi: qui non si giudica. I bot sono presenti e discreti.", 500, "system"],
  ["m91", "r-vent", "u-elodie", "oggi ho rimandato un anno un esame e non so come dirlo a casa", 140],
  ["m92", "r-vent", "u-porto", "respira. le onde aspettano, e tu puoi ricominciare da qui", 135],
  ["m93", "r-vent", "u-anouk", "sono qui. a volte basta dire la cosa ad alta voce", 130],
  ["m94", "r-vent", "u-onda", "mi dispiace, davvero. se vuoi ti passo i miei appunti", 125],
  ["m95", "r-vent", "u-elodie", "grazie. è la prima volta che qualcuno lo dice con calma", 120],

  ["m96", "r-vent13", "u-coral", "Sfoghi 13-17: qui puoi dirlo. I bot ascoltavano prima ancora che scrivessi.", 500, "system"],
  ["m97", "r-vent13", "u-rae", "oggi alla danza ho sbagliato tutto e ho pianto negli spogliatoi", 110],
  ["m98", "r-vent13", "u-nova", "lo faccio anche io, e poi esco e mi sento più leggera", 105],
  ["m99", "r-vent13", "u-coral", "respirare aiuta. sei nel posto giusto", 100],

  ["m98", "r-nera", "u-noctis", "Marea Nera: solo adulti verificati, zero tolleranza, moderazione attiva.", 70, "system"],
];

const PRODUCTS: [id: string, seller: string, title: string, desc: string, cat: string, price: number, promoted: boolean, sold: number][] = [
  ["p1", "u-kaito", "Pack 12 beat lo-fi", "12 beat originali in WAV + stems. Ideali per video, podcast e studio. Licenza commerciale inclusa.", "digital", 1200, true, 23],
  ["p2", "u-mara", "Logo design per creator", "Logo vettoriale su misura: 2 bozze, 3 rivedite, file finali in SVG e PNG. Consegna in 5 giorni.", "service", 4500, false, 9],
  ["p3", "u-rio", "Fotografie di viaggio · Lisbona", "Set di 20 foto ad alta risoluzione della Lisbona notturna. Stampa a casa o licenza per uso editoriale.", "product", 1900, false, 14],
  ["p4", "u-elodie", "Template Notion per studiare", "Sistema completo: syllabus, pomodoro, ripetizione spaziata. Bilingue FR/EN, aggiornato ogni mese.", "digital", 700, false, 41],
  ["p5", "u-nino", "Lezione di chitarra 30 min", "Primo o secondo livello. Online, con spartiti condivisi. Se ti va male la prima volta, è colpa mia.", "service", 1800, false, 6],
  ["p6", "u-luna", "Illustrazione custom — ritratto", "Ritratto illustrato da una tua foto (o dal tuo animale). Due bozze di pose, consegna in 7 giorni.", "service", 3000, false, 11],
  ["p7", "u-zef", "Playlist estiva + cover art", "43 minuti selezionati a mano + cover art in alta risoluzione. Perfetta per sfondi e vlog.", "digital", 500, false, 33],
  ["p8", "u-anouk", "Conversazione in francese", "30 minuti di conversazione guidata, livello A2-B2. Correzioni gentili, niente noia.", "service", 1500, false, 17],
];

const ORDERS: [id: string, product: string, buyer: string, amount: number][] = [
  ["o1", "p2", "u-onda", 4500],
  ["o2", "p4", "u-onda", 700],
  ["o3", "p7", "u-onda", 500],
  ["o4", "p1", "u-nino", 1200],
  ["o5", "p3", "u-kaito", 1900],
  ["o6", "p1", "u-elodie", 1200],
  ["o7", "p4", "u-anouk", 700],
  ["o8", "p8", "u-luna", 1500],
  ["o9", "p8", "u-kaito", 1500],
  ["o10", "p2", "u-theo", 4500],
  ["o11", "p6", "u-mara", 3000],
  ["o12", "p6", "u-nino", 3000],
  ["o13", "p7", "u-elodie", 500],
  ["o14", "p1", "u-rio", 1200],
];

const REVIEWS: [id: string, product: string, buyer: string, rating: number, comment: string, daysAgo: number][] = [
  ["rv1", "p1", "u-nino", 5, "batte ogni altra cosa, il track 4 è oro puro", 12],
  ["rv2", "p1", "u-elodie", 4, "ottimi beat, qualche mastering da rifare ma vale", 8],
  ["rv3", "p2", "u-onda", 5, "professionale e velocissima, il mio podcast ora esiste", 20],
  ["rv4", "p2", "u-theo", 5, "due bozze, zero incomprensioni. consigliatissima", 15],
  ["rv5", "p3", "u-kaito", 5, "stampe superbe, luce notturna catturata benissimo", 10],
  ["rv6", "p3", "u-luna", 4, "bellissime, la spedizione è un po' lunga", 6],
  ["rv7", "p4", "u-onda", 5, "il mio semestre, salvato. la ripetizione spaziata è geniale", 18],
  ["rv8", "p4", "u-anouk", 5, "pulitissimo, bilingue davvero utile", 5],
  ["rv9", "p5", "u-theo", 4, "bravo, pazienza infinita con le mie dissonanze", 9],
  ["rv10", "p5", "u-zef", 5, "tre accordi in mezz'ora, non male", 4],
  ["rv11", "p6", "u-mara", 5, "mi ha ritratta meglio di come mi vedo io", 14],
  ["rv12", "p6", "u-nino", 5, "regalo perfetto per mia sorella", 7],
  ["rv13", "p7", "u-elodie", 5, "estate in 43 minuti, la cover è perfetta", 11],
  ["rv14", "p7", "u-onda", 4, "bella, manca una traccia in chiusura ma funziona", 3],
  ["rv15", "p8", "u-luna", 5, "mi ha corretto tutto con una gentilezza rara", 13],
  ["rv16", "p8", "u-kaito", 5, "now I can order croissant in French", 6],
];

const MATCHES: [id: string, peer: string, score: number, reason: string][] = [
  ["mt1", "u-kaito", 92, "3 interessi in comune · stessa lingua"],
  ["mt2", "u-elodie", 87, "2 interessi in comune · lingue diverse"],
  ["mt3", "u-nino", 74, "1 interesse in comune · stesso paese"],
];

async function run() {
  await ensureSchema();
  const [{ value }] = await db.select({ value: count() }).from(s.users);
  if (value > 0) return;

  await db.insert(s.users).values(
    USERS.map(([id, nickname, email, country, language, ageGroup, bio, hue, interests, verified, plus, isBot, d]) => ({
      id, nickname, email, country, language, ageGroup, bio, hue, interests,
      verified, plus, isBot,
      passwordHash: PW,
      createdAt: days(d),
      ...(plus ? { plusRenewsAt: new Date(Date.now() + 20 * 864e5) } : {}),
    }))
  );

  await db.insert(s.rooms).values(
    ROOMS.map(([id, slug, name, description, kind, language, group, isAdult, hue]) => ({
      id, slug, name, description, kind, language, group, isAdult,
      premium: kind === "premium",
      hue,
    }))
  );

  // economy: points + active free trial for everyone
  await db.update(s.users).set({ trialEndsAt: new Date(Date.now() + 24 * 3600e3) });
  const POINTS: Record<string, number> = {
    "u-kaito": 342, "u-elodie": 310, "u-theo": 287, "u-mara": 254, "u-anouk": 231,
    "u-onda": 214, "u-nova": 189, "u-sky": 176, "u-nino": 150, "u-luna": 143,
    "u-rio": 120, "u-zef": 108, "u-ken": 96, "u-vera": 88,
  };
  for (const [id, p] of Object.entries(POINTS)) {
    await db.update(s.users).set({ points: p }).where(eq(s.users.id, id));
  }
  await db.update(s.users).set({ walletCents: 2400 }).where(eq(s.users.id, "u-mara"));

  await db.insert(s.messages).values(
    MSGS.map(([id, roomId, userId, content, mins, kind, flagged, alias]) => ({
      id: id + "-" + Math.random().toString(36).slice(2, 6),
      roomId, userId, content, kind: kind ?? "text",
      flagged: flagged ?? false,
      alias: alias ?? null,
      createdAt: ago(mins),
    }))
  );

  await db.insert(s.dms).values([
    { id: "d1", a: "u-mara", b: "u-onda", lastReadA: ago(5), lastReadB: ago(120), createdAt: ago(300) },
    { id: "d2", a: "u-kaito", b: "u-onda", lastReadA: ago(1), lastReadB: ago(1), createdAt: ago(250) },
    { id: "d3", a: "u-nova", b: "u-sky", lastReadA: ago(10), lastReadB: ago(10), createdAt: ago(400) },
  ]);

  await db.insert(s.dmMessages).values([
    { id: "dm1", dmId: "d1", senderId: "u-mara", content: "hi! ho visto il tuo post nelle Maree Generali. anche io amo lo surf", createdAt: ago(300) },
    { id: "dm2", dmId: "d1", senderId: "u-onda", content: "esatto! che spot frequenti?", createdAt: ago(290) },
    { id: "dm3", dmId: "d1", senderId: "u-mara", content: "Marbella. ma un giorno la Bretagna, giuro", createdAt: ago(30) },
    { id: "dm4", dmId: "d2", senderId: "u-kaito", content: "hey, vuoi provare la mia playlist retro-gaming?", createdAt: ago(200) },
    { id: "dm5", dmId: "d2", senderId: "u-onda", content: "sì! mandamela quando vuoi", createdAt: ago(195) },
    { id: "dm6", dmId: "d2", senderId: "u-kaito", content: "fatto. dimmi se il track 4 non è perfetto", createdAt: ago(190) },
    { id: "dm7", dmId: "d3", senderId: "u-nova", content: "allora, la partita di stasera? porto io la playlist", createdAt: ago(200) },
    { id: "dm8", dmId: "d3", senderId: "u-sky", content: "ok! alle 21, prima della cena di mia madre", createdAt: ago(190) },
  ]);

  await db.insert(s.products).values(
    PRODUCTS.map(([id, sellerId, title, description, category, priceCents, promoted, sold]) => ({
      id, sellerId, title, description, category, priceCents, promoted, sold,
      createdAt: days(Math.floor(Math.random() * 20) + 2),
    }))
  );

  await db.insert(s.orders).values(
    ORDERS.map(([id, productId, buyerId, amountCents]) => ({
      id, productId, buyerId, amountCents,
      feeCents: Math.round(amountCents * 0.1),
      createdAt: days(Math.floor(Math.random() * 15) + 1),
    }))
  );

  await db.insert(s.reviews).values(
    REVIEWS.map(([id, productId, buyerId, rating, comment, d]) => ({
      id, productId, buyerId, rating, comment, createdAt: days(d),
    }))
  );

  await db.insert(s.matches).values(
    MATCHES.map(([id, peerId, score, reason]) => ({
      id, userId: "u-onda", peerId, score, reason,
      createdAt: ago(200),
    }))
  );

  await db.insert(s.matchReactions).values([
    { id: "mr1", matchId: "mt1", userId: "u-kaito", kind: "wave", createdAt: ago(150) },
    { id: "mr2", matchId: "mt2", userId: "u-elodie", kind: "like", createdAt: ago(140) },
  ]);

  await db.insert(s.reports).values([
    { id: "rp1", reporterId: "u-onda", targetType: "message", targetId: crypto.randomUUID(), reason: "scam", status: "resolved", createdAt: ago(55) },
    { id: "rp2", reporterId: "u-onda", targetType: "user", targetId: "u-rio", reason: "spam", status: "open", createdAt: ago(54) },
  ]);
}
