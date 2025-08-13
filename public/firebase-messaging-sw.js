importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDH-9HMnMIMnpP7JT3HwODG1cZRrFTr-Ko",
  authDomain: "easylease-sgaap.firebaseapp.com",
  projectId: "easylease-sgaap",
  storageBucket: "easylease-sgaap.firebasestorage.app",
  messagingSenderId: "1097212604433",
  appId: "1:1097212604433:web:b9179f3228068f5d3a01b0",
  measurementId: "G-0HXJV0VGHS"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || 'EasyLease';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
