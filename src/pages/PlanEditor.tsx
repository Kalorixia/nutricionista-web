import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Plus, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { mealPlansService } from "@/services/mealPlans.service"
import { recipesService } from "@/services/recipes.service"
import type { DiaPlan, MealPlan } from "@/types/mealPlan"
import type { Recipe } from "@/types/recipe"

export default function PlanEditor() {
  const { id } = useParams<{ id: string }>()
  const confirm = useConfirm()

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [dias, setDias] = useState<DiaPlan[]>([])
  const [recetasPorId, setRecetasPorId] = useState<Map<string, Recipe>>(
    new Map()
  )
  const [catalogo, setCatalogo] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [picker, setPicker] = useState<{ dia: string; slot: string } | null>(
    null
  )

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const [loadedPlan, recetas] = await Promise.all([
          mealPlansService.get(id),
          recipesService.list(),
        ])
        if (cancelled) return
        setPlan(loadedPlan)
        setDias(loadedPlan.dias)
        setCatalogo(recetas)
        setRecetasPorId(new Map(recetas.map((r) => [r.id, r])))
      } catch {
        if (!cancelled) toast.error("No se pudo cargar el plan")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const addRecipe = (dia: string, slot: string, recetaId: string) => {
    setDias((current) =>
      current.map((d) =>
        d.dia !== dia
          ? d
          : {
              ...d,
              comidas: {
                ...d.comidas,
                [slot]: [...(d.comidas[slot] ?? []), recetaId],
              },
            }
      )
    )
    setPicker(null)
  }

  const removeRecipe = (dia: string, slot: string, recetaId: string) => {
    setDias((current) =>
      current.map((d) =>
        d.dia !== dia
          ? d
          : {
              ...d,
              comidas: {
                ...d.comidas,
                [slot]: (d.comidas[slot] ?? []).filter(
                  (id) => id !== recetaId
                ),
              },
            }
      )
    )
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      await mealPlansService.update(id, dias)
      toast.success("Cambios guardados")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    const ok = await confirm({
      title: "¿Generar plan con IA?",
      description:
        "Esto va a reemplazar las recetas asignadas en todos los días. (Función de demostración: la generación real todavía no está conectada.)",
      confirmText: "Generar",
    })
    if (!ok) return
    setGenerating(true)
    try {
      const nuevosDias = await mealPlansService.generateWithAI()
      setDias(nuevosDias)
      toast.success("Plan generado")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Plan no encontrado.</p>
        <Button variant="outline" render={<Link to="/planificacion" />}>
          Volver a planificación
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/planificacion" />}
        className="gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Planificación
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            {plan.nombre}
          </h1>
          <p className="text-muted-foreground">
            {plan.objetivo || "Sin objetivo"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateAI}
            disabled={generating}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generar con IA
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {dias.map((dia) => (
          <Card key={dia.dia} className="p-4">
            <h2 className="mb-3 font-heading text-sm font-semibold">
              {dia.dia}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plan.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                    {slot.nombre}
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {(dia.comidas[slot.id] ?? []).map((recetaId) => (
                      <Badge
                        key={recetaId}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {recetasPorId.get(recetaId)?.titulo ?? recetaId}
                        <button
                          onClick={() =>
                            removeRecipe(dia.dia, slot.id, recetaId)
                          }
                          className="rounded-full p-0.5 hover:bg-secondary-foreground/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPicker({ dia: dia.dia, slot: slot.id })}
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                  >
                    <Plus className="h-3 w-3" /> Agregar receta
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!picker} onOpenChange={(o) => !o && setPicker(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Elegir receta</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {catalogo.map((r) => (
              <button
                key={r.id}
                onClick={() => picker && addRecipe(picker.dia, picker.slot, r.id)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                {r.titulo}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
