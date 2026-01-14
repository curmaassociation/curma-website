/* Google Apps Script backend for CURMA
 * - Stores members, programs, social, sports, magazine, announcements in Google Sheets
 * - Stores images/PDFs in Google Drive
 * - Provides admin-auth endpoints
 * Replace PLACEHOLDER IDs before deploy.
 */

const CONFIG = {
  SHEET_ID: "https://docs.google.com/spreadsheets/d/1IWSxdJ5RXOY2r3zQBzw73kglRK8_y2Wk5jUw0VyTMj8/edit?gid=0#gid=0",
  DRIVE_ROOT: "https://drive.google.com/drive/folders/1NZKW4oeVRjH8PVVTX38pplwNS5PkUaKt?usp=drive_link",
  MEMBERS_FOLDER: "https://drive.google.com/drive/folders/1BfULsHZbZcoM9QoSyW-CBix9G8_I7TSo?usp=drive_link", // e.g., root/CURMA/Members
  SECRET: PropertiesService.getScriptProperties().getProperty("AUTH_SECRET") || "CHANGE_ME", // set in Script Properties
  ADMIN_USERS: [
    { email: "president@curaj.ac.in", password: "changeme", role: "President" },
    { email: "secretary@curaj.ac.in", password: "changeme", role: "Secretary" },
    { email: "treasurer@curaj.ac.in", password: "changeme", role: "Treasurer" }
  ],
  TOKEN_TTL_MS: 24 * 60 * 60 * 1000
};

function doGet(e) {
  const action = e.parameter.action;
  const res = ContentService.createTextOutput();
  setCors(res);
  if (action === "listMembers") {
    if (!requireAuth({ token: e.parameter.token })) return jsonResponse({ error: "Unauthorized" }, res, 401);
    return jsonResponse(listMembers(e.parameter.interest || ""), res);
  }
  if (action === "exportMembers") {
    if (!requireAuth({ token: e.parameter.token })) return jsonResponse({ error: "Unauthorized" }, res, 401);
    return exportMembers(res);
  }
  if (action === "health") return jsonResponse({ ok: true }, res);
  return jsonResponse({ error: "Unknown action" }, res, 400);
}

function doPost(e) {
  const res = ContentService.createTextOutput();
  setCors(res);
  const ct = e.contentType || "";
  if (ct.includes("multipart/form-data")) {
    const action = e.parameter.action;
    if (action === "register") return handleRegistration(e, res);
  }
  const body = parseJsonSafe(e.postData && e.postData.contents) || {};
  const action = body.action || (e.parameter && e.parameter.action);
  if (action === "login") return handleLogin(body, res);
  if (!requireAuth(body)) return jsonResponse({ error: "Unauthorized" }, res, 401);
  switch (action) {
    case "approve": return jsonResponse(updateStatus(body.id, "Approved"), res);
    case "reject": return jsonResponse(updateStatus(body.id, "Rejected"), res);
    case "upsertProgram": return jsonResponse(upsertSheetRow("Programs", body), res);
    case "upsertSocial": return jsonResponse(upsertSheetRow("Social", body), res);
    case "upsertSports": return jsonResponse(upsertSheetRow("Sports", body), res);
    case "upsertMagazine": return jsonResponse(upsertSheetRow("Magazine", body), res);
    case "postAnnouncement": return jsonResponse(upsertSheetRow("Announcements", body), res);
    default: return jsonResponse({ error: "Unknown action" }, res, 400);
  }
}

function handleLogin(body, res) {
  const user = CONFIG.ADMIN_USERS.find(u => u.email === body.email);
  if (!user || user.password !== body.password) return jsonResponse({ error: "Invalid credentials" }, res, 401);
  const token = signToken(user.email, user.role);
  return jsonResponse({ token, role: user.role }, res);
}

function handleRegistration(e, res) {
  const sheet = getSheet("Members", ["id","timestamp","fullName","course","department","year","phone","email","whatsapp","hostel","nativePlace","interests","photoUrl","status"]);
  const id = Utilities.getUuid();
  const blob = e.files && e.files.photo ? e.files.photo : null;
  let photoUrl = "";
  if (blob) {
    const folder = DriveApp.getFolderById(CONFIG.MEMBERS_FOLDER);
    const file = folder.createFile(blob);
    file.setName(`${id}-${blob.getName()}`);
    photoUrl = file.getUrl();
  }
  const row = [
    id,
    new Date(),
    e.parameter.fullName,
    e.parameter.course,
    e.parameter.department,
    e.parameter.year,
    e.parameter.phone,
    e.parameter.email,
    e.parameter.whatsapp,
    e.parameter.hostel,
    e.parameter.nativePlace,
    e.parameter.interests,
    photoUrl,
    "Pending"
  ];
  sheet.appendRow(row);
  return jsonResponse({ ok: true, id }, res);
}

function listMembers(interest) {
  const sheet = getSheet("Members");
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const members = data.filter(r => r[0]).map(r => toObj(headers, r));
  const filtered = interest ? members.filter(m => (m.interests || "").toLowerCase().includes(interest.toLowerCase())) : members;
  return { members: filtered };
}

function updateStatus(id, status) {
  const sheet = getSheet("Members");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 14).setValue(status); // status column
      return { ok: true };
    }
  }
  return { error: "Not found" };
}

function upsertSheetRow(name, body) {
  const sheet = getSheet(name);
  const headers = sheet.getDataRange().getValues()[0];
  const idIndex = headers.indexOf("id");
  const id = body.id || Utilities.getUuid();
  const rowMap = headers.map(h => body[h] || "");
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowMap]);
      found = true; break;
    }
  }
  if (!found) sheet.appendRow(rowMap.map((v, idx) => idx === idIndex ? id : v));
  return { ok: true, id };
}

function exportMembers(res) {
  const sheet = getSheet("Members");
  const data = sheet.getDataRange().getValues();
  const csv = data.map(r => r.map(cell => typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell).join(",")).join("\n");
  const out = res || ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.CSV);
  out.setContent(csv);
  setCors(out);
  return out;
}

// Helpers
function getSheet(name, headers) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) sheet.appendRow(headers);
  }
  return sheet;
}

function toObj(headers, row) {
  const o = {};
  headers.forEach((h, i) => o[h] = row[i]);
  return o;
}

function parseJsonSafe(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch (_) { return null; }
}

function jsonResponse(obj, res, status) {
  const out = res || ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  out.setContent(JSON.stringify(obj));
  setCors(out);
  return out;
}

function signToken(email, role) {
  const ts = Date.now();
  const base = `${email}|${role}|${ts}`;
  const sig = Utilities.computeHmacSha256Signature(base, CONFIG.SECRET);
  const token = Utilities.base64EncodeWebSafe(base + "|" + Utilities.base64EncodeWebSafe(sig));
  return token;
}

function verifyToken(token) {
  if (!token) return null;
  const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
  const parts = decoded.split("|");
  if (parts.length !== 4) return null;
  const [email, role, tsStr, sig] = parts;
  const base = `${email}|${role}|${tsStr}`;
  const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(base, CONFIG.SECRET));
  if (expected !== sig) return null;
  if (Date.now() - Number(tsStr) > CONFIG.TOKEN_TTL_MS) return null;
  return { email, role };
}

function requireAuth(body) {
  const raw = (body && body.token) || "";
  const ok = verifyToken(raw);
  return Boolean(ok);
}

// CORS preflight support
function doOptions() {
  const out = ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
  setCors(out);
  return out;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
