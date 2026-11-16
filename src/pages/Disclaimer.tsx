import { useState, type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import KalorixiaLoader from "@/components/common/KalorixiaLoader"
import DisclaimerBody from "@/components/modules/disclaimer/DisclaimerBody"
import { useDisclaimer } from "@/hooks/use-disclaimer"
import { useConfirmedSignOut } from "@/hooks/use-confirmed-sign-out"
import { ApiError } from "@/services/http"

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card-shadow w-full max-w-2xl rounded-2xl border border-border bg-card p-8">
        {children}
      </div>
    </div>
  )
}

export default function Disclaimer() {
  const { disclaimer, status, errorMessage, reload, accept } = useDisclaimer()
  const handleSignOut = useConfirmedSignOut()
  const location = useLocation()
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (status === "loading") {
    return (
      <Frame>
        <div className="flex justify-center">
          <KalorixiaLoader />
        </div>
      </Frame>
    )
  }

  if (status === "error" || !disclaimer) {
    return (
      <Frame>
        <div className="text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">
            No pudimos cargar el aviso médico
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No pudimos cargar el aviso médico. Sin aceptarlo no se puede usar el
            portal.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
          )}
          <Button onClick={() => void reload()} className="mt-6 w-full">
            Reintentar
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="mt-2 w-full gap-1.5"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </Frame>
    )
  }

  if (disclaimer.aceptado) {
    const from = (location.state as { from?: { pathname: string } } | null)
      ?.from
    const destino =
      from && from.pathname !== "/disclaimer" ? from.pathname : "/"
    return <Navigate to={destino} replace />
  }

  const handleAccept = async () => {
    setSubmitting(true)
    try {
      await accept(disclaimer.version)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          "Se publicó una versión nueva del aviso. Leela antes de aceptar."
        )
        setChecked(false)
      } else {
        toast.error(error instanceof Error ? error.message : "Ocurrió un error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Frame>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {disclaimer.titulo}
      </h1>

      <div className="mt-4 max-h-[50vh] overflow-y-auto pr-1">
        <DisclaimerBody cuerpo={disclaimer.cuerpo} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Checkbox
          id="disclaimer-acepto"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <Label htmlFor="disclaimer-acepto">
          Leí y acepto estas condiciones.
        </Label>
      </div>

      <Button
        onClick={handleAccept}
        disabled={!checked || submitting}
        className="mt-4 w-full gap-1.5"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Aceptar y continuar
      </Button>
      <Button
        variant="ghost"
        onClick={handleSignOut}
        className="mt-2 w-full gap-1.5"
      >
        <LogOut className="size-4" /> Cerrar sesión
      </Button>
    </Frame>
  )
}
