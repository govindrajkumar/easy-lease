const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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
