import { describe, expect, it } from "vitest"
import { ordenar_planes_paciente } from "@/utils/planes"
import type { EstadoPlanificacion, Planificacion } from "@/types/mealPlan"

function plan(
  id: number,
  estado: EstadoPlanificacion,
  created_at: string
): Planificacion {
  return {
    id_planificacion: id,
    id_paciente: 1,
    nombre_paciente: "Ana",
    nombre: `Plan ${id}`,
    descripcion: null,
    estado,
    fecha_inicio: null,
    fecha_fin: null,
    fecha_publicacion: null,
    created_at,
    cantidad_recetas: 0,
  }
}

describe("ordenar_planes_paciente", () => {
  it("pone primero el publicado aunque sea el más viejo", () => {
    const ordenados = ordenar_planes_paciente([
      plan(1, "borrador", "2026-11-10T10:00:00Z"),
      plan(2, "publicada", "2026-01-01T10:00:00Z"),
      plan(3, "archivada", "2026-11-12T10:00:00Z"),
    ])
    expect(ordenados.map((p) => p.id_planificacion)).toEqual([2, 3, 1])
  })

  it("ordena el resto del más reciente al más antiguo", () => {
    const ordenados = ordenar_planes_paciente([
      plan(1, "archivada", "2026-03-01T10:00:00Z"),
      plan(2, "borrador", "2026-09-01T10:00:00Z"),
      plan(3, "archivada", "2026-06-01T10:00:00Z"),
    ])
    expect(ordenados.map((p) => p.id_planificacion)).toEqual([2, 3, 1])
  })

  it("no muta la entrada", () => {
    const entrada = [
      plan(1, "archivada", "2026-03-01T10:00:00Z"),
      plan(2, "publicada", "2026-01-01T10:00:00Z"),
    ]
    ordenar_planes_paciente(entrada)
    expect(entrada.map((p) => p.id_planificacion)).toEqual([1, 2])
  })
})
