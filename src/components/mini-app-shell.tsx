"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TabKey = "team" | "stats" | "schedule" | "shop";

type GroupOption = { id: number; name: string };

type BootstrapPayload = {
  ok: boolean;
  telegramUserId: number;
  groups: GroupOption[];
  registered: boolean;
  registrationOpen: boolean;
  registrationOpensAt?: string;
  profile?: {
    fullName: string;
    groupName: string;
    teamName: string;
    teamLogo: string | null;
  };
  team?: {
    points: number;
    members: Array<{ fullName: string; isStarosta: boolean; isShopManager: boolean }>;
  };
  stats?: Array<{ id: number; title: string; points: number; source: string; createdAt: string }>;
  schedule?: Array<{
    id: number;
    title: string;
    shortDescription: string;
    taskBody: string;
    startsAt: string;
    endsAt: string | null;
    isVisible: boolean;
  }>;
  shop?: Array<{ id: number; title: string; imageUrl: string; stock: number; costPoints: number }>;
};

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "team", label: "Команда", icon: "👥" },
  { key: "stats", label: "Статистика", icon: "📊" },
  { key: "schedule", label: "Расписание", icon: "🗓️" },
  { key: "shop", label: "Магазин", icon: "🛒" },
];

async function safeReadJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function detectTelegramUserId() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const byQuery = params.get("tgUserId");

  const tgWindow = window as Window & {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id?: number;
          };
        };
      };
    };
  };

  const byWebApp = tgWindow.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  const raw = byWebApp ?? (byQuery ? Number(byQuery) : null);
  if (!raw || !Number.isFinite(raw)) {
    return 101001;
  }

  return raw;
}

