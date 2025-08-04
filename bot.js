require('dotenv').config();
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const channelLink = process.env.CHANNEL_LINK;

const bot = new TelegramBot(token, { polling: true });
const userStates = {};
const DB_FILE = 'users.json';

function loadUsers() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveUser(user) {
  const users = loadUsers();
  users.push(user);
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function userExists(chatId) {
  const users = loadUsers();
  return users.some((u) => u.id === chatId);
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (userExists(chatId)) {
    bot.sendMessage(chatId, `Ви вже зареєстровані ✅\nОсь силка на канал:\n${channelLink}`);
    return;
  }

  userStates[chatId] = { step: 'name' };
  bot.sendMessage(chatId, 'Привіт! Як тебе звати?');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith('/')) return;

  const user = userStates[chatId];
  if (!user || user.step === 'done') return;

  switch (user.step) {
    case 'name':
      user.name = msg.text;
      user.step = 'phone';
      bot.sendMessage(chatId, 'Надішли свій номер:', {
        reply_markup: {
          keyboard: [
            [{ text: '📞 Надіслати номер', request_contact: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      break;

    case 'phone':
      if (msg.contact && msg.contact.phone_number) {
        user.phone = msg.contact.phone_number;
        user.step = 'username';
        bot.sendMessage(chatId, 'Введи свій юзернейм (без @):', {
          reply_markup: { remove_keyboard: true },
        });
      } else {
        bot.sendMessage(chatId, 'Будь ласка, натисни кнопку для номера.');
      }
      break;

    case 'username':
      user.username = msg.text;
      user.step = 'done';

      saveUser({
        id: chatId,
        name: user.name,
        phone: user.phone,
        username: user.username,
      });

      // Надсилання адміну
      bot.sendMessage(920291804, `➕ Новий користувач:
👤 Ім'я: ${user.name}
📞 Телефон: ${user.phone}
🔗 Юзернейм: @${user.username}`);
      
      
        id: chatId,
        name: user.name,
        phone: user.phone,
        username: user.username,
      });

      bot.sendMessage(chatId, `Дякую, ${user.name}!\nОсь силка на канал:\n${channelLink}`);
      break;
  }
});
