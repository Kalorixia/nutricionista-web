import { beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import RequireDisclaimer from "@/routes/RequireDisclaimer"
import { useDisclaimer } from "@/hooks/use-disclaimer"
import type { Disclaimer } from "@/types/disclaimer"

vi.mock("@/hooks/use-disclaimer", () => ({ useDisclaimer: vi.fn() }))
vi.mock("@/components/common/KalorixiaLoader", () => ({
  default: () => <p>Cargando</p>,
}))

const base: Disclaimer = {
  rol: "nutricionista",
  version: 1,
  titulo: "Antes de empezar",
  cuerpo: "Texto",
  vigente_desde: "2026-11-16T12:00:00Z",
  aceptado: false,
  fecha_aceptacion: null,
}

function mockState(
  status: "loading" | "ready" | "error",
  disclaimer: Disclaimer | null
) {
  vi.mocked(useDisclaimer).mockReturnValue({
    disclaimer,
    status,
    errorMessage: null,
    reload: vi.fn(),
    accept: vi.fn(),
  })
}

function mount(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/disclaimer" element={<p>Pantalla disclaimer</p>} />
        <Route element={<RequireDisclaimer />}>
          <Route path="/" element={<p>Portal</p>} />
          <Route path="/pendiente" element={<p>Pendiente</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

it("mientras carga muestra el loader, sin outlet ni redirección", () => {
  mockState("loading", null)
  mount("/")
  expect(screen.getByText("Cargando")).toBeTruthy()
  expect(screen.queryByText("Portal")).toBeNull()
  expect(screen.queryByText("Pantalla disclaimer")).toBeNull()
})

it("aceptado deja pasar en / y en /pendiente", () => {
  mockState("ready", { ...base, aceptado: true })
  mount("/")
  expect(screen.getByText("Portal")).toBeTruthy()
})

it("aceptado deja pasar en /pendiente", () => {
  mockState("ready", { ...base, aceptado: true })
  mount("/pendiente")
  expect(screen.getByText("Pendiente")).toBeTruthy()
})

it("no aceptado manda a /disclaimer, también desde /pendiente", () => {
  mockState("ready", base)
  mount("/pendiente")
  expect(screen.getByText("Pantalla disclaimer")).toBeTruthy()
  expect(screen.queryByText("Pendiente")).toBeNull()
})

it("no aceptado manda a /disclaimer desde /", () => {
  mockState("ready", base)
  mount("/")
  expect(screen.getByText("Pantalla disclaimer")).toBeTruthy()
})

it("un error manda a /disclaimer (fail-closed)", () => {
  mockState("error", null)
  mount("/")
  expect(screen.getByText("Pantalla disclaimer")).toBeTruthy()
})
