import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { UserEvent } from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import Signup from "@/pages/Signup"
import { apiFetch } from "@/services/http"
import { nutritionistService } from "@/services/nutritionist.service"

const signUp = vi.fn()

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signUp }),
}))
vi.mock("@/services/nutritionist.service", () => ({
  nutritionistService: { catalogosRegistro: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(nutritionistService.catalogosRegistro).mockResolvedValue({
    especialidades: [],
  } as unknown as Awaited<
    ReturnType<typeof nutritionistService.catalogosRegistro>
  >)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function completar(user: UserEvent, email: string) {
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  )
  await user.type(screen.getByLabelText("Nombre"), "Ana")
  await user.type(screen.getByLabelText("Apellido"), "Pérez")
  if (email) await user.type(screen.getByLabelText("Email"), email)
  await user.type(screen.getByLabelText("Contraseña"), "Nutri12345")
  await user.type(screen.getByLabelText("Repetir contraseña"), "Nutri12345")
  await user.type(screen.getByLabelText("Matrícula profesional"), "MN123")
  await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
}

it("rechaza en español un email sin dominio con punto", async () => {
  const user = userEvent.setup()
  await completar(user, "juan@gmail")

  await screen.findByText("El email ingresado no es válido")
  expect(signUp).not.toHaveBeenCalled()
})

it("pide en español los campos obligatorios vacíos", async () => {
  const user = userEvent.setup()
  await completar(user, "")

  await screen.findByText("Completá todos los campos obligatorios")
  expect(signUp).not.toHaveBeenCalled()
})

it("un email válido llega al registro", async () => {
  signUp.mockResolvedValue(undefined)
  const user = userEvent.setup()
  await completar(user, "ana@example.com")

  expect(signUp).toHaveBeenCalledWith(
    expect.objectContaining({ email: "ana@example.com" })
  )
})

function stubResponse(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    )
  )
}

it("traduce un 422 de Pydantic sobre el email", async () => {
  stubResponse(422, {
    detail: [
      {
        type: "value_error",
        loc: ["body", "email"],
        msg: "value is not a valid email address: An email address must have an @-sign.",
      },
    ],
  })

  await expect(apiFetch("/auth/register/nutricionista")).rejects.toThrow(
    "El email ingresado no es válido"
  )
})

it("un 422 de Pydantic sobre otro campo no muestra el mensaje en inglés", async () => {
  stubResponse(422, {
    detail: [
      { type: "missing", loc: ["body", "nombre"], msg: "Field required" },
    ],
  })

  await expect(apiFetch("/auth/register/nutricionista")).rejects.toThrow(
    "Revisá los datos ingresados"
  )
})

it("un detail en texto se sigue mostrando tal cual", async () => {
  stubResponse(409, { detail: "Email o matrícula ya registrados" })

  await expect(apiFetch("/auth/register/nutricionista")).rejects.toThrow(
    "Email o matrícula ya registrados"
  )
})
