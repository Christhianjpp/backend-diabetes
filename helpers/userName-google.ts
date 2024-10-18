export const userNameGoogle = (name: string) => {
    const nombreCompleto = name.replace(/\s/g, '')


    const valor = Math.random().toString(36).substring(2, 7);

    let resultado = nombreCompleto + valor

    if (resultado.length > 15) {
        resultado = resultado.substring(0, 15)
    }
    console.log(resultado)
    return resultado
}

const combinacionesUtilizadas = new Set();

function generarCombinacionUnica() {
    let combinacion;

    do {
        // Generar una combinación de números y letras de 5 dígitos
        combinacion = Math.random().toString(36).substring(2, 7);
    } while (combinacionesUtilizadas.has(combinacion));

    combinacionesUtilizadas.add(combinacion);
    return combinacion;
}
