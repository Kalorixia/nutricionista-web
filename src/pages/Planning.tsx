import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Archive, Loader2, Plus, Send, Sparkles } from "lucide-react"
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

const ESTADO_VARIANT: Record<
  EstadoPlanificacion,
  "secondary" | "default" | "outline"
> = {
  borrador: "secondary",
  publicada: "default",
  archivada: "outline",
}

export default function Planning() {
  const navigate = useNavigate()
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
  const [instructions, set_instructions] = useState("")
  const [load_error, set_load_error] = useState<string | null>(null)
  const [patients_error, set_patients_error] = useState<string | null>(null)
  const [busy_id, set_busy_id] = useState<number | null>(null)
  const action_lock = useRef(false)
  const create_lock = useRef(false)

  const load = async () => {
    setLoading(true)
    set_load_error(null)
    try {
      setPlans(await mealPlansService.list())
    } catch (error) {
      set_load_error(
        error instanceof Error ? error.message : "No pudimos cargar los planes"
      )
    } finally {
      setLoading(false)
    }
  }

  const load_patients = async () => {
    set_patients_error(null)
    try {
      setPacientes((await patientsService.listarPacientes()).pacientes)
    } catch (error) {
      set_patients_error(
        error instanceof Error
          ? error.message
          : "No pudimos cargar los pacientes"
      )
    }
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
    void load_patients()
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

  const handleCreate = async (with_ai = false) => {
    if (create_lock.current) return
    if (!idPaciente) {
      toast.error("Elegí un paciente")
      return
    }
    if (!nombre.trim()) {
      toast.error("Ingresá un nombre para el plan")
      return
    }
    setSaving(true)
    create_lock.current = true
    try {
      const input = {
        id_paciente: Number(idPaciente),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      }
      const plan = with_ai
        ? await mealPlansService.generate({
            ...input,
            indicaciones: instructions.trim() || undefined,
          })
        : await mealPlansService.create(input)
      toast.success(
        with_ai
          ? "Borrador generado. Revisalo antes de publicar."
          : "Plan creado"
      )
      setCreating(false)
      setIdPaciente("")
      setNombre("")
      setDescripcion("")
      navigate(`/planificacion/${plan.id_planificacion}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
      create_lock.current = false
    }
  }

  const handleDelete = async (plan: Planificacion) => {
    if (action_lock.current) return
    action_lock.current = true
    set_busy_id(plan.id_planificacion)
    try {
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
      toast.success("Plan eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      action_lock.current = false
      set_busy_id(null)
    }
  }

  const handleArchive = async (plan: Planificacion) => {
    if (action_lock.current) return
    action_lock.current = true
    set_busy_id(plan.id_planificacion)
    try {
      await mealPlansService.archive(plan.id_planificacion)
      toast.success("Plan archivado")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      action_lock.current = false
      set_busy_id(null)
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
      ) : load_error ? (
        <Card className="space-y-3 p-4">
          <p role="alert">{load_error}</p>
          <Button onClick={load}>Reintentar</Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {plans.map((plan) => (
            <div
              key={plan.id_planificacion}
              className="flex items-center gap-3 p-4"
            >
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
                  render={
                    <Link to={`/planificacion/${plan.id_planificacion}`} />
                  }
                  className="gap-1 rounded-xl"
                >
                  <Send className="h-4 w-4" /> Revisar y publicar
                </Button>
              )}
              {plan.estado === "publicada" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleArchive(plan)}
                  disabled={busy_id !== null}
                  className="gap-1 rounded-xl"
                >
                  <Archive className="h-4 w-4" /> Archivar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(plan)}
                disabled={busy_id !== null}
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

      <Dialog
        open={creating}
        onOpenChange={(open) => !saving && setCreating(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo plan de alimentación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="plan-patient">Paciente</Label>
              <select
                id="plan-patient"
                disabled={saving}
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
              {patients_error && (
                <div role="alert">
                  <p>{patients_error}</p>
                  <Button onClick={load_patients} disabled={saving}>
                    Reintentar pacientes
                  </Button>
                </div>
              )}
              {pacientes.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Todavía no tenés pacientes vinculados.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="plan-name">Nombre del plan</Label>
              <Input
                id="plan-name"
                disabled={saving}
                maxLength={150}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                disabled={saving}
                maxLength={2000}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Bajar de peso, primera consulta"
                className="min-h-[70px]"
              />
            </div>
            <div>
              <Label htmlFor="copilot-instructions">
                Indicaciones para el Copiloto (opcional)
              </Label>
              <Textarea
                id="copilot-instructions"
                disabled={saving}
                maxLength={4000}
                value={instructions}
                onChange={(event) => set_instructions(event.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                El Copiloto crea un borrador privado para tu revisión.
              </p>
            </div>
            {saving && (
              <p role="status">
                Preparando el borrador. La generación puede tardar hasta dos
                minutos.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              disabled={saving}
              variant="outline"
              onClick={() => setCreating(false)}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleCreate(false)} disabled={saving}>
              Crear manual
            </Button>
            <Button
              onClick={() => handleCreate(true)}
              disabled={saving}
              className="gap-1"
            >
              <Sparkles className="h-4 w-4" /> Generar con Copiloto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
