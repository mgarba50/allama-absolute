export type AbsoluteCommand =
  | { type:"cast" }
  | { type:"judge" }
  | { type:"reverse" }
  | { type:"house"; house:number }
  | { type:"abjad"; text:string }
  | { type:"hour" }
  | { type:"moon" }
  | { type:"deep" }
  | { type:"compare" }
  | { type:"lock" }
  | { type:"outcome" }
  | { type:"graphs" }
  | { type:"settings" }
  | { type:"unknown"; raw:string };

export function parseCommand(input: string): AbsoluteCommand {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return { type:"unknown", raw:trimmed };
  const [command,...rest] = trimmed.slice(1).split(/\s+/);
  if (command === "cast") return { type:"cast" };
  if (command === "judge") return { type:"judge" };
  if (command === "reverse") return { type:"reverse" };
  if (command === "house") {
    const house = Number(rest[0]);
    if (Number.isInteger(house) && house >= 1 && house <= 12) return { type:"house", house };
    return { type:"unknown", raw:trimmed };
  }
  if (command === "abjad") return { type:"abjad", text:rest.join(" ") };
  if (command === "hour") return { type:"hour" };
  if (command === "moon") return { type:"moon" };
  if (command === "deep") return { type:"deep" };
  if (command === "compare") return { type:"compare" };
  if (command === "lock") return { type:"lock" };
  if (command === "outcome") return { type:"outcome" };
  if (command === "graphs" || command === "graph") return { type:"graphs" };
  if (command === "settings" || command === "config") return { type:"settings" };
  return { type:"unknown", raw:trimmed };
}
