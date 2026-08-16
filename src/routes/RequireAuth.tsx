import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import KalorixiaLoader from "@/components/common/KalorixiaLoader"

export default function RequireAuth() {
  const { user, isNutritionist, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <KalorixiaLoader />
      </div>
    )
  }

  if (!user || !isNutritionist) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
