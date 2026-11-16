import { describe, expect, it } from "vitest"
import {
  PASSWORD_MAX_LENGTH_MESSAGE,
  validar_password_nueva,
} from "@/utils/password"

describe("validar_password_nueva", () => {
  it("exige 8 caracteres como mínimo", () => {
    expect(validar_password_nueva("abc123", "abc123")).toBe(
      "La contraseña debe tener al menos 8 caracteres"
    )
  })

  it("rechaza más de 72 caracteres", () => {
    const larga = "a1".repeat(37)
    expect(validar_password_nueva(larga, larga)).toBe(
      PASSWORD_MAX_LENGTH_MESSAGE
    )
  })

  it("exige una letra", () => {
    expect(validar_password_nueva("12345678", "12345678")).toBe(
      "La contraseña debe incluir al menos una letra"
    )
  })

  it("exige un número", () => {
    expect(validar_password_nueva("abcdefgh", "abcdefgh")).toBe(
      "La contraseña debe incluir al menos un número"
    )
  })

  it("exige que coincidan", () => {
    expect(validar_password_nueva("abcdefg1", "abcdefg2")).toBe(
      "Las contraseñas no coinciden"
    )
  })

  it("devuelve null con una contraseña válida", () => {
    expect(validar_password_nueva("abcdefg1", "abcdefg1")).toBeNull()
  })
})
