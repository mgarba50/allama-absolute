export type Locale = "en" | "ar";

const messages = {
  en:{
    dashboard:"Command Center",
    absolute:"Ω Sovereign Analysis",
    cast:"Raml Shield",
    houses:"House Map",
    reverse:"Reverse Judge",
    abjad:"Abjad Lab",
    question:"Question Intelligence",
    celestial:"Celestial",
    laboratory:"Private Practitioner Laboratory",
    localCore:"Local-first core",
    runAnalysis:"Run Ω Analysis",
    castingChamber:"Open Casting Chamber"
  },
  ar:{
    dashboard:"مركز القيادة",
    absolute:"Ω التحليل السيادي",
    cast:"درع الرمل",
    houses:"خريطة البيوت",
    reverse:"التحليل العكسي للحاكم",
    abjad:"مختبر الأبجد",
    question:"ذكاء السؤال",
    celestial:"السياق الفلكي",
    laboratory:"مختبر الممارس الخاص",
    localCore:"نواة محلية أولاً",
    runAnalysis:"تشغيل تحليل Ω",
    castingChamber:"فتح غرفة الضرب"
  }
} as const;

export type MessageKey = keyof typeof messages.en;

export function translate(locale: Locale,key: MessageKey): string {
  return messages[locale][key] ?? messages.en[key];
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
