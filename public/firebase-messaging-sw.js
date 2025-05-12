// Import the Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js');

// Init Firebase in SW
firebase.initializeApp({
    apiKey: "AIzaSyB1sUAM6-zyIEXXbjhMzAveEnO_IDDu4o8",
    authDomain: "tapeat-56b0b.firebaseapp.com",
    projectId: "tapeat-56b0b",
    storageBucket: "tapeat-56b0b.firebasestorage.app",
    messagingSenderId: "467409723194",
    appId: "1:467409723194:web:b90c2020b1fd5d89723a03"
});

const messaging = firebase.messaging();

// Gérer la notification entrante
messaging.onBackgroundMessage(function (payload) {
    console.log('[fcm.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
