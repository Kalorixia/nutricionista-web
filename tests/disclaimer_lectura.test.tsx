import { beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import Account from "@/pages/Account"
import Pending from "@/pages/Pending"
import { nutritionistService } from "@/services/nutritionist.service"
import { formatDateTime } from "@/utils/format"
import type { Disclaimer } from "@/types/disclaimer"

const FECHA = "2026-11-16T15:17:00Z"

const aceptado: Disclaimer = {
  rol: "nutricionista",
  version: 1,
  titulo: "Antes de empezar",
  cuerpo: "Cuerpo del aviso\n\n* Una viñeta",
  vigente_desde: FECHA,
  aceptado: true,
  fecha_aceptacion: FECHA,
}

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { nombre: "Ana", apellido: "Pérez", email: "ana@example.com" },
    refreshMe: vi.fn(),
  }),
}))
vi.mock("@/hooks/use-disclaimer", () => ({
  useDisclaimer: () => ({ disclaimer: aceptado }),
}))
vi.mock("@/hooks/use-confirmed-sign-out", () => ({
  useConfirmedSignOut: () => vi.fn(),
}))
vi.mock("@/services/nutritionist.service", () => ({
  nutritionistService: { estadoMatricula: vi.fn() },
}))
vi.mock("@/services/authService", () => ({ authService: {} }))
vi.mock("@/services/subscription.service", () => ({
  subscriptionService: {
    getMine: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}))
vi.mock("@/services/session", () => ({ getSessionToken: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
})

it("Account muestra versión y fecha de aceptación, y Leer abre el aviso", async () => {
  const user = userEvent.setup()
  vi.mocked(nutritionistService.estadoMatricula).mockResolvedValue(
    null as unknown as Awaited<
      ReturnType<typeof nutritionistService.estadoMatricula>
    >
  )
  render(
    <ConfirmProvider>
      <Account />
    </ConfirmProvider>
  )

  expect(screen.getByText("Aviso médico")).toBeTruthy()
  expect(screen.getByText("Versión 1")).toBeTruthy()
  expect(screen.getByText(formatDateTime(FECHA))).toBeTruthy()

  await user.click(screen.getByRole("button", { name: "Leer" }))
  expect(await screen.findByText("Antes de empezar")).toBeTruthy()
  expect(screen.getByText("Cuerpo del aviso")).toBeTruthy()
})

for (const estado of ["pendiente", "rechazada"] as const) {
  it(`Pending (${estado}) permite leer el aviso aceptado`, async () => {
    const user = userEvent.setup()
    vi.mocked(nutritionistService.estadoMatricula).mockResolvedValue({
      id_nutricionista: 1,
      matricula: "MP-1",
      estado,
      fecha_solicitud: FECHA,
      fecha_validacion: null,
      observaciones: null,
    } as Awaited<ReturnType<typeof nutritionistService.estadoMatricula>>)
    render(
      <MemoryRouter>
        <Pending />
      </MemoryRouter>
    )

    await user.click(
      await screen.findByRole("button", {
        name: "Leer el aviso médico que aceptaste",
      })
    )
    expect(await screen.findByText("Antes de empezar")).toBeTruthy()
    expect(screen.getByText("Cuerpo del aviso")).toBeTruthy()
  })
}
