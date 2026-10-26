export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR")
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR")
}

/**
 * "15/9/2026" a partir de una fecha sin hora ("2026-09-15"), sin correr de
 * día: `new Date("2026-09-15")` es medianoche UTC, el día anterior en
 * Argentina.
 */
export function formatDateOnly(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR")
}

/** `YYYY-MM-DD` de la fecha local, nunca la UTC de `toISOString()`. */
export function localDateIso(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, "0")
  const dia = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${mes}-${dia}`
}
