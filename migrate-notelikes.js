// Script para migrar NoteLikes de itemId a noteId
const mongoose = require('mongoose');

async function migrateNoteLikes() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-database');
    console.log('🔌 Conectado a MongoDB');
    
    // Verificar si hay documentos con itemId
    const noteLikesWithItemId = await mongoose.connection.db.collection('notelikes').find({ itemId: { $exists: true } }).toArray();
    console.log(`📊 Encontrados ${noteLikesWithItemId.length} documentos NoteLike con itemId`);
    
    if (noteLikesWithItemId.length > 0) {
      console.log('📄 Muestra de documento con itemId:', noteLikesWithItemId[0]);
      
      // Migrar itemId a noteId
      const result = await mongoose.connection.db.collection('notelikes').updateMany(
        { itemId: { $exists: true } },
        { $rename: { itemId: 'noteId' } }
      );
      
      console.log(`✅ Migrados ${result.modifiedCount} documentos de itemId a noteId`);
    }
    
    // Verificar documentos después de la migración
    const noteLikesWithNoteId = await mongoose.connection.db.collection('notelikes').find({ noteId: { $exists: true } }).toArray();
    console.log(`📊 Total de documentos NoteLike con noteId: ${noteLikesWithNoteId.length}`);
    
    if (noteLikesWithNoteId.length > 0) {
      console.log('📄 Muestra de documento con noteId:', noteLikesWithNoteId[0]);
    }
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateNoteLikes();
}

module.exports = migrateNoteLikes;
