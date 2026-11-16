import { describe, expect, it } from "vitest"
import {
  CABECERA_LISTA,
  LISTA_VACIA,
  contenido_lista,
  generar_lista_pdf,
} from "@/utils/lista_pdf"
import type { ListaRecetaDetalle, RecetaListItem } from "@/types/recipe"

const receta = (extra: Partial<RecetaListItem>): RecetaListItem => ({
  id_receta: 1,
  nombre: "Tarta",
  descripcion: null,
  tiempo_preparacion: 0,
  porciones: 2,
  dificultad: null,
  calorias_por_porcion: null,
  estado_nutricional: null,
  imagen_url: null,
  publica: false,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: null,
  categorias: [],
  ...extra,
})

const lista = (recetas: RecetaListItem[]): ListaRecetaDetalle => ({
  id_lista: 1,
  nombre: "Cenas rápidas ñandú",
  publica: false,
  created_at: "2026-10-05T10:00:00Z",
  recetas,
})

const LLENA = lista([
  receta({
    id_receta: 1,
    nombre: "Pollo al horno",
    descripcion: "Con papas",
    tiempo_preparacion: 45,
    porciones: 4,
    dificultad: "Media",
    calorias_por_porcion: 1234.4,
  }),
  receta({ id_receta: 2, nombre: "Ensalada" }),
])

describe("contenido_lista", () => {
  it("arma título, líneas, cabecera y filas en orden", () => {
    const c = contenido_lista(LLENA, "2026-11-16")
    expect(c.titulo).toBe("Cenas rápidas ñandú")
    expect(c.lineas).toEqual(["Creada el 5/10/2026", "2 recetas"])
    expect(c.tabla?.cabecera).toEqual(CABECERA_LISTA)
    expect(c.tabla?.filas).toEqual([
      ["Pollo al horno\nCon papas", "45 min", "4", "Media", "1.234"],
      ["Ensalada", "—", "2", "—", "—"],
    ])
    expect(c.vacio).toBeNull()
    expect(c.pie).toBe("Generado el 16/11/2026 con Kalorixia")
    expect(c.nombre_archivo).toBe("lista-cenas-rapidas-nandu.pdf")
  })

  it("usa singular con una receta", () => {
    const c = contenido_lista(lista([receta({})]), "2026-11-16")
    expect(c.lineas[1]).toBe("1 receta")
  })

  it("la lista vacía no tiene tabla y lleva el texto de vacío", () => {
    const c = contenido_lista(lista([]), "2026-11-16")
    expect(c.tabla).toBeNull()
    expect(c.vacio).toBe(LISTA_VACIA)
    expect(c.lineas[1]).toBe("0 recetas")
  })
})

describe("generar_lista_pdf", () => {
  it("genera el PDF de la lista vacía", async () => {
    const doc = await generar_lista_pdf(
      contenido_lista(lista([]), "2026-11-16")
    )
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    expect(doc.output()).toContain("no tiene recetas")
  })

  it("genera el PDF de la lista con recetas", async () => {
    const doc = await generar_lista_pdf(contenido_lista(LLENA, "2026-11-16"))
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    expect(doc.output()).toContain("Pollo al horno")
  })
})
