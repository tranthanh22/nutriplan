import { CheckoutSuccess } from "@/features/subscription/checkout-success";

export default function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: { session_id?: string };
}) {
  return <CheckoutSuccess sessionId={searchParams.session_id ?? ""} />;
}
