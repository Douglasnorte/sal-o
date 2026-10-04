import { auth } from "@/lib/auth";
import Sidebar, { MobileBottomNav, MobileTopBar } from "@/components/Sidebar";

// Every page here reads live, per-request data behind auth — never prerender.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <Sidebar userName={session?.user?.name ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
