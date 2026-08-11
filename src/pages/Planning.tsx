import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2, Plus, Send, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"
import type { EstadoPlan, MealPlan } from "@/types/mealPlan"
import type { PacienteVinculado } from "@/types/patient"

const ESTADO_LABEL: Record<EstadoPlan, string> = {
  borrador: "Borrador",
  aprobada: "Aprobada",
  publicada: "Publicada",
}

const ESTADO_VARIANT: Record<EstadoPlan, "secondary" | "default"> = {
  borrador: "secondary",
  aprobada: "secondary",
  publicada: "default",
}

export default function Planning() {
  const confirm = useConfirm()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([])

  const [creating, setCreating] = useState(false)
  const [nombre, setNombre] = useState("")
  const [objetivo, setObjetivo] = useState("")
  const [saving, setSaving] = useState(false)

  const [publishing, setPublishing] = useState<MealPlan | null>(null)
  const [idPacienteElegido, setIdPacienteElegido] = useState<string>("")

  const load = async () => {
    setLoading(true)
    try {
      setPlans(await mealPlansService.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
    patientsService
      .listarPacientes()
      .then(({ pacientes }) => setPacientes(pacientes))
      .catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!nombre.trim()) {
      toast.error("Ingresá un nombre para el plan")
      return
    }
    setSaving(true)
    try {
      const plan = await mealPlansService.create(
        nombre.trim(),
        objetivo.trim()
      )
      toast.success("Plan creado")
      setCreating(false)
      setNombre("")
      setObjetivo("")
      setPlans((current) => [plan, ...current])
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plan: MealPlan) => {
    const ok = await confirm({
      title: "¿Eliminar este plan?",
      description: `"${plan.nombre}" se va a eliminar permanentemente.`,
      confirmText: "Eliminar",
    })
    if (!ok) return
    await mealPlansService.remove(plan.id)
    setPlans((current) => current.filter((p) => p.id !== plan.id))
  }

  const handleApprove = async (plan: MealPlan) => {
    try {
      const updated = await mealPlansService.approve(plan.id)
      setPlans((current) =>
        current.map((p) => (p.id === updated.id ? updated : p))
      )
      toast.success("Plan aprobado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const openPublish = (plan: MealPlan) => {
    setPublishing(plan)
    setIdPacienteElegido("")
  }

  const doPublish = async () => {
    if (!publishing || !idPacienteElegido) return
    const paciente = pacientes.find(
      (p) => String(p.id_paciente) === idPacienteElegido
    )
    if (!paciente) return
    try {
      const updated = await mealPlansService.publish(
        publishing.id,
        paciente.id_paciente,
        `${paciente.nombre} ${paciente.apellido}`
      )
      setPlans((current) =>
        current.map((p) => (p.id === updated.id ? updated : p))
      )
      toast.success(`Plan publicado para ${paciente.nombre}`)
      setPublishing(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const handleUnpublish = async (plan: MealPlan) => {
    const updated = await mealPlansService.unpublish(plan.id)
    setPlans((current) =>
      current.map((p) => (p.id === updated.id ? updated : p))
    )
    toast.success("Plan despublicado")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            Planificación
          </h1>
          <p className="text-muted-foreground">
            Creá, aprobá y publicá planes de alimentación para tus pacientes.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nuevo plan
        </Button>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Card className="divide-y divide-border">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/planificacion/${plan.id}`}
                  className="truncate font-medium hover:underline"
                >
                  {plan.nombre}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {plan.objetivo || "Sin objetivo"} ·{" "}
                  {plan.nombre_paciente ?? "Sin publicar"}
                </p>
              </div>
              <Badge variant={ESTADO_VARIANT[plan.estado]}>
                {ESTADO_LABEL[plan.estado]}
              </Badge>
              {plan.estado === "borrador" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(plan)}
                  className="gap-1 rounded-xl"
                >
                  <CheckCircle2 className="h-4 w-4" /> Aprobar
                </Button>
              )}
              {plan.estado === "aprobada" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPublish(plan)}
                  className="gap-1 rounded-xl"
                >
                  <Send className="h-4 w-4" /> Publicar
                </Button>
              )}
              {plan.estado === "publicada" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnpublish(plan)}
                  className="gap-1 rounded-xl"
                >
                  <Undo2 className="h-4 w-4" /> Despublicar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(plan)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Eliminar
              </Button>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Todavía no creaste ningún plan.
            </p>
          )}
        </Card>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo plan de alimentación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ej: Bajar de peso"
              />
            </div>
          </div>
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

      <Dialog
        open={!!publishing}
        onOpenChange={(o) => !o && setPublishing(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Elegí a quién publicárselo</Label>
            <select
              value={idPacienteElegido}
              onChange={(e) => setIdPacienteElegido(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-sm"
            >
              <option value="">Seleccioná un paciente</option>
              {pacientes.map((p) => (
                <option key={p.id_paciente} value={p.id_paciente}>
                  {p.nombre} {p.apellido}
                </option>
              ))}
            </select>
            {pacientes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todavía no tenés pacientes vinculados.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishing(null)}>
              Cancelar
            </Button>
            <Button onClick={doPublish} disabled={!idPacienteElegido}>
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
