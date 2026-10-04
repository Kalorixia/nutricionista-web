import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Apple, ChefHat, Clock, Loader2, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Pagination from "@/components/common/Pagination"
import AddToListButton from "@/components/modules/recipes/AddToListButton"
import { recipesService } from "@/services/recipes.service"
import { Button } from "@/components/ui/button"
import type { RecetaListItem, TipoReceta } from "@/types/recipe"

const FILTROS: { valor: TipoReceta | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "Todo" },
  { valor: "receta", etiqueta: "Recetas" },
  { valor: "alimento", etiqueta: "Alimentos" },
]

const LIMIT = 12
const DEBOUNCE_MS = 350

export default function Recipes() {
  const [recetas, setRecetas] = useState<RecetaListItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [tipo, set_tipo] = useState<TipoReceta | null>(null)

  useEffect(() => {
    // Cada búsqueda nueva arranca desde la primera página.
    const id = setTimeout(() => {
      setDebouncedQuery(query)
      setOffset(0)
    }, DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const result = await recipesService.list({
          q: debouncedQuery || undefined,
          tipo: tipo ?? undefined,
          limit: LIMIT,
          offset,
        })
        if (!cancelled) {
          setRecetas(result.recetas)
          setTotal(result.total)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, offset, tipo])

  return (
    <div className="space-y-6">
      <div className="hero-gradient rounded-3xl border border-primary/10 p-6 sm:p-8">
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Recetas
        </h1>
        <p className="text-muted-foreground">
          Recetas y alimentos simples para armar tus planes de alimentación.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o categoría…"
          className="surface-raised h-11 rounded-xl pl-9"
        />
      </div>

      <div
        role="group"
        aria-label="Tipo de ítem"
        className="flex flex-wrap gap-2"
      >
        {FILTROS.map((filtro) => (
          <Button
            key={filtro.etiqueta}
            size="sm"
            variant={tipo === filtro.valor ? "default" : "outline"}
            aria-pressed={tipo === filtro.valor}
            onClick={() => {
              set_tipo(filtro.valor)
              setOffset(0)
            }}
          >
            {filtro.etiqueta}
          </Button>
        ))}
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recetas.map((r) => (
              <Card
                key={r.id_receta}
                className="card-shadow hover:card-shadow-hover h-full overflow-hidden border-primary/10 p-0 transition-all hover:-translate-y-1"
              >
                <Link to={`/recetas/${r.id_receta}`}>
                  {r.imagen_url ? (
                    <img
                      src={r.imagen_url}
                      alt={r.nombre}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-secondary text-muted-foreground">
                      <ChefHat className="h-8 w-8" />
                    </div>
                  )}
                  <div className="p-4 pb-0">
                    <h3 className="font-heading font-semibold">{r.nombre}</h3>
                    {r.descripcion && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {r.descripcion}
                      </p>
                    )}
                    {r.tipo === "alimento" ? (
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {r.porcion_descripcion}
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <Apple className="h-3 w-3" /> Alimento
                        </Badge>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />{" "}
                          {r.tiempo_preparacion} min
                        </span>
                        {r.dificultad && (
                          <Badge variant="secondary">{r.dificultad}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 pt-3">
                  <AddToListButton recetaId={r.id_receta} className="w-full" />
                </div>
              </Card>
            ))}
            {recetas.length === 0 && (
              <p className="col-span-full p-6 text-center text-sm text-muted-foreground">
                No encontramos nada para esa búsqueda.
              </p>
            )}
          </div>

          <Pagination
            total={total}
            limit={LIMIT}
            offset={offset}
            onOffsetChange={setOffset}
          />
        </>
      )}
    </div>
  )
}
