import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import PatientDetail from "@/pages/PatientDetail"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { ApiError } from "@/services/http"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"
import type {
  CalculoNutricional,
  Medicion,
  PacienteDetalle,
  PerfilPaciente,
  RequerimientoNutricional,
} from "@/types/patient"

vi.mock("@/services/patients.service", () => ({
  patientsService: {
    obtenerPaciente: vi.fn(),
    obtenerPerfil: vi.fn(),
    listarMediciones: vi.fn(),
    listarRequerimientos: vi.fn(),
    registrarMedicion: vi.fn(),
    darDeBajaMedicion: vi.fn(),
    desvincularPaciente: vi.fn(),
  },
}))
vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: { list: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
// El Perfil clínico tiene sus propios tests: acá solo importa su onChange.
vi.mock("@/components/modules/patients/ClinicalProfileCard", () => ({
  ClinicalProfileCard: ({
    perfil,
    onChange,
  }: {
    perfil: PerfilPaciente
    onChange: (perfil: PerfilPaciente) => void
  }) => (
    <button type="button" onClick={() => onChange(perfil)}>
      Cambiar perfil
    </button>
  ),
}))

const PACIENTE: PacienteDetalle = {
  id_paciente: 65,
  nombre: "Juan",
  apellido: "Validakis",
  fecha_nacimiento: "1996-01-01",
  sexo_biologico: "masculino",
  peso_kg: 53,
  altura_cm: 163,
  objetivo: "Aumentar masa muscular",
  nivel_actividad: "moderado",
  condiciones_medicas: [],
  restricciones_alimentarias: [],
  fecha_inicio: "2026-09-01T10:00:00Z",
}

const CALCULO: CalculoNutricional = {
  version: "mifflin-v1",
  edad: 30,
  tmb_kcal: 1400,
  get_kcal: 2100,
  get_objetivo_kcal: 2044,
  proteinas_g: 106,
  grasas_g: 57,
  carbohidratos_g: 243,
  hidratacion_ml: 1855,
}

const PERFIL: PerfilPaciente = {
  id_paciente: 65,
  nombre: "Juan",
  apellido: "Validakis",
  fecha_nacimiento: "1996-01-01",
  sexo_biologico: "masculino",
  peso_kg: 53,
  altura_cm: 163,
  objetivo: { id: 1, codigo: "aumentar_masa_muscular", nombre: "Aumentar" },
  nivel_actividad: { id: 2, nombre: "moderado" },
  calculo_nutricional: CALCULO,
  condiciones_medicas: [],
  restricciones_alimentarias: [],
  onboarding_completado: true,
}

const MEDICIONES: Medicion[] = [
  {
    id_medicion: 31,
    peso_kg: 53,
    altura_cm: 163,
    fecha_medicion: "2026-09-15",
    created_at: "2026-09-15T13:42:00Z",
    cargada_por: "paciente",
  },
]

const REQUERIMIENTOS: RequerimientoNutricional[] = [
  {
    id_requerimiento: 8,
    resultado: CALCULO,
    calculo: CALCULO,
    objetivo_prescrito: null,
    version_calculo: "mifflin-v1",
    id_medicion: 31,
    objetivo: PERFIL.objetivo,
    objetivo_personalizado: null,
    nivel_actividad: { id: 2, nombre: "moderado" },
    created_at: "2026-09-15T13:42:00Z",
    originado_por: "paciente",
  },
]

function renderizar() {
  render(
    <ConfirmProvider>
      <MemoryRouter initialEntries={["/pacientes/65"]}>
        <Routes>
          <Route path="/pacientes/:id" element={<PatientDetail />} />
        </Routes>
      </MemoryRouter>
    </ConfirmProvider>
  )
}

function tarjeta(nombre: string) {
  return screen.getByLabelText(nombre)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(patientsService.obtenerPaciente).mockResolvedValue(PACIENTE)
  vi.mocked(patientsService.obtenerPerfil).mockResolvedValue(PERFIL)
  vi.mocked(patientsService.listarMediciones).mockResolvedValue(MEDICIONES)
  vi.mocked(patientsService.listarRequerimientos).mockResolvedValue(
    REQUERIMIENTOS
  )
  vi.mocked(mealPlansService.list).mockResolvedValue([])
})

