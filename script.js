// Frontend logic for CURMA site. Replace API_BASE with your deployed Google Apps Script Web App URL.
const API_BASE = "https://script.google.com/macros/s/AKfycbx4T9cVmCCqSTH1_WyulyegZklQshOX7sXYdUcmxwmwN4s3gH3p-B1RPiXHOhsRFG5j/exec";

const sampleAnnouncements = [
  { message: "Onam auditions start next week", link: "#programs" },
  { message: "Fresher helpdesk open for 2025 arrivals", link: "#registration" },
  { message: "Blanket Challenge 2025 – volunteer now", link: "#social" }
];

const samplePrograms = [
  { title: "Onam", description: "Main campus festival with Sadhya, Thiruvathira, and arts.", year: "2025", folderId: "" },
  { title: "Iftaar", description: "Community iftaar with students and staff.", year: "2025", folderId: "" },
  { title: "Vishu", description: "Vishu kani, cultural evening, and outreach.", year: "2025", folderId: "" }
];

const sampleSocial = [
  { title: "Blanket Challenge", year: "2025", description: "Blankets for campus workers during winter.", folderId: "" }
];

const sampleFootball = [
  { year: "2024", winner: "Dept. of Economics", runner: "Dept. of CS", score: "2 - 1" },
  { year: "2023", winner: "Dept. of Physics", runner: "Dept. of Commerce", score: "3 - 2 (ET)" }
];

const sampleMagazines = [
  { year: "2024", title: "Mazhavil", editor: "Editorial Board", pdfId: "", coverId: "" }
];

const sampleCommittee = [
  { year: "2024-25", president: "Name", secretary: "Name", treasurer: "Name", executives: "Team" },
  { year: "2023-24", president: "Name", secretary: "Name", treasurer: "Name", executives: "Team" }
];

const sampleGallery = [
  { title: "Onam 2024", folderId: "", thumb: "https://via.placeholder.com/600x400?text=Onam" },
  { title: "Iftaar 2024", folderId: "", thumb: "https://via.placeholder.com/600x400?text=Iftaar" },
  { title: "Blanket Challenge 2025", folderId: "", thumb: "https://via.placeholder.com/600x400?text=Social" }
];

// Helper: build Drive image URL from file ID
const driveImg = (id) => id ? `https://drive.google.com/uc?export=view&id=${id}` : "https://via.placeholder.com/800x500?text=Image";
const driveFile = (id) => id ? `https://drive.google.com/uc?export=download&id=${id}` : "#";

const qs = (sel) => document.querySelector(sel);

function renderAnnouncements(list) {
  const el = qs("#announcements");
  el.innerHTML = list.map(a => `<li>${a.link ? `<a href="${a.link}">${a.message}</a>` : a.message}</li>`).join("");
}

function renderPrograms(list) {
  const wrap = qs("#program-cards");
  wrap.innerHTML = list.map(p => `
    <div class="card">
      <p class="eyebrow">${p.year}</p>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      ${p.folderId ? `<a href="https://drive.google.com/drive/folders/${p.folderId}" target="_blank">View gallery →</a>` : ""}
    </div>`).join("");
}

function renderSocial(list) {
  const wrap = qs("#social-cards");
  wrap.innerHTML = list.map(s => `
    <div class="card">
      <p class="eyebrow">${s.year}</p>
      <h3>${s.title}</h3>
      <p>${s.description}</p>
      ${s.folderId ? `<a href="https://drive.google.com/drive/folders/${s.folderId}" target="_blank">Photos →</a>` : ""}
    </div>`).join("");
}

function renderFootball(rows) {
  const tbody = qs("#football-table tbody");
  tbody.innerHTML = rows.map(r => `<tr><td>${r.year}</td><td>${r.winner}</td><td>${r.runner}</td><td>${r.score}</td></tr>`).join("");
}

function renderFootballGallery(list) {
  const wrap = qs("#football-gallery");
  wrap.innerHTML = list.map(item => `
    <div class="tile"><img src="${driveImg(item.coverId || "")}" alt="${item.title}" /><span>${item.title || item.year}</span></div>`).join("");
}

function renderMagazines(list) {
  const wrap = qs("#magazine-cards");
  wrap.innerHTML = list.map(m => `
    <div class="card">
      <p class="eyebrow">${m.year}</p>
      <h3>${m.title}</h3>
      <p>${m.editor}</p>
      <div class="hero-actions">
        <a class="btn primary" href="${driveFile(m.pdfId)}" target="_blank">Download PDF</a>
        <a class="btn ghost" href="${driveImg(m.coverId)}" target="_blank">Cover</a>
      </div>
    </div>`).join("");
}

function renderCommittee(list) {
  const wrap = qs("#committee-cards");
  wrap.innerHTML = list.map(c => `
    <div class="card">
      <p class="eyebrow">${c.year}</p>
      <h3>President</h3><p>${c.president}</p>
      <h3>Secretary</h3><p>${c.secretary}</p>
      <h3>Treasurer</h3><p>${c.treasurer}</p>
      <p><strong>Executive Members:</strong> ${c.executives}</p>
    </div>`).join("");
}

