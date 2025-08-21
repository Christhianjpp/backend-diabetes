"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeStr = normalizeStr;
exports.slugify = slugify;
// src/lib/normalize.ts
function normalizeStr(input) {
    return input
        .toLowerCase()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .replace(/[^a-z0-9\s/&-]/g, "") // quita símbolos raros (mantén básicos)
        .replace(/\s+/g, " ") // colapsa espacios
        .trim();
}
function slugify(input) {
    return normalizeStr(input).replace(/[\/&]/g, " y ").replace(/\s+/g, "-");
}
//# sourceMappingURL=normalize.js.map