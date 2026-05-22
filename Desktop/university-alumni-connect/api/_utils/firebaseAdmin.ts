import admin from 'firebase-admin'

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

if (!rawServiceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set')
}

const serviceAccount = JSON.parse(rawServiceAccount)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export const firebaseAdmin = admin
