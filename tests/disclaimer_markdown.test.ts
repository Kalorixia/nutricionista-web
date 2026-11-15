import { expect, it } from "vitest"
import { parseDisclaimerBody } from "@/utils/disclaimer_markdown"

// Texto del ticket (nutricionista, v1) con la transformación de la semilla:
// sin "> ", sin título ni casilla, párrafo y lista separados por "\n\n".
const CUERPO_V1 = [
  "Kalorixia es una herramienta de apoyo para tu práctica profesional. **La responsabilidad clínica sobre cada plan es tuya.**",
  "",
  "* Los borradores del **Copiloto** se generan con inteligencia artificial. Son sugerencias: revisalos y ajustalos antes de aprobarlos. Pueden contener errores u omisiones.",
  "* Los **requerimientos calculados** (gasto energético y macronutrientes) usan fórmulas estándar y son un punto de partida, no una prescripción.",
  "* El filtro de **restricciones y alergias** descarta recetas según los datos cargados. Verificá que el plan sea seguro para tu paciente: el sistema no reemplaza tu criterio.",
  "* Usá los datos de tus pacientes solo para su atención, y mantené la confidencialidad profesional.",
].join("\n")

it("el cuerpo v1 da un párrafo y una lista de 4 viñetas con las negritas", () => {
  const blocks = parseDisclaimerBody(CUERPO_V1)
  expect(blocks).toHaveLength(2)
  const [paragraph, list] = blocks
  if (paragraph.type !== "paragraph" || list.type !== "list") {
    throw new Error("Estructura inesperada")
  }
  expect(paragraph.segments.filter((s) => s.bold)).toEqual([
    { text: "La responsabilidad clínica sobre cada plan es tuya.", bold: true },
  ])
  expect(list.items).toHaveLength(4)
  expect(list.items[0].filter((s) => s.bold)).toEqual([
    { text: "Copiloto", bold: true },
  ])
})

it("un ** sin cierre queda literal", () => {
  expect(parseDisclaimerBody("Hola **mundo")).toEqual([
    { type: "paragraph", segments: [{ text: "Hola **mundo", bold: false }] },
  ])
})

it("normaliza \\r\\n", () => {
  const blocks = parseDisclaimerBody("Uno\r\n\r\n* a\r\n* b")
  expect(blocks).toHaveLength(2)
  expect(blocks[1]).toEqual({
    type: "list",
    items: [[{ text: "a", bold: false }], [{ text: "b", bold: false }]],
  })
})

it("un bloque mixto es párrafo", () => {
  expect(parseDisclaimerBody("* a\nb")).toEqual([
    { type: "paragraph", segments: [{ text: "* a b", bold: false }] },
  ])
})
