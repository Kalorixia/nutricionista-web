import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DisclaimerBody from "@/components/modules/disclaimer/DisclaimerBody"
import { formatDateTime } from "@/utils/format"
import type { Disclaimer } from "@/types/disclaimer"

interface Props {
  disclaimer: Disclaimer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Lectura del aviso ya aceptado: sin casilla ni acciones. */
export default function DisclaimerDialog({
  disclaimer,
  open,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open && !!disclaimer} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {disclaimer && (
          <>
            <DialogHeader>
              <DialogTitle>{disclaimer.titulo}</DialogTitle>
              <DialogDescription>
                Versión {disclaimer.version}
                {disclaimer.fecha_aceptacion &&
                  ` · aceptada el ${formatDateTime(disclaimer.fecha_aceptacion)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <DisclaimerBody cuerpo={disclaimer.cuerpo} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
