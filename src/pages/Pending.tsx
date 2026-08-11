import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock3, LogOut, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { nutritionistService } from "@/services/nutritionist.service"
import KalorixiaLoader from "@/components/common/KalorixiaLoader"
import type { EstadoMatriculaDetalle } from "@/types/auth"

export default function Pending() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [detalle, setDetalle] = useState<EstadoMatriculaDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    nutritionistService
      .estadoMatricula()
      .then((result) => {
        if (!cancelled) setDetalle(result)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const rechazada = detalle?.estado === "rechazada"

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4">
      <div className="card-shadow w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        {loading ? (
          <KalorixiaLoader />
        ) : (
          <>
            <div
              className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
                rechazada
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {rechazada ? (
                <XCircle className="size-7" />
              ) : (
                <Clock3 className="size-7" />
              )}
            </div>

            <h1 className="font-heading text-xl font-bold text-foreground">
              {rechazada
                ? "Tu solicitud fue rechazada"
                : "Tu cuenta está en revisión"}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {rechazada
                ? "Un administrador revisó tu matrícula y no pudo aprobarla."
                : "Un administrador está validando tu matrícula profesional. Te avisamos por email apenas se apruebe."}
            </p>

            {detalle?.matricula && (
              <p className="mt-4 text-xs text-muted-foreground">
                Matrícula: <span className="font-medium">{detalle.matricula}</span>
              </p>
            )}

            {rechazada && detalle?.observaciones && (
              <p className="mt-3 rounded-lg bg-destructive/5 p-3 text-left text-sm text-destructive">
                <span className="font-medium">Motivo: </span>
                {detalle.observaciones}
              </p>
            )}

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="mt-6 w-full gap-1.5"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
