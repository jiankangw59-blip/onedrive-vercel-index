import type { NextApiRequest, NextApiResponse } from 'next'

import { pingOdAuthStorage } from '../../../utils/odAuthTokenStore'

type ResponseBody = { ok: true } | { error: string }

/**
 * Vercel Cron entry point. A successful PING keeps a Redis Cloud database active
 * without reading or changing the stored OAuth tokens.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  res.setHeader('Cache-Control', 'no-store')

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized.' })
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  try {
    await pingOdAuthStorage()
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Redis keepalive failed:', error instanceof Error ? error.message : 'unknown error')
    res.status(503).json({ error: 'Redis storage is unavailable.' })
  }
}
