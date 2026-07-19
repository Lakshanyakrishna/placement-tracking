import { request as pwRequest, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

export interface RawRole {
  role: string;
  scopeType: string;
  scopeId: string | null;
}

export interface RawEnrollment {
  id: string;
  academicPeriodId: string;
  branchId: string;
  sectionId: string;
  groupId?: string;
  batchId: string;
  rollNumber?: string;
}

export interface RawUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  mustChangePassword: boolean;
  roles: RawRole[];
  enrollment: RawEnrollment | null;
}

export interface FrontendUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isStudent: boolean;
  mustChangePassword: boolean;
  enrollment?: RawEnrollment;
}

export const API_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
export const FRONTEND_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

// Mirrors frontend/src/api/auth.api.ts's toUser() mapping exactly — the backend
// returns roles as {role, scopeType, scopeId}[] and a nullable enrollment object;
// the frontend flattens roles to string[] and derives isStudent from enrollment.
function toFrontendUser(raw: RawUser): FrontendUser {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    roles: raw.roles.map((r) => r.role),
    isStudent: raw.enrollment !== null,
    mustChangePassword: raw.mustChangePassword,
    enrollment: raw.enrollment ?? undefined,
  };
}

export interface LoginResult {
  accessToken: string;
  user: FrontendUser;
  rawUser: RawUser;
}

/** Calls POST /auth/login directly against the API — no UI involved. */
export async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<LoginResult> {
  const response = await request.post(`${API_URL}/auth/login`, { data: { email, password } });
  if (!response.ok()) {
    throw new Error(`apiLogin failed for ${email}: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  const { accessToken, user: rawUser } = body.data as { accessToken: string; user: RawUser };
  return { accessToken, user: toFrontendUser(rawUser), rawUser };
}

/** Calls POST /auth/change-password directly against the API — no UI involved. */
export async function apiChangePassword(
  request: APIRequestContext,
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await request.post(`${API_URL}/auth/change-password`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { currentPassword, newPassword },
  });
  if (!response.ok()) {
    throw new Error(`apiChangePassword failed: ${response.status()} ${await response.text()}`);
  }
}

type CookieState = Awaited<ReturnType<APIRequestContext['storageState']>>;

export interface PlaywrightStorageState {
  cookies: CookieState['cookies'];
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
}

/**
 * Logs in via the API and returns a Playwright storageState object that skips the
 * login UI entirely: loading a page with this storageState makes AuthContext read
 * the cached user from localStorage on mount, then call /auth/refresh using the
 * refresh_token cookie (captured here automatically by the request context) to
 * obtain a fresh in-memory access token — exactly what a real login would produce.
 *
 * IMPORTANT — refresh tokens rotate and are single-use (auth.service.ts's
 * `refresh()` immediately marks the token it just consumed as revoked). That means
 * a storageState object returned here is only good for exactly one browser context:
 * the first page load that triggers AuthContext's mount-time `/auth/refresh` call
 * consumes it. Never cache this in a file and reuse it across multiple contexts or
 * multiple tests — every context that needs to start authenticated must call
 * `authedContext()` (below) to get its own fresh login.
 */
export async function buildStorageState(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<PlaywrightStorageState> {
  const { user } = await apiLogin(request, email, password);
  const cookieState = await request.storageState();
  return {
    cookies: cookieState.cookies,
    origins: [
      {
        origin: FRONTEND_URL,
        localStorage: [{ name: 'auth_user', value: JSON.stringify(user) }],
      },
    ],
  };
}

/**
 * Logs in fresh via the API and returns a brand-new browser context + page already
 * authenticated as `email` — the one correct way to start a test "already logged
 * in" given single-use refresh tokens (see buildStorageState's doc comment). Call
 * this once per context you need; never share the result across multiple tests.
 * Caller is responsible for closing the returned context when done.
 */
export async function authedContext(
  browser: Browser,
  email: string,
  password: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const apiContext = await pwRequest.newContext();
  let storageState: PlaywrightStorageState;
  try {
    storageState = await buildStorageState(apiContext, email, password);
  } finally {
    await apiContext.dispose();
  }
  const context = await browser.newContext({ storageState, baseURL: FRONTEND_URL });
  const page = await context.newPage();
  return { context, page };
}

/** An explicitly logged-out storageState, for tests that must start unauthenticated. */
export const LOGGED_OUT_STATE: PlaywrightStorageState = { cookies: [], origins: [] };
