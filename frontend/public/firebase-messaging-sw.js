// Web Firebase Messaging Service Worker
// This file runs in the browser background to intercept and display push notifications when the app is closed.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Initialize Firebase App for Service Worker
// Parse the query parameters from the registration URL to set configuration dynamically,
// falling back to default values if not provided.
const urlParams = new URLSearchParams(location.search);
const config = Object.fromEntries(urlParams);

firebase.initializeApp({
  apiKey: config.apiKey || "AIzaSyAOU3gODihgxONXDpTfnNz6Q65MZAlzqFg",
  authDomain: config.authDomain || "aroundyou-497203.firebaseapp.com",
  projectId: config.projectId || "aroundyou-497203",
  storageBucket: config.storageBucket || "aroundyou-497203.firebasestorage.app",
  messagingSenderId: config.messagingSenderId || "233722731121",
  appId: config.appId || "1:233722731121:web:654c7c8efa3f6e2e2d19d0"
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
