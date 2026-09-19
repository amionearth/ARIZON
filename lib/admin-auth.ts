import { getSession } from '@/app/actions/auth';

export async function requireGovernmentSession() {
  const session = await getSession();
  if (!session || session.role !== 'gov') {
    return Response.json({ error: 'Government authorization required.' }, { status: 403 });
  }
  return null;
}
