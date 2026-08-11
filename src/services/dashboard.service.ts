// La actividad reciente es MOCK (services/mocks/dashboard.mock.ts); los
// conteos de pacientes se piden aparte, a la API real, desde Dashboard.tsx.
import { activityItems, type ActivityItem } from "@/services/mocks/dashboard.mock"
import { delay } from "@/services/mockUtils"

export const dashboardService = {
  async recentActivity(): Promise<ActivityItem[]> {
    return delay(activityItems)
  },
}
