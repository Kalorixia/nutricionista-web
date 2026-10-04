import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import type {
  ActualizarPlanificacionInput,
  PlanificacionDetalle,
} from "@/types/mealPlan"

const redondo = (valor: number | null | undefined) =>
  valor != null ? String(Math.round(valor)) : ""

/**
 * Datos del plan: nombre, descripción, período y objetivos (KAL-131-08).
 * Sirve para borradores y publicados; en un publicado el cambio lo ve el
 * paciente de inmediato. Se monta abierto: el padre lo desmonta al cerrar.
 */
export function PlanHeaderDialog({
  plan,
  busy,
  onClose,
  onSave,
}: {
  plan: PlanificacionDetalle
  busy: boolean
  onClose: () => void
  onSave: (cambios: ActualizarPlanificacionInput) => void
}) {
  const objetivos = plan.objetivos_nutricionales
  const [nombre, set_nombre] = useState(plan.nombre)
  const [descripcion, set_descripcion] = useState(plan.descripcion ?? "")
  const [inicio, set_inicio] = useState(plan.fecha_inicio ?? "")
  const [fin, set_fin] = useState(plan.fecha_fin ?? "")
  const [kcal, set_kcal] = useState(redondo(objetivos?.get_objetivo_kcal))
  const [proteinas, set_proteinas] = useState(redondo(objetivos?.proteinas_g))
  const [grasas, set_grasas] = useState(redondo(objetivos?.grasas_g))

  const guardar = () => {
    const cambios: ActualizarPlanificacionInput = {}
    if (nombre.trim() !== plan.nombre) cambios.nombre = nombre.trim()
    if (descripcion.trim() !== (plan.descripcion ?? ""))
      cambios.descripcion = descripcion.trim() || null
    if (inicio !== (plan.fecha_inicio ?? ""))
      cambios.fecha_inicio = inicio || null
    if (fin !== (plan.fecha_fin ?? "")) cambios.fecha_fin = fin || null
    const numeros_cambiados =
      kcal !== redondo(objetivos?.get_objetivo_kcal) ||
      proteinas !== redondo(objetivos?.proteinas_g) ||
      grasas !== redondo(objetivos?.grasas_g)
    if (kcal && proteinas && grasas && numeros_cambiados)
      cambios.objetivos = {
        get_objetivo_kcal: Number(kcal),
        proteinas_g: Number(proteinas),
        grasas_g: Number(grasas),
      }
    if (!Object.keys(cambios).length) {
      onClose()
      return
    }
    onSave(cambios)
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Datos del plan</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            guardar()
          }}
        >
          <div>
            <Label htmlFor="cabecera-nombre">Nombre del plan</Label>
            <Input
              id="cabecera-nombre"
              maxLength={150}
              value={nombre}
              disabled={busy}
              onChange={(event) => set_nombre(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cabecera-descripcion">Descripción</Label>
            <Textarea
              id="cabecera-descripcion"
              maxLength={2000}
              value={descripcion}
              disabled={busy}
              onChange={(event) => set_descripcion(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cabecera-inicio">Desde</Label>
              <Input
                id="cabecera-inicio"
                type="date"
                value={inicio}
                disabled={busy}
                onChange={(event) => set_inicio(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cabecera-fin">Hasta</Label>
              <Input
                id="cabecera-fin"
                type="date"
                value={fin}
                disabled={busy}
                onChange={(event) => set_fin(event.target.value)}
              />
            </div>
          </div>
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="mb-1 text-sm font-medium">
              Objetivos del plan
            </legend>
            <div>
              <Label htmlFor="cabecera-kcal">Energía (kcal)</Label>
              <Input
                id="cabecera-kcal"
                type="number"
                min="0"
                value={kcal}
                disabled={busy}
                onChange={(event) => set_kcal(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cabecera-proteinas">Proteínas (g)</Label>
              <Input
                id="cabecera-proteinas"
                type="number"
                min="0"
                value={proteinas}
                disabled={busy}
                onChange={(event) => set_proteinas(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cabecera-grasas">Grasas (g)</Label>
              <Input
                id="cabecera-grasas"
                type="number"
                min="0"
                value={grasas}
                disabled={busy}
                onChange={(event) => set_grasas(event.target.value)}
              />
            </div>
            <p className="col-span-3 text-xs text-muted-foreground">
              Los carbohidratos se completan con el resto de la energía. No
              cambia el perfil del paciente.
            </p>
          </fieldset>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={busy || !nombre.trim()}
              className="gap-1.5"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
