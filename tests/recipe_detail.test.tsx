import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import RecipeDetail from "@/pages/RecipeDetail"
import { recipesService } from "@/services/recipes.service"
import type { RecetaDetalle } from "@/types/recipe"

vi.mock("@/services/recipes.service", () => ({
  recipesService: { get: vi.fn() },
}))
vi.mock("@/services/recipeLists.service", () => ({
  recipeListsService: { list: vi.fn().mockResolvedValue([]) },
}))

const receta: RecetaDetalle = {
  id_receta: 9,
  id_usuario: 1,
  nombre: "Tarta de verduras",
  descripcion: null,
  tiempo_preparacion: 35,
  porciones: 4,
  dificultad: "fácil",
  calorias_por_porcion: 320,
  estado_nutricional: "validada",
  imagen_url: "https://example.test/legado.jpg",
  imagenes: ["https://example.test/portada.jpg"],
  publica: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
  categorias: [],
  ingredientes: [],
  pasos: [],
}

function mount() {
  return render(
    <MemoryRouter initialEntries={["/recetas/9"]}>
      <Routes>
        <Route path="/recetas/:id" element={<RecipeDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("Detalle de receta", () => {
  beforeEach(() =>
    vi.mocked(recipesService.get).mockResolvedValue({ ...receta })
  )

  it("prioriza la primera imagen de la colección", async () => {
    mount()
    expect(
      (await screen.findByRole("img", { name: receta.nombre })).getAttribute(
        "src"
      )
    ).toBe(receta.imagenes[0])
  })

  it("muestra un placeholder estable si la imagen falla", async () => {
    mount()
    fireEvent.error(await screen.findByRole("img", { name: receta.nombre }))
    expect(
      screen.getByRole("img", { name: `Sin imagen para ${receta.nombre}` })
    ).toBeTruthy()
  })

  it("muestra un alimento sin pasos ni tiempo, con su porción", async () => {
    vi.mocked(recipesService.get).mockResolvedValue({
      ...receta,
      nombre: "Banana",
      tipo: "alimento",
      porcion_descripcion: "1 unidad mediana (118 g)",
      tiempo_preparacion: 0,
      porciones: 1,
      dificultad: null,
      ingredientes: [
        {
          id_receta_ingrediente: 1,
          nombre: "Banana",
          cantidad: 118,
          unidad: "g",
          observaciones: null,
        },
      ],
    })
    mount()
    expect(
      await screen.findByText("Porción: 1 unidad mediana (118 g)")
    ).toBeTruthy()
    expect(screen.getByText("Alimento")).toBeTruthy()
    expect(screen.queryByText("0 min")).toBeNull()
    expect(screen.queryByText("Ingredientes")).toBeNull()
  })
})
