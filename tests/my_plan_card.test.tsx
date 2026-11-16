import { beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import MyPlanCard from "@/components/modules/account/MyPlanCard"
import { subscriptionService } from "@/services/subscription.service"
import type { MiSuscripcion } from "@/types/subscription"

vi.mock("@/services/subscription.service", () => ({
  subscriptionService: { getMine: vi.fn() },
}))

const PLAN = {
  codigo: "starter",
  nombre: "Starter",
  max_pacientes_activos: 15,
  max_generaciones_mes: 20,
}

function suscripcion(pacientes: number, generaciones: number): MiSuscripcion {
  return {
    plan: PLAN,
    uso: {
      mes: "2026-11",
      pacientes_activos: pacientes,
      generaciones_mes: generaciones,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

it("muestra el plan y el uso", async () => {
  vi.mocked(subscriptionService.getMine).mockResolvedValue(suscripcion(12, 7))
  render(<MyPlanCard />)
  expect(await screen.findByText("Starter")).toBeTruthy()
  expect(screen.getByText("12 de 15")).toBeTruthy()
  expect(screen.getByText("7 de 20")).toBeTruthy()
  expect(screen.queryByText("Llegaste al límite de tu plan")).toBeNull()
})

it("con el uso por encima del máximo lo muestra sin recortar y avisa", async () => {
  vi.mocked(subscriptionService.getMine).mockResolvedValue(suscripcion(17, 7))
  render(<MyPlanCard />)
  expect(await screen.findByText("17 de 15")).toBeTruthy()
  expect(screen.getByText("Llegaste al límite de tu plan")).toBeTruthy()
})

it("avisa si no se pudo cargar el plan", async () => {
  vi.mocked(subscriptionService.getMine).mockRejectedValue(new Error("boom"))
  render(<MyPlanCard />)
  expect(await screen.findByText("No pudimos cargar tu plan.")).toBeTruthy()
})
