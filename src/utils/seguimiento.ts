import type { Planificacion } from "@/types/mealPlan"

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
