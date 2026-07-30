import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

async function forward(request?: Request) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  return forwardBackendJson(
    "/profiles/me",
    request
      ? { method: "PATCH", body: await request.text() }
      : { method: "GET" },
    token
  );
}

export function GET() {
  return forward();
}

export function PATCH(request: Request) {
  return forward(request);
}
