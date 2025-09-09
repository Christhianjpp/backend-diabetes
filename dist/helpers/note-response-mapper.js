"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAggregationResultsToResponse = exports.mapAggregationResultToResponse = void 0;
/**
 * Helper para mapear resultados de agregación MongoDB al formato de respuesta
 */
const mapAggregationResultToResponse = (aggregationResult) => {
    var _a;
    const { _id, createdAt, updatedAt } = aggregationResult, note = __rest(aggregationResult, ["_id", "createdAt", "updatedAt"]);
    // Debug: Log para verificar el mapeo en el backend
    if (note.debugInfo) {
        console.log('🔄 Backend mapping aggregation result:', {
            noteId: _id === null || _id === void 0 ? void 0 : _id.toString(),
            title: ((_a = note.title) === null || _a === void 0 ? void 0 : _a.substring(0, 20)) + '...',
            isLikedByCurrentUser: note.isLikedByCurrentUser,
            debugInfo: note.debugInfo,
            publicStats: note.publicStats
        });
    }
    return Object.assign(Object.assign({ id: _id }, note), { createdAt: createdAt ? new Date(createdAt).getTime() : undefined, updatedAt: updatedAt ? new Date(updatedAt).getTime() : undefined });
};
exports.mapAggregationResultToResponse = mapAggregationResultToResponse;
/**
 * Mapea una lista de resultados de agregación
 */
const mapAggregationResultsToResponse = (results) => {
    return results.map(exports.mapAggregationResultToResponse);
};
exports.mapAggregationResultsToResponse = mapAggregationResultsToResponse;
//# sourceMappingURL=note-response-mapper.js.map