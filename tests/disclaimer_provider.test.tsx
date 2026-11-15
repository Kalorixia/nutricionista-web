import { useEffect } from "react"
import { beforeEach, expect, it, vi } from "vitest"
import { act, render, waitFor } from "@testing-library/react"
import { DisclaimerProvider, useDisclaimer } from "@/hooks/use-disclaimer"
import { useAuth } from "@/hooks/use-auth"
import { disclaimerService } from "@/services/disclaimer.service"
import { ApiError, apiFetch } from "@/services/http"
import type { Disclaimer } from "@/types/disclaimer"

vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }))
vi.mock("@/services/disclaimer.service", () => ({
  disclaimerService: { obtener: vi.fn(), aceptar: vi.fn() },
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

type Ctx = ReturnType<typeof useDisclaimer>
const holder: { current: Ctx | null } = { current: null }
const ctx = () => holder.current as Ctx

function Probe() {
  const value = useDisclaimer()
  useEffect(() => {
    holder.current = value
  })
  return null
}

function authValue(idUsuario: number | null) {
  const user =
    idUsuario === null
      ? null
      : ({ id_usuario: idUsuario } as NonNullable<
          ReturnType<typeof useAuth>["user"]
        >)
  return { user, isNutritionist: user !== null } as ReturnType<typeof useAuth>
}

function mount(idUsuario: number | null) {
  vi.mocked(useAuth).mockReturnValue(authValue(idUsuario))
  const view = render(
    <DisclaimerProvider>
      <Probe />
    </DisclaimerProvider>
  )
  return {
    rerender(next: number | null) {
      vi.mocked(useAuth).mockReturnValue(authValue(next))
      view.rerender(
        <DisclaimerProvider>
          <Probe />
        </DisclaimerProvider>
      )
    },
  }
}

/** Dispara el manejador real que el provider registró en http.ts. */
async function fire403() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "x" }), {
        status: 403,
        headers: { "X-Disclaimer-Requerido": "true" },
      })
    )
  )
  await apiFetch("/x").catch(() => {})
  vi.unstubAllGlobals()
}

beforeEach(() => {
  vi.clearAllMocks()
})

it("con nutricionista hace un GET y queda ready", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue(base)
  mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))
  expect(disclaimerService.obtener).toHaveBeenCalledOnce()
  expect(ctx().disclaimer).toEqual(base)
})

it("sin usuario no hace GET y queda loading", () => {
  mount(null)
  expect(disclaimerService.obtener).not.toHaveBeenCalled()
  expect(ctx().status).toBe("loading")
})

it("si el GET falla (404 incluido) queda en error y nunca aceptado", async () => {
  vi.mocked(disclaimerService.obtener).mockRejectedValue(
    new ApiError("No hay un disclaimer vigente para el rol del usuario", 404)
  )
  mount(1)
  await waitFor(() => expect(ctx().status).toBe("error"))
  expect(ctx().disclaimer).toBeNull()
  expect(ctx().errorMessage).toBe(
    "No hay un disclaimer vigente para el rol del usuario"
  )
})

it("refreshMe con el mismo id_usuario no vuelve a pedir", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue(base)
  const view = mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))
  view.rerender(1)
  expect(disclaimerService.obtener).toHaveBeenCalledOnce()
  expect(ctx().status).toBe("ready")
})

it("un usuario distinto nunca ve los datos del anterior", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue({
    ...base,
    aceptado: true,
  })
  const view = mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))
  vi.mocked(disclaimerService.obtener).mockReturnValue(new Promise(() => {}))
  view.rerender(2)
  expect(ctx().status).toBe("loading")
  expect(ctx().disclaimer).toBeNull()
})

it("el manejador del 403 pasa a loading y re-pide una sola vez", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue({
    ...base,
    aceptado: true,
  })
  mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))

  let resolver: (value: Disclaimer) => void = () => {}
  vi.mocked(disclaimerService.obtener).mockReturnValue(
    new Promise<Disclaimer>((resolve) => {
      resolver = resolve
    })
  )
  await act(async () => {
    await fire403()
    await fire403()
    await fire403()
  })
  expect(ctx().status).toBe("loading")
  expect(disclaimerService.obtener).toHaveBeenCalledTimes(2)

  await act(async () => {
    resolver({ ...base, version: 2 })
  })
  expect(ctx().status).toBe("ready")
  expect(ctx().disclaimer?.version).toBe(2)
  expect(ctx().disclaimer?.aceptado).toBe(false)
})

it("al quedar sin usuario el manejador se desregistra", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue(base)
  const view = mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))
  view.rerender(null)
  await act(async () => {
    await fire403()
  })
  expect(disclaimerService.obtener).toHaveBeenCalledOnce()
  expect(ctx().status).toBe("loading")
})

it("accept con 200 deja aceptado con la respuesta del servidor", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue(base)
  const aceptado = {
    ...base,
    aceptado: true,
    fecha_aceptacion: "2026-11-17T10:00:00Z",
  }
  vi.mocked(disclaimerService.aceptar).mockResolvedValue(aceptado)
  mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))
  await act(async () => {
    await ctx().accept(1)
  })
  expect(disclaimerService.aceptar).toHaveBeenCalledWith(1)
  expect(ctx().disclaimer).toEqual(aceptado)
})

it("accept con 409 re-pide el GET y re-lanza el error", async () => {
  vi.mocked(disclaimerService.obtener).mockResolvedValue(base)
  mount(1)
  await waitFor(() => expect(ctx().status).toBe("ready"))
  const conflicto = new ApiError("La versión indicada no es la vigente", 409)
  vi.mocked(disclaimerService.aceptar).mockRejectedValue(conflicto)
  vi.mocked(disclaimerService.obtener).mockResolvedValue({
    ...base,
    version: 2,
  })
  let thrown: unknown
  await act(async () => {
    await ctx()
      .accept(1)
      .catch((e: unknown) => {
        thrown = e
      })
  })
  expect(thrown).toBe(conflicto)
  expect(disclaimerService.obtener).toHaveBeenCalledTimes(2)
  expect(ctx().disclaimer?.version).toBe(2)
})
