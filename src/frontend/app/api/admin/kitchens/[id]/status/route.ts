import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  return forwardBackendJson(
    `/admin/kitchens/${encodeURIComponent(context.params.id)}/status`,
    { method: "PATCH", body: await request.text() },
    token
  );
}
