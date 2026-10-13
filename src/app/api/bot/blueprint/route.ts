export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    bot: {
      name: "Первая группа ФИЭиГХ",
      flows: {
        start: {
          command: "/start",
          sends: [
            "Приветственное изображение",
            "Описание конкурса, условия, призы, сроки",
            "Inline-кнопки: Mini App и связь с организаторами",
          ],
        },
        reminders: {
          source: "announcements",
          types: ["text", "video_note", "result_cta"],
          resultButton: "Отправить результат",
          ctaDestination: "ЛС ответственного администратора",
        },
        pinCodes: {
          acceptedFormat: "6 digits",
          checks: ["code exists", "is active", "user not claimed this code before"],
          scoringRule: "1st=4, 2nd=3, 3rd=2, next=1",
          globalMessage: "Пин-код локации №N найден N раз(а)",
          endpoint: "POST /api/bot/pin-code",
        },
      },
    },
    miniApp: {
      registration: {
        opensAt: "19.10",
        fields: ["ФИО", "Направление", "Я староста"],
        required: true,
      },
      tabs: ["Команда", "Статистика", "Расписание", "Магазин"],
      bootstrapEndpoint: "GET /api/mini-app/bootstrap",
      registerEndpoint: "POST /api/mini-app/register",
    },
    adminSystem: {
      access: "tgUserId in TELEGRAM_ADMIN_IDS or admins table",
      endpoints: [
        "GET /api/admin/overview",
        "POST /api/admin/points",
        "POST /api/admin/challenges",
        "POST /api/admin/announcements",
        "POST /api/admin/users/shop-manager",
        "POST /api/admin/grant",
      ],
    },
  });
}
