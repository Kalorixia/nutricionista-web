// MOCK — todavía no existe un feed de actividad real en el backend.
export interface ActivityItem {
  id: string
  mensaje: string
  fecha: string
}

function hoursAgo(hours: number) {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

export const activityItems: ActivityItem[] = [
  { id: "act_1", mensaje: "Generaste un código de vinculación", fecha: hoursAgo(3) },
  { id: "act_2", mensaje: "Creaste el plan \"Plan de ejemplo — déficit calórico\"", fecha: hoursAgo(30) },
  { id: "act_3", mensaje: "Actualizaste tu perfil profesional", fecha: hoursAgo(72) },
]
