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

// === Variables ===
const nomsNiveaux = [
  "Renardeaux", "Petits roux", "Apprentis rusés", "Jeunes goupils",
  "Renards vifs", "Goupils rusés", "Renards éclaireurs", "Renards stratèges",
  "Grands roux", "Renard Majestieux"
];
let challengerId = null;
let challengerNom = "";

// === Canvas ===
const canvas = document.getElementById('canvasPyramide');
const ctx = canvas.getContext("2d");

// ===== Navigation onglets =====
function showTab(tab) {
  ["pyramide", "defi", "stats", "regles"].forEach(
    id => document.getElementById(id).style.display = (tab === id ? "" : "none")
  );
}

// ===== Dessin badges & bulle =====
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

function dessinerBulleChallenger(x, y, nom) {
  ctx.beginPath();
  ctx.arc(x, y, 60, 0, Math.PI * 2);
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

// ===== Affichage pyramide (Niv1 large en bas) =====
function afficherPyramide(joueurs) {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const baseWidth = W * 0.65, topWidth = W * 0.25;
  const heightPerLevel = H / nomsNiveaux.length;

  for (let i = 0; i < nomsNiveaux.length; i++) {
    const lvl = i + 1; // 1 = bas
    const y = (nomsNiveaux.length - lvl) * heightPerLevel;
    const widthLvl = baseWidth - ((lvl - 1) * (baseWidth - topWidth) / (nomsNiveaux.length - 1));
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
    const badgeW = Math.min(spaceX * 0.8, 100), badgeH = heightPerLevel * 0.6;
    joueursNiv.forEach((joueur, idx) => {
      dessinerBadge(x + spaceX * (idx + 1) - badgeW / 2,
                    y + (heightPerLevel - badgeH) / 2,
                    badgeW, badgeH, joueur.nom);
    });
  }
  // bulle challenger à gauche, tout en haut, sur la ligne niveau 10
  dessinerBulleChallenger(100, heightPerLevel / 2, challengerNom);
}

// ===== Defi =====
function afficherDefi(joueurs) {
  const container = document.getElementById('defi');
  container.innerHTML = `
    <h2>Lancer un défi</h2>
    <select id="joueurSelect"></select> VS
    <select id="adversaireSelect"></select>
    <input type="text" id="score" placeholder="21-18,15-21,21-10"/>
    <button onclick="gererDefi()">✔ Valider</button>
  `;
  const js = document.getElementById("joueurSelect");
  const as = document.getElementById("adversaireSelect");
  joueurs.forEach(j => {
    js.innerHTML += `<option value="${j.id}">${j.nom}</option>`;
    as.innerHTML += `<option value="${j.id}">${j.nom}</option>`;
  });
}

// ===== Stats personnelles =====
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
    zone.innerHTML = `<h3>${joueur.nom}</h3>
                      <p>Niveau : ${joueur.niveau}</p>
                      <p>Victoires : ${joueur.victoires} | Défaites : ${joueur.defaites}</p>`;

    const matchs = [];
    (await db.collection('defis').where('joueur1', '==', joueur.nom).get()).forEach(doc => matchs.push(doc.data()));
    (await db.collection('defis').where('joueur2', '==', joueur.nom).get()).forEach(doc => matchs.push(doc.data()));
    matchs.sort((a,b) => (b.date?.seconds||0) - (a.date?.seconds||0));

    if (!matchs.length) { zone.innerHTML += "<p>Aucun match</p>"; return; }

    let html = `<table><thead><tr><th>Date</th><th>Adversaire</th><th>Score</th><th>Résultat</th></tr></thead><tbody>`;
    matchs.forEach(m => {
      const d = new Date(m.date.seconds * 1000);
      const adv = m.joueur1 === joueur.nom ? m.joueur2 : m.joueur1;
      const victoire = m.gagnant === joueur.nom;
      html += `<tr><td>${d.toLocaleDateString()} ${d.toLocaleTimeString().slice(0,5)}</td>
                   <td>${adv}</td><td>${m.score}</td>
                   <td class="result-${victoire?'victoire':'defaite'}">${victoire?'Victoire':'Défaite'}</td></tr>`;
    });
    zone.innerHTML += html + "</tbody></table>";
  });
}

// ===== Règles =====
function afficherRegles() {
  document.getElementById('regles').innerHTML = `
    <h2>Règles du Championnat</h2>
    <ul>
      <li>Niveau 1 = base large ; Niveau 10 = sommet étroit (plus on monte, plus la place est rare !).</li>
      <li>Si le niveau 10 est vide : premier match Niv9 vs Niv9 : vainqueur monte direct, perdant descend à Niv8.</li>
      <li>Si le niveau 10 est occupé : Niv9 vs Niv9 → vainqueur devient Challenger (reste Niv9), perdant descend à Niv8.</li>
      <li>Seul le Challenger peut défier le sommet s’il est occupé.</li>
      <li>Victoire du Challenger : il prend la place de Niv10, l’autre descend en Niv9.</li>
      <li>Défaite du Challenger : il retourne en Niv9, nouvelle sélection nécessaire.</li>
      <li>Défis classiques : montée et descente d’un niveau dans les autres cas, selon résultat.</li>
    </ul>
  `;
}

