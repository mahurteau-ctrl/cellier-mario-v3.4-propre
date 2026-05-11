const STORAGE_KEY = "cellier_mario_v3_4";
let wines = [];
let mode = "all";
let editingId = null;
let currentPhotoData = null;
const currentYear = new Date().getFullYear();

/* -------------------- CHARGEMENT / SAUVEGARDE -------------------- */

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try { wines = JSON.parse(raw); } catch(e) { wines = []; }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wines));
}

/* -------------------- STATUT / TIMELINE -------------------- */

function getStatus(w) {
  const from = w.drinkFrom;
  const to = w.drinkTo;
  const year = new Date().getFullYear();

  if (!from && !to)
    return {label:"Inconnu", class:"unknown", code:"unknown"};

  if (from && year < from) {
    const diff = from - year;
    if (diff >= 3)
      return {label:"À garder (longue date)", class:"later-long", code:"later-long"};
    return {label:"À garder", class:"later", code:"later"};
  }

  if (from && to && year >= from && year <= to)
    return {label:"Prêt", class:"now", code:"now"};

  if (to && year > to)
    return {label:"Dernières années", class:"late", code:"late"};

  return {label:"Inconnu", class:"unknown", code:"unknown"};
}

function matchMode(code) {
  if (mode === "later") return code === "later" || code === "later-long";
  return mode === "all" || mode === code;
}

function renderTimeline(w) {
  const from = w.drinkFrom;
  const to = w.drinkTo;

  if (!from || !to || to <= from)
    return `<div class="timeline"></div>`;

  const total = to - from;
  const pos = ((currentYear - from) / total) * 100;
  const clamped = Math.max(0, Math.min(100, pos));

  return `
    <div class="timeline">
      <div class="bar" style="left:0; width:100%; background:#ddd;"></div>
      <div class="bar" style="left:${clamped}%; width:4px; background:#0078d4;"></div>
    </div>
  `;
}

/* -------------------- AFFICHAGE -------------------- */

