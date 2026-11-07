import { projectId } from "@/sanity/env";

/**
 * Checks that a request comes from someone with a role on this Sanity project
 * (i.e. a Studio user). The Studio sends its login token as
 * `Authorization: Bearer <token>`; we ask Sanity who that token belongs to.
 *
 * Returns null when authorized, or a Response to send back otherwise.
 */
export async function requireStudioUser(request: Request): Promise<Response | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return Response.json({ error: "Please log in to the Studio." }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return Response.json({ error: "Couldn't verify your login." }, { status: 503 });
  }

  if (res.status === 401 || res.status === 403) {
    return Response.json({ error: "Your Studio login has expired." }, { status: 401 });
  }
  if (!res.ok) {
    return Response.json({ error: "Couldn't verify your login." }, { status: 503 });
  }

  // A valid Sanity login that isn't a member of this project has no roles here.
  const user = (await res.json()) as { id?: string; roles?: unknown[] };
  if (!user.id || !Array.isArray(user.roles) || user.roles.length === 0) {
    return Response.json({ error: "No access to this project." }, { status: 403 });
  }
  return null;
}
