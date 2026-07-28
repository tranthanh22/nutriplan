import { forwardBackendJson } from "@/lib/backend-api-server";

export const dynamic = "force-dynamic";

export function GET() {
  return forwardBackendJson("/subscriptions/plans");
}