function renderGallery(list) {
  const wrap = qs("#gallery-grid");
  wrap.innerHTML = list.map(g => `
    <div class="tile"><img src="${g.thumb}" alt="${g.title}" /><span>${g.title}</span></div>`).join("");
}

function renderByeLaw() {
  const content = qs("#byelaw-content");
  content.innerHTML = `
    <p><strong>Membership:</strong> Malayali students of CURAJ. Freshers submit details and await admin approval.</p>
    <p><strong>Leadership:</strong> President, Secretary, Treasurer, and Executive Members elected yearly.</p>
    <p><strong>Finance:</strong> Transparent budgeting; Treasurer maintains records; audits at term end.</p>
    <p><strong>Conduct:</strong> Inclusivity, cultural respect, and adherence to CURAJ policies.</p>
  `;
  qs("#byelaw-download").href = "https://drive.google.com/uc?export=download&id=BYELAW_PDF_ID";
}

function attachNavToggle() {
  const btn = qs(".nav-toggle");
  const nav = qs(".nav");
  btn.addEventListener("click", () => nav.classList.toggle("show"));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("show")));
}

async function submitRegistration(e) {
  e.preventDefault();
  const form = e.target;
  const status = qs("#form-status");
  status.textContent = "Submitting...";
  const data = new FormData(form);
  data.set("action", "register");
  const interests = Array.from(form.interests.selectedOptions).map(o => o.value);
  data.set("interests", interests.join(", "));
  try {
    const res = await fetch(API_BASE, { method: "POST", body: data });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "Failed");
    status.textContent = "Submitted. Await admin approval.";
    form.reset();
  } catch (err) {
    status.textContent = `Error: ${err.message}`;
  }
}

async function loginAdmin(e) {
  e.preventDefault();
  const status = qs("#admin-status");
  status.textContent = "Authenticating...";
  const payload = {
    action: "login",
    email: e.target.adminEmail.value,
    password: e.target.adminPassword.value
  };
  try {
    const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "Login failed");
    status.textContent = "Logged in";
    qs("#admin-panel").classList.remove("hidden");
    localStorage.setItem("curmaToken", json.token);
    loadMembers();
  } catch (err) {
    status.textContent = `Error: ${err.message}`;
  }
}

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-nav button").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
  document.querySelectorAll(".admin-tab").forEach(div => div.classList.toggle("hidden", div.dataset.tabContent !== tab));
}

function initAdminTabs() {
  document.querySelectorAll(".admin-nav button").forEach(btn => btn.addEventListener("click", () => switchAdminTab(btn.dataset.tab)));
}

const getToken = () => localStorage.getItem("curmaToken") || "";

async function loadMembers(filterInterest = "") {
  const wrap = qs("#members-table-wrap");
  wrap.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}?action=listMembers&interest=${encodeURIComponent(filterInterest)}&token=${encodeURIComponent(getToken())}`);
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "Failed");
    const rows = json.members || [];
    wrap.innerHTML = `<table><thead><tr><th>Name</th><th>Course</th><th>Year</th><th>Interests</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${r.fullName}</td><td>${r.course}</td><td>${r.year}</td><td>${r.interests}</td><td>${r.status}</td>
        <td><button data-action="approve" data-id="${r.id}">Approve</button> <button data-action="reject" data-id="${r.id}">Reject</button></td></tr>`).join("")}
    </tbody></table>`;
    wrap.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => updateMember(btn.dataset.action, btn.dataset.id)));
  } catch (err) {
    wrap.innerHTML = `Error: ${err.message}`;
  }
}

async function updateMember(action, id) {
  try {
    const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, token: getToken() }) });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "Failed");
    loadMembers(qs("#filter-interest").value);
  } catch (err) {
    alert(err.message);
  }
}

function downloadCSV() {
  window.location = `${API_BASE}?action=exportMembers&token=${encodeURIComponent(getToken())}`;
}

function initAdminForms() {
  qs("#filter-interest").addEventListener("input", (e) => loadMembers(e.target.value));
  qs("#download-members").addEventListener("click", downloadCSV);
  const cfg = [
    { form: "#program-form", action: "upsertProgram" },
    { form: "#social-form", action: "upsertSocial" },
    { form: "#sports-form", action: "upsertSports" },
    { form: "#magazine-form", action: "upsertMagazine" },
    { form: "#announcement-form", action: "postAnnouncement" }
  ];
  cfg.forEach(({ form, action }) => {
    const el = qs(form);
    el.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(el).entries());
      data.action = action;
      data.token = getToken();
      try {
        const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || "Failed");
        alert("Saved");
        el.reset();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function hydrateStatic() {
  renderAnnouncements(sampleAnnouncements);
  renderPrograms(samplePrograms);
  renderSocial(sampleSocial);
  renderFootball(sampleFootball);
  renderFootballGallery(sampleGallery);
  renderMagazines(sampleMagazines);
  renderCommittee(sampleCommittee);
  renderGallery(sampleGallery);
  renderByeLaw();
  qs("#year").textContent = new Date().getFullYear();
}

function init() {
  hydrateStatic();
  attachNavToggle();
  qs("#registration-form").addEventListener("submit", submitRegistration);
  qs("#admin-login").addEventListener("submit", loginAdmin);
  initAdminTabs();
  initAdminForms();
}

window.addEventListener("DOMContentLoaded", init);