function render() {
  const tbody = document.querySelector("#wineTable tbody");
  tbody.innerHTML = "";

  wines.forEach(w => {
    const st = getStatus(w);

    if (!matchMode(st.code)) continue;

    const photoHtml = w.photo
      ? `<img src="${w.photo}" class="wine-photo" onclick="window.open('${w.photo}','_blank')">`
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${w.year || ""}</td>
      <td><div class="wine-cell">${photoHtml}<span>${w.name}</span></div></td>
      <td>${w.type || ""}</td>
      <td>${w.location || ""}</td>
      <td>${w.region || ""}</td>
      <td>${w.price ? w.price + "$" : ""}</td>
      <td>${w.purchaseDate || ""}</td>
      <td>${(w.drinkFrom || "—") + "–" + (w.drinkTo || "—")}</td>
      <td><span class="tag ${st.class}">${st.label}</span></td>
      <td>${renderTimeline(w)}</td>
      <td>${w.consumed || ""}</td>
      <td>${(w.notes || "").replace(/\n/g,"<br>")}</td>
      <td class="actions">
        <button class="btn-secondary" data-action="edit" data-id="${w.id}">Éditer</button>
        <button class="btn-danger" data-action="delete" data-id="${w.id}">X</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* -------------------- FORMULAIRE -------------------- */

function resetForm() {
  editingId = null;
  currentPhotoData = null;
  document.querySelectorAll("#year,#name,#region,#type,#location,#price,#purchaseDate,#from,#to,#consumed,#photo,#notes")
    .forEach(el => el.value = "");
  document.getElementById("formStatus").textContent = "";
  document.getElementById("saveBtn").textContent = "Enregistrer la bouteille";
}

function fillForm(w) {
  editingId = w.id;
  currentPhotoData = null;

  document.getElementById("year").value = w.year || "";
  document.getElementById("name").value = w.name || "";
  document.getElementById("region").value = w.region || "";
  document.getElementById("type").value = w.type || "";
  document.getElementById("location").value = w.location || "";
  document.getElementById("price").value = w.price || "";
  document.getElementById("purchaseDate").value = w.purchaseDate || "";
  document.getElementById("from").value = w.drinkFrom || "";
  document.getElementById("to").value = w.drinkTo || "";
  document.getElementById("consumed").value = w.consumed || "";
  document.getElementById("notes").value = w.notes || "";

  document.getElementById("saveBtn").textContent = "Mettre à jour";
  document.getElementById("formStatus").textContent = "Mode édition";
}

/* -------------------- PHOTO -------------------- */

document.getElementById("photo").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return currentPhotoData = null;

  const reader = new FileReader();
  reader.onload = () => currentPhotoData = reader.result;
  reader.readAsDataURL(file);
});

/* -------------------- SAUVEGARDE / MISE À JOUR -------------------- */

document.getElementById("saveBtn").addEventListener("click", () => {
  const year = parseInt(document.getElementById("year").value) || null;
  const name = document.getElementById("name").value.trim();
  const region = document.getElementById("region").value.trim();
  const type = document.getElementById("type").value.trim();
  const location = document.getElementById("location").value.trim();
  const price = parseFloat(document.getElementById("price").value) || null;
  const purchaseDate = document.getElementById("purchaseDate").value.trim();
  const from = parseInt(document.getElementById("from").value) || null;
  const to = parseInt(document.getElementById("to").value) || null;
  const consumed = document.getElementById("consumed").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!name) {
    document.getElementById("formStatus").textContent = "Le nom du vin est obligatoire.";
    return;
  }

  if (editingId) {
    const idx = wines.findIndex(w => w.id === editingId);
    const old = wines[idx];

    wines[idx] = {
      ...old,
      year: year ?? old.year,
      name: name || old.name,
      region: region || old.region,
      type: type || old.type,
      location: location || old.location,
      price: price !== null ? price : old.price,
      purchaseDate: purchaseDate || old.purchaseDate,
      drinkFrom: from !== null ? from : old.drinkFrom,
      drinkTo: to !== null ? to : old.drinkTo,
      consumed: consumed || old.consumed,
      notes: notes || old.notes,
      photo: currentPhotoData !== null ? currentPhotoData : old.photo
    };

    document.getElementById("formStatus").textContent = "Bouteille mise à jour.";
  } else {
    wines.push({
      id: Date.now().toString(),
      year, name, region, type, location,
      price, purchaseDate,
      drinkFrom: from, drinkTo: to,
      consumed, notes,
      photo: currentPhotoData
    });

    document.getElementById("formStatus").textContent = "Bouteille ajoutée.";
  }

  saveData();
  render();
  setTimeout(() => document.getElementById("formStatus").textContent = "", 1500);
  resetForm();
});

/* -------------------- BOUTONS / ACTIONS -------------------- */

document.getElementById("resetBtn").addEventListener("click", resetForm);

document.querySelectorAll(".filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
    render();
  });
});

document.querySelector("#wineTable tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "delete") {
    if (confirm("Supprimer cette bouteille ?")) {
      wines = wines.filter(w => w.id !== id);
      saveData();
      render();
      if (editingId === id) resetForm();
    }
  }

  if (action === "edit") {
    const w = wines.find(w => w.id === id);
    if (w) fillForm(w);
  }
});

/* -------------------- IMPORT / EXPORT -------------------- */

function exportData() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cellier-export.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedWines = JSON.parse(e.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(importedWines));
      alert("Importation réussie !");
      location.reload();
    } catch (err) {
      alert("Erreur : fichier JSON invalide.");
    }
  };

  reader.readAsText(file);
}

document.getElementById("exportBtn").addEventListener("click", exportData);
document.getElementById("importFile").addEventListener("change", importData);

document.getElementById("importBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  e.preventDefault();
  document.getElementById("importFile").dispatchEvent(new MouseEvent("click", { bubbles: true }));
});

/* -------------------- INITIALISATION -------------------- */

loadData();
render();
