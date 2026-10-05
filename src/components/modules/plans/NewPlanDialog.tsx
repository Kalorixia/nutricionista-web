import { useState, type ReactNode } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PlanTargetsSection } from "@/components/modules/plans/PlanTargetsSection"
import { SELECT_CLASS } from "@/utils/form_styles"
import { MOMENTOS_COMIDA } from "@/types/mealPlan"
import type { ParametrosPlanInput } from "@/types/mealPlan"
import type { PacienteVinculado } from "@/types/patient"

export interface NuevoPlan {
  id_paciente: number
  nombre: string
  descripcion?: string
  targets: ParametrosPlanInput
  indicaciones?: string
  momentos: string[]
}

/**
 * Crear un plan: a mano o con el Copiloto. Cuatro pasos en una sola ventana
 * (paciente, objetivos, comidas e indicaciones), con las acciones siempre a la
 * vista. Se monta abierto: cerrar lo desmonta y el formulario arranca limpio.
 */
export function NewPlanDialog({
  pacientes,
  pacientesError,
  onRetryPacientes,
  idPacienteInicial,
  saving,
  onClose,
  onSubmit,
}: {
  pacientes: PacienteVinculado[]
  pacientesError: string | null
  onRetryPacientes: () => void
  idPacienteInicial?: string
  saving: boolean
  onClose: () => void
  onSubmit: (plan: NuevoPlan, conCopiloto: boolean) => void
}) {
  const [id_paciente, set_id_paciente] = useState(idPacienteInicial ?? "")
  const [nombre, set_nombre] = useState("")
  const [descripcion, set_descripcion] = useState("")
  const [targets, set_targets] = useState<ParametrosPlanInput>({})
  const [momentos, set_momentos] = useState<string[]>([...MOMENTOS_COMIDA])
  const [indicaciones, set_indicaciones] = useState("")
  const [error, set_error] = useState<string | null>(null)

  const enviar = (con_copiloto: boolean) => {
    const falta = !id_paciente
      ? "Elegí un paciente"
      : !nombre.trim()
        ? "Ingresá un nombre para el plan"
        : "objetivo_personalizado" in targets && !targets.objetivo_personalizado
          ? "Escribí el objetivo del plan o elegí uno de la lista"
          : con_copiloto && !momentos.length
            ? "Elegí al menos una comida para el plan"
            : null
    set_error(falta)
    if (falta) return
    onSubmit(
      {
        id_paciente: Number(id_paciente),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        targets,
        indicaciones: indicaciones.trim() || undefined,
        momentos,
      },
      con_copiloto
    )
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !saving && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Nuevo plan de alimentación
          </DialogTitle>
          <DialogDescription>
            Elegí el paciente, revisá los objetivos y generalo con el Copiloto o
            armalo a mano.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
          <Paso numero={1} titulo="Paciente y plan">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-patient">Paciente</Label>
                <select
                  id="plan-patient"
                  disabled={saving}
                  value={id_paciente}
                  onChange={(e) => set_id_paciente(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Seleccioná un paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombre} {p.apellido}
                    </option>
                  ))}
                </select>
                {pacientes.length === 0 && !pacientesError && (
                  <p className="text-xs text-muted-foreground">
                    Todavía no tenés pacientes vinculados.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Nombre del plan</Label>
                <Input
                  id="plan-name"
                  disabled={saving}
                  maxLength={150}
                  value={nombre}
                  onChange={(e) => set_nombre(e.target.value)}
                  placeholder="Ej: Semana de octubre"
                />
              </div>
            </div>
            {pacientesError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <p>{pacientesError}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRetryPacientes}
                  disabled={saving}
                >
                  Reintentar pacientes
                </Button>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="plan-description">
                Descripción{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="plan-description"
                disabled={saving}
                maxLength={2000}
                value={descripcion}
                onChange={(e) => set_descripcion(e.target.value)}
                placeholder="Ej: primera consulta, foco en ordenar horarios"
                className="min-h-16"
              />
            </div>
          </Paso>

          <Paso
            numero={2}
            titulo="Objetivos"
            ayuda="Arrancan con los del paciente. Lo que cambies vale sólo para este plan."
          >
            <PlanTargetsSection
              key={id_paciente}
              idPaciente={id_paciente ? Number(id_paciente) : null}
              disabled={saving}
              onChange={set_targets}
            />
          </Paso>

          <Paso
            numero={3}
            titulo="Comidas del día"
            ayuda="No todos los pacientes hacen las cuatro. El plan cubre los siete días de las que elijas."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MOMENTOS_COMIDA.map((momento) => {
                const activo = momentos.includes(momento)
                return (
                  <button
                    key={momento}
                    type="button"
                    aria-pressed={activo}
                    disabled={saving}
                    onClick={() =>
                      set_momentos((actuales) =>
                        activo
                          ? actuales.filter((valor) => valor !== momento)
                          : MOMENTOS_COMIDA.filter(
                              (m) => m === momento || actuales.includes(m)
                            )
                      )
                    }
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-4xl border px-3 py-2 text-sm transition-colors disabled:opacity-50",
                      activo
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {activo && <Check className="h-3.5 w-3.5" />}
                    {momento}
                  </button>
                )
              })}
            </div>
          </Paso>

          <Paso
            numero={4}
            titulo="Indicaciones para el Copiloto"
            ayuda="Opcional. Sólo se usan al generar con el Copiloto; nunca pasan por encima de las restricciones."
          >
            <Textarea
              id="copilot-instructions"
              aria-label="Indicaciones para el Copiloto (opcional)"
              disabled={saving}
              maxLength={4000}
              value={indicaciones}
              onChange={(event) => set_indicaciones(event.target.value)}
              placeholder="Ej: cenas livianas, sin repetir pollo más de dos veces, viandas fáciles para el almuerzo"
              className="min-h-20"
            />
          </Paso>
        </div>

        <DialogFooter className="items-center border-t border-border bg-muted/30 px-6 py-4 sm:justify-between">
          <div className="text-xs" aria-live="polite">
            {error ? (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            ) : saving ? (
              <p
                role="status"
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparando el
                plan…
              </p>
            ) : (
              <p className="text-muted-foreground">
                El Copiloto crea un borrador privado para tu revisión.
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="ghost" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => enviar(false)}
              disabled={saving}
            >
              Crear manual
            </Button>
            <Button
              onClick={() => enviar(true)}
              disabled={saving}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" /> Generar con Copiloto
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Paso({
  numero,
  titulo,
  ayuda,
  children,
}: {
  numero: number
  titulo: string
  ayuda?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3" aria-label={titulo}>
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {numero}
        </span>
        <div>
          <h3 className="text-sm leading-6 font-semibold">{titulo}</h3>
          {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
        </div>
      </div>
      <div className="space-y-3 sm:pl-9">{children}</div>
    </section>
  )
}
