import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClinicalProfileCard } from "@/components/modules/patients/ClinicalProfileCard"
import { patientsService } from "@/services/patients.service"
import type { PerfilPaciente } from "@/types/patient"

vi.mock("@/services/patients.service", () => ({
  patientsService: {
    actualizarPerfil: vi.fn(),
    prescribirObjetivo: vi.fn(),
    catalogos: vi.fn(),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

function perfil(overrides: Partial<PerfilPaciente> = {}): PerfilPaciente {
  return {
    id_paciente: 65,
    nombre: "Juan",
    apellido: "Validakis",
    fecha_nacimiento: "1996-01-01",
    sexo_biologico: "masculino",
    peso_kg: 53,
    altura_cm: 163,
    objetivo: {
      id: 1,
      codigo: "aumentar_masa_muscular",
      nombre: "Aumentar masa muscular",
    },
    nivel_actividad: { id: 2, nombre: "moderado" },
    calculo_nutricional: {
      version: "mifflin-v1",
      edad: 30,
      tmb_kcal: 1400,
      get_kcal: 2100,
      get_objetivo_kcal: 2044,
      proteinas_g: 106,
      grasas_g: 57,
      carbohidratos_g: 243,
      hidratacion_ml: 1855,
    },
    condiciones_medicas: [],
    restricciones_alimentarias: [
      { tipo: "aversion", nombre: "Pescado", detalle: null },
    ],
    onboarding_completado: true,
    ...overrides,
  }
}

const CATALOGOS = {
  objetivos: [
    {
      id: 1,
      codigo: "aumentar_masa_muscular",
      nombre: "Aumentar masa muscular",
    },
    { id: 3, codigo: "mantener_peso", nombre: "Mantener el peso" },
  ],
  niveles_actividad: [
    { id: 2, nombre: "moderado" },
    { id: 3, nombre: "intenso" },
  ],
  condiciones_medicas: [
    { id: 1, nombre: "Celiaquía" },
    { id: 2, nombre: "Diabetes" },
  ],
  restricciones_alimentarias: [
    { id: 4, tipo: "intolerancia", nombre: "Lactosa" },
    { id: 6, tipo: "aversion", nombre: "Pescado" },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(patientsService.catalogos).mockResolvedValue(CATALOGOS)
})

describe("Perfil clínico editable por el profesional", () => {
  it("deja corregir un peso mal cargado en el onboarding", async () => {
    const user = userEvent.setup()
    const actualizado = perfil({ peso_kg: 58 })
    vi.mocked(patientsService.actualizarPerfil).mockResolvedValue(actualizado)
    const onChange = vi.fn()
    render(<ClinicalProfileCard perfil={perfil()} onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: /Editar datos/ }))
    const peso = await screen.findByLabelText("Peso (kg)")
    await user.clear(peso)
    await user.type(peso, "58")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    await waitFor(() =>
      expect(patientsService.actualizarPerfil).toHaveBeenCalledWith(
        65,
        expect.objectContaining({ peso_kg: 58 })
      )
    )
    expect(onChange).toHaveBeenCalledWith(actualizado)
  })

  it("muestra el objetivo como calculado cuando nadie lo prescribió", () => {
    render(<ClinicalProfileCard perfil={perfil()} onChange={vi.fn()} />)
    expect(screen.getByText(/Calculados automáticamente/)).toBeTruthy()
    expect(screen.queryByText("prescrito")).toBeNull()
  })

  it("marca lo prescrito y muestra al lado lo que sugeriría la fórmula", () => {
    render(
      <ClinicalProfileCard
        perfil={perfil({
          calculo_nutricional: {
            ...perfil().calculo_nutricional!,
            get_objetivo_kcal: 2400,
            prescrito_por_profesional: ["get_objetivo_kcal"],
            calculado: { get_objetivo_kcal: 2044 },
          },
        })}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText("2400 kcal")).toBeTruthy()
    expect(screen.getByText("prescrito")).toBeTruthy()
    expect(screen.getByText(/la fórmula sugiere 2044 kcal/)).toBeTruthy()
    expect(screen.getByText(/aunque el paciente cambie su peso/)).toBeTruthy()
  })

  it("prescribe un objetivo y lo borra con el campo vacío", async () => {
    const user = userEvent.setup()
    vi.mocked(patientsService.prescribirObjetivo).mockResolvedValue(perfil())
    render(<ClinicalProfileCard perfil={perfil()} onChange={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Prescribir/ }))
    const kcal = screen.getByLabelText("Energía diaria (kcal)")
    await user.clear(kcal)
    await user.type(kcal, "2400")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() =>
      expect(patientsService.prescribirObjetivo).toHaveBeenCalledWith(65, {
        get_objetivo_kcal: 2400,
      })
    )

    await user.click(screen.getByRole("button", { name: /Prescribir/ }))
    await user.clear(screen.getByLabelText("Energía diaria (kcal)"))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() =>
      expect(patientsService.prescribirObjetivo).toHaveBeenLastCalledWith(
        65,
        {}
      )
    )
  })

  it("avisa si el paciente no tiene datos para calcular", () => {
    render(
      <ClinicalProfileCard
        perfil={perfil({ calculo_nutricional: null })}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Faltan datos físicos/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Prescribir/ })).toBeNull()
  })

  it("con un objetivo propio y sin energía, muestra el objetivo y deja prescribirla", async () => {
    const user = userEvent.setup()
    vi.mocked(patientsService.prescribirObjetivo).mockResolvedValue(perfil())
    render(
      <ClinicalProfileCard
        perfil={perfil({
          objetivo: null,
          objetivo_personalizado: "Preparar una maratón",
          calculo_nutricional: null,
        })}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText("Otro: Preparar una maratón")).toBeTruthy()
    expect(
      screen.getByText(/objetivo propio, que no tiene fórmula/)
    ).toBeTruthy()
    await user.click(screen.getByRole("button", { name: /Prescribir/ }))
    await user.type(screen.getByLabelText("Energía diaria (kcal)"), "2600")
    await user.click(screen.getByRole("button", { name: /Guardar/ }))
    await waitFor(() =>
      expect(patientsService.prescribirObjetivo).toHaveBeenCalledWith(65, {
        get_objetivo_kcal: 2600,
      })
    )
  })

  it("edita lo clínico completo sin tocar nombre ni fecha de nacimiento", async () => {
    const user = userEvent.setup()
    vi.mocked(patientsService.actualizarPerfil).mockResolvedValue(perfil())
    render(
      <ClinicalProfileCard
        perfil={perfil({
          condiciones_medicas: [
            { id_condicion: 2, nombre: "Diabetes", detalle: "tipo 2" },
            { id_condicion: null, nombre: "Gota", detalle: null },
          ],
          restricciones_alimentarias: [
            {
              id_restriccion: 6,
              tipo: "aversion",
              nombre: "Pescado",
              detalle: null,
            },
          ],
        })}
        onChange={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button", { name: /Editar datos/ }))
    await user.selectOptions(
      await screen.findByLabelText("Sexo biológico"),
      "femenino"
    )
    await user.selectOptions(screen.getByLabelText("Actividad"), "3")
    await user.selectOptions(screen.getByLabelText("Objetivo"), "otro")
    await user.type(
      screen.getByLabelText("Objetivo propio"),
      "Preparar una maratón"
    )
    await user.click(screen.getByRole("checkbox", { name: "Celiaquía" }))
    await user.type(screen.getByLabelText("Otra restricción"), "Sésamo")
    await user.click(
      screen.getByRole("button", { name: /Agregar restricción/ })
    )
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    await waitFor(() =>
      expect(patientsService.actualizarPerfil).toHaveBeenCalled()
    )
    const cambios = vi.mocked(patientsService.actualizarPerfil).mock.calls[0][1]
    expect(cambios).toMatchObject({
      sexo_biologico: "femenino",
      id_nivel_actividad: 3,
      objetivo_personalizado: "Preparar una maratón",
    })
    expect(cambios).not.toHaveProperty("fecha_nacimiento")
    expect(cambios).not.toHaveProperty("id_objetivo")
    // La condición propia y el detalle de la del catálogo se conservan.
    expect(cambios.condiciones_medicas).toEqual([
      { id_condicion: 2, detalle: "tipo 2" },
      { id_condicion: 1 },
      { nombre_personalizado: "Gota" },
    ])
    expect(cambios.restricciones_alimentarias).toEqual([
      { id_restriccion: 6 },
      { tipo_personalizado: "alergia", nombre_personalizado: "Sésamo" },
    ])
  })
})
