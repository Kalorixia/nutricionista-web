import { beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { UserEvent } from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Login from "@/pages/Login"

const signIn = vi.fn()

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signIn }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function ingresar(user: UserEvent, email: string, password: string) {
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: "/login", state: { from: { pathname: "/pacientes" } } },
      ]}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pacientes" element={<p>Pantalla de pacientes</p>} />
      </Routes>
    </MemoryRouter>
  )
  if (email) await user.type(screen.getByLabelText("Email"), email)
  if (password) await user.type(screen.getByLabelText("Contraseña"), password)
  await user.click(screen.getByRole("button", { name: "Ingresar" }))
}

it("avisa en español que el email está vacío", async () => {
  const user = userEvent.setup()
  await ingresar(user, "", "Secreta123")

  await screen.findByText("Completá el email")
  expect(signIn).not.toHaveBeenCalled()
})

it("avisa en español que la contraseña está vacía", async () => {
  const user = userEvent.setup()
  await ingresar(user, "nutri@example.com", "")

  await screen.findByText("Completá la contraseña")
  expect(signIn).not.toHaveBeenCalled()
})

it("avisa en español que los dos campos están vacíos", async () => {
  const user = userEvent.setup()
  await ingresar(user, "", "")

  await screen.findByText("Completá el email y la contraseña")
  expect(signIn).not.toHaveBeenCalled()
})

it("una contraseña de solo espacios cuenta como vacía", async () => {
  const user = userEvent.setup()
  await ingresar(user, "nutri@example.com", "   ")

  await screen.findByText("Completá la contraseña")
  expect(signIn).not.toHaveBeenCalled()
})

it("con los dos campos completos inicia sesión y vuelve a la ruta de origen", async () => {
  signIn.mockResolvedValue(undefined)
  const user = userEvent.setup()
  await ingresar(user, "nutri@example.com", "Secreta123")

  await screen.findByText("Pantalla de pacientes")
  expect(signIn).toHaveBeenCalledWith("nutri@example.com", "Secreta123")
})
