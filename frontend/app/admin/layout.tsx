export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cf-bg text-zinc-100">{children}</div>
  );
}
