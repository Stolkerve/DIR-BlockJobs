import {initializeApp} from 'firebase/app';
import {getAuth} from "firebase/auth";
import { async } from 'regenerator-runtime';
import {collection, getDocs, getFirestore} from 'firebase/firestore';

export function fbConfig() {
    const config = {
        apiKey: "AIzaSyBBoSwIv5REEoD4Rm2oTDQeARbGJCBPWu4",
        authDomain: "blockjobs-6c724.firebaseapp.com",
        projectId: "blockjobs-6c724",
        storageBucket: "blockjobs-6c724.appspot.com",
        messagingSenderId: "486388453283",
        appId: "1:486388453283:web:8c15c5689ba4ed35f69416"
      };
      
      // Initialize Firebase
      const app = initializeApp(fbConfig);
}

export function fbRegisterUser(id) {
    createUser(getAuth(), id);
}

export async function fbSearch(coleccion) {
    let query = collection(getFirestore(), coleccion);
    let result = await getDocs(query);
    let list = [];

    result.forEach(documento => {
        let objeto = documento.data()
        objeto.id = documento.id
        list.push(objeto);
    });
    return list;
}