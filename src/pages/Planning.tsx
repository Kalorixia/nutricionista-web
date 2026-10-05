import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Archive,
  BookmarkPlus,
  Copy,
  FileText,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { mealPlansService } from "@/services/mealPlans.service"
import { useGenerations } from "@/hooks/use-generations"
import { patientsService } from "@/services/patients.service"
import {
  NewPlanDialog,
  type NuevoPlan,
} from "@/components/modules/plans/NewPlanDialog"
import {
  CopyPlanDialog,
  type ModoCopia,
} from "@/components/modules/plans/CopyPlanDialog"
import type {
  EstadoPlanificacion,
  Planificacion,
  PlantillaResumen,
} from "@/types/mealPlan"
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
  const [saving, setSaving] = useState(false)
  const { active, recent, track, dismiss } = useGenerations()
  const [load_error, set_load_error] = useState<string | null>(null)
  const [patients_error, set_patients_error] = useState<string | null>(null)
  const [busy_id, set_busy_id] = useState<number | null>(null)
  const action_lock = useRef(false)
  const create_lock = useRef(false)
  const [plantillas, set_plantillas] = useState<PlantillaResumen[]>([])
  const [copia, set_copia] = useState<{
    modo: ModoCopia
    origen: { id_planificacion: number; nombre: string; es_plantilla?: boolean }
    id_paciente?: number | null
  } | null>(null)

  const load = async () => {
    setLoading(true)
    set_load_error(null)
    try {
      const [lista, propias] = await Promise.all([
        mealPlansService.list(),
        mealPlansService.templates(),
      ])
      setPlans(lista)
      set_plantillas(propias)
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
      await Promise.all([load(), load_patients()])
    })()
  }, [])

  const completadas = recent
    .filter((item) => item.estado === "completada" && item.id_planificacion)
    .map((item) => item.id_planificacion as number)
  const nuevos = new Set(completadas)
  const clave_completadas = completadas.join(",")
  useEffect(() => {
    if (!clave_completadas) return
    void (async () => {
      try {
        const lista = await mealPlansService.list()
        setPlans(lista)
      } catch {
        // Si falla, el borrador igual aparece en la próxima carga.
      }
    })()
  }, [clave_completadas])
  const fallidas = recent.filter((item) => item.estado === "fallida")
  const nombre_paciente = (idPaciente: number) => {
    const paciente = pacientes.find((item) => item.id_paciente === idPaciente)
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : "Paciente"
  }

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

  const handleCreate = async (nuevo: NuevoPlan, with_ai: boolean) => {
    if (create_lock.current) return
    setSaving(true)
    create_lock.current = true
    try {
      const input = {
        id_paciente: nuevo.id_paciente,
        nombre: nuevo.nombre,
        descripcion: nuevo.descripcion,
        ...nuevo.targets,
      }
      // Con IA el pedido es asíncrono: se cierra el diálogo y el profesional
      // sigue trabajando. El aviso llega cuando el borrador está listo.
      if (with_ai) {
        const generacion = await mealPlansService.generate({
          ...input,
          indicaciones: nuevo.indicaciones,
          momentos: nuevo.momentos,
        })
        track(generacion)
        toast.success("Lo estoy generando. Te aviso cuando esté listo.")
      }
      const plan = with_ai ? null : await mealPlansService.create(input)
      if (plan) toast.success("Plan creado")
      setCreating(false)
      setIdPaciente("")
      if (plan) navigate(`/planificacion/${plan.id_planificacion}`)
      else await load()
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

  const handle_delete_template = async (plantilla: PlantillaResumen) => {
    if (action_lock.current) return
    action_lock.current = true
    set_busy_id(plantilla.id_planificacion)
    try {
      const ok = await confirm({
        title: "¿Eliminar esta plantilla?",
        description: `"${plantilla.nombre}" se va a eliminar. Los planes creados desde ella no cambian.`,
        confirmText: "Eliminar",
      })
      if (!ok) return
      await mealPlansService.remove(plantilla.id_planificacion)
      set_plantillas((actuales) =>
        actuales.filter(
          (item) => item.id_planificacion !== plantilla.id_planificacion
        )
      )
      toast.success("Plantilla eliminada")
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
        <Card className="surface-raised divide-y divide-border overflow-hidden">
          {active.map((generacion) => (
            <div
              key={`g-${generacion.id_generacion}`}
              role="status"
              aria-label={`Generando ${generacion.nombre || "borrador"}`}
              className="flex flex-wrap items-center gap-3 bg-primary/5 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {generacion.nombre || "Borrador del Copiloto"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {nombre_paciente(generacion.id_paciente)} ·{" "}
                  {generacion.estado === "pendiente"
                    ? "En cola"
                    : "El Copiloto está armando la semana"}{" "}
                  · <Transcurrido desde={generacion.created_at} />
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                {generacion.estado === "pendiente" ? "En cola" : "Generando"}
              </Badge>
            </div>
          ))}
          {fallidas.map((generacion) => (
            <div
              key={`f-${generacion.id_generacion}`}
              className="flex flex-wrap items-center gap-3 bg-destructive/5 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {generacion.nombre || "Borrador del Copiloto"}
                </p>
                <p className="text-xs text-destructive">
                  {nombre_paciente(generacion.id_paciente)} ·{" "}
                  {generacion.error_mensaje || "No se pudo generar."}
                </p>
              </div>
              <Badge variant="destructive">Falló</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismiss(generacion.id_generacion)}
                className="gap-1"
                aria-label={`Descartar ${generacion.nombre || "borrador"}`}
              >
                <X className="h-4 w-4" /> Descartar
              </Button>
            </div>
          ))}
          {plans.map((plan) => (
            <div
              key={plan.id_planificacion}
              className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-secondary/30"
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
              {nuevos.has(plan.id_planificacion) && (
                <Badge
                  variant="outline"
                  className="border-primary text-primary"
                >
                  Nuevo
                </Badge>
              )}
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
                onClick={() =>
                  set_copia({
                    modo: "duplicar",
                    origen: plan,
                    id_paciente: plan.id_paciente,
                  })
                }
                disabled={busy_id !== null}
                className="gap-1"
                aria-label={`Duplicar ${plan.nombre}`}
              >
                <Copy className="h-4 w-4" /> Duplicar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => set_copia({ modo: "plantilla", origen: plan })}
                disabled={busy_id !== null}
                className="gap-1"
                aria-label={`Guardar ${plan.nombre} como plantilla`}
              >
                <BookmarkPlus className="h-4 w-4" /> Plantilla
              </Button>
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
          {plans.length === 0 &&
            active.length === 0 &&
            fallidas.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Todavía no creaste ningún plan.
              </p>
            )}
        </Card>
      )}

      {!loading && !load_error && (
        <section className="space-y-3" aria-label="Mis plantillas">
          <div>
            <h2 className="text-brand-dark font-heading text-xl font-semibold">
              Mis plantillas
            </h2>
            <p className="text-sm text-muted-foreground">
              Planes base privados para reusar. Guardá cualquier plan como
              plantilla y creá desde ella un borrador para un paciente.
            </p>
          </div>
          <Card className="divide-y divide-border overflow-hidden">
            {plantillas.map((plantilla) => (
              <div
                key={plantilla.id_planificacion}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/planificacion/${plantilla.id_planificacion}`}
                    className="truncate font-medium hover:underline"
                  >
                    {plantilla.nombre}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {plantilla.cantidad_recetas} ítems
                    {plantilla.descripcion ? ` · ${plantilla.descripcion}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    set_copia({
                      modo: "duplicar",
                      origen: { ...plantilla, es_plantilla: true },
                    })
                  }
                  disabled={busy_id !== null}
                  className="gap-1 rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Crear plan
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handle_delete_template(plantilla)}
                  disabled={busy_id !== null}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Eliminar plantilla ${plantilla.nombre}`}
                >
                  Eliminar
                </Button>
              </div>
            ))}
            {plantillas.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Todavía no guardaste plantillas.
              </p>
            )}
          </Card>
        </section>
      )}

      {copia && (
        <CopyPlanDialog
          modo={copia.modo}
          origen={copia.origen}
          pacientes={pacientes}
          idPacienteInicial={copia.id_paciente}
          onClose={() => set_copia(null)}
          onDone={(resultado) => {
            set_copia(null)
            toast.success(
              resultado.plan.es_plantilla
                ? "Plantilla guardada"
                : "Borrador creado"
            )
            navigate(`/planificacion/${resultado.plan.id_planificacion}`)
          }}
        />
      )}

      {creating && (
        <NewPlanDialog
          pacientes={pacientes}
          pacientesError={patients_error}
          onRetryPacientes={load_patients}
          idPacienteInicial={idPaciente}
          saving={saving}
          onClose={() => {
            setCreating(false)
            setIdPaciente("")
          }}
          onSubmit={(nuevo, con_copiloto) =>
            void handleCreate(nuevo, con_copiloto)
          }
        />
      )}
    </div>
  )
}

/** Tiempo desde que se pidió el borrador, para que se note que avanza. */
function Transcurrido({ desde }: { desde: string }) {
  const [ahora, set_ahora] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => set_ahora(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const segundos = Math.max(
    0,
    Math.floor((ahora - new Date(desde).getTime()) / 1000)
  )
  const minutos = Math.floor(segundos / 60)
  return (
    <span className="tabular-nums">
      {minutos}:{String(segundos % 60).padStart(2, "0")}
    </span>
  )
}
