"use strict";
/**
 * Utilidades para la generación de nombres de usuario únicos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userName = void 0;
// Almacena combinaciones ya utilizadas para evitar duplicados
const combinacionesUtilizadas = new Set();
/**
 * Genera un nombre de usuario único basado en el nombre real del usuario
 * y una combinación aleatoria de caracteres alfanuméricos
 *
 * @param name - Nombre completo del usuario
 * @param maxLength - Longitud máxima del nombre de usuario (por defecto 15)
 * @returns Nombre de usuario único
 */
const userName = (name, maxLength = 15) => {
    // Normalizar el nombre: quitar espacios, acentos y convertir a minúsculas
    const nombreNormalizado = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]/g, ''); // Solo permitir letras y números
    // Generar valor aleatorio único
    const valorAleatorio = generarCombinacionUnica();
    // Combinar nombre y valor aleatorio
    let nombreUsuario = nombreNormalizado + valorAleatorio;
    // Truncar si excede la longitud máxima
    if (nombreUsuario.length > maxLength) {
        // Reservar espacio para el valor aleatorio
        const longitudNombre = maxLength - valorAleatorio.length;
        nombreUsuario = nombreNormalizado.substring(0, longitudNombre) + valorAleatorio;
    }
    return nombreUsuario;
};
exports.userName = userName;
/**
 * Genera una combinación alfanumérica única que no se haya utilizado antes
 *
 * @param length - Longitud de la combinación (por defecto 5)
 * @returns Combinación alfanumérica única
 */
function generarCombinacionUnica(length = 5) {
    let combinacion;
    let intentos = 0;
    const maxIntentos = 100; // Evitar bucle infinito en caso de muchas colisiones
    do {
        // Generar una combinación alfanumérica
        combinacion = Math.random().toString(36).substring(2, 2 + length);
        intentos++;
        // Si después de muchos intentos no encontramos una combinación única,
        // agregar un timestamp para garantizar unicidad
        if (intentos > maxIntentos) {
            combinacion += Date.now().toString(36).slice(-3);
            break;
        }
    } while (combinacionesUtilizadas.has(combinacion));
    combinacionesUtilizadas.add(combinacion);
    return combinacion;
}
//# sourceMappingURL=userCreateName.js.map