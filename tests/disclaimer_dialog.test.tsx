import { expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import DisclaimerDialog from "@/components/modules/disclaimer/DisclaimerDialog"
import { formatDateTime } from "@/utils/format"
import type { Disclaimer } from "@/types/disclaimer"

const FECHA = "2026-11-16T15:17:00Z"

const base: Disclaimer = {
  rol: "nutricionista",
  version: 1,
  titulo: "Antes de empezar",
  cuerpo: "Intro con **negrita**.\n\n* Primera\n* Segunda",
  vigente_desde: FECHA,
  aceptado: true,
  fecha_aceptacion: FECHA,
}

it("muestra título, versión, fecha, viñetas y negritas, sin casilla", () => {
  render(<DisclaimerDialog disclaimer={base} open onOpenChange={() => {}} />)

  expect(screen.getByText("Antes de empezar")).toBeTruthy()
  expect(
    screen.getByText(`Versión 1 · aceptada el ${formatDateTime(FECHA)}`)
  ).toBeTruthy()
  expect(screen.getAllByRole("listitem")).toHaveLength(2)
  expect(screen.getByText("negrita").tagName).toBe("STRONG")
  expect(screen.queryByRole("checkbox")).toBeNull()
})

it("un cuerpo con <script> se muestra como texto", () => {
  render(
    <DisclaimerDialog
      disclaimer={{ ...base, cuerpo: "<script>alert(1)</script>" }}
      open
      onOpenChange={() => {}}
    />
  )
  expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy()
  expect(document.querySelector("script")).toBeNull()
})
