// El backend acepta contraseñas de 8 a 72 caracteres (Field(max_length=72) en
// registro y en change-password). Se valida acá para no mandar un dato que el
// servidor rechaza con un 422 genérico.
export const PASSWORD_MAX_LENGTH = 72
export const PASSWORD_MAX_LENGTH_MESSAGE = `La contraseña debe tener como máximo ${PASSWORD_MAX_LENGTH} caracteres`
