import type { GeomanticFigure, Shield } from "./types";

export interface HousePlacement {
  house: number;
  figure: GeomanticFigure;
  source: string;
}

export function housePlacements(shield: Shield): HousePlacement[] {
  const figures = [...shield.mothers, ...shield.daughters, ...shield.nieces];
  const labels = ["M1","M2","M3","M4","D1","D2","D3","D4","N1","N2","N3","N4"];
  return figures.map((figure, index) => ({ house:index + 1, figure, source:labels[index] }));
}

export function figureMigration(shield: Shield): Array<{ figure: GeomanticFigure; houses: number[]; count: number }> {
  const groups = new Map<string, { figure: GeomanticFigure; houses: number[] }>();
  for (const placement of housePlacements(shield)) {
    const current = groups.get(placement.figure.id) ?? { figure:placement.figure, houses:[] };
    current.houses.push(placement.house);
    groups.set(placement.figure.id, current);
  }
  return [...groups.values()]
    .filter((group) => group.houses.length > 1)
    .map((group) => ({ ...group, count:group.houses.length }))
    .sort((a,b) => b.count - a.count);
}

export function elementDistribution(shield: Shield): Record<string, number> {
  const figures = [
    ...shield.mothers,
    ...shield.daughters,
    ...shield.nieces,
    shield.rightWitness,
    shield.leftWitness,
    shield.judge,
    shield.reconciler
  ];
  const distribution: Record<string, number> = { Fire:0, Air:0, Water:0, Earth:0 };
  for (const figure of figures) distribution[figure.element] = (distribution[figure.element] ?? 0) + 1;
  return distribution;
}

export function dominantElements(shield: Shield): { dominant: string[]; deficient: string[]; distribution: Record<string, number> } {
  const distribution = elementDistribution(shield);
  const values = Object.values(distribution);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return {
    dominant:Object.entries(distribution).filter(([,value]) => value === max).map(([name]) => name),
    deficient:Object.entries(distribution).filter(([,value]) => value === min).map(([name]) => name),
    distribution
  };
}

export function houseMirrors(shield: Shield) {
  const placements = housePlacements(shield);
  const pairs = [[1,7],[2,8],[3,9],[4,10],[5,11],[6,12]] as const;
  return pairs.map(([a,b]) => {
    const left = placements[a - 1].figure;
    const right = placements[b - 1].figure;
    return {
      houses:[a,b],
      figures:[left,right],
      sameFigure:left.id === right.id,
      sameElement:left.element === right.element,
      qualityAgreement:left.quality === right.quality
    };
  });
}
