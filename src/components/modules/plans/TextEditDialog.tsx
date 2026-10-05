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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Edición de un texto del plan que lee el paciente: las indicaciones generales
 * o la nota de una comida (KAL-132-02). Se monta abierto; vacío borra.
 */
export function TextEditDialog({
  titulo,
  etiqueta,
  ayuda,
  inicial,
  maximo,
  busy,
  onClose,
  onSave,
}: {
  titulo: string
  etiqueta: string
  ayuda?: string
  inicial: string
  maximo: number
  busy: boolean
  onClose: () => void
  onSave: (texto: string) => void
}) {
  const [texto, set_texto] = useState(inicial)
  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            onSave(texto.trim())
          }}
        >
          <div>
            <Label htmlFor="texto-plan">{etiqueta}</Label>
            <Textarea
              id="texto-plan"
              className="min-h-28"
              maxLength={maximo}
              value={texto}
              disabled={busy}
              onChange={(event) => set_texto(event.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {ayuda ? `${ayuda} ` : ""}Lo ve el paciente. Vacío lo borra.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
