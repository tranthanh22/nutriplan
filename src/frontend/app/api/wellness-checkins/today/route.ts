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
    "/wellness-checkins/today",
    request
      ? { method: "PUT", body: await request.text() }
      : { method: "GET" },
    token
  );
}

export function GET() {
  return forward();
}

export function PUT(request: Request) {
  return forward(request);
}
