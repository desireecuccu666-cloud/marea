import type { Lang } from "./i18n";

export const BOT_IDS: Record<string, string> = {
  Brisa: "u-brisa",
  Pixel: "u-pixel",
  Porto: "u-porto",
  Byte: "u-byte",
  Noctis: "u-noctis",
  Bolla: "u-bolla",
  Corallo: "u-coral",
  "Marea.Assist": "u-assist",
};

export function botForRoom(kind: string, language: string | null, group: string): string {
  if (group === "minor") {
    if (kind === "gaming") return BOT_IDS.Bolla;
    if (kind === "vent" || kind === "live") return BOT_IDS.Corallo;
    return BOT_IDS.Bolla;
  }
  if (language === "en") return BOT_IDS.Byte;
  if (kind === "gaming") return BOT_IDS.Pixel;
  if (kind === "vent") return BOT_IDS.Porto;
  if (kind === "adult") return BOT_IDS.Noctis;
  return BOT_IDS.Brisa;
}

const REPLIES: Record<Lang, string[]> = {
  it: [
    "ciao {name}, benvenuto nella corrente. da dove arrivi tu?",
    "mi ci aggancio: stavo dicendo la stessa cosa",
    "qui ci passano onde da ogni fuso orario, resta con noi",
    "buona onda. e tu, cosa ti ha portato in questa stanza?",
    "detto con onestà: anche io ci ho messo tempo a scrivere per primo",
    "se qualcuno rompe le regole, il bot lo vede prima di me",
  ],
  en: [
    "hey {name}, welcome to the current. where are you in from?",
    "hanging on here: I was about to say the same",
    "waves pass through every timezone here, stick around",
    "good tide. what brought you to this room?",
    "honestly: it took me a while to write first too",
    "if anyone breaks the rules, the bot spots it before I do",
  ],
  es: [
    "hola {name}, bienvenida a la corriente. ¿de dónde eres?",
    "me apunto: iba a decir lo mismo",
    "aquí pasan mareas de cada zona horaria, quédate",
    "buena ola. y tú, ¿qué te trae a esta sala?",
    "con honestidad: a mí también me costó escribir primero",
    "si alguien rompe las reglas, el bot lo ve antes que yo",
  ],
  fr: [
    "salut {name}, bienvenue dans le courant. tu viens d'où ?",
    "je m'accroche : j'allais dire la même chose",
    "les vagues traversent tous les fuseaux ici, reste",
    "bonne marée. et toi, qu'est-ce qui t'amène dans cette salle ?",
    "honnêtement : j'ai aussi mis du temps à écrire en premier",
    "si quelqu'un casse les règles, le bot le voit avant moi",
  ],
  de: [
    "hallo {name}, willkommen zur Gezeitenströmung. woher kommst du?",
    "ich hänge mit: ich wollte genau das sagen",
    "hier treffen Wellen aus allen Zeitzonen, bleib kurz",
    "gute Welle. was hat dich in diesen Raum gebracht?",
    "ehrlich: bei mir hat auch gedauert, bis ich als erstes schrieb",
    "wenn jemand die Regeln bricht, sieht es der Bot vor mir",
  ],
};

const MINOR_REPLIES: Record<Lang, string[]> = {
  it: [
    "ehi {name}! da che parte del mondo giochi?",
    "mi piace l'energia di stanotte",
    "qui si chatta e si gioca, nient'altro",
    "qualcuno vuole una partita dopo?",
    "bravo a chi resta con calma",
    "io sono Bolla, il bot della stanza: chiedi pure",
  ],
  en: [
    "hey {name}! where do you game from?",
    "loving the energy tonight",
    "we chat and we play, nothing else",
    "anyone up for a game after?",
    "props to whoever stays chill",
    "i'm Bolla, this room's bot: ask me anything",
  ],
  es: [
    "¡ey {name}! ¿desde qué parte del mundo juegas?",
    "me encanta la energía de esta noche",
    "aquí chateamos y jugamos, nada más",
    "¿alguien quiere una partida después?",
    "respeto a quien se queda tranquilo",
    "soy Bolla, el bot de la sala: pregunta lo que quieras",
  ],
  fr: [
    "salut {name} ! tu joues depuis quel coin du monde ?",
    "j'aime l'énergie de ce soir",
    "on discute et on joue, rien d'autre",
    "quelqu'un veut une partie après ?",
    "chapeau à ceux qui restent calmes",
    "je suis Bolla, le bot de la salle : posez vos questions",
  ],
  de: [
    "hey {name}! woher spielst du?",
    "die Stimmung heute ist top",
    "wir chatten und spielen, sonst nichts",
    "nachher noch eine Runde?",
    "Respekt, wer entspannt bleibt",
    "ich bin Bolla, der Bot des Raums: frag ruhig",
  ],
};

export function botReply(kind: string, lang: string, name: string, group: string): string {
  const l = (lang as Lang) in REPLIES ? (lang as Lang) : "it";
  const pool = group === "minor" ? MINOR_REPLIES[l] : REPLIES[l];
  const s = pool[Math.floor(Math.random() * pool.length)];
  return s.replace("{name}", name);
}

export const AUTO_REPLY_CHANCE = 0.55;
