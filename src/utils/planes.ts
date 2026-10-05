import type { EstadoPlanificacion, Planificacion } from "@/types/mealPlan"

export interface GrupoPaciente {
  id_paciente: number | null
  nombre_paciente: string
  planes: Planificacion[]
}

/** Lo que el profesional tiene que atender primero: borradores, después lo vigente. */
const PRIORIDAD: Record<EstadoPlanificacion, number> = {
  borrador: 0,
  publicada: 1,
  archivada: 2,
}

const fecha = (plan: Planificacion) =>
  plan.fecha_publicacion ?? plan.created_at ?? ""

function ordenar(a: Planificacion, b: Planificacion) {
  return (
    PRIORIDAD[a.estado] - PRIORIDAD[b.estado] ||
    fecha(b).localeCompare(fecha(a)) ||
    b.id_planificacion - a.id_planificacion
  )
}

/**
 * Los planes agrupados por paciente. Dentro de cada paciente, borradores
 * primero y después lo más reciente; los pacientes, del que tuvo actividad
 * más reciente al más antiguo.
 */
export function agrupar_por_paciente(planes: Planificacion[]): GrupoPaciente[] {
  const grupos = new Map<string, GrupoPaciente>()
  for (const plan of planes) {
    const clave = String(plan.id_paciente ?? plan.nombre_paciente)
    const grupo = grupos.get(clave) ?? {
      id_paciente: plan.id_paciente ?? null,
      nombre_paciente: plan.nombre_paciente || "Paciente",
      planes: [],
    }
    grupo.planes.push(plan)
    grupos.set(clave, grupo)
  }
  const reciente = (grupo: GrupoPaciente) =>
    grupo.planes.reduce((max, plan) => {
      const valor = plan.created_at ?? ""
      return valor > max ? valor : max
    }, "")
  return [...grupos.values()]
    .map((grupo) => ({ ...grupo, planes: [...grupo.planes].sort(ordenar) }))
    .sort(
      (a, b) =>
        reciente(b).localeCompare(reciente(a)) ||
        a.nombre_paciente.localeCompare(b.nombre_paciente)
    )
}

/** "Ana Pérez" → "AP" */
export function iniciales(nombre: string): string {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?"
  )
}
