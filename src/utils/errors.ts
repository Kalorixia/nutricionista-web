import { ApiError } from "@/services/http"

/**
 * El backend devuelve 501 + "Funcionalidad en desarrollo" para los
 * endpoints cuyo contrato ya está definido pero la lógica todavía no se
 * implementó (ver app/main.py del backend). Se distingue de un error real
 * para no alarmar con un mensaje destructivo por algo esperado.
 */
export function isNotImplemented(error: unknown): boolean {
  return error instanceof ApiError && error.status === 501
}
