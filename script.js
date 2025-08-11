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

// === Variables globales ===
const nomsNiveaux = [
  "Renardeaux", "Petits roux", "Apprentis rusés", "Jeunes goupils",
  "Renards vifs", "Goupils rusés", "Renards éclaireurs", "Renards stratèges",
  "Grands roux", "Renard Majestieux"
];
let challengerId = null;
let challengerNom = "";

// Canvas
const canvas = document.getElementById('canvasPyramide');
const ctx = canvas.getContext('2d');

// Navigation onglets
function showTab(tab) {
  ["pyramide", "defi", "stats", "regles"].forEach(id =>
    document.getElementById(id).style.display = (tab === id ? "" : "none")
  );
}

// Dessins badges + bulle
function dessinerBadge(x, y, w, h, texte) { /* ... */ }
function dessinerBulleChallenger(x, y, nom) { /* ... */ }

// Affiche pyramide inversée
function afficherPyramide(joueurs) {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const baseWidth = W * 0.65, topWidth = W * 0.25;
  const heightPerLevel = H / nomsNiveaux.length;

  for (let i = 0; i < nomsNiveaux.length; i++) {
    const lvl = i + 1;
    const y = (nomsNiveaux.length - 1 - i) * heightPerLevel;
    const widthLvl = baseWidth - ((lvl - 1) * (baseWidth - topWidth) / (nomsNiveaux.length - 1));
    const x = (W - widthLvl) / 2 - 80;

    ctx.strokeStyle = "#c55a11"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + widthLvl, y); ctx.stroke();

    ctx.fillStyle = "#c55a11"; ctx.font = "bold 16px Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(`${nomsNiveaux[lvl-1]} (Niv.${lvl})`, x + widthLvl + 10, y + heightPerLevel/2);

    const joueursNiv = joueurs.filter(j => j.niveau === lvl);
    const spaceX = widthLvl / (joueursNiv.length + 1);
    const badgeW = Math.min(spaceX*0.8, 100), badgeH = heightPerLevel*0.6;
    joueursNiv.forEach((joueur, idx) => {
      dessinerBadge(x + spaceX*(idx+1) - badgeW/2, y + (heightPerLevel - badgeH)/2, badgeW, badgeH, joueur.nom);
    });
  }
  dessinerBulleChallenger(100, (0 + heightPerLevel) / 2 + heightPerLevel / 2, challengerNom);
}

// Formulaire défi
function afficherDefi(joueurs) { /* inchangé */ }

// Stats personnelles avec choix joueur
function afficherStats(joueurs) {
  const container = document.getElementById('stats');
  container.innerHTML = `
    <h2>Statistiques</h2>
    <label>Choisir joueur :</label>
    <select id="selectStats">
      <option value="">-- Sélectionner un joueur --</option>
      ${joueurs.map(j => `<option value="${j.id}">${j.nom}</option>`).join('')}
    </select>
    <div id="zoneStatsPerso"></div>
  `;
  document.getElementById('selectStats').addEventListener('change', async function() {
    const joueurId = this.value, zone = document.getElementById('zoneStatsPerso');
    zone.innerHTML = "";
    if (!joueurId) return;
    const joueurDoc = await db.collection('joueurs').doc(joueurId).get();
    if (!joueurDoc.exists) { zone.innerHTML = "Joueur introuvable."; return; }
    const joueur = { id: joueurDoc.id, ...joueurDoc.data() };
    zone.innerHTML = `<h3>${joueur.nom}</h3><p>Niveau : ${joueur.niveau}</p><p>Victoires : ${joueur.victoires} | Défaites : ${joueur.defaites}</p>`;
    const matchs = [];
    (await db.collection('defis').where('joueur1', '==', joueur.nom).get()).forEach(doc => matchs.push(doc.data()));
    (await db.collection('defis').where('joueur2', '==', joueur.nom).get()).forEach(doc => matchs.push(doc.data()));
    matchs.sort((a,b) => (b.date?.seconds||0) - (a.date?.seconds||0));
    if (!matchs.length) { zone.innerHTML += "<p>Aucun match</p>"; return; }
    let html = `<table><thead><tr><th>Date</th><th>Adversaire</th><th>Score</th><th>Résultat</th></tr></thead><tbody>`;
    matchs.forEach(m => {
      const d = new Date(m.date.seconds*1000), adv = m.joueur1===joueur.nom ? m.joueur2 : m.joueur1;
      const victoire = m.gagnant === joueur.nom;
      html += `<tr><td>${d.toLocaleDateString()} ${d.toLocaleTimeString().slice(0,5)}</td>
               <td>${adv}</td><td>${m.score}</td>
               <td class="result-${victoire?'victoire':'defaite'}">${victoire?'Victoire':'Défaite'}</td></tr>`;
    });
    zone.innerHTML += html + "</tbody></table>";
  });
}

// Onglet règles
function afficherRegles() { /* inchangé de la version précédente */ }

// Gérer défi
async function gererDefi() { /* version corrigée N9/N10 + perdant descend */ }

// Écoutes
db.collection('meta').doc('challenger').onSnapshot(doc => {
  challengerId = doc.exists ? doc.data().id : null;
  challengerNom = doc.exists ? doc.data().nom : "";
});
db.collection('joueurs').orderBy('niveau', 'desc').onSnapshot(snap => {
  const joueurs = [];
  snap.forEach(doc => joueurs.push({ id: doc.id, ...doc.data() }));
  afficherPyramide(joueurs);
  afficherDefi(joueurs);
  afficherStats(joueurs);
});
afficherRegles();


