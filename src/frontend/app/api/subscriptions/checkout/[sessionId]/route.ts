import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();

  return forwardBackendJson(
    `/subscriptions/checkout/${encodeURIComponent(params.sessionId)}`,
    {},
    token
  );
}
