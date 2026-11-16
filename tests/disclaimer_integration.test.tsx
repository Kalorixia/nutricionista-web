import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Disclaimer from "@/pages/Disclaimer"
import RequireDisclaimer from "@/routes/RequireDisclaimer"
import { DisclaimerProvider } from "@/hooks/use-disclaimer"
import { authedFetch } from "@/services/http"
import type { Disclaimer as DisclaimerData } from "@/types/disclaimer"

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id_usuario: 7 },
    isNutritionist: true,
  }),
}))
vi.mock("@/hooks/use-confirmed-sign-out", () => ({
  useConfirmedSignOut: () => vi.fn(),
}))
vi.mock("@/services/session", () => ({
  getSessionToken: () => "token-de-prueba",
  refreshSessionOnce: async () => false,
}))

const v1: DisclaimerData = {
  rol: "nutricionista",
  version: 1,
  titulo: "Antes de empezar",
  cuerpo: "Texto de la versión uno",
  vigente_desde: "2026-11-16T12:00:00Z",
  aceptado: true,
  fecha_aceptacion: "2026-11-16T13:00:00Z",
}
const v2: DisclaimerData = {
  ...v1,
  version: 2,
  cuerpo: "Texto de la versión dos",
  aceptado: false,
  fecha_aceptacion: null,
}

let vigente: DisclaimerData

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

function Pantalla() {
  return (
    <button
      onClick={() => {
        void authedFetch("/pacientes").catch(() => {})
      }}
    >
      Pedir pacientes
    </button>
  )
}

beforeEach(() => {
  vigente = v1
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/disclaimer")) return json(vigente)
      // El servidor publicó la v2: toda request de portal da el 403 de bloqueo.
      vigente = v2
      return json(
        {
          detail:
            "Debe aceptar el disclaimer médico vigente antes de continuar",
        },
        403,
        { "X-Disclaimer-Requerido": "true" }
      )
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it("un 403 de bloqueo a mitad de sesión lleva a /disclaimer con la versión nueva", async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={["/"]}>
      <DisclaimerProvider>
        <Routes>
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route element={<RequireDisclaimer />}>
            <Route path="/" element={<Pantalla />} />
          </Route>
        </Routes>
      </DisclaimerProvider>
    </MemoryRouter>
  )

  await user.click(
    await screen.findByRole("button", { name: "Pedir pacientes" })
  )

  expect(await screen.findByText("Texto de la versión dos")).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Pedir pacientes" })).toBeNull()
  expect(
    screen.getByRole("checkbox", { name: "Leí y acepto estas condiciones." })
  ).toBeTruthy()
})
