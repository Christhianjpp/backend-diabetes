// Script temporal para probar la agregación y verificar datos
const mongoose = require('mongoose');

async function testAggregation() {
  try {
    // Conectar a la base de datos (ajustar según tu configuración)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-database');
    
    console.log('🔌 Conectado a MongoDB');
    
    // Verificar datos existentes en NoteLike
    const noteLikesCount = await mongoose.connection.db.collection('notelikes').countDocuments();
    console.log('📊 Cantidad de documentos en notelikes:', noteLikesCount);
    
    if (noteLikesCount > 0) {
      const sampleNoteLike = await mongoose.connection.db.collection('notelikes').findOne();
      console.log('📄 Muestra de NoteLike:', sampleNoteLike);
    }
    
    // Verificar datos existentes en Note
    const notesCount = await mongoose.connection.db.collection('notes').countDocuments();
    console.log('📊 Cantidad de documentos en notes:', notesCount);
    
    if (notesCount > 0) {
      const sampleNote = await mongoose.connection.db.collection('notes').findOne();
      console.log('📄 Muestra de Note:', sampleNote);
    }
    
    // Probar el pipeline de agregación con un usuario ficticio
    if (notesCount > 0) {
      const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // ID ficticio
      
      const pipeline = [
        // Filtrar notas públicas
        { $match: { visibility: 'public' } },
        
        // Lookup para verificar likes
        {
          $lookup: {
            from: 'notelikes',
            let: { noteId: '$_id', currentUser: testUserId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$noteId', '$$noteId'] },  // Verificar si usa noteId
                      { $eq: ['$userId', '$$currentUser'] }
                    ]
                  }
                }
              }
            ],
            as: 'currentUserLike'
          }
        },
        
        // Agregar campo isLikedByCurrentUser
        {
          $addFields: {
            isLikedByCurrentUser: { $gt: [{ $size: '$currentUserLike' }, 0] },
            debugInfo: {
              currentUserLikeCount: { $size: '$currentUserLike' },
              testUserId: testUserId
            }
          }
        },
        
        { $limit: 2 } // Solo primeros 2 para test
      ];
      
      console.log('🧪 Probando pipeline de agregación...');
      const result = await mongoose.connection.db.collection('notes').aggregate(pipeline).toArray();
      console.log('📊 Resultado de agregación:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testAggregation();
