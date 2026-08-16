import { useEffect, useState } from "react"
import { ListPlus, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { recipeListsService } from "@/services/recipeLists.service"
import type { ListaReceta } from "@/types/recipe"

interface Props {
  recetaId: number
  className?: string
}

export default function AddToListButton({ recetaId, className }: Props) {
  const [open, setOpen] = useState(false)
  const [lists, setLists] = useState<ListaReceta[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    if (!open) return
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
  }, [open])

  const toggle = async (list: ListaReceta) => {
    const yaEsta = list.receta_ids.includes(recetaId)
    try {
      if (yaEsta) {
        await recipeListsService.removeRecipe(list.id_lista, recetaId)
      } else {
        await recipeListsService.addRecipe(list.id_lista, recetaId)
      }
      setLists((current) =>
        current.map((l) =>
          l.id_lista === list.id_lista
            ? {
                ...l,
                receta_ids: yaEsta
                  ? l.receta_ids.filter((id) => id !== recetaId)
                  : [...l.receta_ids, recetaId],
              }
            : l
        )
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const list = await recipeListsService.create(newName.trim())
      await recipeListsService.addRecipe(list.id_lista, recetaId)
      setLists((current) => [{ ...list, receta_ids: [recetaId] }, ...current])
      setNewName("")
      toast.success("Lista creada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className={`gap-1 rounded-xl ${className ?? ""}`}
      >
        <ListPlus className="h-4 w-4" /> Agregar a lista
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Agregar a lista</DialogTitle>
          </DialogHeader>

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {lists.map((list) => (
                <label
                  key={list.id_lista}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
                >
                  <Checkbox
                    checked={list.receta_ids.includes(recetaId)}
                    onCheckedChange={() => toggle(list)}
                  />
                  {list.nombre}
                </label>
              ))}
              {lists.length === 0 && (
                <p className="p-2 text-center text-sm text-muted-foreground">
                  Todavía no tenés listas.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nueva lista…"
              className="rounded-xl"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="shrink-0 gap-1 rounded-xl"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
