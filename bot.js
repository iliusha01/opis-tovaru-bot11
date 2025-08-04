
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const channelLink = process.env.CHANNEL_LINK;
const userDataPath = './users.json';

let users = {};

if (fs.existsSync(userDataPath)) {
  users = JSON.parse(fs.readFileSync(userDataPath));
}

function saveUser(user) {
  users[user.id] = user;
  fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (users[chatId]) {
    bot.sendMessage(chatId, `Ви вже зареєстровані. Ось силка на канал:
${channelLink}`);
    return;
  }

  users[chatId] = { step: 'name' };
  bot.sendMessage(chatId, 'Привіт! Введи своє імʼя:');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId] || users[chatId].step === 'done') return;

  const user = users[chatId];

  switch (user.step) {
    case 'name':
      user.name = msg.text;
      user.step = 'phone';
      bot.sendMessage(chatId, 'Тепер введи свій номер телефону:');
      break;
    case 'phone':
      user.phone = msg.text;
      user.step = 'username';
      bot.sendMessage(chatId, 'Тепер введи свій Telegram юзернейм (без @):');
      break;
    case 'username':
      user.username = msg.text;
      user.step = 'done';

      const newUser = {
        id: chatId,
        name: user.name,
        phone: user.phone,
        username: user.username,
      };

      saveUser(newUser);

      // Надсилання адміну
      bot.sendMessage(920291804, `➕ Новий користувач:
👤 Ім'я: ${newUser.name}
📞 Телефон: ${newUser.phone}
🔗 Юзернейм: @${newUser.username}`);

      bot.sendMessage(chatId, `Дякую, ${newUser.name}!
Ось силка на канал:
${channelLink}`);
      break;
  }
});
