/** Natural-sounding speech helpers for MenoKnow games. */

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  if (/en(-|_)?(us|gb|au|ie|za)?/.test(voice.lang.toLowerCase())) score += 8;
  if (voice.localService) score += 2;
  if (
    /natural|neural|premium|enhanced|siri|aria|jenny|sara|guy|davis|ryan|sonia|natasha|samantha|karen|moira|daniel|kate|oliver|google us|google uk/.test(
      name,
    )
  ) {
    score += 12;
  }
  if (
    /compact|espeak|robot|novelty|whisper|zarvox|trinoids|bad news|good news|bubbles|boing|organ/.test(
      name,
    )
  ) {
    score -= 20;
  }
  if (
    /female|woman|girl|samantha|karen|moira|aria|jenny|sara|sonia|kate/.test(
      name,
    )
  ) {
    score += 3;
  }
  return score;
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    cachedVoice = null;
    return null;
  }
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  cachedVoice = ranked[0] ?? null;
  return cachedVoice;
}

function warmVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const refresh = () => {
    cachedVoice = undefined;
    pickNaturalVoice();
  };
  refresh();
  window.speechSynthesis.addEventListener("voiceschanged", refresh, {
    once: true,
  });
}

if (typeof window !== "undefined") {
  warmVoices();
}

export function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const voice = pickNaturalVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function speakLetter(letter: string) {
  const upper = letter.toUpperCase();
  // Spell out clearly for preschool ears ("A" can sound clipped alone).
  speakText(`The letter ${upper}`);
}
