import { afterEach, beforeEach, expect, it, vi } from "vitest"
import {
  ApiError,
  DisclaimerRequiredError,
  apiFetch,
  setDisclaimerRequiredHandler,
} from "@/services/http"

const handler = vi.fn()

function respond(status: number, detail: string, headers?: HeadersInit) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail }), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
      })
    )
  )
}

beforeEach(() => {
  handler.mockReset()
  setDisclaimerRequiredHandler(handler)
})

afterEach(() => {
  setDisclaimerRequiredHandler(null)
  vi.unstubAllGlobals()
})

it("403 con el header lanza DisclaimerRequiredError y llama al manejador una vez", async () => {
  respond(403, "Debe aceptar el disclaimer médico vigente antes de continuar", {
    "X-Disclaimer-Requerido": "true",
  })
  const error = await fallo()
  expect(error).toBeInstanceOf(DisclaimerRequiredError)
  expect(error).toBeInstanceOf(ApiError)
  expect(error.status).toBe(403)
  expect(error.message).toBe(
    "Debe aceptar el disclaimer médico vigente antes de continuar"
  )
  expect(handler).toHaveBeenCalledOnce()
})

it("403 sin el header es un ApiError común y no llama al manejador", async () => {
  respond(403, "Matrícula profesional no aprobada")
  const error = await fallo()
  expect(error).toBeInstanceOf(ApiError)
  expect(error).not.toBeInstanceOf(DisclaimerRequiredError)
  expect(handler).not.toHaveBeenCalled()
})

it("el header con otro valor no llama al manejador", async () => {
  respond(403, "x", { "X-Disclaimer-Requerido": "false" })
  const error = await fallo()
  expect(error).not.toBeInstanceOf(DisclaimerRequiredError)
  expect(handler).not.toHaveBeenCalled()
})

it("sin manejador registrado lanza igual", async () => {
  setDisclaimerRequiredHandler(null)
  respond(403, "x", { "X-Disclaimer-Requerido": "true" })
  await expect(apiFetch("/x")).rejects.toBeInstanceOf(DisclaimerRequiredError)
})

it("otro status con el header no llama al manejador", async () => {
  respond(500, "x", { "X-Disclaimer-Requerido": "true" })
  const error = await fallo()
  expect(error).toBeInstanceOf(ApiError)
  expect(error).not.toBeInstanceOf(DisclaimerRequiredError)
  expect(handler).not.toHaveBeenCalled()
})

async function fallo(): Promise<ApiError> {
  try {
    await apiFetch("/x")
  } catch (error) {
    return error as ApiError
  }
  throw new Error("apiFetch no lanzó")
}
