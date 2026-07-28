import {
  forwardBackendJson,
  getVerifiedAccessToken,
  unauthorizedResponse
} from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

function backendPath(request: Request, segments: string[]) {
  const url = new URL(request.url);
  return `/assistant/${segments.map(encodeURIComponent).join("/")}${url.search}`;
}

async function forward(
  request: Request,
  segments: string[],
  method: "GET" | "POST"
) {
  const token = await getVerifiedAccessToken();
  if (!token) return unauthorizedResponse();
  const body = method === "GET" ? undefined : await request.text();
  return forwardBackendJson(
    backendPath(request, segments),
    { method, ...(body ? { body } : {}) },
    token
  );
}

type RouteContext = { params: { segments: string[] } };

export function GET(request: Request, { params }: RouteContext) {
  return forward(request, params.segments, "GET");
}

export function POST(request: Request, { params }: RouteContext) {
  return forward(request, params.segments, "POST");
}
