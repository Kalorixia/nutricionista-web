import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import Account from "@/pages/Account"
import { authService } from "@/services/authService"
import { nutritionistService } from "@/services/nutritionist.service"
import { getSessionToken } from "@/services/session"

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { nombre: "Ana", apellido: "Pérez", email: "ana@example.com" },
  }),
}))
vi.mock("@/services/nutritionist.service", () => ({
  nutritionistService: { estadoMatricula: vi.fn() },
}))
vi.mock("@/services/authService", () => ({
  authService: { changePassword: vi.fn() },
}))
vi.mock("@/services/session", () => ({ getSessionToken: vi.fn() }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(nutritionistService.estadoMatricula).mockResolvedValue(
    null as unknown as Awaited<
      ReturnType<typeof nutritionistService.estadoMatricula>
    >
  )
  vi.mocked(getSessionToken).mockReturnValue("token-de-prueba")
})

async function cambiarContrasena(newPassword: string) {
  const user = userEvent.setup()
  render(<Account />)
  await user.type(screen.getByLabelText("Contraseña actual"), "Actual1234")
  await user.type(screen.getByLabelText("Contraseña nueva"), newPassword)
  await user.click(
    screen.getByRole("button", { name: "Actualizar contraseña" })
  )
}

it("rechaza en español una contraseña nueva de más de 72 caracteres", async () => {
  await cambiarContrasena("a1".repeat(36) + "a")

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "La contraseña debe tener como máximo 72 caracteres"
    )
  )
  expect(authService.changePassword).not.toHaveBeenCalled()
})

it("una contraseña nueva de exactamente 72 caracteres llega al servidor", async () => {
  vi.mocked(authService.changePassword).mockResolvedValue({ message: "ok" })
  const password = "a1".repeat(36)
  await cambiarContrasena(password)

  await waitFor(() =>
    expect(authService.changePassword).toHaveBeenCalledWith(
      "token-de-prueba",
      "Actual1234",
      password
    )
  )
  expect(toast.error).not.toHaveBeenCalled()
})
