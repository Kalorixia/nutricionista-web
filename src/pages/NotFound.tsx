import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-heading text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">Esta página no existe.</p>
      <Button render={<Link to="/" />}>Volver al inicio</Button>
    </div>
  )
}
