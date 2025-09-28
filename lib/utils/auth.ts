import { NextRequest } from 'next/server';

export function requireUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    throw new Error('UNAUTHENTICATED');
  }
  return userId;
}
