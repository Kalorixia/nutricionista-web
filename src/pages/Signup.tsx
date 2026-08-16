import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/use-auth"
import { nutritionistService } from "@/services/nutritionist.service"
import type { Especialidad } from "@/types/auth"

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [matricula, setMatricula] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<
    number[]
  >([])

  const [loadingCatalogo, setLoadingCatalogo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    nutritionistService
      .catalogosRegistro()
      .then(({ especialidades }) => {
        if (!cancelled) setEspecialidades(especialidades)
      })
      .catch(() => {
        // El formulario sigue funcionando sin catálogo: las especialidades
        // quedan vacías y se pueden completar más adelante desde la cuenta.
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalogo(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleEspecialidad = (id: number) => {
    setSelectedEspecialidades((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)
    try {
      await signUp({
        email,
        password,
        nombre,
        apellido,
        matricula,
        descripcion: descripcion.trim() || undefined,
        especialidades: selectedEspecialidades,
      })
      navigate("/verificar-email", { state: { email } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card-shadow w-full max-w-lg rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Kalorixia{" "}
            <span className="font-normal text-muted-foreground">
              Nutricionistas
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu cuenta profesional. Un administrador va a revisar tu
            matrícula antes de habilitarte el acceso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-confirm">Repetir contraseña</Label>
              <Input
                id="password-confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="matricula">Matrícula profesional</Label>
            <Input
              id="matricula"
              required
              placeholder="Ej: MN123456"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
          </div>

          {!loadingCatalogo && especialidades.length > 0 && (
            <div className="space-y-1.5">
              <Label>Especialidades</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
                {especialidades.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedEspecialidades.includes(item.id)}
                      onCheckedChange={() => toggleEspecialidad(item.id)}
                    />
                    {item.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">
              Descripción profesional (opcional)
            </Label>
            <Textarea
              id="descripcion"
              className="min-h-[80px]"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
