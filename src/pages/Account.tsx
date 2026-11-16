import { useEffect, useRef, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UserAvatar from "@/components/common/UserAvatar"
import { useConfirm } from "@/components/common/ConfirmDialog"
import { PasswordInput } from "@/components/common/PasswordInput"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useDisclaimer } from "@/hooks/use-disclaimer"
import MyPlanCard from "@/components/modules/account/MyPlanCard"
import DisclaimerDialog from "@/components/modules/disclaimer/DisclaimerDialog"
import { formatDateTime } from "@/utils/format"
import { authService } from "@/services/authService"
import { nutritionistService } from "@/services/nutritionist.service"
import type { EstadoMatriculaDetalle } from "@/types/auth"
import { getSessionToken } from "@/services/session"
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
} from "@/utils/password"

const ESTADO_LABEL: Record<EstadoMatriculaDetalle["estado"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
}

export default function Account() {
  const { user, refreshMe } = useAuth()
  const confirm = useConfirm()
  const fileInput = useRef<HTMLInputElement>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const { disclaimer } = useDisclaimer()
  const [leyendo, setLeyendo] = useState(false)
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
    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      toast.error(PASSWORD_MAX_LENGTH_MESSAGE)
      return
    }
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

  const handleFoto = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = ""
    if (!file) return
    setSubiendoFoto(true)
    try {
      await nutritionistService.subirFoto(file)
      await refreshMe()
      toast.success("Foto de perfil actualizada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleQuitarFoto = async () => {
    const ok = await confirm({
      title: "Quitar foto de perfil",
      description: "Se mostrarán tus iniciales en lugar de la foto.",
      confirmText: "Quitar",
    })
    if (!ok) return
    setSubiendoFoto(true)
    try {
      await nutritionistService.quitarFoto()
      await refreshMe()
      toast.success("Foto de perfil eliminada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSubiendoFoto(false)
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
        <div className="flex items-center gap-4 pb-2">
          <UserAvatar
            nombre={user?.nombre ?? ""}
            apellido={user?.apellido}
            fotoUrl={user?.foto_url}
            className="size-20 text-2xl"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png"
              hidden
              aria-label="Archivo de foto de perfil"
              onChange={(e) => void handleFoto(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              disabled={subiendoFoto}
              onClick={() => fileInput.current?.click()}
            >
              {subiendoFoto && <Loader2 className="h-4 w-4 animate-spin" />}
              {user?.foto_url ? "Cambiar foto" : "Subir foto"}
            </Button>
            {user?.foto_url && (
              <Button
                type="button"
                variant="ghost"
                disabled={subiendoFoto}
                onClick={() => void handleQuitarFoto()}
              >
                Quitar foto
              </Button>
            )}
          </div>
        </div>
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

      <MyPlanCard />

      {disclaimer && (
        <Card className="space-y-3 p-5 text-sm">
          <h2 className="font-heading text-lg font-semibold">Aviso médico</h2>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Texto</span>
            <span className="font-medium">Versión {disclaimer.version}</span>
          </div>
          {disclaimer.fecha_aceptacion && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aceptado el</span>
              <span className="font-medium">
                {formatDateTime(disclaimer.fecha_aceptacion)}
              </span>
            </div>
          )}
          <Button variant="outline" onClick={() => setLeyendo(true)}>
            Leer
          </Button>
          <DisclaimerDialog
            disclaimer={disclaimer}
            open={leyendo}
            onOpenChange={setLeyendo}
          />
        </Card>
      )}

      <Card className="space-y-4 p-5">
        <h2 className="font-heading text-lg font-semibold">
          Cambiar contraseña
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Contraseña nueva</Label>
            <PasswordInput
              id="new-password"
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
