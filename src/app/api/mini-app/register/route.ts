import { registrationAllowed, registerUser } from "@/lib/contest";
import { resolveTelegramUserId } from "@/lib/telegram";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const telegramUserId = resolveTelegramUserId(request);

  if (!telegramUserId) {
    return Response.json({ ok: false, error: "TELEGRAM_USER_ID_REQUIRED" }, { status: 400 });
  }

  if (!registrationAllowed()) {
    return Response.json({ ok: false, error: "REGISTRATION_NOT_OPEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const groupId = Number(body?.groupId);
  const isStarosta = Boolean(body?.isStarosta);

  if (!fullName || fullName.length < 5) {
    return Response.json({ ok: false, error: "INVALID_FULL_NAME" }, { status: 400 });
  }

  if (!Number.isFinite(groupId) || groupId <= 0) {
    return Response.json({ ok: false, error: "INVALID_GROUP" }, { status: 400 });
  }

  try {
    const user = await registerUser({
      telegramUserId,
      fullName,
      groupId,
      isStarosta,
    });

    return Response.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REGISTER_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
