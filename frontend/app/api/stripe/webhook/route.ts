// Stripe webhook has moved to the FastAPI backend at /billing/webhook
// Update your Stripe Dashboard webhook URL to: https://your-backend.railway.app/billing/webhook
export async function POST() {
  return Response.json({ detail: "Moved to backend" }, { status: 410 });
}
