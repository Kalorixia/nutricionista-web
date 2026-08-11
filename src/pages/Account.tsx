import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/authService"
import { nutritionistService } from "@/services/nutritionist.service"
import type { EstadoMatriculaDetalle } from "@/types/auth"
import { getSessionToken } from "@/services/session"

const ESTADO_LABEL: Record<EstadoMatriculaDetalle["estado"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
}

export default function Account() {
  const { user } = useAuth()
  const [detalle, setDetalle] = useState<EstadoMatriculaDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(true)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    nutritionistService
      .estadoMatricula()
      .then((result) => {
        if (!cancelled) setDetalle(result)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDetalle(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    const token = getSessionToken()
    if (!token) return
    setSaving(true)
    try {
      await authService.changePassword(token, currentPassword, newPassword)
      toast.success("Contraseña actualizada")
      setCurrentPassword("")
      setNewPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Mi cuenta
        </h1>
        <p className="text-muted-foreground">
          Datos de tu perfil profesional y credenciales de acceso.
        </p>
      </div>

      <Card className="space-y-3 p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nombre</span>
          <span className="font-medium">
            {user?.nombre} {user?.apellido}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{user?.email}</span>
        </div>
        {loadingDetalle ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          detalle && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Matrícula</span>
                <span className="font-medium">{detalle.matricula}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge
                  variant={
                    detalle.estado === "aprobada"
                      ? "default"
                      : detalle.estado === "rechazada"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {ESTADO_LABEL[detalle.estado]}
                </Badge>
              </div>
            </>
          )
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-heading text-lg font-semibold">
          Cambiar contraseña
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Contraseña nueva</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Actualizar contraseña
          </Button>
        </form>
      </Card>
    </div>
  )
}
