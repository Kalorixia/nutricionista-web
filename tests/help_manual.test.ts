import { describe, expect, it } from "vitest"
import { MANUAL_NUTRICIONISTA } from "@/content/manual_nutricionista"

const PROHIBIDOS = [
  /\bKalo\b/,
  /soporte/i,
  /si est[aá] disponible/i,
  /pr[oó]ximamente/i,
  /recuper/i,
  /olvid/i,
  /notificaci/i,
  /suscripci/i,
  /adjunt/i,
]

function all_texts(): string[] {
  const m = MANUAL_NUTRICIONISTA
  return [
    m.introduccion,
    ...m.temas.flatMap((t) => [
      t.id,
      t.titulo,
      t.resumen,
      ...t.pasos,
      ...t.notas.map((n) => n.texto),
      ...t.palabras_clave,
    ]),
    ...m.preguntas_frecuentes.flatMap((f) => [f.pregunta, f.respuesta]),
  ]
}

describe("manual del nutricionista", () => {
  it("tiene ids únicos y al menos un paso por tema", () => {
    const ids = MANUAL_NUTRICIONISTA.temas.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const tema of MANUAL_NUTRICIONISTA.temas) {
      expect(tema.pasos.length).toBeGreaterThan(0)
    }
  })

  it("tiene el tema del Copiloto y las preguntas frecuentes", () => {
    expect(MANUAL_NUTRICIONISTA.temas.map((t) => t.id)).toContain("copiloto")
    expect(MANUAL_NUTRICIONISTA.preguntas_frecuentes).toHaveLength(5)
  })

  it("no menciona funciones que el portal no ofrece", () => {
    for (const texto of all_texts()) {
      for (const patron of PROHIBIDOS) {
        expect(texto, String(patron)).not.toMatch(patron)
      }
    }
  })
})
