import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { recipeListsService } from "@/services/recipeLists.service"
import { recipesService } from "@/services/recipes.service"
import type { ListaRecetaDetalle, RecetaListItem } from "@/types/recipe"

const SEARCH_DEBOUNCE_MS = 350
const SEARCH_LIMIT = 8

export default function ListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [detail, setDetail] = useState<ListaRecetaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<RecetaListItem[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const result = await recipeListsService.get(Number(id))
        if (!cancelled) setDetail(result)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    let cancelled = false
    if (!adding || !debouncedQuery) {
      void (async () => {
        setResults([])
      })()
      return
    }
    void (async () => {
      setSearching(true)
      try {
        const result = await recipesService.list({
          q: debouncedQuery,
          limit: SEARCH_LIMIT,
        })
        if (!cancelled) setResults(result.recetas)
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, adding])

  const handleAdd = async (receta: RecetaListItem) => {
    if (!detail) return
    try {
      await recipeListsService.addRecipe(detail.id_lista, receta.id_receta)
      setDetail({ ...detail, recetas: [...detail.recetas, receta] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const handleRemove = async (idReceta: number) => {
    if (!detail) return
    try {
      await recipeListsService.removeRecipe(detail.id_lista, idReceta)
      setDetail({
        ...detail,
        recetas: detail.recetas.filter((r) => r.id_receta !== idReceta),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const handleDeleteList = async () => {
    if (!detail) return
    const ok = await confirm({
      title: "¿Eliminar esta lista?",
      description: `"${detail.nombre}" se va a eliminar.`,
      confirmText: "Eliminar",
    })
    if (!ok) return
    try {
      await recipeListsService.remove(detail.id_lista)
      toast.success("Lista eliminada")
      navigate("/listas", { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  if (notFound || !detail) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Lista no encontrada.</p>
        <Button variant="outline" render={<Link to="/listas" />}>
          Volver a listas
        </Button>
      </div>
    )
  }

  const idsEnLista = new Set(detail.recetas.map((r) => r.id_receta))

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/listas" />}
        className="gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Listas
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            {detail.nombre}
          </h1>
          <p className="text-muted-foreground">
            {detail.recetas.length} recetas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Agregar recetas
          </Button>
          <Button
            variant="ghost"
            onClick={handleDeleteList}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Eliminar lista
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {detail.recetas.map((r) => (
          <Card
            key={r.id_receta}
            className="card-shadow hover:card-shadow-hover h-full overflow-hidden p-0 transition-shadow"
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
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {r.tiempo_preparacion} min
                  </span>
                  {r.dificultad && (
                    <Badge variant="secondary">{r.dificultad}</Badge>
                  )}
                </div>
              </div>
            </Link>
            <div className="p-4 pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemove(r.id_receta)}
                className="w-full gap-1 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" /> Quitar de la lista
              </Button>
            </div>
          </Card>
        ))}
        {detail.recetas.length === 0 && (
          <p className="col-span-full p-6 text-center text-sm text-muted-foreground">
            Todavía no agregaste recetas a esta lista.
          </p>
        )}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar recetas a "{detail.nombre}"</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              className="rounded-xl pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              results
                .filter((r) => !idsEnLista.has(r.id_receta))
                .map((r) => (
                  <button
                    key={r.id_receta}
                    onClick={() => handleAdd(r)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary"
                  >
                    <span className="truncate">{r.nombre}</span>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))
            )}
            {!searching && debouncedQuery && results.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No encontramos recetas para esa búsqueda.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
