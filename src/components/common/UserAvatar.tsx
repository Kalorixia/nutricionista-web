import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { iniciales } from "@/utils/planes"

interface UserAvatarProps {
  nombre: string
  apellido?: string | null
  fotoUrl?: string | null
  className?: string
}

/** Foto de perfil, o las iniciales si no hay foto o falla al cargar. */
export default function UserAvatar({
  nombre,
  apellido,
  fotoUrl,
  className,
}: UserAvatarProps) {
  const texto = `${nombre} ${apellido ?? ""}`.trim()
  return (
    <Avatar className={className}>
      {fotoUrl && <AvatarImage src={fotoUrl} alt={texto} />}
      <AvatarFallback className="bg-primary/15 font-semibold text-primary">
        {iniciales(texto)}
      </AvatarFallback>
    </Avatar>
  )
}
