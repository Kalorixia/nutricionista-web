import { apiFetch, authedFetch } from "@/services/http"
import type { SessionResponse, UsuarioActual } from "@/types/auth"

export interface RegistroNutricionistaInput {
  email: string
  password: string
  nombre: string
  apellido: string
  matricula: string
  descripcion?: string
  especialidades: number[]
}

export const authService = {
  login(email: string, password: string) {
    return apiFetch<SessionResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
  },

  register(input: RegistroNutricionistaInput) {
    return apiFetch<{ message: string }>("/auth/register/nutricionista", {
      method: "POST",
      body: input,
    })
  },

  verifyEmail(email: string, codigo: string) {
    return apiFetch<SessionResponse>("/auth/verify-email", {
      method: "POST",
      body: { email, codigo },
    })
  },

  resendCode(email: string) {
    return apiFetch<{ message: string }>("/auth/resend-code", {
      method: "POST",
      body: { email },
    })
  },

  forgotPassword(email: string) {
    return apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    })
  },

  resetPassword(
    email: string,
    codigo: string,
    newPassword: string,
    newPasswordConfirmation: string
  ) {
    return apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: {
        email,
        codigo,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      },
    })
  },

  refresh(refreshToken: string) {
    return apiFetch<SessionResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
    })
  },

  logout(accessToken: string) {
    return apiFetch<void>("/auth/logout", {
      method: "POST",
      token: accessToken,
    })
  },

  changePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string
  ) {
    return apiFetch<{ message: string }>("/auth/change-password", {
      method: "POST",
      token: accessToken,
      body: { current_password: currentPassword, new_password: newPassword },
    })
  },

  me(accessToken: string) {
    return apiFetch<UsuarioActual>("/auth/me", {
      method: "GET",
      token: accessToken,
    })
  },

  meAuthed() {
    return authedFetch<UsuarioActual>("/auth/me")
  },
}
