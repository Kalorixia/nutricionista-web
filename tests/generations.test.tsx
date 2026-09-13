import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { GenerationsProvider } from "@/hooks/use-generations"
import { GenerationsIndicator } from "@/components/modules/plans/GenerationsIndicator"
import { mealPlansService } from "@/services/mealPlans.service"
import { toast } from "sonner"
import type { GeneracionPlan } from "@/types/mealPlan"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: {
    activeGenerations: vi.fn(),
    generationStatus: vi.fn(),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

function generacion(overrides: Partial<GeneracionPlan> = {}): GeneracionPlan {
  return {
    id_generacion: 12,
    id_paciente: 3,
    estado: "procesando",
    id_planificacion: null,
    nombre: "Semana de Ana",
    error_codigo: null,
    error_mensaje: null,
    created_at: "2026-09-12T12:00:00Z",
    updated_at: "2026-09-12T12:00:00Z",
    ...overrides,
  }
}

function mount() {
  render(
    <MemoryRouter>
      <GenerationsProvider>
        <GenerationsIndicator />
      </GenerationsProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("Seguimiento de generaciones en segundo plano", () => {
  it("muestra lo que se está generando y lo deja de mostrar al terminar", async () => {
    vi.mocked(mealPlansService.activeGenerations)
      .mockResolvedValueOnce([generacion()])
      .mockResolvedValue([])
    vi.mocked(mealPlansService.generationStatus).mockResolvedValue(
      generacion({ estado: "completada", id_planificacion: 7 })
    )

    mount()
    expect(await screen.findByText(/Generando Semana de Ana/)).toBeTruthy()

    await vi.advanceTimersByTimeAsync(4000)
    await waitFor(() =>
      expect(screen.queryByText(/Generando Semana de Ana/)).toBeNull()
    )
  })

  it("avisa con un enlace al borrador cuando queda listo", async () => {
    vi.mocked(mealPlansService.activeGenerations)
      .mockResolvedValueOnce([generacion()])
      .mockResolvedValue([])
    vi.mocked(mealPlansService.generationStatus).mockResolvedValue(
      generacion({ estado: "completada", id_planificacion: 7 })
    )

    mount()
    await vi.advanceTimersByTimeAsync(4000)

    expect(toast.success).toHaveBeenCalledWith(
      "Semana de Ana está listo para revisar",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Ver borrador" }),
      })
    )
  })

  it("muestra el motivo cuando la generación falla", async () => {
    vi.mocked(mealPlansService.activeGenerations)
      .mockResolvedValueOnce([generacion()])
      .mockResolvedValue([])
    vi.mocked(mealPlansService.generationStatus).mockResolvedValue(
      generacion({
        estado: "fallida",
        error_codigo: "insufficient_catalog",
        error_mensaje: "El catálogo compatible es insuficiente.",
      })
    )

    mount()
    await vi.advanceTimersByTimeAsync(4000)

    expect(toast.error).toHaveBeenCalledWith(
      "El catálogo compatible es insuficiente.",
      expect.anything()
    )
  })

  it("avisa una sola vez por generación", async () => {
    vi.mocked(mealPlansService.activeGenerations)
      .mockResolvedValueOnce([generacion()])
      .mockResolvedValue([])
    vi.mocked(mealPlansService.generationStatus).mockResolvedValue(
      generacion({ estado: "completada", id_planificacion: 7 })
    )

    mount()
    await vi.advanceTimersByTimeAsync(4000)
    await vi.advanceTimersByTimeAsync(4000)
    await vi.advanceTimersByTimeAsync(4000)

    expect(vi.mocked(toast.success).mock.calls).toHaveLength(1)
  })

  it("un fallo de red no rompe el seguimiento ni inventa un aviso", async () => {
    vi.mocked(mealPlansService.activeGenerations)
      .mockResolvedValueOnce([generacion()])
      .mockRejectedValueOnce(new Error("Sin conexión"))
      .mockResolvedValue([generacion()])

    mount()
    expect(await screen.findByText(/Generando Semana de Ana/)).toBeTruthy()
    await vi.advanceTimersByTimeAsync(4000)

    // Sigue mostrándose y nadie anunció un final que no ocurrió.
    expect(screen.getByText(/Generando Semana de Ana/)).toBeTruthy()
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
