// MOCK — ver services/mocks/subscription.mock.ts.
import { mySubscription, subscriptionPlans } from "@/services/mocks/subscription.mock"
import { delay } from "@/services/mockUtils"
import type { Subscription, SubscriptionPlanOption } from "@/types/subscription"

export const subscriptionService = {
  async listPlans(): Promise<SubscriptionPlanOption[]> {
    return delay([...subscriptionPlans])
  },

  async getMySubscription(): Promise<Subscription> {
    return delay({ ...mySubscription })
  },

  async subscribe(planId: string): Promise<Subscription> {
    mySubscription.plan_id = planId
    mySubscription.activa = true
    mySubscription.fecha_inicio = new Date().toISOString()
    return delay({ ...mySubscription })
  },

  async toggleAutoRenew(): Promise<Subscription> {
    mySubscription.auto_renueva = !mySubscription.auto_renueva
    return delay({ ...mySubscription }, 50)
  },
}
