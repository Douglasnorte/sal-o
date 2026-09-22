import { prisma } from "@/lib/prisma";
import BookingWizard from "./BookingWizard";

export const dynamic = "force-dynamic";

export default async function ReservarPage() {
  const [professionals, services] = await Promise.all([
    prisma.professional.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return <BookingWizard professionals={professionals} services={services} />;
}
