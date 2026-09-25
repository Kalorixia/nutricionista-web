import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { useConfirmedSignOut } from "@/hooks/use-confirmed-sign-out"

const signOut = vi.fn()

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signOut }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  signOut.mockResolvedValue(undefined)
})

function SalirButton() {
  const handleSignOut = useConfirmedSignOut()
  return <button onClick={handleSignOut}>Salir</button>
}

function mount() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ConfirmProvider>
        <Routes>
          <Route path="/" element={<SalirButton />} />
          <Route path="/login" element={<p>Pantalla de login</p>} />
        </Routes>
      </ConfirmProvider>
    </MemoryRouter>
  )
}

it("pide confirmación antes de cerrar la sesión", async () => {
  const user = userEvent.setup()
  mount()

  await user.click(screen.getByRole("button", { name: "Salir" }))

  await screen.findByText("¿Cerrar sesión?")
  expect(signOut).not.toHaveBeenCalled()
})

it("cancelar deja la sesión abierta y no navega", async () => {
  const user = userEvent.setup()
  mount()

  await user.click(screen.getByRole("button", { name: "Salir" }))
  await user.click(await screen.findByRole("button", { name: "Cancelar" }))

  await waitFor(() => expect(screen.queryByText("¿Cerrar sesión?")).toBeNull())
  expect(signOut).not.toHaveBeenCalled()
  expect(screen.queryByText("Pantalla de login")).toBeNull()
})

it("confirmar cierra la sesión y vuelve al login", async () => {
  const user = userEvent.setup()
  mount()

  await user.click(screen.getByRole("button", { name: "Salir" }))
  await user.click(await screen.findByRole("button", { name: "Cerrar sesión" }))

  await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
  await screen.findByText("Pantalla de login")
})
