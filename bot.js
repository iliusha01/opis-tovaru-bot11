const TelegramBot = require('node-telegram-bot-api');

const token = '7593968750:AAEqxf9xqvZPOzLpzwW3FFVfUVu804OSzBg';
const bot = new TelegramBot(token, { polling: true });

const ADMIN_ID = 920291804;
const CHANNEL_LINK = 'https://t.me/+N2JJml7IIOthNzE6';

const users = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привіт! Введи своє імʼя:');
    users[chatId] = { step: 'name' };
});

bot.on('contact', (msg) => {
    const chatId = msg.chat.id;
    if (!users[chatId]) users[chatId] = {};
    users[chatId].phone = msg.contact.phone_number;
    checkCompleted(chatId, msg.from);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userData = users[chatId];

    if (!userData) return;

    if (userData.step === 'name') {
        userData.name = msg.text;
        userData.step = 'phone';
        bot.sendMessage(chatId, 'Тепер поділись номером телефону, натиснувши кнопку нижче.', {
            reply_markup: {
                keyboard: [[{ text: "Надіслати номер телефону", request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
});

function checkCompleted(chatId, from) {
    const user = users[chatId];
    if (user.name && user.phone) {
        const username = from.username || 'не вказано';
        user.username = username;

        const message = `👤 Новий користувач:
Імʼя: ${user.name}
Телефон: ${user.phone}
Username: @${username}`;

        bot.sendMessage(ADMIN_ID, message);
        bot.sendMessage(chatId, 'Дякую! Ось доступ до каналу: ' + CHANNEL_LINK);
        delete users[chatId];
    }
}
