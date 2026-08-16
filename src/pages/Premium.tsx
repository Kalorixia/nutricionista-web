import { useEffect, useState } from "react"
import { Check, Crown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { subscriptionService } from "@/services/subscription.service"
import type { Subscription, SubscriptionPlanOption } from "@/types/subscription"

function UsageBar({
  label,
  used,
  max,
}: {
  label: string
  used: number
  max: number
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {used} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Premium() {
  const [plans, setPlans] = useState<SubscriptionPlanOption[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      subscriptionService.listPlans(),
      subscriptionService.getMySubscription(),
    ]).then(([plans, subscription]) => {
      setPlans(plans)
      setSubscription(subscription)
      setLoading(false)
    })
  }, [])

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId)
    try {
      const updated = await subscriptionService.subscribe(planId)
      setSubscription(updated)
      toast.success("Suscripción actualizada")
    } finally {
      setSubscribing(null)
    }
  }

  const handleToggleAutoRenew = async () => {
    const updated = await subscriptionService.toggleAutoRenew()
    setSubscription(updated)
  }

  if (loading || !subscription) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  const currentPlan = plans.find((p) => p.id === subscription.plan_id)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Suscripción
        </h1>
        <p className="text-muted-foreground">
          Administrá tu plan y el uso de pacientes y generaciones con IA.
        </p>
      </div>

      {currentPlan && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="font-heading text-lg font-semibold">
                Plan {currentPlan.nombre}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-renew" className="text-sm text-muted-foreground">
                Renovación automática
              </Label>
              <Switch
                id="auto-renew"
                checked={subscription.auto_renueva}
                onCheckedChange={handleToggleAutoRenew}
              />
            </div>
          </div>
          <UsageBar
            label="Pacientes"
            used={subscription.pacientes_usados}
            max={currentPlan.max_pacientes}
          />
          <UsageBar
            label="Generaciones con IA este mes"
            used={subscription.ai_usado}
            max={currentPlan.ai_limit}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === subscription.plan_id
          return (
            <Card key={plan.id} className="flex flex-col gap-3 p-5">
              <h3 className="font-heading text-lg font-semibold">
                {plan.nombre}
              </h3>
              <p className="text-2xl font-bold">
                {plan.precio_mensual === 0
                  ? "Gratis"
                  : `$${plan.precio_mensual.toLocaleString("es-AR")}/mes`}
              </p>
              <ul className="flex-1 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> Hasta{" "}
                  {plan.max_pacientes} pacientes
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> {plan.ai_limit}{" "}
                  generaciones con IA/mes
                </li>
              </ul>
              <Button
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || subscribing === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {subscribing === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Plan actual"
                ) : (
                  "Suscribirme"
                )}
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
