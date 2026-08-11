import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChefHat, Clock, Loader2, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { recipesService } from "@/services/recipes.service"
import type { Recipe } from "@/types/recipe"

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const load = async (q?: string) => {
    setLoading(true)
    try {
      setRecipes(await recipesService.list(q))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Recetas
        </h1>
        <p className="text-muted-foreground">
          Catálogo de recetas para armar tus planes de alimentación.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            void load(e.target.value || undefined)
          }}
          placeholder="Buscar por nombre o tag…"
          className="rounded-xl pl-9"
        />
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <Link key={r.id} to={`/recetas/${r.id}`}>
              <Card className="card-shadow hover:card-shadow-hover h-full p-4 transition-shadow">
                <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <ChefHat className="h-8 w-8" />
                </div>
                <h3 className="font-heading font-semibold">{r.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {r.descripcion}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {r.tiempo_min} min
                  </span>
                  <Badge variant="secondary">{r.dificultad}</Badge>
                </div>
              </Card>
            </Link>
          ))}
          {recipes.length === 0 && (
            <p className="col-span-full p-6 text-center text-sm text-muted-foreground">
              No encontramos recetas para esa búsqueda.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
