import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PlanificacionDetalle } from "@/types/mealPlan"
import { review_summary } from "@/utils/plan_review"

interface PublishPlanDialogProps {
  plan: PlanificacionDetalle
  open: boolean
  busy: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PublishPlanDialog({
  plan,
  open,
  busy,
  onOpenChange,
  onConfirm,
}: PublishPlanDialogProps) {
  const review = review_summary(plan)
  const has_details =
    review.missing.length > 0 ||
    review.outside.length > 0 ||
    review.unverified.length > 0

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        className="flex max-h-[min(90dvh,46rem)] max-w-xl flex-col gap-0 overflow-hidden p-0"
        showCloseButton={!busy}
      >
        <DialogHeader className="shrink-0 border-b bg-secondary/35 p-6 pr-14">
          <DialogTitle className="text-xl">
            ¿Aprobar y publicar este plan?
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {review.description} El paciente podrá verlo y ya no se podrá
            editar.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {has_details ? (
            <details className="group rounded-2xl border bg-background p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Ver
                detalles de la revisión
                <span className="ml-auto text-xs text-muted-foreground group-open:hidden">
                  Expandir
                </span>
              </summary>
              <div className="mt-4 space-y-5 border-t pt-4 text-sm">
                {review.missing.length > 0 && (
                  <section>
                    <h3 className="font-semibold">
                      Momentos sin comidas ({review.missing.length})
                    </h3>
                    <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
                      {review.missing.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {review.outside.length > 0 && (
                  <section>
                    <h3 className="font-semibold">
                      Comidas fuera de la grilla
                    </h3>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {review.outside.map((item) => (
                        <li
                          key={item.id_planificacion_receta}
                          className="break-words"
                        >
                          • {item.receta.nombre}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {review.unverified.length > 0 && (
                  <section>
                    <h3 className="font-semibold">Información sin verificar</h3>
                    <ul className="mt-2 space-y-2 text-muted-foreground">
                      {review.unverified.map((item, index) => (
                        <li key={`${index}-${item}`} className="break-words">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </details>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary" /> La grilla
              semanal está completa.
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t bg-background p-4 sm:p-6">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button disabled={busy} onClick={onConfirm}>
            {busy ? "Publicando…" : "Aprobar y publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
