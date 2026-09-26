import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  BookOpen,
  ListChecks,
  Crown,
  HelpCircle,
  ChevronDown,
  Leaf,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useConfirmedSignOut } from "@/hooks/use-confirmed-sign-out"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, end: true },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Planificación", url: "/planificacion", icon: CalendarRange },
  { title: "Recetas", url: "/recetas", icon: BookOpen },
  { title: "Listas", url: "/listas", icon: ListChecks },
  { title: "Suscripción", url: "/suscripcion", icon: Crown },
]

export default function ProSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const { pathname } = useLocation()
  const { user } = useAuth()
  const handleSignOut = useConfirmedSignOut()
  const greetingName = user?.nombre?.trim() || "Nutricionista"
  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/")

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-background">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
            <Leaf className="h-5 w-5" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <h2 className="font-heading text-lg leading-none font-bold text-foreground">
              Kalorixia{" "}
              <span className="font-normal text-muted-foreground">Pro</span>
            </h2>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && (
            <p className="mb-1 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Portal del nutricionista
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = isActive(it.url, it.end)
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton
                      render={
                        <NavLink
                          to={it.url}
                          end={it.end}
                          className={`flex items-center gap-3 px-3 ${
                            active
                              ? "font-semibold text-primary"
                              : "text-foreground/70"
                          }`}
                        />
                      }
                      isActive={active}
                      className="h-10 rounded-lg"
                    >
                      <it.icon className="h-4 w-4" />
                      {!collapsed && <span>{it.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-border/60 bg-background p-3">
        <button className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50">
          <HelpCircle className="h-4 w-4" />
          {!collapsed && <span>Ayuda y Soporte</span>}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {greetingName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <span className="flex-1 truncate text-left text-sm font-medium text-foreground">
                  {greetingName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem render={<NavLink to="/cuenta" />}>
              Mi cuenta
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive"
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
