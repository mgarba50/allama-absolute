import type { EngineProtocol } from "./protocols";

export interface ProtocolConfiguration {
  enabledModules: readonly string[];
  weights: Readonly<Record<string,number>>;
  options: Readonly<Record<string,unknown>>;
}

export interface ProtocolBookmark {
  id:string;
  name:string;
  protocolId:string;
  configuration:ProtocolConfiguration;
  createdAt:string;
  updatedAt:string;
}

export function createProtocolBookmark(
  protocol:EngineProtocol,
  configuration:Partial<ProtocolConfiguration>={},
  now=new Date().toISOString()
):ProtocolBookmark {
  return {
    id:"BOOKMARK-"+now.replace(/\D/g,""),
    name:protocol.name,
    protocolId:protocol.id,
    configuration:{
      enabledModules:[...(configuration.enabledModules ?? protocol.modules)],
      weights:{...(configuration.weights ?? {})},
      options:{...(configuration.options ?? {})}
    },
    createdAt:now,
    updatedAt:now
  };
}

export function validateProtocolBookmark(bookmark:ProtocolBookmark,protocols:readonly EngineProtocol[]):string[] {
  const errors:string[]=[];
  const protocol=protocols.find((item)=>item.id===bookmark.protocolId);
  if(!protocol) errors.push("Unknown protocol: "+bookmark.protocolId);
  if(!bookmark.name.trim()) errors.push("Bookmark name is required.");
  if(new Set(bookmark.configuration.enabledModules).size!==bookmark.configuration.enabledModules.length) errors.push("Duplicate enabled modules.");
  for(const [key,value] of Object.entries(bookmark.configuration.weights)) {
    if(!key || !Number.isFinite(value)) errors.push("Invalid weight: "+key);
  }
  return errors;
}
