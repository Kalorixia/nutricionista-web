import type { Medicion } from "@/types/patient"

export interface PuntoPeso {
  x: number
  y: number
}

/**
 * Puntos de la línea de peso para un SVG de `ancho` x `alto`, en el orden de
 * las mediciones (ascendentes por fecha). Ignora las que no tienen peso. El
 * peso más alto queda arriba; con un peso constante, la línea va al medio.
 */
export function puntos_peso(
  mediciones: Pick<Medicion, "peso_kg">[],
  ancho: number,
  alto: number,
  margen = 4
): PuntoPeso[] {
  const pesos = mediciones
    .map((m) => m.peso_kg)
    .filter((peso): peso is number => peso !== null)
  if (!pesos.length) return []
  const minimo = Math.min(...pesos)
  const maximo = Math.max(...pesos)
  const util_x = ancho - margen * 2
  const util_y = alto - margen * 2
  return pesos.map((peso, i) => ({
    x:
      pesos.length === 1
        ? ancho / 2
        : margen + (util_x * i) / (pesos.length - 1),
    y:
      maximo === minimo
        ? alto / 2
        : margen + util_y * (1 - (peso - minimo) / (maximo - minimo)),
  }))
}
