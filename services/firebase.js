//COPIADO DIRETO DO TERMINAL DO FIREBASE

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { initializeApp } from 'firebase/app';

import { getAuth } from 'firebase/auth';

const firebaseConfig = {

    apiKey:
        'AIzaSyCI-3KUHcszmd8NnBCUGKH64gdtQAMc3iQ',

    authDomain:
        'vapefree-pi.firebaseapp.com',

    projectId:
        'vapefree-pi',

    storageBucket:
        'vapefree-pi.firebasestorage.app',

    messagingSenderId:
        '445859118404',

    appId:
        '1:445859118404:web:7e9be5456eb117a3732b11'

};

const app =
    initializeApp(firebaseConfig);

export const auth =
    getAuth(app);

export default app;