async function registrar_medicion() {
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole("button", { name: "Registrar medición" })
  )
  await user.click(screen.getByRole("button", { name: "Guardar" }))
}

describe("Historial en la ficha del paciente", () => {
  it("monta las dos tarjetas con lo que devuelve el servidor", async () => {
    renderizar()
    expect(
      await screen.findByText(/Medición del 15\/9\/2026: 53 kg · 163 cm/)
    ).toBeTruthy()
    expect(
      within(tarjeta("Mediciones")).getByRole("table", {
        name: "Historial de mediciones",
      })
    ).toBeTruthy()
    expect(
      within(tarjeta("Requerimientos nutricionales")).getByRole("list", {
        name: "Historial de requerimientos",
      })
    ).toBeTruthy()
    expect(patientsService.listarMediciones).toHaveBeenCalledWith(65)
    expect(patientsService.listarRequerimientos).toHaveBeenCalledWith(65)
  })

  it("registrar una medición refresca el historial, el perfil y los datos", async () => {
    vi.mocked(patientsService.registrarMedicion).mockResolvedValue({
      ...MEDICIONES[0],
      id_medicion: 32,
    })
    renderizar()
    await screen.findByText(/Medición del 15\/9\/2026/)
    await registrar_medicion()

    await waitFor(() => {
      expect(patientsService.listarMediciones).toHaveBeenCalledTimes(2)
      expect(patientsService.listarRequerimientos).toHaveBeenCalledTimes(2)
      expect(patientsService.obtenerPerfil).toHaveBeenCalledTimes(2)
      expect(patientsService.obtenerPaciente).toHaveBeenCalledTimes(2)
    })
  })

  it("si el perfil falla en el refresco, la ficha sigue a la vista", async () => {
    vi.mocked(patientsService.registrarMedicion).mockResolvedValue({
      ...MEDICIONES[0],
      id_medicion: 32,
    })
    renderizar()
    await screen.findByText(/Medición del 15\/9\/2026/)
    vi.mocked(patientsService.obtenerPerfil).mockRejectedValue(
      new ApiError("Ocurrió un error inesperado", 500)
    )
    await registrar_medicion()

    await waitFor(() =>
      expect(patientsService.obtenerPerfil).toHaveBeenCalledTimes(2)
    )
    expect(screen.queryByText("Paciente no encontrado.")).toBeNull()
    expect(screen.getByRole("heading", { name: "Juan Validakis" })).toBeTruthy()
    expect(tarjeta("Mediciones")).toBeTruthy()
  })

  it("un cambio desde el Perfil clínico vuelve a pedir el historial", async () => {
    const user = userEvent.setup()
    renderizar()
    await user.click(
      await screen.findByRole("button", { name: "Cambiar perfil" })
    )
    await waitFor(() => {
      expect(patientsService.listarMediciones).toHaveBeenCalledTimes(2)
      expect(patientsService.listarRequerimientos).toHaveBeenCalledTimes(2)
    })
  })

  it("un 404 de las mediciones se ve en su tarjeta y no tapa a la otra", async () => {
    vi.mocked(patientsService.listarMediciones).mockRejectedValue(
      new ApiError("Paciente no encontrado", 404)
    )
    renderizar()
    const alerta = await within(
      await screen.findByLabelText("Mediciones")
    ).findByRole("alert")
    expect(alerta.textContent).toContain(
      "Este paciente ya no está vinculado a tu perfil."
    )
    expect(
      within(tarjeta("Requerimientos nutricionales")).getByRole("list", {
        name: "Historial de requerimientos",
      })
    ).toBeTruthy()
    expect(
      within(tarjeta("Requerimientos nutricionales")).getByText(
        /Medición no disponible/
      )
    ).toBeTruthy()
  })
})
