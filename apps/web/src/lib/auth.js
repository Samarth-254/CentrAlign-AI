import { cookies } from 'next/headers';

/**
 * Check if portal user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isPortalAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('portal_session');
  return !!session?.value;
}

/**
 * Check if ERP user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isErpAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('erp_session');
  return !!session?.value;
}
