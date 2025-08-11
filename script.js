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

function showTab(tab) {
  document.getElementById("pyramide").style.display = tab === "pyramide" ? "" : "none";
  document.getElementById("defi").style.display = tab === "defi" ? "" : "none";
  document.getElementById("stats").style.display = tab === "stats" ? "" : "none";
}

// --- Canvas - nouvelle pyramide ---
const canvas = document.getElementById('canvasPyramide');
const ctx = canvas.getContext('2d');
const nombreNiveaux = 10;

function dessinerBadge(x, y, width, height, texte) {
  const radius = 14;
  ctx.fillStyle = "#ff914d";
  ctx.strokeStyle = "#c55a11";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.min(20, height * 0.7)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texte, x + width / 2, y + height / 2);
}

function afficherPyramide(joueurs) {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const paddingY = 24; // marge haut/bas
  const minHeight = 38;
  const levels = nombreNiveaux;
  const widthBase = W * 0.8;
  const minWidth = W * 0.18; // sommet
  const widthDiff = (widthBase - minWidth) / (levels - 1);

  // Calculer la hauteur de chaque niveau selon les badges
  let badgesParNiveau = [];
  let heightParNiveau = [];
  for (let i=0; i<levels; i++) {
    const niveau = levels-i;
    const joueursNiv = joueurs.filter(j=>j.niveau===niveau);
    badgesParNiveau[i]=joueursNiv.length;
    // hauteur proportionnelle au nombre de badges + min
    heightParNiveau[i] = Math.max(minHeight, 34 + Math.ceil(joueursNiv.length/4)*32);
  }
  const hauteurTotale = heightParNiveau.reduce((a,b)=>a+b,0) + paddingY*2;
  let y = (H - hauteurTotale) / 2 + paddingY;

  for (let i=0; i<levels; i++) {
    const niveau = levels-i;
    const joueursNiv = joueurs.filter(j=>j.niveau===niveau);

    // largeur du niveau
    const widthNiv = widthBase - i*widthDiff;
    const xNiv = (W-widthNiv-120)/2; // 120 pour zone nom niveau à droite

    // Ligne séparatrice supérieure
    ctx.strokeStyle = "#c55a11";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xNiv, y);
    ctx.lineTo(xNiv+widthNiv, y);
    ctx.stroke();

    // Badges
    const spaceX = widthNiv/(joueursNiv.length+1);
    const badgeW = Math.min(spaceX*0.8,110);
    const badgeH = heightParNiveau[i]*0.7;
    for (let k=0;k<joueursNiv.length;k++) {
      const xBadge = xNiv+spaceX*(k+1)-badgeW/2;
      const yBadge = y+heightParNiveau[i]/2-badgeH/2;
      dessinerBadge(xBadge, yBadge, badgeW, badgeH, joueursNiv[k].nom);
    }

    // Nom du niveau à droite
    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#c55a11";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${nomsNiveaux[niveau-1]} (Niv.${niveau})`, xNiv+widthNiv+20, y + heightParNiveau[i]/2);

    y += heightParNiveau[i];
  }
}

// --- Formulaire défi / stats inchangés ---
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

function afficherStats(joueurs) {
  const container = document.getElementById('stats');
  container.innerHTML = "<h2>Statistiques</h2>";
  joueurs.forEach(j => {
    container.innerHTML += `<div><b>${j.nom}</b> - 🏆 ${j.victoires} / ❌ ${j.defaites} - Niveau ${j.niveau}</div>`;
  });
}

async function ajouterJoueur() {
  let nom = document.getElementById('nouveauNom').value.trim();
  if(!nom) return alert("Nom vide");
  const check = await db.collection('joueurs').where('nom', '==', nom).get();
  if(!check.empty) return alert("Ce joueur existe déjà !");
  await db.collection('joueurs').add({ nom, niveau: 1, victoires: 0, defaites: 0 });
  document.getElementById('nouveauNom').value = '';
}

async function gererDefi() {
  let id1 = document.getElementById('joueurSelect').value;
  let id2 = document.getElementById('adversaireSelect').value;
  if(id1 === id2) return alert("Joueurs identiques !");
  let scoreTxt = document.getElementById('score').value.trim();
  if(!scoreTxt) return alert("Pas de score");

  let j1Doc = await db.collection('joueurs').doc(id1).get();
  let j2Doc = await db.collection('joueurs').doc(id2).get();
  let j1 = { id: j1Doc.id, ...j1Doc.data() };
  let j2 = { id: j2Doc.id, ...j2Doc.data() };

  let set1 = scoreTxt.split(',')[0].split('-').map(s => parseInt(s));
  let gagnant = set1[0] > set1[1] ? j1 : j2;
  let perdant = gagnant.id === j1.id ? j2 : j1;

  if(j1.niveau === j2.niveau) {
    if(gagnant.niveau < 10) gagnant.niveau++;
    if(perdant.niveau > 1) perdant.niveau--;
  } else if(perdant.niveau === gagnant.niveau + 1 && gagnant.id === j1.id) {
    gagnant.niveau++;
  } else if(gagnant.niveau === 9 && perdant.niveau === 10 && gagnant.id === j1.id) {
    gagnant.niveau = 10;
  }

  gagnant.victoires++;
  perdant.defaites++;

  await db.collection('joueurs').doc(gagnant.id).update({ niveau: gagnant.niveau, victoires: gagnant.victoires });
  await db.collection('joueurs').doc(perdant.id).update({ niveau: perdant.niveau, defaites: perdant.defaites });
  await db.collection('defis').add({ joueur1: j1.nom, joueur2: j2.nom, score: scoreTxt, gagnant: gagnant.nom, date: new Date() });

  document.getElementById('score').value = '';
}

// --- Synchronisation temps réel ---
db.collection('joueurs').orderBy('niveau', 'desc').onSnapshot(snapshot => {
  let joueurs = [];
  snapshot.forEach(doc => joueurs.push({ id: doc.id, ...doc.data() }));
  afficherPyramide(joueurs);
  afficherDefi(joueurs);
  afficherStats(joueurs);
});
