import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  total: number
  limit: number
  offset: number
  onOffsetChange: (offset: number) => void
}

export default function Pagination({ total, limit, offset, onOffsetChange }: Props) {
  if (total <= limit) return null

  const desde = total === 0 ? 0 : offset + 1
  const hasta = Math.min(offset + limit, total)
  const canPrev = offset > 0
  const canNext = offset + limit < total

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Mostrando {desde}–{hasta} de {total}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canPrev}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          className="gap-1 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canNext}
          onClick={() => onOffsetChange(offset + limit)}
          className="gap-1 rounded-xl"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
