import { authedFetch } from "@/services/http"
import type { Disclaimer } from "@/types/disclaimer"

export const disclaimerService = {
  obtener() {
    return authedFetch<Disclaimer>("/disclaimer")
  },

  aceptar(version: number) {
    return authedFetch<Disclaimer>("/disclaimer/aceptacion", {
      method: "POST",
      body: { version },
    })
  },
}
