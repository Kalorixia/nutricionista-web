import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PreferencesCard } from "@/components/modules/patients/PreferencesCard"
import { patientsService } from "@/services/patients.service"

vi.mock("@/services/patients.service", () => ({
  patientsService: { guardarPreferencias: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

it("avisa cuando el paciente todavía no respondió", () => {
  render(
    <PreferencesCard idPaciente={4} preferencias={null} onChange={vi.fn()} />
  )
  expect(screen.getByText(/todavía no contó sus preferencias/)).toBeTruthy()
})

it("muestra lo que respondió el paciente", () => {
  render(
    <PreferencesCard
      idPaciente={4}
      preferencias={{
        le_gustan: ["milanesas"],
        tiempo_cocina_semana: "menos_15",
        comidas_fuera: ["Almuerzo"],
        personas_hogar: 3,
      }}
      onChange={vi.fn()}
    />
  )
  expect(screen.getByText("milanesas")).toBeTruthy()
  expect(screen.getByText("semana: menos de 15 min")).toBeTruthy()
  expect(screen.getByText("Almuerzo")).toBeTruthy()
  expect(screen.getByText("3 personas")).toBeTruthy()
})

it("el nutricionista completa y guarda sólo lo cargado", async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  vi.mocked(patientsService.guardarPreferencias).mockResolvedValue({
    prefiere_evitar: ["hígado", "berenjena"],
    presupuesto: "ajustado",
  })
  render(
    <PreferencesCard idPaciente={4} preferencias={null} onChange={onChange} />
  )
  await user.click(screen.getByRole("button", { name: /Editar preferencias/ }))
  await user.type(
    screen.getByLabelText("Prefiere evitar (separados por coma)"),
    "hígado, berenjena"
  )
  await user.selectOptions(screen.getByLabelText("Presupuesto"), "ajustado")
  await user.click(screen.getByRole("button", { name: "Guardar" }))
  await waitFor(() =>
    expect(patientsService.guardarPreferencias).toHaveBeenCalledWith(4, {
      prefiere_evitar: ["hígado", "berenjena"],
      presupuesto: "ajustado",
    })
  )
  expect(onChange).toHaveBeenCalledWith({
    prefiere_evitar: ["hígado", "berenjena"],
    presupuesto: "ajustado",
  })
})
