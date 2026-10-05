import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { nutritionistService } from "@/services/nutritionist.service"
import { contenido_pdf, descargar_pdf } from "@/utils/plan_pdf"
import type { PlanificacionDetalle } from "@/types/mealPlan"

/**
 * Descargar el plan en PDF (KAL-132-04). La matrícula se pide al descargar:
 * si no responde, el PDF sale igual, sin ella.
 */
export function PlanPdfDialog({
  plan,
  onClose,
}: {
  plan: PlanificacionDetalle
  onClose: () => void
}) {
  const { user } = useAuth()
  const [incluir_nutricion, set_incluir_nutricion] = useState(false)
  const [busy, set_busy] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  const descargar = async () => {
    set_busy(true)
    set_error(null)
    try {
      const matricula = await nutritionistService
        .estadoMatricula()
        .then((detalle) => detalle.matricula)
        .catch(() => null)
      const nombre = user ? `${user.nombre} ${user.apellido}`.trim() : ""
      await descargar_pdf(
        contenido_pdf(
          plan,
          { nombre: nombre || "Profesional", matricula },
          { incluir_nutricion }
        )
      )
      onClose()
    } catch {
      set_error("No se pudo generar el PDF. Intentá de nuevo.")
    } finally {
      set_busy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Descargar PDF</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Incluye tus datos y matrícula, el paciente, el período, las comidas
            de cada día con sus notas y las indicaciones generales.
          </p>
          <label className="flex items-center gap-2">
            <Checkbox
              id="pdf-nutricion"
              checked={incluir_nutricion}
              disabled={busy}
              onCheckedChange={(marcado) =>
                set_incluir_nutricion(marcado === true)
              }
            />
            Incluir calorías y macros
          </label>
          {plan.estado === "borrador" && (
            <p className="text-amber-600">
              Es un borrador: el PDF va a decir que no está publicado.
            </p>
          )}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy} onClick={descargar} className="gap-1.5">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
