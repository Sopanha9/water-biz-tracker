// IndexedDB helper for offline support
import { openDB } from 'idb'

const DB_NAME = 'water-biz-offline'
const DB_VERSION = 1

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        const cs = db.createObjectStore('customers', { keyPath: 'id' })
        cs.createIndex('name', 'name')
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('pendingSync')) {
        db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function saveCustomerOffline(customer) {
  const db = await getDB()
  await db.put('customers', customer)
}

export async function getCustomersOffline() {
  const db = await getDB()
  return db.getAll('customers')
}

export async function saveOrderOffline(order) {
  const db = await getDB()
  await db.put('orders', order)
}

export async function getOrdersOffline() {
  const db = await getDB()
  return db.getAll('orders')
}

export async function addPendingSync(action) {
  const db = await getDB()
  await db.add('pendingSync', { ...action, timestamp: Date.now() })
}

export async function getPendingSync() {
  const db = await getDB()
  return db.getAll('pendingSync')
}

export async function clearPendingSync() {
  const db = await getDB()
  await db.clear('pendingSync')
}
