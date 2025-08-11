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
  document.getElementById("defi").style.display = tab === "defi" ? "" : "none";
  document.getElementById("stats").style.display = tab === "stats" ? "" : "none";
}

// Dessin badge
function dessinerBadge(x, y, w, h, texte) {
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = "#ff914d";
  ctx.fill();
  ctx.strokeStyle = "#c55a11";
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texte, x + w / 2, y + h / 2);
}

// Dessin bulle challenger
function dessinerBulleChallenger(x, y, nom) {
  ctx.beginPath();
  ctx.arc(x, y, 60, 0, 2 * Math.PI);
  ctx.fillStyle = "#ee7b23";
  ctx.fill();
  ctx.strokeStyle = "#c55a11";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CHALLENGER", x, y - 20);
  ctx.font = "bold 18px Arial";
  ctx.fillText(nom || "Vide", x, y + 15);
}

// Affichage pyramide
function afficherPyramide(joueurs) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const baseWidth = W * 0.65;
  const topWidth = W * 0.25;
  const heightPerLevel = H / nomsNiveaux.length;

  for (let i = 0; i < nomsNiveaux.length; i++) {
    const lvl = nomsNiveaux.length - i;
    const y = i * heightPerLevel;
    const widthLvl = baseWidth - (i * (baseWidth - topWidth) / (nomsNiveaux.length - 1));
    const x = (W - widthLvl) / 2 - 80;

    ctx.strokeStyle = "#c55a11";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + widthLvl, y);
    ctx.stroke();

    ctx.fillStyle = "#c55a11";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${nomsNiveaux[lvl - 1]} (Niv.${lvl})`, x + widthLvl + 10, y + heightPerLevel / 2);

    const joueursNiv = joueurs.filter(j => j.niveau === lvl);
    const spaceX = widthLvl / (joueursNiv.length + 1);
    const badgeW = Math.min(spaceX * 0.8, 100);
    const badgeH = heightPerLevel * 0.6;
    joueursNiv.forEach((joueur, idx) => {
      const bx = x + spaceX * (idx + 1) - badgeW / 2;
      const by = y + (heightPerLevel - badgeH) / 2;
      dessinerBadge(bx, by, badgeW, badgeH, joueur.nom);
    });
  }

  // Position bulle challenger
  const centerY = (0 + heightPerLevel) / 2 + heightPerLevel / 2;
  dessinerBulleChallenger(100, centerY, challengerNom);
}

// Afficher formulaire
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

// Afficher stats
function afficherStats(joueurs) {
  const container = document.getElementById('stats');
  container.innerHTML = "<h2>Statistiques</h2>";
  joueurs.forEach(j => {
    container.innerHTML += `<div><b>${j.nom}</b> - 🏆 ${j.victoires} / ❌ ${j.defaites} - Niveau ${j.niveau}</div>`;
  });
}

// Ajouter un joueur
async function ajouterJoueur() {
  let nom = document.getElementById('nouveauNom').value.trim();
  if (!nom) return alert("Nom vide");
  const check = await db.collection('joueurs').where('nom', '==', nom).get();
  if (!check.empty) return alert("Ce joueur existe déjà !");
  await db.collection('joueurs').add({ nom, niveau: 1, victoires: 0, defaites: 0 });
}

// Gerer un défi
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

  // Vérifier si déjà un Niv10
  const joueursNiv10 = await db.collection('joueurs').where('niveau', '==', 10).get();
  const dejaUnNiv10 = !joueursNiv10.empty;

  // Cas Niv9 vs Niv9 → Challenger
  if (j1.niveau === 9 && j2.niveau === 9 && !challengerId) {
    await db.collection('meta').doc('challenger').set({ id: gagnant.id, nom: gagnant.nom });
    alert(`${gagnant.nom} devient challenger !`);
    return; // STOP ici, pas de montée
  }

  // Cas Challenger vs Niv10
  if (challengerId && (j1.id === challengerId || j2.id === challengerId) &&
      (j1.niveau === 10 || j2.niveau === 10)) {
    if (gagnant.id === challengerId) {
      await db.collection('joueurs').doc(gagnant.id).update({ niveau: 10 });
      await db.collection('joueurs').doc(perdant.id).update({ niveau: 9 });
      alert(`Le challenger ${gagnant.nom} prend la place au sommet !`);
    } else {
      await db.collection('joueurs').doc(challengerId).update({ niveau: 9 });
      alert(`Le challenger ${challengerNom} a perdu et retourne en Niv9.`);
    }
    await db.collection('meta').doc('challenger').delete();
    return;
  }

  // Empêche défi contre Niv10 hors challenger
  if ((j1.niveau === 10 || j2.niveau === 10) &&
      (j1.niveau === 9 || j2.niveau === 9) && !challengerId) {
    alert("Seul le challenger peut défier le Niveau 10.");
    return;
  }

  // Règles classiques (avec blocage montée vers Niv10 si déjà occupé)
  if (j1.niveau === j2.niveau) {
    if (gagnant.niveau < 9) gagnant.niveau++;
    else if (gagnant.niveau === 9 && !dejaUnNiv10) gagnant.niveau++;
    if (perdant.niveau > 1) perdant.niveau--;
  } else if (perdant.niveau === gagnant.niveau + 1 && gagnant.id === j1.id) {
    if (gagnant.niveau < 9) gagnant.niveau++;
    else if (gagnant.niveau === 9 && !dejaUnNiv10) gagnant.niveau++;
  }

  gagnant.victoires++;
  perdant.defaites++;

  await db.collection('joueurs').doc(gagnant.id).update(gagnant);
  await db.collection('joueurs').doc(perdant.id).update(perdant);
  await db.collection('defis').add({
    joueur1: j1.nom, joueur2: j2.nom, score: scoreTxt,
    gagnant: gagnant.nom, date: new Date()
  });
}

// Écoute challenger
db.collection('meta').doc('challenger').onSnapshot(doc => {
  if (doc.exists) {
    challengerId = doc.data().id;
    challengerNom = doc.data().nom;
  } else {
    challengerId = null;
    challengerNom = "";
  }
});

// Écoute joueurs et maj affichage
db.collection('joueurs').orderBy('niveau', 'desc').onSnapshot(snap => {
  let joueurs = [];
  snap.forEach(doc => joueurs.push({ id: doc.id, ...doc.data() }));
  afficherPyramide(joueurs);
  afficherDefi(joueurs);
  afficherStats(joueurs);
});
