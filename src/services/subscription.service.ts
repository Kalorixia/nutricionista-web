import { authedFetch } from "@/services/http"
import type { MiSuscripcion } from "@/types/subscription"

export const subscriptionService = {
  getMine(): Promise<MiSuscripcion> {
    return authedFetch<MiSuscripcion>("/nutricionistas/me/suscripcion")
  },
}
