import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as jwt from 'jsonwebtoken'

export const getSecret = () => process.env.SECRET_KEY || 'change-this-secret-in-prod'

export function signToken(payload: object) {
  return jwt.sign(payload, getSecret(), { expiresIn: '8h' })
}

export function verifyAuth(req: VercelRequest, res: VercelResponse): { id: string; email: string } | null {
  const auth = req.headers['authorization']
  if (!auth) {
    res.status(401).json({ message: 'Token não fornecido' })
    return null
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(' ')[1]
  try {
    const decoded = jwt.verify(token, getSecret()) as any
    return decoded
  } catch {
    res.status(403).json({ message: 'Token inválido' })
    return null
  }
}

