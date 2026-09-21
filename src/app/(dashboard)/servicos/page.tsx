import { prisma } from "@/lib/prisma";
import ServicosView from "./ServicosView";

export default async function ServicosPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <ServicosView services={services} />;
}
