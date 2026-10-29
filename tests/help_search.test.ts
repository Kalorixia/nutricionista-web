import { describe, expect, it } from "vitest"
import { search_help_topics } from "@/utils/help_search"
import type { HelpTopic } from "@/types/help"

function topic(id: string, partial: Partial<HelpTopic> = {}): HelpTopic {
  return {
    id,
    titulo: id,
    resumen: "",
    pasos: ["Paso uno"],
    notas: [],
    palabras_clave: [],
    ...partial,
  }
}

const topics: HelpTopic[] = [
  topic("vincular", {
    titulo: "Vincular un paciente con un código",
    pasos: ["Tocá “Generar código”."],
  }),
  topic("listas", {
    titulo: "Armar listas",
    pasos: ["Abrí la lista de compras de recetas."],
    palabras_clave: ["vinculación"],
  }),
  topic("otro", { notas: [{ tipo: "consejo", texto: "Cuidá tu CONTRASEÑA" }] }),
]

const ids = (found: HelpTopic[]) => found.map((t) => t.id)

describe("search_help_topics", () => {
  it("ignora mayúsculas", () => {
    expect(ids(search_help_topics(topics, "VINCULAR"))).toEqual(["vincular"])
  })

  it("ignora tildes en los dos sentidos", () => {
    expect(ids(search_help_topics(topics, "vinculacion"))).toEqual(["listas"])
    expect(ids(search_help_topics(topics, "codigo"))).toEqual(["vincular"])
    expect(ids(search_help_topics(topics, "código"))).toEqual(["vincular"])
  })

  it("exige todas las palabras aunque no sean contiguas", () => {
    expect(ids(search_help_topics(topics, "lista recetas"))).toEqual(["listas"])
    expect(ids(search_help_topics(topics, "lista pacientes"))).toEqual([])
  })

  it("busca en las notas", () => {
    expect(ids(search_help_topics(topics, "contrasena"))).toEqual(["otro"])
  })

  it("con consulta vacía devuelve todos en orden", () => {
    expect(ids(search_help_topics(topics, ""))).toEqual([
      "vincular",
      "listas",
      "otro",
    ])
    expect(ids(search_help_topics(topics, "   "))).toHaveLength(3)
  })

  it("sin coincidencias devuelve vacío", () => {
    expect(search_help_topics(topics, "zzz")).toEqual([])
  })
})
