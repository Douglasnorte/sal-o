import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar userName={session?.user?.name ?? ""} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
