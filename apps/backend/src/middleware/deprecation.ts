import { Request, Response, NextFunction } from 'express'

const DEPRECATION_DATE = 'Sat, 01 Jan 2027 00:00:00 GMT'
const SUCCESSOR_VERSION = '/api/v1'

export function deprecationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.set({
    'Deprecation': 'true',
    'Sunset': DEPRECATION_DATE,
    'Link': `<${SUCCESSOR_VERSION}>; rel="successor-version"`,
    'X-API-Version': 'v1 (deprecated)'
  })
  next()
}

export function addVersionHeader(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.set('API-Version', 'v1')
  next()
}

export const API_VERSION = 'v1'
export const DEPRECATION_SUNSET = DEPRECATION_DATE
