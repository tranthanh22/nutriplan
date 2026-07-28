import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  return forwardBackendJson("/settings", {}, token);
}

export async function PATCH(request: Request) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  const body = await request.text();
  return forwardBackendJson("/settings", { method: "PATCH", body }, token);
}
