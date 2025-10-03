# 🔒 Sistema de Bloqueo de Usuarios

## 📋 Descripción General

El sistema de bloqueo de usuarios permite a los usuarios bloquear a otros usuarios, ocultando automáticamente todo su contenido (publicaciones, comentarios) y limpiando las interacciones existentes entre ellos.

## 🏗️ Arquitectura

### Capa de Servicio (`services/userBlocking.ts`)
Contiene toda la lógica de negocio relacionada con el bloqueo de usuarios.

### Capa de Controlador (`controllers/user-moderation.ts`)
Maneja las peticiones HTTP y delega la lógica al servicio.

### Capa de Datos
- **Modelo BlockedUser**: Almacena los registros de bloqueos
- **Modelo User**: Contiene campo `blockedBy` para tracking rápido

## 🔧 Funciones del Servicio

### `blockUserService(data: BlockUserData)`
Bloquea a un usuario y ejecuta todas las operaciones relacionadas.

**Parámetros:**
```typescript
{
  blockerId: string;      // ID del usuario que bloquea
  blockedUserId: string;  // ID del usuario a bloquear
  reason?: string;        // Razón opcional del bloqueo
}
```

**Operaciones que realiza:**
1. ✅ Valida que los usuarios existan
2. ✅ Verifica que no sea auto-bloqueo
3. ✅ Crea registro en `BlockedUser`
4. ✅ Actualiza campo `blockedBy` en User
5. ✅ Limpia relaciones (usuarios guardados)
6. ✅ Elimina likes mutuos
7. ✅ Incrementa contador de violaciones
8. ✅ Crea notificación para el usuario bloqueado

### `unblockUserService(blockerId: string, blockedUserId: string)`
Desbloquea a un usuario previamente bloqueado.

**Operaciones que realiza:**
1. ✅ Elimina registro de `BlockedUser`
2. ✅ Actualiza campo `blockedBy` en User
3. ✅ Decrementa contador de violaciones

### `getBlockedUserIds(userId: string)`
Obtiene la lista de IDs de usuarios bloqueados por un usuario.

**Retorna:** `string[]` - Array de IDs de usuarios bloqueados

### `isUserBlocked(blockerId: string, blockedUserId: string)`
Verifica si un usuario está bloqueado por otro.

**Retorna:** `boolean`

### `getBlockedUsersService(blockerId: string, desde: number, limit: number)`
Obtiene la lista paginada de usuarios bloqueados.

**Parámetros:**
- `blockerId`: ID del usuario
- `desde`: Offset para paginación (default: 0)
- `limit`: Límite de resultados (default: 20)

## 📡 Endpoints API

### Bloquear Usuario
```http
POST /api/user-moderation/block
Authorization: Bearer {token}
Content-Type: application/json

{
  "blockedUserId": "64a1b2c3...",
  "reason": "Comportamiento inapropiado"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario bloqueado correctamente",
  "block": {
    "blockerId": "...",
    "blockedUserId": "...",
    "blockedUserName": "...",
    "blockedUserImg": "...",
    "reason": "...",
    "createdAt": 1234567890
  }
}
```

### Desbloquear Usuario
```http
DELETE /api/user-moderation/block/:blockedUserId
Authorization: Bearer {token}
```

### Obtener Usuarios Bloqueados
```http
GET /api/user-moderation/blocked?desde=0&limit=20
Authorization: Bearer {token}
```

### Verificar Si Usuario Está Bloqueado
```http
GET /api/user-moderation/is-blocked/:userId
Authorization: Bearer {token}
```

## 🔍 Filtrado de Contenido

El sistema filtra automáticamente el contenido de usuarios bloqueados en:

### Publicaciones (`getPublicNotes`)
```typescript
// Obtiene usuarios bloqueados
const blockedUserIds = await getBlockedUserIds(user._id);

// Filtra publicaciones en el pipeline de agregación
if (blockedUserIds.length > 0) {
  pipeline.unshift({
    $match: {
      userId: { $nin: blockedUserIds.map(id => new Types.ObjectId(id)) }
    }
  });
}
```

### Comentarios (`getComments`)
```typescript
// Filtra comentarios en la query
let commentQuery = { itemId: id };
if (blockedUserIds.length > 0) {
  commentQuery.userId = { 
    $nin: blockedUserIds.map(id => new Types.ObjectId(id)) 
  };
}
```

