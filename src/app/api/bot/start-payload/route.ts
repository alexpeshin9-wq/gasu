export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    title: "Первая группа ФИЭиГХ",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1280&auto=format&fit=crop",
    text: [
      "Добро пожаловать в командный квест «Первая группа ФИЭиГХ»!",
      "",
      "Условия участия:",
      "• Зарегистрируйтесь в Mini App",
      "• Выполняйте испытания по расписанию",
      "• Находите пин-коды локаций и зарабатывайте баллы",
      "",
      "Призы:",
      "• Мерч факультета",
      "• Гаджеты и бонусы от организаторов",
      "",
      "Сроки проведения: 19.10 — 26.10",
    ].join("\n"),
    inlineKeyboard: [
      [
        {
          text: "Перейти в приложение",
          web_app: {
            url: process.env.NEXT_PUBLIC_MINI_APP_URL ?? "https://example.com",
          },
        },
      ],
      [
        {
          text: "Связаться с организаторами",
          url: process.env.NEXT_PUBLIC_ORGANIZER_URL ?? "https://t.me/organizers",
        },
      ],
    ],
  });
}
