import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; dailyOrderId: string } }
) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  return forwardBackendJson(
    `/orders/${encodeURIComponent(params.id)}/daily-orders/${encodeURIComponent(params.dailyOrderId)}/status`,
    { method: "PATCH", body: await request.text() },
    token
  );
}
