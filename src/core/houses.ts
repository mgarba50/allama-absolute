export const HOUSES = [
  { number:1, name:"Querent / Self", keywords:["self","body","identity","initiative"] },
  { number:2, name:"Money / Possessions", keywords:["money","resources","possessions","income"] },
  { number:3, name:"Siblings / Messages", keywords:["siblings","messages","short travel","documents"] },
  { number:4, name:"Home / Father / Land", keywords:["home","land","roots","father","property"] },
  { number:5, name:"Children / Pleasure", keywords:["children","pregnancy","creativity","pleasure"] },
  { number:6, name:"Illness / Service", keywords:["illness","workers","service","routine"] },
  { number:7, name:"Partner / Opponent", keywords:["spouse","partner","opponent","other person"] },
  { number:8, name:"Others' Money / Loss", keywords:["debt","inheritance","shared resources","loss"] },
  { number:9, name:"Long Travel / Higher Study", keywords:["journey","religion","higher study","foreign"] },
  { number:10, name:"Career / Authority", keywords:["career","office","authority","reputation"] },
  { number:11, name:"Friends / Hopes", keywords:["friends","support","hopes","networks"] },
  { number:12, name:"Hidden Enemies / Confinement", keywords:["hidden","confinement","secret opposition","isolation"] }
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
