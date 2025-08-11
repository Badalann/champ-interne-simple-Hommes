let challengerId = null; // Id du joueur qui est challenger (dans Firestore, enregistrer dans une collection dédiée)

// === Configuration Firebase ===
// ⚠️ Remplace par tes infos Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCxikXGPoWe8H5ySTqbMRp_D50GX-6X0rY",
    authDomain: "championnat-simples-hommes.firebaseapp.com",
    projectId: "championnat-simples-hommes",
    storageBucket: "championnat-simples-hommes.firebasestorage.app",
    messagingSenderId: "264288626258",
    appId: "1:264288626258:web:5272c3c971230f2dc1a18b"
};

// Initialisation
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === Niveaux ===
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

// Navigation onglets
function showTab(tab) {
  document.getElementById("pyramide").style.display = tab === "pyramide" ? "" : "none";
  document.getElementById("defi").style.display = tab === "defi" ? "" : "none";
  document.getElementById("stats").style.display = tab === "stats" ? "" : "none";
}

// Affichage pyramide avec badges visuels
function afficherPyramide(joueurs) {
  const container = document.getElementById('pyramide');
  container.innerHTML = `
    <h2>Pyramide</h2>
    <input type="text" id="nouveauNom" placeholder="Nom adhérent" />
    <button onclick="ajouterJoueur()">➕ Ajouter joueur</button>
    <div id="vuePyramide" class="pyramide"></div>
  `;
  const vue = document.getElementById("vuePyramide");
  vue.innerHTML = ''; // Reset contenu

  for (let niveau = nomsNiveaux.length; niveau >= 1; niveau--) {
    let divNiveau = document.createElement("div");
    divNiveau.className = "niveau";
    // Largeur réduite par niveau pour effet pyramide
    divNiveau.style.width = `${100 - (nomsNiveaux.length - niveau) * 7}%`;
    divNiveau.style.margin = "8px 0";
    divNiveau.style.border = "2px solid #c55a11";
    divNiveau.style.borderRadius = "10px";
    divNiveau.style.padding = "10px";
    divNiveau.style.backgroundColor = "#f9f1e7";
    divNiveau.style.boxShadow = "0 2px 8px rgba(197,90,17,0.3)";
    divNiveau.style.textAlign = "center";

    const titre = document.createElement("div");
    titre.className = "niveau-title";
    titre.style.fontWeight = "bold";
    titre.style.fontSize = "1.2em";
    titre.style.marginBottom = "10px";
    titre.textContent = `${nomsNiveaux[niveau - 1]} (Niveau ${niveau})`;
    divNiveau.appendChild(titre);

    const badgesContainer = document.createElement("div");
    badgesContainer.style.display = "flex";
    badgesContainer.style.flexWrap = "wrap";
    badgesContainer.style.justifyContent = "center";
    badgesContainer.style.gap = "8px";

    joueurs.filter(j => j.niveau === niveau).forEach(joueur => {
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = joueur.nom;
      badge.style.cursor = "default";
      badgesContainer.appendChild(badge);
    });

    divNiveau.appendChild(badgesContainer);
    vue.appendChild(divNiveau);
  }
}

// Formulaire défi
function afficherDefi(joueurs) {
  const container = document.getElementById('defi');
  container.innerHTML = `
    <h2>Lancer un défi</h2>
    <select id="joueurSelect"></select> VS 
    <select id="adversaireSelect"></select>
    <input type="text" id="score" placeholder="21-18,15-21,21-10"/>
    <button onclick="gererDefi()">✔ Valider</button>
  `;
  let js = document.getElementById("joueurSelect");
  let as = document.getElementById("adversaireSelect");
  joueurs.forEach(j => {
    js.innerHTML += `<option value="${j.id}">${j.nom}</option>`;
    as.innerHTML += `<option value="${j.id}">${j.nom}</option>`;
  });
}

// Stats
function afficherStats(joueurs) {
  const container = document.getElementById('stats');
  container.innerHTML = "<h2>Statistiques</h2>";
  joueurs.forEach(j => {
    container.innerHTML += `<div><b>${j.nom}</b> - 🏆 ${j.victoires} / ❌ ${j.defaites} - Niveau ${j.niveau}</div>`;
  });
}

// Ajouter joueur
async function ajouterJoueur() {
  let nom = document.getElementById('nouveauNom').value.trim();
  if (!nom) return alert("Nom vide");
  const check = await db.collection('joueurs').where('nom', '==', nom).get();
  if (!check.empty) return alert("Ce joueur existe déjà !");
  await db.collection('joueurs').add({ nom, niveau: 1, victoires: 0, defaites: 0 });
}

// Gérer défi
async function gererDefi() {
  let id1 = document.getElementById('joueurSelect').value;
  let id2 = document.getElementById('adversaireSelect').value;
  if (id1 === id2) return alert("Joueurs identiques !");
  let scoreTxt = document.getElementById('score').value.trim();
  if (!scoreTxt) return alert("Pas de score");

  let j1Doc = await db.collection('joueurs').doc(id1).get();
  let j2Doc = await db.collection('joueurs').doc(id2).get();
  let j1 = { id: j1Doc.id, ...j1Doc.data() };
  let j2 = { id: j2Doc.id, ...j2Doc.data() };

  let set1 = scoreTxt.split(',')[0].split('-').map(s => parseInt(s));
  let gagnant = set1[0] > set1[1] ? j1 : j2;
  let perdant = gagnant.id === j1.id ? j2 : j1;

  // Règles
  if (j1.niveau === j2.niveau) {
    if (gagnant.niveau < 10) gagnant.niveau++;
    if (perdant.niveau > 1) perdant.niveau--;
  } else if (perdant.niveau === gagnant.niveau + 1 && gagnant.id === j1.id) {
    gagnant.niveau++;
  } else if (gagnant.niveau === 9 && perdant.niveau === 10 && gagnant.id === j1.id) {
    gagnant.niveau = 10;
  }

  gagnant.victoires++;
  perdant.defaites++;

  await db.collection('joueurs').doc(gagnant.id).update(gagnant);
  await db.collection('joueurs').doc(perdant.id).update(perdant);
  await db.collection('defis').add({ joueur1: j1.nom, joueur2: j2.nom, score: scoreTxt, gagnant: gagnant.nom, date: new Date() });
}

// Synchronisation temps réel
db.collection('joueurs').orderBy('niveau', 'desc').onSnapshot(snap => {
  let joueurs = [];
  snap.forEach(doc => joueurs.push({ id: doc.id, ...doc.data() }));
  afficherPyramide(joueurs);
  afficherDefi(joueurs);
  afficherStats(joueurs);
});
