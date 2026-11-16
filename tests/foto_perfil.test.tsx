import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import Account from "@/pages/Account"
import UserAvatar from "@/components/common/UserAvatar"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { nutritionistService } from "@/services/nutritionist.service"
import { ApiError } from "@/services/http"

const refreshMe = vi.fn()

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      nombre: "Ana",
      apellido: "Pérez",
      email: "ana@example.com",
      foto_url: null,
    },
    refreshMe,
  }),
}))
vi.mock("@/hooks/use-disclaimer", () => ({
  useDisclaimer: () => ({ disclaimer: null }),
}))
vi.mock("@/services/session", () => ({
  getSessionToken: vi.fn().mockReturnValue("token-de-prueba"),
  refreshSessionOnce: vi.fn(),
}))
vi.mock("@/services/subscription.service", () => ({
  subscriptionService: {
    getMine: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(nutritionistService, "estadoMatricula").mockResolvedValue(
    null as unknown as Awaited<
      ReturnType<typeof nutritionistService.estadoMatricula>
    >
  )
})

it("subirFoto manda FormData con el campo foto y sin Content-Type JSON", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ foto_url: "https://x/y.jpg" }), {
      status: 200,
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const file = new File(["x"], "foto.png", { type: "image/png" })

  const result = await nutritionistService.subirFoto(file)

  expect(result).toEqual({ foto_url: "https://x/y.jpg" })
  const [url, init] = fetchMock.mock.calls[0]
  expect(String(url)).toContain("/nutricionistas/me/foto")
  expect(init.method).toBe("POST")
  expect(init.body).toBeInstanceOf(FormData)
  expect((init.body as FormData).get("foto")).toBe(file)
  expect(init.headers["Content-Type"]).toBeUndefined()
  vi.unstubAllGlobals()
})

it("UserAvatar muestra las iniciales cuando no hay foto", () => {
  render(<UserAvatar nombre="Ana" apellido="Pérez" fotoUrl={null} />)
  expect(screen.getByText("AP")).toBeTruthy()
})

it("en Account, un 422 con detail string se ve en el toast", async () => {
  vi.spyOn(nutritionistService, "subirFoto").mockRejectedValue(
    new ApiError("La foto no puede superar los 5 MB", 422)
  )
  const user = userEvent.setup()
  render(
    <ConfirmProvider>
      <Account />
    </ConfirmProvider>
  )

  await user.upload(
    screen.getByLabelText("Archivo de foto de perfil"),
    new File(["x"], "foto.png", { type: "image/png" })
  )

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "La foto no puede superar los 5 MB"
    )
  )
  expect(refreshMe).not.toHaveBeenCalled()
})

it("en Account, una subida exitosa llama a refreshMe", async () => {
  vi.spyOn(nutritionistService, "subirFoto").mockResolvedValue({
    foto_url: "https://x/y.jpg",
  })
  const user = userEvent.setup()
  render(
    <ConfirmProvider>
      <Account />
    </ConfirmProvider>
  )

  await user.upload(
    screen.getByLabelText("Archivo de foto de perfil"),
    new File(["x"], "foto.png", { type: "image/png" })
  )

  await waitFor(() => expect(refreshMe).toHaveBeenCalledTimes(1))
  expect(toast.success).toHaveBeenCalled()
})

it("UserAvatar ampliable abre la foto en grande", async () => {
  const user = userEvent.setup()
  render(
    <UserAvatar
      nombre="Ana"
      apellido="Pérez"
      fotoUrl="https://cdn.test/a.jpg"
      ampliable
    />
  )
  await user.click(
    screen.getByRole("button", { name: "Ver la foto de Ana Pérez" })
  )
  expect(await screen.findByAltText("Foto de Ana Pérez")).toBeTruthy()
})

it("UserAvatar ampliable sin foto no es un botón", () => {
  render(<UserAvatar nombre="Ana" apellido="Pérez" fotoUrl={null} ampliable />)
  expect(screen.queryByRole("button")).toBeNull()
})
