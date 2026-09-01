import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBH6i8ezjhqxvGx8RZrpfVc-fcdgi0hhBM",
  authDomain: "arushi-linkhub.firebaseapp.com",
  projectId: "arushi-linkhub",
  storageBucket: "arushi-linkhub.firebasestorage.app",
  messagingSenderId: "974388315383",
  appId: "1:974388315383:web:5629fbc1ba323cb6c43ff2",
  measurementId: "G-VP68Q2Z86P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
