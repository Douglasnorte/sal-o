const MP_API_BASE = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return token;
}

export type CreatePreferenceInput = {
  appointmentId: string;
  title: string;
  amount: number;
  payerName: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  notificationUrl: string;
};

export async function createDepositPreference(input: CreatePreferenceInput) {
  const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: input.amount,
        },
      ],
      payer: { name: input.payerName },
      external_reference: input.appointmentId,
      notification_url: input.notificationUrl,
      back_urls: {
        success: input.successUrl,
        pending: input.pendingUrl,
        failure: input.failureUrl,
      },
      auto_return: "approved",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao criar cobrança no Mercado Pago: ${body}`);
  }

  const data = await response.json();
  return { id: data.id as string, initPoint: data.init_point as string };
}

export type MercadoPagoPayment = {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  payment_method_id: string;
  payment_type_id: string;
};

export async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao consultar pagamento no Mercado Pago: ${body}`);
  }
  return response.json();
}

export function mapMercadoPagoMethod(payment: MercadoPagoPayment): "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER" {
  if (payment.payment_method_id === "pix") return "PIX";
  if (payment.payment_type_id === "credit_card") return "CREDIT_CARD";
  if (payment.payment_type_id === "debit_card") return "DEBIT_CARD";
  return "OTHER";
}
