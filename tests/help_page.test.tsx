import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"
import Help from "@/pages/Help"
import { MANUAL_NUTRICIONISTA } from "@/content/manual_nutricionista"

function mount() {
  return render(
    <MemoryRouter initialEntries={["/ayuda"]}>
      <Routes>
        <Route path="/ayuda" element={<Help />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("Help", () => {
  it("renderiza todos los temas y los problemas frecuentes", () => {
    mount()
    for (const tema of MANUAL_NUTRICIONISTA.temas) {
      expect(screen.getByText(tema.titulo)).toBeTruthy()
    }
    expect(screen.getByText("Problemas frecuentes")).toBeTruthy()
  })

  it("filtra por la búsqueda sin distinguir mayúsculas", () => {
    mount()
    fireEvent.change(screen.getByLabelText("Buscar en la ayuda"), {
      target: { value: "COPILOTO" },
    })
    expect(screen.getByText("Usar el Copiloto")).toBeTruthy()
    expect(screen.queryByText("Ingresar a Kalorixia")).toBeNull()
    expect(screen.getByText("Problemas frecuentes")).toBeTruthy()
  })

  it("muestra un mensaje si no hay coincidencias", () => {
    mount()
    fireEvent.change(screen.getByLabelText("Buscar en la ayuda"), {
      target: { value: "zzzxyz" },
    })
    expect(
      screen.getByText(/No encontramos temas con esa búsqueda/)
    ).toBeTruthy()
    expect(screen.getByText("Problemas frecuentes")).toBeTruthy()
  })
})
