import http from "node:http"
import https from "node:https"

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

export default function handler(request, response) {
  const backendOrigin = process.env.BACKEND_ORIGIN

  if (!backendOrigin) {
    response.statusCode = 500
    response.end("BACKEND_ORIGIN is not configured")
    return
  }

  let target
  try {
    const origin = new URL(backendOrigin)
    if (origin.protocol !== "http:" && origin.protocol !== "https:") {
      throw new Error("Unsupported protocol")
    }

    const incomingUrl = new URL(request.url, "http://vercel.internal")
    const pathValue = incomingUrl.searchParams.get("path")
    if (!pathValue) {
      response.statusCode = 400
      response.end("Proxy path is missing")
      return
    }

    incomingUrl.searchParams.delete("path")
    const normalizedPath = pathValue.replace(/^\/+/, "")
    target = new URL(`/api/${normalizedPath}`, origin)
    target.search = incomingUrl.searchParams.toString()
  } catch {
    response.statusCode = 500
    response.end("BACKEND_ORIGIN is invalid")
    return
  }

  const headers = { ...request.headers, host: target.host }
  for (const header of HOP_BY_HOP_HEADERS) {
    delete headers[header]
  }

  const transport = target.protocol === "https:" ? https : http
  const proxyRequest = transport.request(
    target,
    {
      method: request.method,
      headers,
    },
    (proxyResponse) => {
      response.statusCode = proxyResponse.statusCode ?? 502

      for (const [name, value] of Object.entries(proxyResponse.headers)) {
        if (
          value !== undefined &&
          !HOP_BY_HOP_HEADERS.has(name.toLowerCase())
        ) {
          response.setHeader(name, value)
        }
      }

      proxyResponse.pipe(response)
    }
  )

  proxyRequest.on("error", () => {
    if (!response.headersSent) {
      response.statusCode = 502
    }
    response.end("The backend is unavailable")
  })

  request.pipe(proxyRequest)
}
