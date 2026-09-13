import { Outlet, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import ProSidebar from "@/components/modules/layout/ProSidebar"
import { GenerationsIndicator } from "@/components/modules/plans/GenerationsIndicator"
import { useAuth } from "@/hooks/use-auth"
import { GenerationsProvider } from "@/hooks/use-generations"

export default function ProLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    // El seguimiento de generaciones vive acá y no en App: consulta un endpoint
    // que exige nutricionista aprobado, así que no debe correr en el login.
    <GenerationsProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <ProSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur">
              <SidebarTrigger />
              <div className="min-w-0 flex-1">
                <GenerationsIndicator />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSignOut}
                className="gap-1.5 rounded-full text-muted-foreground"
              >
                <LogOut className="h-4 w-4" /> Salir
              </Button>
            </header>
            <main className="flex-1 p-6 md:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </GenerationsProvider>
  )
}
