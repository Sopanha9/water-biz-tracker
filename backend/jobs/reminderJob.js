require('dotenv').config()
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const { sendTelegram } = require('../services/telegram')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[Reminder] Running daily unpaid check...')
  await sendEmployeeReminders()
  await sendOwnerSummary()
})

async function sendEmployeeReminders() {
  // Get unpaid orders older than 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, customers(name, phone), profiles:employee_id(name, telegram_chat_id)')
    .eq('is_paid', false)
    .lt('created_at', threeDaysAgo)

  if (!orders || orders.length === 0) return

  // Group by employee
  const byEmployee = {}
  for (const order of orders) {
    const empId = order.employee_id
    if (!byEmployee[empId]) {
      byEmployee[empId] = {
        name: order.profiles?.name,
        chatId: order.profiles?.telegram_chat_id,
        orders: []
      }
    }
    byEmployee[empId].orders.push(order)
  }

  for (const emp of Object.values(byEmployee)) {
    if (!emp.chatId) continue
    const lines = emp.orders.map(o => {
      const amt = o.currency === 'USD' ? `$${o.amount_owed}` : `${Number(o.amount_owed).toLocaleString()}៛`
      const days = Math.floor((Date.now() - new Date(o.created_at)) / 86400000)
      return `• <b>${o.customers?.name}</b> — ${amt} (${days} days unpaid)`
    })
    const msg = `💧 <b>Unpaid Reminder</b>\n\nYou have ${emp.orders.length} unpaid order(s):\n\n${lines.join('\n')}\n\nPlease follow up with your customers.`
    await sendTelegram(emp.chatId, msg)
  }
}

async function sendOwnerSummary() {
  const { data: unpaid } = await supabase
    .from('orders')
    .select('*, customers(name), profiles:employee_id(name)')
    .eq('is_paid', false)

  if (!unpaid) return

  const totalUSD = unpaid.filter(o => o.currency === 'USD').reduce((s, o) => s + Number(o.amount_owed), 0)
  const totalKHR = unpaid.filter(o => o.currency === 'KHR').reduce((s, o) => s + Number(o.amount_owed), 0)

  const byEmp = {}
  for (const o of unpaid) {
    const n = o.profiles?.name || 'Unknown'
    byEmp[n] = (byEmp[n] || 0) + 1
  }
  const empLines = Object.entries(byEmp).map(([n, c]) => `• ${n}: ${c} order(s)`).join('\n')

  const msg = `📊 <b>Daily Summary — Water Biz</b>\n\n<b>Total Unpaid:</b>\n${totalUSD > 0 ? `$${totalUSD.toFixed(2)}` : ''}${totalUSD > 0 && totalKHR > 0 ? ' + ' : ''}${totalKHR > 0 ? `${totalKHR.toLocaleString()}៛` : ''}\n\n<b>By Employee:</b>\n${empLines || 'None'}\n\n<b>Total Orders:</b> ${unpaid.length}`

  await sendTelegram(process.env.OWNER_TELEGRAM_CHAT_ID, msg)
}

module.exports = { sendEmployeeReminders, sendOwnerSummary }
