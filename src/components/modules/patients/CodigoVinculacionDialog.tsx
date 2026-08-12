import QRCode from "react-qr-code"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/utils/format"
import type { CodigoVinculacion } from "@/types/patient"

interface Props {
  codigo: CodigoVinculacion | null
  onClose: () => void
}

export default function CodigoVinculacionDialog({ codigo, onClose }: Props) {
  const handleCopiar = async () => {
    if (!codigo) return
    await navigator.clipboard.writeText(codigo.codigo)
    toast.success("Código copiado")
  }

  return (
    <Dialog open={!!codigo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Código de vinculación</DialogTitle>
          <DialogDescription>
            El paciente lo escanea desde la app para vincularse a tu perfil.
          </DialogDescription>
        </DialogHeader>

        {codigo && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <QRCode value={codigo.codigo} size={180} />
            </div>

            <div className="w-full space-y-1.5 text-center">
              <p className="text-xs text-muted-foreground">
                O cargalo a mano:
              </p>
              <p className="font-mono text-2xl tracking-widest">
                {codigo.codigo}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Vence el {formatDate(codigo.fecha_expiracion)}
            </p>

            <Button onClick={handleCopiar} variant="outline" className="w-full gap-1.5">
              <Copy className="h-4 w-4" /> Copiar código
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