export function MiniAppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("team");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<BootstrapPayload | null>(null);
  const [expandedChallengeId, setExpandedChallengeId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");
  const [isStarosta, setIsStarosta] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const tgUserId = detectTelegramUserId();
      const res = await fetch(`/api/mini-app/bootstrap?tgUserId=${tgUserId}`, {
        cache: "no-store",
      });
      const data = await safeReadJson<BootstrapPayload & { error?: string }>(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Не удалось загрузить данные Mini App");
      }
      setPayload(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const registrationLocked = useMemo(() => {
    if (!payload) return true;
    return !payload.registered;
  }, [payload]);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payload) return;

    const tgUserId = payload.telegramUserId;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/mini-app/register?tgUserId=${tgUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, groupId, isStarosta }),
      });

      const data = await safeReadJson<{ ok: boolean; error?: string }>(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Ошибка регистрации");
      }

      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#060b16] text-slate-100">
      <div className="pointer-events-none absolute -left-14 top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl animate-float-blob" />
      <div
        className="pointer-events-none absolute -right-16 top-40 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl animate-float-blob"
        style={{ animationDelay: "1.4s" }}
      />
      <header className="relative z-10 px-5 pb-3 pt-6 animate-card-in">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Telegram Mini App</p>
        <h1 className="mt-2 text-2xl font-semibold">Первая группа ФИЭиГХ</h1>
      </header>

      <section className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
        {loading && <div className="glass-card animate-card-in rounded-2xl p-4 text-sm">Загрузка...</div>}
        {error && <div className="mb-3 animate-card-in rounded-2xl bg-rose-500/20 p-3 text-sm text-rose-200">{error}</div>}

        {!loading && payload?.registered && payload.team && payload.profile && activeTab === "team" && (
          <div className="space-y-4 animate-card-in">
            <article className="interactive-lift animate-soft-pulse rounded-3xl bg-gradient-to-br from-cyan-400/30 via-violet-500/25 to-orange-400/20 p-4">
              <p className="text-sm text-cyan-100/90">Баллы команды</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-4xl font-bold leading-none">{payload.team.points}</p>
                  <p className="mt-2 text-sm text-slate-200">{payload.profile.groupName}</p>
                </div>
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-black/20 ring-1 ring-white/20">
                  <img
                    src={payload.profile.teamLogo ?? "https://placehold.co/160x160/111827/ffffff?text=Logo"}
                    alt="Логотип команды"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </article>

            <article className="glass-card animate-card-in rounded-3xl p-4" style={{ animationDelay: "0.08s" }}>
              <h2 className="text-lg font-semibold">Состав команды</h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-200">
                {payload.team.members.map((member, index) => (
                  <li
                    key={`${member.fullName}-${index}`}
                    className="interactive-lift flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2"
                  >
                    <span>
                      {index + 1}. {member.fullName}
                    </span>
                    <span className="flex gap-1">
                      {member.isStarosta && <span title="Староста">⭐</span>}
                      {member.isShopManager && <span title="Ответственный за магазин">🛍️</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        )}

        {!loading && payload?.registered && activeTab === "stats" && (
          <article className="glass-card animate-card-in space-y-2 rounded-3xl p-4">
            <h2 className="text-lg font-semibold">История начислений</h2>
            {payload.stats?.length ? (
              payload.stats.map((row) => (
                <div key={row.id} className="interactive-lift rounded-xl bg-black/20 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{row.title}</span>
                    <span className={row.points >= 0 ? "text-emerald-300" : "text-orange-300"}>
                      {row.points >= 0 ? `+${row.points}` : row.points}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">Начислений пока нет.</p>
            )}
          </article>
        )}

        {!loading && payload?.registered && activeTab === "schedule" && (
          <article className="glass-card animate-card-in space-y-2 rounded-3xl p-4">
            <h2 className="text-lg font-semibold">Расписание испытаний</h2>
            {payload.schedule?.map((item) => {
              const expanded = expandedChallengeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="interactive-lift w-full rounded-2xl bg-black/20 px-3 py-3 text-left"
                  onClick={() => setExpandedChallengeId(expanded ? null : item.id)}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{new Date(item.startsAt).toLocaleString("ru-RU")}</p>
                  {expanded && (
                    <div className="mt-2 text-sm text-slate-200">
                      <p>{item.shortDescription}</p>
                      <p className="mt-2 rounded-xl bg-white/5 p-2">{item.taskBody}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </article>
        )}

        {!loading && payload?.registered && activeTab === "shop" && (
          <article className="glass-card animate-card-in rounded-3xl p-4">
            <h2 className="text-lg font-semibold">Магазин</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {payload.shop?.map((item) => (
                <div key={item.id} className="interactive-lift overflow-hidden rounded-2xl bg-black/25">
                  <img src={item.imageUrl} alt={item.title} className="h-24 w-full object-cover" />
                  <div className="space-y-1 p-2 text-xs">
                    <p className="line-clamp-2 min-h-8 font-medium text-slate-100">{item.title}</p>
                    <p className="text-slate-300">Остаток: {item.stock} шт.</p>
                    <p className="font-semibold text-orange-300">{item.costPoints} баллов</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}

        {!loading && registrationLocked && payload && (
          <div className="glass-card animate-card-in rounded-3xl p-4">
            <h2 className="text-lg font-semibold">Регистрация участника</h2>
            <p className="mt-2 text-sm text-slate-300">Выберите одно из направлений подготовки:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {payload.groups.slice(0, 11).map((group, index) => (
                <span
                  key={group.id}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-cyan-100 animate-card-in"
                  style={{ animationDelay: `${0.03 * index}s` }}
                >
                  {group.name}
                </span>
              ))}
            </div>
            {!payload.registrationOpen && (
              <p className="mt-2 rounded-xl bg-orange-500/20 p-3 text-sm text-orange-200">
                Регистрация откроется {new Date(payload.registrationOpensAt ?? "").toLocaleDateString("ru-RU")}
              </p>
            )}
            <form className="mt-3 space-y-3" onSubmit={submitRegistration}>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">ФИО</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="interactive-lift w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none ring-cyan-300/40 focus:ring"
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Направление</span>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(Number(e.target.value) || "")}
                  className="interactive-lift w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none ring-cyan-300/40 focus:ring"
                  required
                >
                  <option value="">Выберите направление</option>
                  {payload.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={isStarosta}
                  onChange={(e) => setIsStarosta(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
                Я староста
              </label>

              <button
                type="submit"
                disabled={!payload.registrationOpen || saving}
                className="interactive-lift animate-soft-pulse w-full rounded-xl bg-cyan-400 px-3 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Сохраняем..." : "Завершить регистрацию"}
              </button>
            </form>
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-md gap-1 border-t border-white/10 bg-[#050913]/85 px-2 py-2 backdrop-blur-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`interactive-lift flex flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 text-xs transition-all duration-300 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-cyan-300 to-violet-300 text-slate-950 shadow-[0_8px_20px_rgba(34,211,238,0.35)]"
                : "text-slate-300"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
