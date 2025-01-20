// bot.ts
import {Bot, Context, InlineKeyboard} from "grammy";
import {User} from "./models";

// Создаём экземпляр бота
export const bot = new Bot(process.env.BOT_TOKEN!);

export const setupBot = () => {
    bot.api.setMyCommands([
        {command: "start", description: "Start the bot"},
        {command: "settings", description: "Open settings"},
    ]);

    // Хендлер команды "/start"
    bot.command("start", async (ctx) => {
        // Создаем инлайн-клавиатуру с кнопкой "Запустить Mini App"
        const keyboard = new InlineKeyboard().url(
            "Запустить Mini App",
            "https://t.me/tester1571bot/tester1571app" // Укажите URL вашего веб-приложения
        );

        // Отправляем приветственное сообщение с кнопкой
        await ctx.reply(
            "Добро пожаловать! Нажмите кнопку ниже, чтобы запустить Mini App.",
            {reply_markup: keyboard}
        );
    });

    bot.on('message', async (ctx: Context) => {
        // Проверяем, содержит ли сообщение поле new_chat_members
        const newMembers = ctx.message?.new_chat_members;
        console.log(ctx.message)
        console.log(newMembers)
        if (newMembers) {
            for (const newUser of newMembers) {
                // Проверяем, существует ли пользователь в базе данных
                const existingUser = await User.findOne({
                    where: {telegramId: newUser.id.toString()},
                });

                if (!existingUser) {
                    // Создаем нового пользователя
                    await User.create({
                        telegramId: newUser.id.toString(),
                        firstName: newUser.first_name,
                        lastName: newUser.last_name || '',
                        userName: newUser.username || '',
                        languageCode: newUser.language_code || '',
                        isAdmin:false,
                        isBot:newUser.is_bot,

                    });
                    console.log(`Новый пользователь ${newUser.first_name} добавлен в базу данных`);
                }
            }

        }
    });
}
