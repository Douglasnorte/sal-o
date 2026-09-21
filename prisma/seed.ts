import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const WEEKDAYS = [1, 2, 3, 4, 5, 6]; // segunda a sábado

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@salao.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administradora",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  const professionalsData = [
    { name: "Camila Souza", color: "#EC4899", commissionPercent: 40 },
    { name: "Fernanda Lima", color: "#8B5CF6", commissionPercent: 35 },
    { name: "Juliana Alves", color: "#F59E0B", commissionPercent: 40 },
  ];

  const professionals = [];
  for (const data of professionalsData) {
    const existing = await prisma.professional.findFirst({ where: { name: data.name } });
    const professional =
      existing ??
      (await prisma.professional.create({
        data: {
          ...data,
          workingHours: {
            create: WEEKDAYS.map((weekday) => ({
              weekday,
              startTime: "09:00",
              endTime: "19:00",
            })),
          },
        },
      }));
    professionals.push(professional);
  }

  const servicesData = [
    { name: "Corte Feminino", category: "Cabelo", durationMinutes: 45, price: 80 },
    { name: "Escova", category: "Cabelo", durationMinutes: 40, price: 60 },
    { name: "Coloração", category: "Química", durationMinutes: 120, price: 220 },
    { name: "Hidratação", category: "Tratamento", durationMinutes: 50, price: 90 },
    { name: "Manicure", category: "Unhas", durationMinutes: 30, price: 40 },
    { name: "Pedicure", category: "Unhas", durationMinutes: 40, price: 45 },
    { name: "Escova Progressiva", category: "Química", durationMinutes: 150, price: 280 },
  ];

  const services = [];
  for (const data of servicesData) {
    const existing = await prisma.service.findFirst({ where: { name: data.name } });
    const service = existing ?? (await prisma.service.create({ data }));
    services.push(service);
  }

  const clientsData = [
    { name: "Ana Paula Ribeiro", phone: "(11) 98765-4321" },
    { name: "Beatriz Costa", phone: "(11) 91234-5678" },
    { name: "Carla Mendes", phone: "(11) 99876-5432" },
    { name: "Débora Santos", phone: "(11) 93456-7890" },
    { name: "Elaine Ferreira", phone: "(11) 92345-6789" },
  ];

  const clients = [];
  for (const data of clientsData) {
    const existing = await prisma.client.findFirst({ where: { name: data.name } });
    const client = existing ?? (await prisma.client.create({ data }));
    clients.push(client);
  }

  const existingAppointments = await prisma.appointment.count();
  if (existingAppointments === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sampleSlots: { dayOffset: number; hour: number; minute: number }[] = [
      { dayOffset: 0, hour: 9, minute: 0 },
      { dayOffset: 0, hour: 10, minute: 30 },
      { dayOffset: 0, hour: 14, minute: 0 },
      { dayOffset: 1, hour: 11, minute: 0 },
      { dayOffset: 1, hour: 15, minute: 30 },
    ];

    for (let i = 0; i < sampleSlots.length; i++) {
      const slot = sampleSlots[i];
      const professional = professionals[i % professionals.length];
      const service = services[i % services.length];
      const client = clients[i % clients.length];

      const start = new Date(today);
      start.setDate(start.getDate() + slot.dayOffset);
      start.setHours(slot.hour, slot.minute, 0, 0);
      const end = new Date(start.getTime() + service.durationMinutes * 60000);

      const status = i === 0 ? "DONE" : i === 1 ? "CONFIRMED" : "SCHEDULED";

      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          start,
          end,
          status,
          price: service.price,
        },
      });

      if (status === "DONE") {
        await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            amount: service.price,
            method: "PIX",
          },
        });
      }
    }
  }

  console.log("Seed concluído.");
  console.log(`Login: ${adminEmail} / senha: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
