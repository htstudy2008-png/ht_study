import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSEZ0XqrLyzz7xT71TVVh-ykK9vEMdsAI",
  authDomain: "ht-study-a4589.firebaseapp.com",
  projectId: "ht-study-a4589",
  storageBucket: "ht-study-a4589.firebasestorage.app",
  messagingSenderId: "290246694134",
  appId: "1:290246694134:web:b22cd80332b2cccc1908d7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
