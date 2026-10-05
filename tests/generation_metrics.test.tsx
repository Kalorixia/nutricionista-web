import { render, screen } from "@testing-library/react"
import { expect, it } from "vitest"
import { GenerationMetrics } from "@/components/modules/plans/GenerationMetrics"

const base = {
  modelo: "gemini-3.1-pro-preview",
  version_prompt: "weekly-draft-v5",
  generado_en: "2026-10-04T12:00:00",
}

it("muestra el desvío final y el previo a la corrección", () => {
  render(
    <GenerationMetrics
      generacion={{
        ...base,
        desviacion: {
          antes: { energia: 0.31, proteinas: 0.4, dias_fuera: 7 },
          despues: { energia: 0.08, proteinas: 0.12, dias_fuera: 1 },
          umbral: 0.1,
          correccion: "aplicada",
        },
      }}
    />
  )
  const medicion = screen.getByRole("region", { name: "Medición del Copiloto" })
  expect(medicion.textContent).toContain("8 %")
  expect(medicion.textContent).toContain("antes de corregir: 31 %")
  expect(medicion.textContent).toContain("ronda de corrección")
})

it("muestra cuánto cambió el profesional al publicar", () => {
  render(
    <GenerationMetrics
      generacion={{
        ...base,
        revision_profesional: {
          agregados: 2,
          quitados: 1,
          cambiados: 3,
          publicado_en: "2026-10-04T13:00:00",
        },
      }}
    />
  )
  expect(screen.getByText(/3 reemplazos, 2 agregados, 1 quitados/)).toBeTruthy()
})

it("no muestra nada en un plan sin medición", () => {
  const { container } = render(<GenerationMetrics generacion={base} />)
  expect(container.textContent).toBe("")
})
