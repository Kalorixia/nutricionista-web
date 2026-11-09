import { describe, expect, it } from "vitest"
import { formatDateTime } from "@/utils/format"

function iso_local(hora: number, minutos: number): string {
  return new Date(2026, 10, 9, hora, minutos, 44).toISOString()
}

describe("formatDateTime", () => {
  it("muestra la tarde en formato de 24 horas", () => {
    expect(formatDateTime(iso_local(15, 17))).toBe("9/11/2026, 15:17:44")
  })

  it("muestra la medianoche como 00", () => {
    expect(formatDateTime(iso_local(0, 5))).toBe("9/11/2026, 00:05:44")
  })
})
