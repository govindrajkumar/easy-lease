const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { DropboxSign } = require('@dropbox/sign');

admin.initializeApp();

const db = admin.firestore();
const storageBucket = admin.storage().bucket();

const HS_API_KEY = process.env.HELLOSIGN_API_KEY || (functions.config().hellosign && functions.config().hellosign.apikey);
const HS_CLIENT_ID = process.env.HELLOSIGN_CLIENT_ID || (functions.config().hellosign && functions.config().hellosign.client_id);

const signatureRequestApi = new DropboxSign.SignatureRequestApi();
const embeddedApi = new DropboxSign.EmbeddedApi();
if (HS_API_KEY) {
  signatureRequestApi.username = HS_API_KEY;
  embeddedApi.username = HS_API_KEY;
}

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

exports.createLeaseSignature = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  if (!HS_API_KEY || !HS_CLIENT_ID) {
    throw new functions.https.HttpsError('failed-precondition', 'HelloSign not configured');
  }
  const leaseId = data.leaseId;
  if (!leaseId) {
    throw new functions.https.HttpsError('invalid-argument', 'leaseId is required');
  }
  const leaseSnap = await db.collection('Leases').doc(leaseId).get();
  if (!leaseSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Lease not found');
  }
  const userSnap = await db.collection('Users').doc(context.auth.uid).get();
  const user = userSnap.data();
  const signerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Tenant';
  const signerEmail = user.email;

  const request = {
    clientId: HS_CLIENT_ID,
    title: 'Lease Agreement',
    subject: 'Please sign your lease',
    message: 'Sign the lease agreement',
    signers: [{ emailAddress: signerEmail, name: signerName }],
    fileUrl: [
      leaseSnap.data().agreement_url ||
        'https://forms.mgcs.gov.on.ca/dataset/edff7620-980b-455f-9666-643196d8312f/resource/44548947-1727-4928-81df-dfc33ffd649a/download/2229e_flat.pdf',
    ],
    testMode: 1,
  };

  const resp = await signatureRequestApi.signatureRequestCreateEmbedded(request);
  const signatureRequestId = resp.body.signatureRequest.signatureRequestId;
  const signatureId = resp.body.signatureRequest.signatures[0].signatureId;

  await db.collection('Leases').doc(leaseId).update({
    hellosign_request_id: signatureRequestId,
    hellosign_signature_id: signatureId,
  });

  const signResp = await embeddedApi.embeddedSignUrl(signatureId);
  return { url: signResp.body.embedded.signUrl };
});

exports.helloSignWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body.event || {};
  if (event.event_type === 'signature_request_all_signed') {
    const requestId = req.body.signature_request?.signature_request_id;
    if (requestId) {
      const leaseSnap = await db
        .collection('Leases')
        .where('hellosign_request_id', '==', requestId)
        .limit(1)
        .get();
      if (!leaseSnap.empty) {
        const leaseDoc = leaseSnap.docs[0];
        try {
          const fileResp = await signatureRequestApi.signatureRequestFiles(requestId, {
            fileType: 'pdf',
          });
          const buffer = Buffer.from(fileResp.body, 'binary');
          const file = storageBucket.file(`signed_leases/${leaseDoc.id}.pdf`);
          await file.save(buffer, { contentType: 'application/pdf' });
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
          });
          await leaseDoc.ref.update({ signed_agreement_url: url });
        } catch (err) {
          console.error('Failed to store signed agreement', err);
        }
      }
    }
  }
  res.status(200).send('ok');
});
