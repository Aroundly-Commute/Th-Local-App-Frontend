// Web Firebase Messaging Service Worker
// This file runs in the browser background to intercept and display push notifications when the app is closed.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Initialize Firebase App for Service Worker
// Mirroring the client config credentials
firebase.initializeApp({
  apiKey: "AIzaSyAOU3gODihgxONXDpTfnNz6Q65MZAlzqFg",
  authDomain: "aroundyou-497203.firebaseapp.com",
  projectId: "aroundyou-497203",
  storageBucket: "aroundyou-497203.firebasestorage.app",
  messagingSenderId: "233722731121",
  appId: "1:233722731121:web:642f3868b99992972d19d0"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'AroundYou Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico', // Fallback to standard web asset icon
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
