import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const resuelto =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  const etiqueta =
    resuelto === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={etiqueta}
      title={etiqueta}
      onClick={() => setTheme(resuelto === "dark" ? "light" : "dark")}
      className="rounded-full text-muted-foreground"
    >
      {resuelto === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
