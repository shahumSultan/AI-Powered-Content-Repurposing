// Stripe checkout has moved to the FastAPI backend at /billing/checkout
export async function POST() {
  return Response.json({ detail: "Moved to backend" }, { status: 410 });
}
