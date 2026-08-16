import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, ListChecks, Plus } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { recipeListsService } from "@/services/recipeLists.service"
import type { ListaReceta } from "@/types/recipe"

export default function Lists() {
  const confirm = useConfirm()
  const [lists, setLists] = useState<ListaReceta[]>([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [nombre, setNombre] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const result = await recipeListsService.list()
        if (!cancelled) setLists(result)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreate = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const list = await recipeListsService.create(nombre.trim())
      setLists((current) => [list, ...current])
      setCreating(false)
      setNombre("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (list: ListaReceta) => {
    const ok = await confirm({
      title: "¿Eliminar esta lista?",
      description: `"${list.nombre}" se va a eliminar.`,
      confirmText: "Eliminar",
    })
    if (!ok) return
    try {
      await recipeListsService.remove(list.id_lista)
      setLists((current) => current.filter((l) => l.id_lista !== list.id_lista))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            Listas
          </h1>
          <p className="text-muted-foreground">
            Armá colecciones de recetas para tus pacientes.
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
            <Card key={list.id_lista} className="space-y-3 p-4">
              <Link
                to={`/listas/${list.id_lista}`}
                className="flex items-center gap-2"
              >
                <div className="rounded-full bg-secondary p-2">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium hover:underline">
                    {list.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {list.receta_ids.length} recetas
                  </p>
                </div>
              </Link>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link to={`/listas/${list.id_lista}`} />}
                  className="flex-1 rounded-xl"
                >
                  Abrir
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
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
