// Configuración de Firebase
// Configuración real de Firebase (Firebase v8 compat para soportar el diseño actual)
const firebaseConfig = {
  apiKey: "AIzaSyAP4m4iUJHu2UohFNVmpvXXy4Jzl4Lty_M",
  authDomain: "turnos-medicos-db87c.firebaseapp.com",
  projectId: "turnos-medicos-db87c",
  storageBucket: "turnos-medicos-db87c.firebasestorage.app",
  messagingSenderId: "1025312922142",
  appId: "1:1025312922142:web:383dfff49efc2e83182c0f"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
