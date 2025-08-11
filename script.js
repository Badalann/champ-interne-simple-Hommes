
  // === Configuration Firebase ===
const firebaseConfig = {
apiKey: "AIzaSyCxikXGPoWe8H5ySTqbMRp_D50GX-6X0rY",
authDomain: "championnat-simples-hommes.firebaseapp.com",
projectId: "championnat-simples-hommes",
storageBucket: "championnat-simples-hommes.firebasestorage.app",
messagingSenderId: "264288626258",
appId: "1:264288626258:web:5272c3c971230f2dc1a18b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
const nomsNiveaux = [
  "Renardeaux",
  "Petits roux",
  "Apprentis rusés",
  "Jeunes goupils",
  "Renards vifs",
  "Goupils rusés",
  "Renards éclaireurs",
  "Renards stratèges",
  "Grands roux",
  "Renard Majestieux"
];
let challengerId = null;
let challengerNom = "";

// Canvas
const canvas = document.getElementById('canvasPyramide');
const ctx = canvas.getContext('2d');

// Navigation
function showTab(tab) {
  document.getElementById("pyramide").style.display = tab === "pyramide" ? "" : "none";
  document.getElementById("defi").style.display =

