const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const HELLOSIGN_API_KEY = 'f91934661f9c4374956ba03c3d2997ad15835e9e250f68ddccbe903dd1ec3344';

async function sendNotificationToUsers(userIds, title, body) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;
  const snaps = await Promise.all(
    uniqueIds.map((uid) => db.collection('Users').doc(uid).get())
  );
  const tokens = snaps
    .map((s) => s.exists && s.data().fcmToken)
    .filter((t) => !!t);
  if (tokens.length === 0) return;
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
  });
}

exports.sendMonthlyRentReminders = functions.pubsub
  .schedule('0 9 1 * *')
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const paymentsSnap = await db
      .collection('RentPayments')
      .where('paid', '==', false)
      .get();

    const batch = db.batch();

    paymentsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const dueDate = new Date(data.due_date);
      if (
        dueDate.getUTCFullYear() === currentYear &&
        dueDate.getUTCMonth() === currentMonth
      ) {
        const reminderRef = db.collection('RentReminders').doc();
        batch.set(reminderRef, {
          tenant_uid: data.tenant_uid,
          property_id: data.property_id,
          amount: data.amount,
          due_date: data.due_date,
          landlord_uid: data.landlord_uid,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    await batch.commit();
    console.log(`Processed ${paymentsSnap.size} payments`);
  });

exports.notifyRentPaymentChange = functions.firestore
  .document('RentPayments/{paymentId}')
  .onWrite(async (change) => {
    const data = change.after.exists ? change.after.data() : change.before.data();
    await sendNotificationToUsers(
      [data.tenant_uid, data.landlord_uid],
      'Rent Payment Updated',
      'A rent payment record has changed.'
    );
  });

exports.notifyMaintenanceRequestChange = functions.firestore
  .document('MaintenanceRequests/{requestId}')
  .onWrite(async (change) => {
    const data = change.after.exists ? change.after.data() : change.before.data();
    await sendNotificationToUsers(
      [data.tenant_uid, data.landlord_id],
      'Maintenance Request Updated',
      data.title || 'A maintenance request has changed.'
    );
  });

exports.notifyMessageCreated = functions.firestore
  .document('Messages/{messageId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    await sendNotificationToUsers(
      [data.to],
      'New Message',
      data.text || 'You have a new message.'
    );
  });

exports.fetchSignedPdf = functions.https.onCall(async (data) => {
  const { signatureRequestId } = data || {};
  if (!signatureRequestId) {
    throw new functions.https.HttpsError('invalid-argument', 'signatureRequestId is required');
  }
  const resp = await fetch(
    `https://api.hellosign.com/v3/signature_request/files/${signatureRequestId}?file_type=pdf`,
    {
      headers: {
        Authorization: 'Basic ' + Buffer.from(HELLOSIGN_API_KEY + ':').toString('base64'),
      },
    }
  );
  if (!resp.ok) {
    const txt = await resp.text();
    console.error('HelloSign fetch failed', txt);
    throw new functions.https.HttpsError('failed-precondition', 'Unable to fetch signed PDF');
  }
  const arrayBuffer = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { base64 };
});
