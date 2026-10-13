import { NextRequest } from "next/server";

export function resolveTelegramUserId(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("tgUserId");
  const fromHeader = request.headers.get("x-telegram-user-id");

  const raw = fromQuery ?? fromHeader;
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
