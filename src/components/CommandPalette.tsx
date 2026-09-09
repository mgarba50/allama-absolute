import { useState } from "react";
import type { Locale } from "../core";

export function CommandPalette({ onCommand,locale="en" }: { onCommand:(command:string)=>string | void; locale?:Locale }) {
  const [value,setValue]=useState(""); const [feedback,setFeedback]=useState(""); const ar=locale==="ar";
  function submit():void{if(!value.trim())return;const result=onCommand(value.trim());setFeedback(result??"");setValue("");}
  return <div className="command-palette"><span>⌘</span><input value={value} onChange={(e)=>setValue(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")submit();}}
    placeholder="/cast  /judge  /house 7  /abjad موسى  /deep  /compare" aria-label={ar?"لوحة أوامر ALLAMA ABSOLUTE":"ALLAMA ABSOLUTE command palette"}/>{feedback&&<small>{feedback}</small>}</div>;
}
