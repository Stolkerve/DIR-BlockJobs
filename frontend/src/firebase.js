import { initializeApp } from "firebase/app";
import {getFirestore} from  "firebase/firestore";
// import { useCollectionData } from "react-firebase-hooks";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APPID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth();
const fireStore = getFirestore(firebaseApp);

const singInFirebaseAnonymously = () => {
    signInAnonymously(auth)
      .then(() => {
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage)
      });
  };


export { fireStore, auth, firebaseApp, singInFirebaseAnonymously };
