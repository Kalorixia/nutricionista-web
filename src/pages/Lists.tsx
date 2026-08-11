import { useEffect, useState } from "react"
import { Copy, Loader2, ListChecks, Plus, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { recipeListsService } from "@/services/recipeLists.service"
import { recipesService } from "@/services/recipes.service"
import type { Recipe, RecipeList } from "@/types/recipe"

export default function Lists() {
  const confirm = useConfirm()
  const [lists, setLists] = useState<RecipeList[]>([])
  const [catalogo, setCatalogo] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [nombre, setNombre] = useState("")

  const [editing, setEditing] = useState<RecipeList | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setLists(await recipeListsService.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
    recipesService.list().then(setCatalogo)
  }, [])

  const handleCreate = async () => {
    if (!nombre.trim()) return
    const list = await recipeListsService.create(nombre.trim())
    setLists((current) => [list, ...current])
    setCreating(false)
    setNombre("")
  }

  const handleShare = async (list: RecipeList) => {
    await navigator.clipboard.writeText(list.shareId)
    toast.success("Código de colección copiado")
  }

  const handleDelete = async (list: RecipeList) => {
    const ok = await confirm({
      title: "¿Eliminar esta lista?",
      description: `"${list.nombre}" se va a eliminar.`,
      confirmText: "Eliminar",
    })
    if (!ok) return
    await recipeListsService.remove(list.id)
    setLists((current) => current.filter((l) => l.id !== list.id))
  }

  const toggleRecipe = async (recetaId: string) => {
    if (!editing) return
    const updated = await recipeListsService.toggleRecipe(editing.id, recetaId)
    setEditing(updated)
    setLists((current) =>
      current.map((l) => (l.id === updated.id ? updated : l))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            Listas
          </h1>
          <p className="text-muted-foreground">
            Armá colecciones de recetas para compartir con tus pacientes.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nueva lista
        </Button>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-secondary p-2">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{list.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.recetaIds.length} recetas
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(list)}
                  className="flex-1 gap-1 rounded-xl"
                >
                  <Settings2 className="h-4 w-4" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(list)}
                  className="gap-1 rounded-xl"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(list)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
          {lists.length === 0 && (
            <p className="col-span-full p-6 text-center text-sm text-muted-foreground">
              Todavía no creaste ninguna lista.
            </p>
          )}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva lista</DialogTitle>
          </DialogHeader>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Recetas altas en proteína"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {catalogo.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
              >
                <Checkbox
                  checked={editing?.recetaIds.includes(r.id) ?? false}
                  onCheckedChange={() => toggleRecipe(r.id)}
                />
                {r.titulo}
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
