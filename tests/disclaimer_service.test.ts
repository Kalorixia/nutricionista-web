import { beforeEach, expect, it, vi } from "vitest"
import { disclaimerService } from "@/services/disclaimer.service"
import { authedFetch } from "@/services/http"

vi.mock("@/services/http", () => ({ authedFetch: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
})

it("obtener pide GET /disclaimer", async () => {
  vi.mocked(authedFetch).mockResolvedValue({})
  await disclaimerService.obtener()
  expect(authedFetch).toHaveBeenCalledWith("/disclaimer")
})

it("aceptar manda POST con la versión exacta", async () => {
  vi.mocked(authedFetch).mockResolvedValue({})
  await disclaimerService.aceptar(3)
  expect(authedFetch).toHaveBeenCalledWith("/disclaimer/aceptacion", {
    method: "POST",
    body: { version: 3 },
  })
})
