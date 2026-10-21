export interface ArabicNormalizationOptions {
  unifyAlif: boolean;
  unifyYa: boolean;
  taMarbutaAsHa: boolean;
  stripDiacritics: boolean;
  stripTatweel: boolean;
  keepOnlyLetters: boolean;
}

export const DEFAULT_NORMALIZATION: ArabicNormalizationOptions = {
  unifyAlif: true,
  unifyYa: true,
  taMarbutaAsHa: false,
  stripDiacritics: true,
  stripTatweel: true,
  keepOnlyLetters: true
};

export const ABJAD_KABIR: Readonly<Record<string, number>> = {
  "ا":1,"ب":2,"ج":3,"د":4,"ه":5,"و":6,"ز":7,"ح":8,"ط":9,
  "ي":10,"ك":20,"ل":30,"م":40,"ن":50,"س":60,"ع":70,"ف":80,"ص":90,
  "ق":100,"ر":200,"ش":300,"ت":400,"ث":500,"خ":600,"ذ":700,"ض":800,"ظ":900,"غ":1000
};

export function normalizeArabic(input: string, options: ArabicNormalizationOptions = DEFAULT_NORMALIZATION): string {
  let text = input.normalize("NFC");
  if (options.stripDiacritics) text = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
  if (options.stripTatweel) text = text.replace(/ـ/g, "");
  if (options.unifyAlif) text = text.replace(/[أإآٱ]/g, "ا");
  if (options.unifyYa) text = text.replace(/[ىئ]/g, "ي");
  text = text.replace(/ؤ/g, "و");
  if (options.taMarbutaAsHa) text = text.replace(/ة/g, "ه");
  if (options.keepOnlyLetters) text = [...text].filter((ch) => ABJAD_KABIR[ch] !== undefined || ch === "ة").join("");
  return text;
}

export interface AbjadResult {
  original: string;
  normalized: string;
  total: number;
  steps: readonly { letter: string; value: number }[];
  reductions: readonly number[];
}

export function digitalReduction(value: number): number[] {
  const out = [value];
  let current = value;
  while (current >= 10) {
    current = String(current).split("").reduce((sum, n) => sum + Number(n), 0);
    out.push(current);
  }
  return out;
}

export function calculateAbjad(input: string, options: ArabicNormalizationOptions = DEFAULT_NORMALIZATION): AbjadResult {
  const normalized = normalizeArabic(input, options);
  const steps = [...normalized].map((letter) => ({ letter, value: ABJAD_KABIR[letter] ?? 0 }));
  const total = steps.reduce((sum, step) => sum + step.value, 0);
  return { original: input, normalized, total, steps, reductions: digitalReduction(total) };
}

export function moduloAnalysis(value: number, moduli: readonly number[] = [4,7,9,12,16,28]): Record<number, number> {
  return Object.fromEntries(moduli.map((m) => [m, ((value % m) + m) % m])) as Record<number, number>;
}
