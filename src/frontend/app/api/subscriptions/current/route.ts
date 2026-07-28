import { forwardBackendJson, getVerifiedAccessToken, unauthorizedResponse } from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  return forwardBackendJson("/subscriptions/current", {}, token);
}
