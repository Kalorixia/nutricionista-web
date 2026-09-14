import { expect, it, vi } from "vitest"
import { authedFetch } from "@/services/http"
import { mealPlansService } from "@/services/mealPlans.service"
vi.mock("@/services/http", () => ({ authedFetch: vi.fn() }))
it("consume el contrato real del Copiloto sin publicar el resultado", async () => {
  const draft = { id_planificacion: 7, estado: "borrador" }
  vi.mocked(authedFetch).mockResolvedValue(draft)
  const input = {
    id_paciente: 3,
    nombre: "Semana",
    indicaciones: "Variar las recetas",
  }
  expect(await mealPlansService.generate(input)).toEqual(draft)
  expect(authedFetch).toHaveBeenCalledExactlyOnceWith("/copiloto/borradores", {
    method: "POST",
    body: input,
  })
})
