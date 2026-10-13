import { redeemPinCode } from "@/lib/contest";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const telegramUserId = Number(body?.telegramUserId);
  const code = typeof body?.code === "string" ? body.code : "";

  if (!Number.isFinite(telegramUserId) || telegramUserId <= 0) {
    return Response.json({ ok: false, error: "INVALID_TELEGRAM_USER_ID" }, { status: 400 });
  }

  try {
    const result = await redeemPinCode({ telegramUserId, code });

    return Response.json({
      ok: true,
      messageToUser: `Код принят! Вы получили ${result.points} балл(а).`,
      broadcastText: result.broadcastText,
      payload: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PIN_REDEEM_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
