export default function AdminBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-900 text-white">{children}</div>;
}
