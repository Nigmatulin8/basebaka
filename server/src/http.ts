import type { IncomingMessage, ServerResponse } from 'node:http'

function applyCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  applyCors(res)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

export function sendOptions(res: ServerResponse) {
  applyCors(res)
  res.writeHead(204)
  res.end()
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }

  if (chunks.length === 0) {
    return null
  }

  const text = Buffer.concat(chunks).toString('utf8')
  if (text.length > 256_000) {
    throw new Error('Request body too large')
  }

  return JSON.parse(text) as unknown
}
