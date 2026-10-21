export const HOUSES = [
  { number:1, name:"Querent / Self", nameAr:"السائل / النفس", keywords:["self","body","identity","initiative"], keywordsAr:["النفس","البدن","الهوية","المبادرة"] },
  { number:2, name:"Money / Possessions", nameAr:"المال / المقتنيات", keywords:["money","resources","possessions","income"], keywordsAr:["المال","الموارد","المقتنيات","الدخل"] },
  { number:3, name:"Siblings / Messages", nameAr:"الإخوة / الرسائل", keywords:["siblings","messages","short travel","documents"], keywordsAr:["الإخوة","الرسائل","السفر القصير","الوثائق"] },
  { number:4, name:"Home / Father / Land", nameAr:"البيت / الأب / الأرض", keywords:["home","land","roots","father","property"], keywordsAr:["البيت","الأرض","الأصول","الأب","العقار"] },
  { number:5, name:"Children / Pleasure", nameAr:"الأولاد / السرور", keywords:["children","pregnancy","creativity","pleasure"], keywordsAr:["الأولاد","الحمل","الإبداع","السرور"] },
  { number:6, name:"Illness / Service", nameAr:"المرض / الخدمة", keywords:["illness","workers","service","routine"], keywordsAr:["المرض","العمال","الخدمة","العمل اليومي"] },
  { number:7, name:"Partner / Opponent", nameAr:"الشريك / الخصم", keywords:["spouse","partner","opponent","other person"], keywordsAr:["الزوج","الشريك","الخصم","الآخر"] },
  { number:8, name:"Others' Money / Loss", nameAr:"مال الغير / الخسارة", keywords:["debt","inheritance","shared resources","loss"], keywordsAr:["الدين","الميراث","الموارد المشتركة","الخسارة"] },
  { number:9, name:"Long Travel / Higher Study", nameAr:"السفر البعيد / العلم العالي", keywords:["journey","religion","higher study","foreign"], keywordsAr:["السفر","الدين","الدراسة العليا","الخارج"] },
  { number:10, name:"Career / Authority", nameAr:"المهنة / السلطة", keywords:["career","office","authority","reputation"], keywordsAr:["المهنة","المنصب","السلطة","السمعة"] },
  { number:11, name:"Friends / Hopes", nameAr:"الأصدقاء / الآمال", keywords:["friends","support","hopes","networks"], keywordsAr:["الأصدقاء","النصرة","الآمال","الشبكات"] },
  { number:12, name:"Hidden Enemies / Confinement", nameAr:"الأعداء الخفيون / الحبس", keywords:["hidden","confinement","secret opposition","isolation"], keywordsAr:["الخفي","الحبس","العداوة الخفية","العزلة"] }
] as const;

export function turnedHouse(baseHouse: number, relationHouse: number): number {
  if (!Number.isInteger(baseHouse) || !Number.isInteger(relationHouse) || baseHouse < 1 || baseHouse > 12 || relationHouse < 1 || relationHouse > 12) {
    throw new Error("Houses must be integers from 1 to 12.");
  }
  return ((baseHouse + relationHouse - 2) % 12) + 1;
}

export function explainTurnedHouse(baseHouse: number, relationHouse: number) {
  return {
    baseHouse,
    relationHouse,
    result: turnedHouse(baseHouse, relationHouse),
    formula: "((" + baseHouse + " + " + relationHouse + " - 2) mod 12) + 1"
  };
}
