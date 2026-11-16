import type { EstadoRegistro, Planificacion } from "@/types/mealPlan"

/** Etiqueta y clases de cada estado de una comida registrada. */
export const ESTADO_REGISTRO: Record<
  EstadoRegistro,
  { label: string; clase: string }
> = {
  cumplida: {
    label: "Cumplida",
    clase:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  con_cambios: {
    label: "Con cambios",
    clase:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  },
  no_cumplida: {
    label: "No cumplida",
    clase:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
  },
}

/** "lun 5/10" a partir de "2026-10-05", sin correr de día por la zona horaria. */
export function fecha_corta(iso: string, con_dia = true): string {
  const [anio, mes, dia] = iso.split("-").map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  const texto = `${fecha.getDate()}/${fecha.getMonth() + 1}`
  return con_dia
    ? `${fecha.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")} ${texto}`
    : texto
}

/** El plan a mostrar por defecto: el publicado más reciente, si no el último archivado. */
export function plan_por_defecto(
  planes: Planificacion[]
): Planificacion | null {
  const reciente = (a: Planificacion, b: Planificacion) =>
    (b.fecha_publicacion ?? b.created_at).localeCompare(
      a.fecha_publicacion ?? a.created_at
    )
  const publicados = planes
    .filter((p) => p.estado === "publicada")
    .sort(reciente)
  const archivados = planes
    .filter((p) => p.estado === "archivada")
    .sort(reciente)
  return publicados[0] ?? archivados[0] ?? null
}
