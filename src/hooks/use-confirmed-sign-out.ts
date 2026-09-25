import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { useAuth } from "@/hooks/use-auth"

/**
 * Cierre de sesión iniciado por el usuario: pide confirmación antes de
 * cerrar la sesión y volver al login. Los tres botones de salida del portal
 * pasan por acá para que ninguno cierre la sesión sin preguntar.
 */
export function useConfirmedSignOut() {
  const { signOut } = useAuth()
  const confirm = useConfirm()
  const navigate = useNavigate()

  return useCallback(async () => {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      description: "Vas a tener que volver a ingresar para usar el portal.",
      confirmText: "Cerrar sesión",
    })
    if (!ok) return
    await signOut()
    navigate("/login", { replace: true })
  }, [confirm, signOut, navigate])
}