// ===== Ajouter joueur =====
async function ajouterJoueur() {
  const nom = document.getElementById('nouveauNom').value.trim();
  if (!nom) return alert("Nom vide");
  const check = await db.collection('joueurs').where('nom', '==', nom).get();
  if (!check.empty) return alert("Ce joueur existe déjà !");
  await db.collection('joueurs').add({ nom, niveau: 1, victoires: 0, defaites: 0 });
}

// ===== Gérer défi (toutes règles N9/N10, Challenger) =====
async function gererDefi() {
  const id1 = document.getElementById('joueurSelect').value;
  const id2 = document.getElementById('adversaireSelect').value;
  if (id1 === id2) return alert("Joueurs identiques !");
  const scoreTxt = document.getElementById('score').value.trim();
  if (!scoreTxt) return alert("Pas de score");

  const j1Doc = await db.collection('joueurs').doc(id1).get();
  const j2Doc = await db.collection('joueurs').doc(id2).get();
  let j1 = { id: j1Doc.id, ...j1Doc.data() };
  let j2 = { id: j2Doc.id, ...j2Doc.data() };

  const set1 = scoreTxt.split(',')[0].split('-').map(s => parseInt(s));
  let gagnant = set1[0] > set1[1] ? j1 : j2;
  let perdant = gagnant.id === j1.id ? j2 : j1;

  const niv10Snap = await db.collection('joueurs').where('niveau', '==', 10).get();
  const niv10Occupe = !niv10Snap.empty;

  // Spécifique N9 vs N9
  if (j1.niveau === 9 && j2.niveau === 9) {
    if (!niv10Occupe) {
      // Premier accès sommet libre : montée directe, perdant descend !
      gagnant.niveau = 10;
      perdant.niveau = 8;
      gagnant.victoires++;
      perdant.defaites++;
      await db.collection('joueurs').doc(gagnant.id).update(gagnant);
      await db.collection('joueurs').doc(perdant.id).update(perdant);
      await db.collection('defis').add({
        joueur1: j1.nom, joueur2: j2.nom, score: scoreTxt,
        gagnant: gagnant.nom, date: new Date()
      });
      alert(`${gagnant.nom} monte directement au sommet !`);
      return;
    } else if (!challengerId) {
      // Sélection du challenger, perdant descend N8
      await db.collection('meta').doc('challenger').set({ id: gagnant.id, nom: gagnant.nom });
      perdant.niveau = 8;
      gagnant.victoires++;
      perdant.defaites++;
      await db.collection('joueurs').doc(gagnant.id).update(gagnant);
      await db.collection('joueurs').doc(perdant.id).update(perdant);
      await db.collection('defis').add({
        joueur1: j1.nom, joueur2: j2.nom, score: scoreTxt,
        gagnant: gagnant.nom, date: new Date()
      });
      alert(`${gagnant.nom} devient Challenger !`);
      return;
    }
  }

  // Duel Challenger vs Niv10
  if (challengerId && (j1.id === challengerId || j2.id === challengerId)
      && (j1.niveau === 10 || j2.niveau === 10)) {
    if (gagnant.id === challengerId) {
      await db.collection('joueurs').doc(gagnant.id).update({ niveau: 10 });
      await db.collection('joueurs').doc(perdant.id).update({ niveau: 9 });
      alert(`Le challenger ${gagnant.nom} prend le sommet !`);
    } else {
      await db.collection('joueurs').doc(challengerId).update({ niveau: 9 });
      alert(`Le challenger ${challengerNom} a perdu et retourne Niv9.`);
    }
    await db.collection('meta').doc('challenger').delete();
    return;
  }

  // Blocage N9 -> N10 si sommet occupé et pas challenger
  if ((j1.niveau === 9 || j2.niveau === 9) && (j1.niveau === 10 || j2.niveau === 10) && niv10Occupe && !challengerId) {
    alert("Seul le challenger peut défier le Niveau 10.");
    return;
  }

  // Règles classiques
  if (j1.niveau === j2.niveau) {
    if (gagnant.niveau < 10) gagnant.niveau++;
    if (perdant.niveau > 1) perdant.niveau--;
  } else if (perdant.niveau === gagnant.niveau + 1) {
    gagnant.niveau++;
  }

  gagnant.victoires++; perdant.defaites++;
  await db.collection('joueurs').doc(gagnant.id).update(gagnant);
  await db.collection('joueurs').doc(perdant.id).update(perdant);
  await db.collection('defis').add({
    joueur1: j1.nom, joueur2: j2.nom, score: scoreTxt, gagnant: gagnant.nom, date: new Date()
  });
}

// ===== Écoutes live DB =====
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
