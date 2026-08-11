import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

/**
 * Se ubica dentro de RequireAuth: asume que ya hay sesión de nutricionista.
 * Si la matrícula todavía no fue aprobada por un administrador, redirige a
 * la pantalla de espera en vez de dejar entrar al resto del portal.
 */
export default function RequireApprovedNutritionist() {
  const { estadoMatricula } = useAuth()

  if (estadoMatricula !== "aprobada") {
    return <Navigate to="/pendiente" replace />
  }

  return <Outlet />
}
