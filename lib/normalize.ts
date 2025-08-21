// src/lib/normalize.ts
export function normalizeStr(input: string) {
    return input
      .toLowerCase()
      .normalize("NFD")                 // separa acentos
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/[^a-z0-9\s/&-]/g, "")  // quita símbolos raros (mantén básicos)
      .replace(/\s+/g, " ")            // colapsa espacios
      .trim();
  }
  
  export function slugify(input: string) {
    return normalizeStr(input).replace(/[\/&]/g, " y ").replace(/\s+/g, "-");
  }
  