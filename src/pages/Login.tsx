import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/"

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    // El formulario va con noValidate: la validación nativa del navegador
    // muestra sus mensajes en el idioma del navegador, no en el de la app.
    const emailEmpty = !email.trim()
    const passwordEmpty = !password.trim()
    if (emailEmpty && passwordEmpty) {
      setError("Completá el email y la contraseña")
      return
    }
    if (emailEmpty) {
      setError("Completá el email")
      return
    }
    if (passwordEmpty) {
      setError("Completá la contraseña")
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4">
      <div className="card-shadow w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Kalorixia{" "}
            <span className="font-normal text-muted-foreground">
              Nutricionistas
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá con tu cuenta profesional
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Ingresar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Todavía no tenés cuenta?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline"
          >
            Registrate como nutricionista
          </Link>
        </p>
      </div>
    </div>
  )
}
