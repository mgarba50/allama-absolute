import { useState } from "react";

export function CommandPalette({ onCommand }: { onCommand:(command:string)=>string | void }) {
  const [value,setValue] = useState("");
  const [feedback,setFeedback] = useState("");

  function submit(): void {
    if (!value.trim()) return;
    const result = onCommand(value.trim());
    setFeedback(result ?? "");
    setValue("");
  }

  return (
    <div className="command-palette">
      <span>⌘</span>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        placeholder="/cast  /judge  /house 7  /abjad موسى  /hour  /deep"
        aria-label="ALLAMA ABSOLUTE command palette"
      />
      {feedback && <small>{feedback}</small>}
    </div>
  );
}
