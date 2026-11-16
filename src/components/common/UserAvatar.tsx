import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { iniciales } from "@/utils/planes"

interface UserAvatarProps {
  nombre: string
  apellido?: string | null
  fotoUrl?: string | null
  className?: string
  /**
   * Con foto, tocarla la abre en grande. No va dentro de otro botón o link
   * (por eso el menú lateral no lo usa). Sin foto no hace nada.
   */
  ampliable?: boolean
}

/** Foto de perfil, o las iniciales si no hay foto o falla al cargar. */
export default function UserAvatar({
  nombre,
  apellido,
  fotoUrl,
  className,
  ampliable = false,
}: UserAvatarProps) {
  const [abierta, setAbierta] = useState(false)
  const texto = `${nombre} ${apellido ?? ""}`.trim()
  const avatar = (
    <Avatar className={className}>
      {fotoUrl && <AvatarImage src={fotoUrl} alt={texto} />}
      <AvatarFallback className="bg-primary/15 font-semibold text-primary">
        {iniciales(texto)}
      </AvatarFallback>
    </Avatar>
  )

  if (!ampliable || !fotoUrl) return avatar

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label={`Ver la foto de ${texto}`}
        className="cursor-zoom-in rounded-full transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {avatar}
      </button>
      <Dialog open={abierta} onOpenChange={setAbierta}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>{texto}</DialogTitle>
          <img
            src={fotoUrl}
            alt={`Foto de ${texto}`}
            className="max-h-[70vh] w-full rounded-2xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
