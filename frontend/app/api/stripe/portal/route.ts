// Billing portal has moved to the FastAPI backend at /billing/portal
export async function POST() {
  return Response.json({ detail: "Moved to backend" }, { status: 410 });
}
