import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();

  return forwardBackendJson(
    `/dishes/${encodeURIComponent(params.id)}/recipe`,
    { method: "GET" },
    token
  );
}
