// El backend acepta contraseñas de 8 a 72 caracteres (Field(max_length=72) en
// registro y en change-password). Se valida acá para no mandar un dato que el
// servidor rechaza con un 422 genérico.
export const PASSWORD_MAX_LENGTH = 72
export const PASSWORD_MAX_LENGTH_MESSAGE = `La contraseña debe tener como máximo ${PASSWORD_MAX_LENGTH} caracteres`

// Misma validación que aplica el servidor en /auth/reset-password: un 422 con
// `detail` en lista no se puede mostrar como mensaje.
export function validar_password_nueva(
  password: string,
  confirmacion: string
): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres"
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return PASSWORD_MAX_LENGTH_MESSAGE
  }
  if (!/[A-Za-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra"
  }
  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un número"
  }
  if (password !== confirmacion) {
    return "Las contraseñas no coinciden"
  }
  return null
}
