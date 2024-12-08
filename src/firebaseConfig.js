import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyD7Yc9cd5UfrtWGvbMwaLNY9ctRg5miG9k",
  authDomain: "sample-7577c.firebaseapp.com",
  databaseURL: "https://sample-7577c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sample-7577c",
  storageBucket: "sample-7577c.firebasestorage.app",
  messagingSenderId: "460339715699",
  appId: "1:460339715699:web:92438ab625dbf4e3bb1406",
  measurementId: "G-TXP80YCF1S"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };