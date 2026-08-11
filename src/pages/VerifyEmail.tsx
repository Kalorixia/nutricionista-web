import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

export default function VerifyEmail() {
  const { verifyEmail, resendCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const stateEmail = (location.state as { email?: string } | null)?.email
  const [email, setEmail] = useState(stateEmail ?? "")
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await verifyEmail(email, codigo)
      navigate("/", { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Código inválido o expirado"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError("Ingresá tu email para reenviar el código")
      return
    }
    setError(null)
    setInfo(null)
    setResending(true)
    try {
      await resendCode(email)
      setInfo("Si la cuenta existe, enviamos un nuevo código.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el código")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4">
      <div className="card-shadow w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Verificá tu email
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Te enviamos un código de 6 dígitos a tu correo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código de verificación</Label>
            <Input
              id="codigo"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              className="text-center tracking-[0.5em]"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}

          <Button
            type="submit"
            disabled={loading || codigo.length !== 6}
            className="w-full"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verificar
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={resending}
            onClick={handleResend}
            className="w-full"
          >
            {resending && <Loader2 className="size-4 animate-spin" />}
            Reenviar código
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
