import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Archive, Loader2, Plus, Send } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { EstadoPlanificacion, Planificacion } from "@/types/mealPlan"
import type { PacienteVinculado } from "@/types/patient"

const ESTADO_LABEL: Record<EstadoPlanificacion, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  archivada: "Archivada",
}

const ESTADO_VARIANT: Record<EstadoPlanificacion, "secondary" | "default" | "outline"> = {
  borrador: "secondary",
  publicada: "default",
  archivada: "outline",
}

export default function Planning() {
  const confirm = useConfirm()
  const [searchParams, setSearchParams] = useSearchParams()

  const [plans, setPlans] = useState<Planificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([])

  const [creating, setCreating] = useState(false)
  const [idPaciente, setIdPaciente] = useState("")
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [saving, setSaving] = useState(false)

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

  // Entrada desde PatientDetail.tsx: "Crear plan para este paciente".
  useEffect(() => {
    void (async () => {
      const idParam = searchParams.get("paciente")
      if (idParam) {
        setIdPaciente(idParam)
        setCreating(true)
        setSearchParams({}, { replace: true })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async () => {
    if (!idPaciente) {
      toast.error("Elegí un paciente")
      return
    }
    if (!nombre.trim()) {
      toast.error("Ingresá un nombre para el plan")
      return
    }
    setSaving(true)
    try {
      await mealPlansService.create({
        id_paciente: Number(idPaciente),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      })
      toast.success("Plan creado")
      setCreating(false)
      setIdPaciente("")
      setNombre("")
      setDescripcion("")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plan: Planificacion) => {
    const ok = await confirm({
      title: "¿Eliminar este plan?",
      description: `"${plan.nombre}" se va a eliminar permanentemente.`,
      confirmText: "Eliminar",
    })
    if (!ok) return
    await mealPlansService.remove(plan.id_planificacion)
    setPlans((current) =>
      current.filter((p) => p.id_planificacion !== plan.id_planificacion)
    )
  }

  const handlePublish = async (plan: Planificacion) => {
    try {
      await mealPlansService.publish(plan.id_planificacion)
      toast.success("Plan publicado")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const handleArchive = async (plan: Planificacion) => {
    try {
      await mealPlansService.archive(plan.id_planificacion)
      toast.success("Plan archivado")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
            Planificación
          </h1>
          <p className="text-muted-foreground">
            Creá y publicá planes de alimentación para tus pacientes.
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
            <div key={plan.id_planificacion} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/planificacion/${plan.id_planificacion}`}
                  className="truncate font-medium hover:underline"
                >
                  {plan.nombre}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {plan.nombre_paciente} · {plan.cantidad_recetas} recetas
                </p>
              </div>
              <Badge variant={ESTADO_VARIANT[plan.estado]}>
                {ESTADO_LABEL[plan.estado]}
              </Badge>
              {plan.estado === "borrador" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish(plan)}
                  className="gap-1 rounded-xl"
                >
                  <Send className="h-4 w-4" /> Publicar
                </Button>
              )}
              {plan.estado === "publicada" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleArchive(plan)}
                  className="gap-1 rounded-xl"
                >
                  <Archive className="h-4 w-4" /> Archivar
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
              <Label>Paciente</Label>
              <select
                value={idPaciente}
                onChange={(e) => setIdPaciente(e.target.value)}
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Todavía no tenés pacientes vinculados.
                </p>
              )}
            </div>
            <div>
              <Label>Nombre del plan</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Bajar de peso, primera consulta"
                className="min-h-[70px]"
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
    </div>
  )
}
