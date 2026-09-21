import { prisma } from "@/lib/prisma";
import ClientesView from "./ClientesView";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });

  return <ClientesView clients={clients} />;
}
