require('dotenv').config()
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId, message) {
  if (!chatId || !BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (e) {
    console.error('Telegram error:', e.message)
  }
}

module.exports = { sendTelegram }
