/**
 * Helper para mapear resultados de agregación MongoDB al formato de respuesta
 */
export const mapAggregationResultToResponse = (aggregationResult: any) => {
  const { _id, createdAt, updatedAt, ...note } = aggregationResult;
  
  // Debug: Log para verificar el mapeo en el backend
  if (note.debugInfo) {
    console.log('🔄 Backend mapping aggregation result:', {
      noteId: _id?.toString(),
      title: note.title?.substring(0, 20) + '...',
      isLikedByCurrentUser: note.isLikedByCurrentUser,
      debugInfo: note.debugInfo,
      publicStats: note.publicStats
    });
  }
  
  return {
    id: _id,
    ...note,
    createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
    updatedAt: updatedAt ? new Date(updatedAt).getTime() : undefined,
  };
};

/**
 * Mapea una lista de resultados de agregación
 */
export const mapAggregationResultsToResponse = (results: any[]) => {
  return results.map(mapAggregationResultToResponse);
};
