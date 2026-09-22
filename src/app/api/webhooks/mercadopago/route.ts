import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPayment, mapMercadoPagoMethod } from "@/lib/mercadopago";

async function extractPaymentId(request: NextRequest): Promise<string | null> {
  const url = request.nextUrl;
  const queryId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
  if (queryId && (!topic || topic === "payment")) {
    return queryId;
  }

  try {
    const body = await request.json();
    if (body?.type === "payment" && body?.data?.id) {
      return String(body.data.id);
    }
  } catch {
    // no JSON body; fall through
  }

  return null;
}

export async function POST(request: NextRequest) {
  const paymentId = await extractPaymentId(request);
  if (!paymentId) {
    return NextResponse.json({ ok: true, skipped: "no payment id" });
  }

  let payment;
  try {
    payment = await fetchPayment(paymentId);
  } catch (err) {
    console.error("Failed to fetch Mercado Pago payment", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const appointmentId = payment.external_reference;
  if (!appointmentId) {
    return NextResponse.json({ ok: true, skipped: "no external_reference" });
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { externalPaymentId: String(payment.id) },
  });
  if (existingPayment) {
    return NextResponse.json({ ok: true, skipped: "already processed" });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ ok: true, skipped: "appointment not pending" });
  }

  if (payment.status === "approved") {
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          appointmentId,
          amount: payment.transaction_amount,
          method: mapMercadoPagoMethod(payment),
          isDeposit: true,
          externalPaymentId: String(payment.id),
        },
      }),
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "SCHEDULED" },
      }),
    ]);
  } else if (payment.status === "rejected" || payment.status === "cancelled") {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELED" },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
