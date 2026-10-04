import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"
import type { CopiaPlan, ItemQuitado } from "@/types/mealPlan"
import type { PacienteVinculado } from "@/types/patient"

export type ModoCopia = "duplicar" | "plantilla"

/**
 * Copiar un plan (KAL-132-03): a un paciente ("duplicar", también desde una
 * plantilla) o como plantilla propia. Si al copiar a un paciente se quitaron
 * ítems que no puede comer, el diálogo los muestra antes de seguir: es la
 * única forma de que el profesional se entere de qué cambió.
 */
export function CopyPlanDialog({
  modo,
  origen,
  pacientes,
  idPacienteInicial,
  onClose,
  onDone,
}: {
  modo: ModoCopia
  origen: { id_planificacion: number; nombre: string; es_plantilla?: boolean }
  /** Sin lista, el diálogo la pide cuando hace falta (desde el editor). */
  pacientes?: PacienteVinculado[]
  idPacienteInicial?: number | null
  onClose: () => void
  /** Se llama al terminar; con la copia ya creada. */
  onDone: (copia: CopiaPlan) => void
}) {
  const nombre_sugerido =
    modo === "plantilla" || origen.es_plantilla
      ? origen.nombre
      : `Copia de ${origen.nombre}`
  const [id_paciente, set_id_paciente] = useState(
    idPacienteInicial ? String(idPacienteInicial) : ""
  )
  const [nombre, set_nombre] = useState(nombre_sugerido)
  const [busy, set_busy] = useState(false)
  const [error, set_error] = useState<string | null>(null)
  const [resultado, set_resultado] = useState<CopiaPlan | null>(null)
  const [cargados, set_cargados] = useState<PacienteVinculado[] | null>(null)
  const opciones = pacientes ?? cargados ?? []

  useEffect(() => {
    if (pacientes || modo !== "duplicar") return
    let vigente = true
    patientsService
      .listarPacientes()
      .then(({ pacientes: lista }) => vigente && set_cargados(lista))
      .catch(() => vigente && set_error("No pudimos cargar tus pacientes"))
    return () => {
      vigente = false
    }
  }, [pacientes, modo])

  const titulo =
    modo === "plantilla"
      ? "Guardar como plantilla"
      : origen.es_plantilla
        ? "Crear plan desde la plantilla"
        : "Duplicar plan"

  const copiar = async () => {
    if (modo === "duplicar" && !id_paciente) {
      set_error("Elegí un paciente")
      return
    }
    set_busy(true)
    set_error(null)
    try {
      const copia =
        modo === "plantilla"
          ? await mealPlansService.saveAsTemplate(
              origen.id_planificacion,
              nombre.trim() || undefined
            )
          : await mealPlansService.duplicate(origen.id_planificacion, {
              id_paciente: Number(id_paciente),
              nombre: nombre.trim() || undefined,
            })
      if (copia.quitados.length) set_resultado(copia)
      else onDone(copia)
    } catch (e) {
      set_error(e instanceof Error ? e.message : "No se pudo copiar el plan")
    } finally {
      set_busy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resultado ? "Plan creado con cambios" : titulo}
          </DialogTitle>
        </DialogHeader>
        {resultado ? (
          <QuitadosAviso quitados={resultado.quitados} />
        ) : (
          <div className="space-y-3">
            {modo === "duplicar" && (
              <div>
                <Label htmlFor="copia-paciente">Paciente</Label>
                <select
                  id="copia-paciente"
                  disabled={busy}
                  value={id_paciente}
                  onChange={(event) => set_id_paciente(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                >
                  <option value="">Seleccioná un paciente</option>
                  {opciones.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombre} {p.apellido}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se revisa cada comida contra sus restricciones y condiciones;
                  lo que no pueda comer se quita. Los objetivos se recalculan si
                  es otro paciente.
                </p>
              </div>
            )}
            {modo === "plantilla" && (
              <p className="text-sm text-muted-foreground">
                La plantilla es privada: no tiene paciente ni se publica. Al
                crear un plan desde ella se revisa contra ese paciente.
              </p>
            )}
            <div>
              <Label htmlFor="copia-nombre">Nombre</Label>
              <Input
                id="copia-nombre"
                maxLength={150}
                disabled={busy}
                value={nombre}
                onChange={(event) => set_nombre(event.target.value)}
              />
            </div>
            {busy && modo === "duplicar" && (
              <p role="status" className="text-sm text-muted-foreground">
                Revisando las comidas para este paciente…
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          {resultado ? (
            <Button onClick={() => onDone(resultado)}>Abrir el plan</Button>
          ) : (
            <>
              <Button variant="outline" disabled={busy} onClick={onClose}>
                Cancelar
              </Button>
              <Button disabled={busy} onClick={copiar} className="gap-1.5">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {modo === "plantilla" ? "Guardar plantilla" : "Crear borrador"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function QuitadosAviso({ quitados }: { quitados: ItemQuitado[] }) {
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        Se quitaron {quitados.length}{" "}
        {quitados.length === 1 ? "comida" : "comidas"} que este paciente no
        puede comer. Revisá esos momentos antes de publicar.
      </p>
      <ul className="space-y-1.5 text-sm" aria-label="Comidas quitadas">
        {quitados.map((item, indice) => (
          <li
            key={`${item.dia_semana}-${item.momento_comida}-${item.id_receta}-${indice}`}
            className="rounded-lg border border-border p-2"
          >
            <span className="font-medium">
              {item.nombre ?? `Receta ${item.id_receta}`}
            </span>{" "}
            <span className="text-muted-foreground">
              · {item.dia_semana} / {item.momento_comida}
            </span>
            <p className="text-xs text-muted-foreground">{item.motivo}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
