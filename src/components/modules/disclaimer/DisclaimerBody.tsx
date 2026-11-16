import { parseDisclaimerBody, type Segment } from "@/utils/disclaimer_markdown"

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.bold ? (
          <strong key={index} className="font-semibold text-foreground">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  )
}

/** Elementos React, nunca HTML crudo: el texto del servidor queda escapado. */
export default function DisclaimerBody({ cuerpo }: { cuerpo: string }) {
  const blocks = parseDisclaimerBody(cuerpo)
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      {blocks.map((block, index) =>
        block.type === "paragraph" ? (
          <p key={index}>
            <Segments segments={block.segments} />
          </p>
        ) : (
          <ul key={index} className="list-disc space-y-2 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Segments segments={item} />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
