export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR")
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR")
}
