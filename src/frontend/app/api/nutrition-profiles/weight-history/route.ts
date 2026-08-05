import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

const validRanges = new Set(["7d", "1m", "3m", "1y", "all"]);

export async function GET(request: Request) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();

  const requestedRange = new URL(request.url).searchParams.get("range") ?? "1m";
  const range = validRanges.has(requestedRange) ? requestedRange : "1m";
  return forwardBackendJson(
    `/nutrition-profiles/weight-history?range=${encodeURIComponent(range)}`,
    {},
    token
  );
}
