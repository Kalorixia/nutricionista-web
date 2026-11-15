import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { toast } from "sonner"
import Disclaimer from "@/pages/Disclaimer"
import { useDisclaimer } from "@/hooks/use-disclaimer"
import { ApiError } from "@/services/http"
import type { Disclaimer as DisclaimerData } from "@/types/disclaimer"

vi.mock("@/hooks/use-disclaimer", () => ({ useDisclaimer: vi.fn() }))
vi.mock("@/hooks/use-confirmed-sign-out", () => ({
  useConfirmedSignOut: () => vi.fn(),
}))
vi.mock("@/components/common/KalorixiaLoader", () => ({
  default: () => <p>Cargando</p>,
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const base: DisclaimerData = {
  rol: "nutricionista",
  version: 4,
  titulo: "Antes de empezar",
  cuerpo: "Intro\n\n* Uno\n* Dos",
  vigente_desde: "2026-11-16T12:00:00Z",
  aceptado: false,
  fecha_aceptacion: null,
}

const accept = vi.fn()
const reload = vi.fn()

function mockState(
  status: "loading" | "ready" | "error",
  disclaimer: DisclaimerData | null,
  errorMessage: string | null = null
) {
  vi.mocked(useDisclaimer).mockReturnValue({
    disclaimer,
    status,
    errorMessage,
    reload,
    accept,
  })
}

function mount(
  entry: string | { pathname: string; state?: unknown } = "/disclaimer"
) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/" element={<p>Portal</p>} />
        <Route path="/pacientes" element={<p>Pacientes</p>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  accept.mockResolvedValue(undefined)
  reload.mockResolvedValue(undefined)
})

it("el botón está deshabilitado hasta tildar la casilla", async () => {
  const user = userEvent.setup()
  mockState("ready", base)
  mount()

  const boton = screen.getByRole("button", { name: /Aceptar y continuar/ })
  expect((boton as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getByRole("heading", { name: "Antes de empezar" })).toBeTruthy()
  expect(screen.getAllByRole("listitem")).toHaveLength(2)

  await user.click(
    screen.getByRole("checkbox", { name: "Leí y acepto estas condiciones." })
  )
  expect((boton as HTMLButtonElement).disabled).toBe(false)
})

it("aceptar manda la versión que vino del GET", async () => {
  const user = userEvent.setup()
  mockState("ready", base)
  mount()

  await user.click(
    screen.getByRole("checkbox", { name: "Leí y acepto estas condiciones." })
  )
  await user.click(screen.getByRole("button", { name: /Aceptar y continuar/ }))

  await waitFor(() => expect(accept).toHaveBeenCalledWith(4))
})

it("ya aceptado navega a `from` sin mostrar el formulario", () => {
  mockState("ready", { ...base, aceptado: true })
  mount({
    pathname: "/disclaimer",
    state: { from: { pathname: "/pacientes" } },
  })
  expect(screen.getByText("Pacientes")).toBeTruthy()
  expect(screen.queryByRole("checkbox")).toBeNull()
})

it("ya aceptado sin `from` va a /", () => {
  mockState("ready", { ...base, aceptado: true })
  mount()
  expect(screen.getByText("Portal")).toBeTruthy()
})

it("409 muestra el aviso y destilda la casilla", async () => {
  const user = userEvent.setup()
  accept.mockRejectedValue(
    new ApiError("La versión indicada no es la vigente", 409)
  )
  mockState("ready", base)
  mount()

  const casilla = screen.getByRole("checkbox", {
    name: "Leí y acepto estas condiciones.",
  })
  await user.click(casilla)
  await user.click(screen.getByRole("button", { name: /Aceptar y continuar/ }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Se publicó una versión nueva del aviso. Leela antes de aceptar."
    )
  )
  await waitFor(() =>
    expect(casilla.getAttribute("aria-checked")).toBe("false")
  )
})

it("otro error muestra su mensaje", async () => {
  const user = userEvent.setup()
  accept.mockRejectedValue(new ApiError("Falla del servidor", 500))
  mockState("ready", base)
  mount()

  await user.click(
    screen.getByRole("checkbox", { name: "Leí y acepto estas condiciones." })
  )
  await user.click(screen.getByRole("button", { name: /Aceptar y continuar/ }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Falla del servidor")
  )
})

it("en error muestra el mensaje y Reintentar llama a reload", async () => {
  const user = userEvent.setup()
  mockState("error", null, "Sin conexión")
  mount()

  expect(
    screen.getByText(/Sin aceptarlo no se puede usar el portal/)
  ).toBeTruthy()
  expect(screen.getByText("Sin conexión")).toBeTruthy()
  expect(screen.queryByRole("checkbox")).toBeNull()

  await user.click(screen.getByRole("button", { name: "Reintentar" }))
  expect(reload).toHaveBeenCalledOnce()
})
