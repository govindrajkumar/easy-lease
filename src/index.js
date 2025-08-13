import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { auth, db, messaging } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import easyLeaseLogo from './EasyLease Logo.png';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

document.title = 'EasyLease';
const favicon = document.getElementById('favicon');
if (favicon) {
  favicon.href = easyLeaseLogo;
}

serviceWorkerRegistration.register();

auth.onAuthStateChanged(async (user) => {
  if (!user || !('Notification' in window)) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await setDoc(doc(db, 'Users', user.uid), { fcmToken: token }, { merge: true });
    }
  } catch (err) {
    console.error('Unable to get permission to notify or save token', err);
  }
});
