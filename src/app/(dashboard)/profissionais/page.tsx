import { prisma } from "@/lib/prisma";
import ProfissionaisView from "./ProfissionaisView";

export default async function ProfissionaisPage() {
  const professionals = await prisma.professional.findMany({
    orderBy: { createdAt: "asc" },
    include: { workingHours: true },
  });

  return <ProfissionaisView professionals={professionals} />;
}
