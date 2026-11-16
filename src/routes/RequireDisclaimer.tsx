import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useDisclaimer } from "@/hooks/use-disclaimer"
import KalorixiaLoader from "@/components/common/KalorixiaLoader"

/**
 * Deja pasar solo a quien aceptó el disclaimer vigente. Cualquier otro caso,
 * incluido un error al consultarlo, va a /disclaimer (fail-closed).
 */
export default function RequireDisclaimer() {
  const { disclaimer, status } = useDisclaimer()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <KalorixiaLoader />
      </div>
    )
  }

  if (status !== "ready" || !disclaimer?.aceptado) {
    return <Navigate to="/disclaimer" replace state={{ from: location }} />
  }

  return <Outlet />
}