### Nota Individual (`getNoteById`)
```typescript
// Verifica si el autor está bloqueado
const blockedUserIds = await getBlockedUserIds(user._id);
if (blockedUserIds.includes(noteAuthorId)) {
  res.status(403).json({ message: 'Note from blocked user' });
  return;
}
```

## ⚡ Optimizaciones

### 1. **Operaciones en Paralelo**
```typescript
await Promise.all([
  cleanUserRelations(blockerId, blockedUserId),
  cleanInteractions(blockerId, blockedUserId),
  updateUserBlockInfo(blockerId, blockedUserId, blockerUser.name)
]);
```

### 2. **Índices de Base de Datos**
```javascript
// BlockedUser Model
{ blockerId: 1, blockedUserId: 1 } // unique index
{ blockerId: 1, createdAt: -1 }
{ blockedUserId: 1, createdAt: -1 }
```

### 3. **Caching de Usuarios Bloqueados**
El campo `blockedBy` en User permite consultas rápidas sin JOIN.

## 🚨 Manejo de Errores

### Errores Comunes

| Error | Código | Descripción |
|-------|--------|-------------|
| Usuario no autenticado | 401 | Token JWT inválido o ausente |
| Auto-bloqueo | 400 | Intentando bloquearse a sí mismo |
| Usuario no existe | 404 | Usuario a bloquear no encontrado |
| Ya bloqueado | 400 | Usuario ya está en la lista de bloqueados |

### Logging
```typescript
console.log(`✅ Usuario ${blockedUserId} bloqueado por ${blockerId}`);
console.error("❌ Error en bloqueo de usuario:", error);
```

## 🧪 Ejemplo de Uso en Frontend

```typescript
// Bloquear usuario
const blockUser = async (userId: string, reason?: string) => {
  try {
    const response = await api.post('/user-moderation/block', {
      blockedUserId: userId,
      reason
    });
    
    if (response.data.success) {
      console.log('Usuario bloqueado exitosamente');
      // Actualizar UI
    }
  } catch (error) {
    console.error('Error al bloquear:', error.response.data.message);
  }
};

// Verificar si usuario está bloqueado
const checkIfBlocked = async (userId: string) => {
  const response = await api.get(`/user-moderation/is-blocked/${userId}`);
  return response.data.isBlocked;
};
```

## 📊 Métricas y Estadísticas

### Contador de Violaciones
Cada bloqueo incrementa el contador `violations` del usuario bloqueado, útil para:
- Moderación automática
- Identificar usuarios problemáticos
- Estadísticas de la plataforma

## 🔐 Seguridad

### Validaciones Implementadas
- ✅ Autenticación JWT obligatoria
- ✅ Validación de IDs con `isMongoId()`
- ✅ Prevención de auto-bloqueo
- ✅ Verificación de existencia de usuarios
- ✅ Índice único para prevenir duplicados

## 🚀 Mejoras Futuras

### Posibles Extensiones
1. **Bloqueo Temporal**: Agregar fecha de expiración
2. **Bloqueo Mutuo Automático**: Si A bloquea a B, B no puede interactuar con A
3. **Notificaciones Push**: Notificar en tiempo real sobre bloqueos
4. **Historial de Bloqueos**: Registro de cambios para auditoría
5. **Razones Predefinidas**: Categorías de razones de bloqueo
6. **Bloqueo en Cascada**: Ocultar también contenido de seguidores

## 📝 Notas de Implementación

### Consideraciones Importantes
1. **Consistencia de Datos**: Todas las operaciones usan transacciones implícitas
2. **Performance**: Operaciones paralelas para minimizar latencia
3. **Reversibilidad**: El desbloqueo restaura parcialmente el estado anterior
4. **UX**: El contenido se oculta inmediatamente sin recargar

## 🔗 Enlaces Relacionados

- **Modelo BlockedUser**: `/models/blocked-user.ts`
- **Modelo User**: `/models/user.ts`
- **Controlador**: `/controllers/user-moderation.ts`
- **Rutas**: `/routes/user-moderation.ts`
- **Filtrado en Notes**: `/controllers/notes.ts`
