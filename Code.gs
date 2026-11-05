/**
 * ==============================================================================
 * SIKAD DIGITAL — SISTEM ADMINISTRASI GURU PROFESIONAL
 * Versi Tahap 2–7 (Lengkap + Import CSV + Cetak Daftar Hadir + Polish)
 * - Login + Session + Role-based Authorization
 * - Migrasi Database aman
 * - Soft Delete + Audit Log
 * - Master Data lengkap (Siswa, Guru, Kelas, Mapel, Tahun Ajaran)
 * - Pembagian Tugas Mengajar
 * - Dashboard data
 * - Kompatibilitas penuh dengan data lama
 * ==============================================================================
 */

// ====================== KONSTANTA ======================
const SHEET_NAMES = {
  USERS: "DB_Users",
  GURU: "DB_Guru",
  SISWA: "DB_Siswa",
  KELAS: "DB_Kelas",
  MAPEL: "DB_Mapel",
  TAHUN_AJARAN: "DB_TahunAjaran",
  TUGAS_MENGAJAR: "DB_TugasMengajar",
  JADWAL: "DB_Jadwal",
  ABSENSI: "DB_Absensi",
  JURNAL: "DB_Jurnal",
  NILAI: "DB_Nilai",
  CATATAN_SISWA: "DB_CatatanSiswa",
  AUDIT_LOG: "DB_AuditLog",
  PENGATURAN: "DB_Pengaturan"
};

const ALLOWED_SHEETS = Object.values(SHEET_NAMES);

const SHEET_SCHEMAS = {
  [SHEET_NAMES.USERS]: [
    "ID", "Email", "PasswordHash", "Nama", "Role", "GuruID", "Status",
    "LastLogin", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.GURU]: [
    "ID", "NIP", "Nama", "Email", "NomorHP", "Alamat", "MapelIDs", "Role",
    "Status", "FotoURL", "HariMengajar", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.SISWA]: [
    "ID", "NIS", "NISN", "Nama", "JenisKelamin", "TempatLahir", "TanggalLahir",
    "Alamat", "NamaWali", "HPWali", "KelasID", "Kelas", "TahunAjaran",
    "Status", "FotoURL", "RiwayatKelas", "CreatedAt", "UpdatedAt",
    "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.KELAS]: [
    "ID", "Nama", "Tingkat", "TahunAjaran", "WaliKelasID", "WaliKelas",
    "Status", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.MAPEL]: [
    "ID", "Kode", "Nama", "Kelompok", "Status",
    "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.TAHUN_AJARAN]: [
    "ID", "TahunAjaran", "Semester", "TanggalMulai", "TanggalSelesai",
    "Status", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.TUGAS_MENGAJAR]: [
    "ID", "GuruID", "Guru", "MapelID", "MataPelajaran", "KelasID", "Kelas",
    "TahunAjaran", "Semester", "JamPerMinggu", "Status",
    "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.JADWAL]: [
    "ID", "Hari", "JamMulai", "JamSelesai", "JenisJadwal", "KelasID", "Kelas", "MapelID",
    "MataPelajaran", "GuruID", "Guru", "Keterangan", "Semester", "TahunAjaran",
    "Status", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.ABSENSI]: [
    "ID", "Timestamp", "Tanggal", "Kelas", "MataPelajaran", "NamaSiswa",
    "StatusAbsen", "Keterangan", "Sesi", "KelasID", "MapelID", "SiswaID",
    "GuruID", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.JURNAL]: [
    "ID", "Timestamp", "Tanggal", "Kelas", "MataPelajaran", "MateriPokok",
    "TujuanPembelajaran", "KegiatanPembelajaran", "Metode", "Media",
    "JumlahHadir", "JumlahTidakHadir", "Hambatan", "TindakLanjut",
    "JamPelajaran", "KelasID", "MapelID", "GuruID", "Guru",
    "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.NILAI]: [
    "ID", "Timestamp", "NamaSiswa", "Kelas", "MataPelajaran", "JenisPenilaian",
    "Nilai", "Bobot", "CatatanGuru", "SiswaID", "KelasID", "MapelID", "GuruID",
    "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.CATATAN_SISWA]: [
    "ID", "SiswaID", "NamaSiswa", "Tanggal", "Jenis", "Judul", "Deskripsi",
    "TindakLanjut", "GuruID", "Guru", "TahunAjaran", "Semester",
    "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES.AUDIT_LOG]: [
    "ID", "Timestamp", "UserID", "UserName", "UserRole", "Action", "Module",
    "RecordID", "BeforeData", "AfterData", "IP", "UserAgent"
  ],
  [SHEET_NAMES.PENGATURAN]: [
    "ID", "Key", "Value", "UpdatedAt", "UpdatedBy"
  ]
};

// Kompatibilitas header lama → baru
const HEADER_ALIASES = {
  "Mata Pelajaran": "MataPelajaran",
  "Nama Siswa": "NamaSiswa",
  "Status Absen": "StatusAbsen",
  "Materi Pokok": "MateriPokok",
  "Kegiatan Pembelajaran": "KegiatanPembelajaran",
  "Hambatan / Catatan": "Hambatan",
  "Jenis Penilaian": "JenisPenilaian",
  "Catatan Guru": "CatatanGuru"
};

const STATUS_ABSEN_VALID = ["Hadir", "Izin", "Sakit", "Alpha"];
const JENIS_PENILAIAN_DEFAULT = [
  "Tugas", "Kuis", "Ulangan Harian", "Formatif", "Sumatif",
  "UTS", "UAS", "Praktik", "Proyek", "Portofolio"
];
const STATUS_AKTIF = ["Aktif", "Nonaktif"];
const STATUS_SISWA = ["Aktif", "Nonaktif", "Lulus"];
const ROLE_VALID = ["Admin", "Guru", "Kepala Sekolah"];
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 jam

// ====================== ENTRY POINT ======================
/**
 * ENTRY POINT
 * - Mode klasik (HtmlService): buka URL Web App tanpa parameter → serve index.html dari GAS
 * - Mode API (GitHub Pages / eksternal): GET/POST dengan body JSON { fn, args }
 *   Frontend memanggil lewat fetch(); session tetap berbasis token.
 */
var API_ALLOWED_FUNCTIONS = {
  login: true,
  logout: true,
  checkSession: true,
  changePassword: true,
  resetPasswordDefault: true,
  getData: true,
  saveData: true,
  deleteData: true,
  getMasterOptions: true,
  getSiswaByKelas: true,
  getSiswaDetail: true,
  getSiswaFiltered: true,
  getDashboardData: true,
  getDashboardDataEnhanced: true,
  getPengaturan: true,
  savePengaturan: true,
  saveKelasGabungGroups: true,
  getUsers: true,
  getTugasMengajar: true,
  saveTugasMengajar: true,
  getGuruMapelKelas: true,
  getAbsensiSummaryForJurnal: true,
  saveBulkAbsensi: true,
  saveBulkNilai: true,
  getJadwal: true,
  getJadwalCetak: true,
  saveJadwal: true,
  deleteJadwalMassal: true,
  generateJadwalOtomatis: true,
  syncTugasMengajarDariJadwal: true,
  getPrintRekapAbsensiMatrix: true,
  getPrintJurnal: true,
  getPrintNilaiMatrix: true,
  getLaporan: true,
  exportXlsx: true,
  getBackupSummary: true,
  getAuditLogs: true,
  getCatatanSiswa: true,
  pindahKelasSiswa: true,
  kenaikanKelasMassal: true,
  globalSearch: true,
  getPengumuman: true,
  savePengumuman: true,
  getAgenda: true,
  saveAgenda: true,
  getPopupInfoAktif: true,
  getNotifikasi: true,
  markNotifikasiRead: true,
  getMonitoringGuru: true,
  getWaliKelasDashboard: true,
  previewLogoUrl: true,
  runSelfTest: true,
  setupDatabase: true,
  migrateDatabase: true
};

function doGet(e) {
  try {
    // API mode: ?api=1  atau  ?fn=namaFungsi
    if (e && e.parameter && (e.parameter.api || e.parameter.fn)) {
      return apiRespond_(handleApiRequest_(e, "GET"));
    }
    setupDatabase();
    // Mode klasik: UI dilayani dari GAS (opsional, jika tidak pakai GitHub Pages)
    return HtmlService.createHtmlOutputFromFile("index")
      .setTitle("SIKAD DIGITAL — Sistem Administrasi Guru Profesional")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    if (e && e.parameter && (e.parameter.api || e.parameter.fn)) {
      return apiRespond_({ success: false, message: String(error.message || error) });
    }
    return HtmlService.createHtmlOutput(
      "<h3>Terjadi kesalahan saat memuat aplikasi.</h3><pre>" + error.message + "</pre>"
    );
  }
}

function doPost(e) {
  try {
    return apiRespond_(handleApiRequest_(e, "POST"));
  } catch (error) {
    return apiRespond_({ success: false, message: String(error && error.message ? error.message : error) });
  }
}

/** CORS-friendly JSON response */
function apiRespond_(obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj == null ? {} : obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

/**
 * Parse request → panggil fungsi yang diizinkan.
 * Body (POST): text/plain atau application/json → { "fn": "login", "args": ["a","b"] }
 * Query (GET): ?api=1&fn=login&args=[...]  (args URL-encoded JSON array)
 */
function handleApiRequest_(e, method) {
  var fn = "";
  var args = [];

  // Prefight / health
  if (e && e.parameter && String(e.parameter.health || "") === "1") {
    return { success: true, message: "SIKAD API OK", method: method || "", time: getNow() };
  }

  var raw = "";
  if (e && e.postData && e.postData.contents) {
    raw = String(e.postData.contents || "");
  }

  if (raw) {
    try {
      var body = JSON.parse(raw);
      fn = String(body.fn || body.function || body.action || "").trim();
      if (Object.prototype.hasOwnProperty.call(body, "args")) {
        args = Array.isArray(body.args) ? body.args : [];
      } else if (Object.prototype.hasOwnProperty.call(body, "params")) {
        args = Array.isArray(body.params) ? body.params : [];
      }
    } catch (parseErr) {
      return { success: false, message: "Body JSON tidak valid: " + parseErr.message };
    }
  }

  if (!fn && e && e.parameter) {
    fn = String(e.parameter.fn || e.parameter.function || e.parameter.action || "").trim();
    if (e.parameter.args) {
      try {
        var parsed = JSON.parse(e.parameter.args);
        args = Array.isArray(parsed) ? parsed : [];
      } catch (e2) {
        args = [];
      }
    }
  }

  if (!fn) {
    return {
      success: false,
      message: "Parameter fn wajib. Contoh POST body: {\"fn\":\"login\",\"args\":[\"email\",\"password\"]}"
    };
  }

  if (!API_ALLOWED_FUNCTIONS[fn]) {
    return { success: false, message: "Fungsi tidak diizinkan: " + fn, code: "FORBIDDEN_FN" };
  }

  var func = resolveApiFunction_(fn);
  if (typeof func !== "function") {
    return { success: false, message: "Fungsi tidak ditemukan di server: " + fn };
  }

  try {
    try { setupDatabase(); } catch (eSetup) { /* non-fatal */ }
    var result = func.apply(null, args);
    if (result === undefined || result === null) {
      return { success: true };
    }
    return result;
  } catch (err) {
    console.error("API " + fn, err);
    return {
      success: false,
      message: "Error server: " + String(err && err.message ? err.message : err),
      code: "SERVER_ERROR"
    };
  }
}

/** Resolve nama fungsi global Apps Script secara aman */
function resolveApiFunction_(name) {
  try {
    if (typeof globalThis !== "undefined" && typeof globalThis[name] === "function") {
      return globalThis[name];
    }
  } catch (e0) {}
  // Fallback: daftar eksplisit (kompatibilitas runtime lama)
  var map = {
    login: login,
    logout: logout,
    checkSession: checkSession,
    changePassword: changePassword,
    resetPasswordDefault: resetPasswordDefault,
    getData: getData,
    saveData: saveData,
    deleteData: deleteData,
    getMasterOptions: getMasterOptions,
    getSiswaByKelas: getSiswaByKelas,
    getSiswaDetail: getSiswaDetail,
    getSiswaFiltered: getSiswaFiltered,
    getDashboardData: getDashboardData,
    getDashboardDataEnhanced: getDashboardDataEnhanced,
    getPengaturan: getPengaturan,
    savePengaturan: savePengaturan,
    saveKelasGabungGroups: saveKelasGabungGroups,
    getUsers: getUsers,
    getTugasMengajar: getTugasMengajar,
    saveTugasMengajar: saveTugasMengajar,
    getGuruMapelKelas: getGuruMapelKelas,
    getAbsensiSummaryForJurnal: getAbsensiSummaryForJurnal,
    saveBulkAbsensi: saveBulkAbsensi,
    saveBulkNilai: saveBulkNilai,
    getJadwal: getJadwal,
    getJadwalCetak: getJadwalCetak,
    saveJadwal: saveJadwal,
    deleteJadwalMassal: deleteJadwalMassal,
    generateJadwalOtomatis: generateJadwalOtomatis,
    syncTugasMengajarDariJadwal: syncTugasMengajarDariJadwal,
    getPrintRekapAbsensiMatrix: getPrintRekapAbsensiMatrix,
    getPrintJurnal: getPrintJurnal,
    getPrintNilaiMatrix: getPrintNilaiMatrix,
    getLaporan: getLaporan,
    exportXlsx: exportXlsx,
    getBackupSummary: getBackupSummary,
    getAuditLogs: getAuditLogs,
    getCatatanSiswa: getCatatanSiswa,
    pindahKelasSiswa: pindahKelasSiswa,
    kenaikanKelasMassal: kenaikanKelasMassal,
    globalSearch: globalSearch,
    getPengumuman: getPengumuman,
    savePengumuman: savePengumuman,
    getAgenda: getAgenda,
    saveAgenda: saveAgenda,
    getPopupInfoAktif: getPopupInfoAktif,
    getNotifikasi: getNotifikasi,
    markNotifikasiRead: markNotifikasiRead,
    getMonitoringGuru: getMonitoringGuru,
    getWaliKelasDashboard: getWaliKelasDashboard,
    previewLogoUrl: previewLogoUrl,
    runSelfTest: runSelfTest,
    setupDatabase: setupDatabase,
    migrateDatabase: migrateDatabase
  };
  return map[name] || null;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ====================== SETUP & MIGRASI ======================
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    Object.keys(SHEET_SCHEMAS).forEach(name => {
      setupSheetHeader(ss, name, SHEET_SCHEMAS[name]);
    });
    // Bersihkan baris kosong master
    [SHEET_NAMES.SISWA, SHEET_NAMES.KELAS, SHEET_NAMES.MAPEL, SHEET_NAMES.GURU, SHEET_NAMES.TAHUN_AJARAN]
      .forEach(name => cleanEmptyRows(ss, name));
    ensureDefaultAdmin();
    ensureDefaultPengaturan();
    try { ensureExtendedSheets(); } catch (e) { console.error(e); }
    try { syncStatusTahunAjaranByDate(); } catch (e) { console.error(e); }
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
  return { success: true, message: "Database siap." };
}

/**
 * Migrasi aman — jalankan sekali dari editor jika perlu
 */
function migrateDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    setupDatabase();

    // Migrasi header lama ke baru (Absensi, Jurnal, Nilai)
    migrateLegacyHeaders(ss, SHEET_NAMES.ABSENSI, {
      "Mata Pelajaran": "MataPelajaran",
      "Nama Siswa": "NamaSiswa",
      "Status Absen": "StatusAbsen"
    });
    migrateLegacyHeaders(ss, SHEET_NAMES.JURNAL, {
      "Mata Pelajaran": "MataPelajaran",
      "Materi Pokok": "MateriPokok",
      "Kegiatan Pembelajaran": "KegiatanPembelajaran",
      "Hambatan / Catatan": "Hambatan"
    });
    migrateLegacyHeaders(ss, SHEET_NAMES.NILAI, {
      "Mata Pelajaran": "MataPelajaran",
      "Nama Siswa": "NamaSiswa",
      "Jenis Penilaian": "JenisPenilaian",
      "Catatan Guru": "CatatanGuru"
    });

    // Pastikan kolom soft-delete & audit ada
    Object.keys(SHEET_SCHEMAS).forEach(name => {
      if (name === SHEET_NAMES.AUDIT_LOG || name === SHEET_NAMES.PENGATURAN) return;
      ensureColumn(ss, name, "IsDeleted", "FALSE");
      ensureColumn(ss, name, "CreatedBy", "");
      ensureColumn(ss, name, "UpdatedBy", "");
    });

    return { success: true, message: "Migrasi selesai dengan aman." };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Migrasi gagal: " + e.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function setupSheetHeader(ss, sheetName, expectedHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const def = ss.getSheetByName("Sheet1");
    if (def && ss.getSheets().length > 1) {
      try { ss.deleteSheet(def); } catch (e) {}
    }
  }

  const lastCol = sheet.getLastColumn();
  let current = [];
  if (lastCol > 0) {
    current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());
  }

  if (current.length === 0 || current.every(h => h === "")) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    styleHeader(sheet, expectedHeaders.length);
    sheet.setFrozenRows(1);
    return;
  }

  const missing = expectedHeaders.filter(h => !current.includes(h));
  if (missing.length > 0) {
    const start = current.length + 1;
    sheet.getRange(1, start, 1, missing.length).setValues([missing]);
    styleHeader(sheet, start + missing.length - 1);
  }
  sheet.setFrozenRows(1);
}

function styleHeader(sheet, lastCol) {
  sheet.getRange(1, 1, 1, lastCol)
    .setFontWeight("bold")
    .setBackground("#0f172a")
    .setFontColor("#ffffff");
}

function ensureColumn(ss, sheetName, colName, defaultValue) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf(colName) === -1) {
    const col = headers.length + 1;
    sheet.getRange(1, col).setValue(colName);
    if (sheet.getLastRow() > 1 && defaultValue !== undefined) {
      sheet.getRange(2, col, sheet.getLastRow() - 1, 1).setValue(defaultValue);
    }
  }
}

function migrateLegacyHeaders(ss, sheetName, mapping) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newHeaders = headers.map(h => mapping[h] || h);
  // Hanya update header jika ada perubahan dan target belum ada
  let changed = false;
  for (let i = 0; i < headers.length; i++) {
    if (mapping[headers[i]] && headers.indexOf(mapping[headers[i]]) === -1) {
      newHeaders[i] = mapping[headers[i]];
      changed = true;
    }
  }
  if (changed) {
    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
  }
}

function cleanEmptyRows(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data = sheet.getRange(2, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIdx = headers.indexOf("ID");
  const namaIdx = headers.indexOf("Nama");

  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    const idVal = idIdx >= 0 ? String(row[idIdx] || "").trim() : "";
    const namaVal = namaIdx >= 0 ? String(row[namaIdx] || "").trim() : "";
    const isEmpty = row.every(cell => cell === "" || cell === null);
    if (isEmpty || !idVal || (namaIdx >= 0 && !namaVal)) {
      sheet.deleteRow(i + 2);
    }
  }
}

function ensureDefaultAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet || sheet.getLastRow() <= 1) {
    // Buat admin default: admin@sikad.local / admin123
    const hash = hashPassword("admin123");
    const now = getNow();
    const id = generateId("USR");
    sheet.appendRow([
      id, "admin@sikad.local", hash, "Administrator", "Admin", "",
      "Aktif", "", now, now, "system", "system", "FALSE"
    ]);
  }
}

function ensureDefaultPengaturan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  if (!sheet) return;
  const data = getRawData(SHEET_NAMES.PENGATURAN);
  const keys = data.map(r => r.Key);
  const defaults = {
    "tahun_ajaran_aktif": new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    "semester_aktif": "Ganjil",
    "kkm_default": "75",
    "nama_sekolah": "SIKAD DIGITAL School",
    "alamat_sekolah": "",
    "email_sekolah": "",
    "instansi_kop": "PEMERINTAH KABUPATEN JEMBER",
    "kop_font_instansi": "11",
    "kop_font_nama": "14",
    "kop_font_alamat": "10",
    "kop_font_judul": "14",
    "kop_font_subjudul": "12",
    "kop_logo_size": "72",
    "logo_kabupaten_url": "",
    "logo_sekolah_url": "",
    "nama_kepala_sekolah": "",
    "nip_kepala_sekolah": "",
    "kepala_sekolah_guru_id": "",
    "kurikulum_guru_id": "",
    "jadwal_slots": JSON.stringify([
      {"jamMulai":"07:00","jamSelesai":"07:40"},
      {"jamMulai":"07:40","jamSelesai":"08:20"},
      {"jamMulai":"08:20","jamSelesai":"09:00"},
      {"jamMulai":"09:00","jamSelesai":"09:40"},
      {"jamMulai":"10:00","jamSelesai":"10:40"},
      {"jamMulai":"10:40","jamSelesai":"11:20"},
      {"jamMulai":"11:20","jamSelesai":"12:00"},
      {"jamMulai":"12:30","jamSelesai":"13:10"}
    ]),
    "jadwal_istirahat": JSON.stringify([
      {"jamMulai":"09:40","jamSelesai":"10:00","label":"Istirahat 1"},
      {"jamMulai":"12:00","jamSelesai":"12:30","label":"Istirahat / Sholat"}
    ]),
    "jadwal_mode_gabung": "pisah",
    // Mapel yang boleh digabung multi-kelas di jam yang sama (mis. PJOK)
    // JSON array nama mapel (case-insensitive). Kosong = tidak ada pengecualian.
    "jadwal_mapel_gabungan": JSON.stringify(["PJOK", "Pendidikan Jasmani", "Pendidikan Jasmani Olahraga dan Kesehatan"]),
    // Maksimal jumlah kelas berbeda pada slot yang sama untuk mapel gabungan
    "jadwal_max_kelas_gabung": "2",
    // Opsional: batasi pasangan kelas yang boleh digabung (JSON array of groups).
    // Contoh: [["VII A","VII B"],["VIII A","VIII B"]]. Kosong = semua kelas boleh digabung selama mapel diizinkan.
    "jadwal_kelas_gabung_groups": "[]"
  };
  Object.keys(defaults).forEach(k => {
    if (keys.indexOf(k) === -1) {
      sheet.appendRow([generateId("SET"), k, defaults[k], getNow(), "system"]);
    }
  });
}

// ====================== UTILITAS ======================
function getNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function generateId(prefix) {
  return (prefix || "ID") + "-" + new Date().getTime() + "-" + Math.floor(Math.random() * 9000 + 1000);
}

function sanitizeInput(str, maxLen) {
  if (str === null || str === undefined) return "";
  if (typeof str !== "string") str = String(str);
  // Batasi panjang default 5000 karakter per field (cegah payload raksasa)
  const limit = maxLen || 5000;
  if (str.length > limit) str = str.substring(0, limit);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isAllowedSheet(name) {
  return ALLOWED_SHEETS.indexOf(name) !== -1;
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + "SIKAD_SALT_2024");
  return digest.map(b => ("0" + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join("");
}

function formatSheetCell(v, header, tz) {
  if (!(v instanceof Date)) return v;
  const h = String(header || "");
  const y = v.getFullYear();
  const mo = v.getMonth();
  const isEpochTime = (y === 1899 && mo === 11);
  const isTimeHeader = /JamMulai|JamSelesai|JamPelajaran|jamMulai|jamSelesai|^Jam$/i.test(h);
  if (isTimeHeader || isEpochTime) {
    return Utilities.formatDate(v, tz, "HH:mm");
  }
  if (/Timestamp|CreatedAt|UpdatedAt|LastLogin|dicetakPada/i.test(h)) {
    return Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm:ss");
  }
  return Utilities.formatDate(v, tz, "yyyy-MM-dd");
}

function toDisplayTime(val) {
  if (val === null || val === undefined || val === "") return "";
  if (val instanceof Date) {
    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(val, tz, "HH:mm");
  }
  const s = String(val).trim();
  if (/1899|1900-01-0/.test(s) && !/:/.test(s)) return "";
  if (/^\d{1,2}:\d{2}/.test(s)) return s.substring(0, 5);
  const t = s.match(/(\d{1,2}:\d{2})/);
  return t ? t[1] : s;
}

function getRawData(sheetName, includeDeleted) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const tz = ss.getSpreadsheetTimeZone();

  return data.map(row => {
    const item = {};
    headers.forEach((h, i) => {
      let v = row[i];
      if (v instanceof Date) v = formatSheetCell(v, h, tz);
      else if (typeof v === "string" && /JamMulai|JamSelesai|JamPelajaran/i.test(String(h))) {
        v = toDisplayTime(v);
      }
      item[h] = v;
    });
    return item;
  }).filter(item => {
    if (!item.ID || String(item.ID).trim() === "") return false;
    if (!includeDeleted && String(item.IsDeleted).toUpperCase() === "TRUE") return false;
    return true;
  });
}

// ====================== SESSION & AUTH ======================
function createSession(user) {
  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  const payload = {
    userId: user.ID,
    email: user.Email,
    nama: user.Nama,
    role: user.Role,
    guruId: user.GuruID || "",
    exp: Date.now() + (SESSION_TTL_SECONDS * 1000)
  };
  cache.put("sess_" + token, JSON.stringify(payload), SESSION_TTL_SECONDS);
  return token;
}

function getSession(token) {
  if (!token) return null;
  const cache = CacheService.getScriptCache();
  const raw = cache.get("sess_" + token);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    if (payload.exp < Date.now()) {
      cache.remove("sess_" + token);
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

function destroySession(token) {
  if (token) CacheService.getScriptCache().remove("sess_" + token);
}

function requireAuth(token, allowedRoles) {
  const session = getSession(token);
  if (!session) {
    return { ok: false, error: { success: false, message: "Sesi tidak valid atau sudah habis. Silakan login ulang.", code: "UNAUTHORIZED" } };
  }
  // Pastikan role masih valid
  if (ROLE_VALID.indexOf(session.role) === -1) {
    destroySession(token);
    return { ok: false, error: { success: false, message: "Role tidak valid. Silakan login ulang.", code: "UNAUTHORIZED" } };
  }
  if (allowedRoles && allowedRoles.length && allowedRoles.indexOf(session.role) === -1) {
    return { ok: false, error: { success: false, message: "Anda tidak memiliki izin untuk aksi ini.", code: "FORBIDDEN" } };
  }
  return { ok: true, session: session };
}

/** Rate limit login: max 8 percobaan / 10 menit per email (atau key) */
function checkLoginRateLimit(key) {
  const cache = CacheService.getScriptCache();
  const k = "login_rl_" + Utilities.base64EncodeWebSafe(String(key).toLowerCase()).substring(0, 80);
  const raw = cache.get(k);
  let count = raw ? parseInt(raw, 10) : 0;
  if (isNaN(count)) count = 0;
  if (count >= 8) {
    return { allowed: false, message: "Terlalu banyak percobaan login. Coba lagi dalam 10 menit." };
  }
  cache.put(k, String(count + 1), 600);
  return { allowed: true };
}

function clearLoginRateLimit(key) {
  const cache = CacheService.getScriptCache();
  const k = "login_rl_" + Utilities.base64EncodeWebSafe(String(key).toLowerCase()).substring(0, 80);
  cache.remove(k);
}

function login(email, password) {
  try {
    if (!email || !password) return { success: false, message: "Email dan password wajib diisi." };
    email = String(email).trim().substring(0, 120);
    password = String(password).substring(0, 128);

    const rl = checkLoginRateLimit(email);
    if (!rl.allowed) return { success: false, message: rl.message };

    const users = getRawData(SHEET_NAMES.USERS);
    const user = users.find(u =>
      String(u.Email).toLowerCase() === String(email).toLowerCase() &&
      String(u.Status) === "Aktif"
    );
    // Pesan generik — jangan bocorkan apakah email terdaftar
    if (!user) {
      writeAuditLog("", email, "", "LOGIN_FAIL", "Auth", "", null, { reason: "user_not_found" });
      return { success: false, message: "Email atau password salah." };
    }

    const hash = hashPassword(password);
    if (hash !== user.PasswordHash) {
      writeAuditLog(user.ID, user.Nama, user.Role, "LOGIN_FAIL", "Auth", user.ID, null, { reason: "bad_password" });
      return { success: false, message: "Email atau password salah." };
    }

    clearLoginRateLimit(email);
    updateFieldById(SHEET_NAMES.USERS, user.ID, { LastLogin: getNow() });

    const token = createSession(user);
    writeAuditLog(user.ID, user.Nama, user.Role, "LOGIN", "Auth", user.ID, null, null);

    return {
      success: true,
      message: "Login berhasil",
      token: token,
      user: {
        id: user.ID,
        email: user.Email,
        nama: user.Nama,
        role: user.Role,
        guruId: user.GuruID || "",
        isWaliKelas: (user.Role === "Guru") ? isGuruWaliKelas(user.GuruID || "", user.ID) : false
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal login." };
  }
}

function logout(token) {
  const session = getSession(token);
  if (session) {
    writeAuditLog(session.userId, session.nama, session.role, "LOGOUT", "Auth", session.userId, null, null);
  }
  destroySession(token);
  return { success: true, message: "Logout berhasil" };
}

function checkSession(token) {
  const session = getSession(token);
  if (!session) return { success: false, message: "Sesi tidak valid" };
  const isWali = (session.role === "Guru")
    ? isGuruWaliKelas(session.guruId || "", session.userId)
    : false;
  return {
    success: true,
    user: {
      id: session.userId,
      email: session.email,
      nama: session.nama,
      role: session.role,
      guruId: session.guruId,
      isWaliKelas: isWali
    }
  };
}


/**
 * Reset password user ke default "123456". Hanya Admin.
 */
function resetPasswordDefault(token, userId) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    if (!userId) return { success: false, message: "ID user wajib." };

    const users = getRawData(SHEET_NAMES.USERS, true);
    const user = users.find(u => String(u.ID) === String(userId));
    if (!user) return { success: false, message: "User tidak ditemukan." };

    const defaultPw = "123456";
    updateFieldById(SHEET_NAMES.USERS, user.ID, {
      PasswordHash: hashPassword(defaultPw),
      UpdatedAt: getNow(),
      UpdatedBy: auth.session.userId
    });
    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "RESET_PASSWORD", "Auth", user.ID, null, { target: user.Email });
    return { success: true, message: "Password berhasil direset ke 123456." };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal reset password: " + (e.message || String(e)) };
  }
}

/**
 * Hitung jumlah user aktif ber-role Admin (opsional excludeId untuk update).
 */
function countActiveAdmins(excludeId) {
  const users = getRawData(SHEET_NAMES.USERS);
  return users.filter(u => {
    if (excludeId && String(u.ID) === String(excludeId)) return false;
    return String(u.Role) === "Admin" && String(u.Status || "Aktif") === "Aktif";
  }).length;
}

function changePassword(token, oldPassword, newPassword) {
  const auth = requireAuth(token);
  if (!auth.ok) return auth.error;
  if (!newPassword || newPassword.length < 6) return { success: false, message: "Password baru minimal 6 karakter." };

  const users = getRawData(SHEET_NAMES.USERS, true);
  const user = users.find(u => u.ID === auth.session.userId);
  if (!user) return { success: false, message: "User tidak ditemukan." };
  if (hashPassword(oldPassword) !== user.PasswordHash) return { success: false, message: "Password lama salah." };

  updateFieldById(SHEET_NAMES.USERS, user.ID, {
    PasswordHash: hashPassword(newPassword),
    UpdatedAt: getNow(),
    UpdatedBy: auth.session.userId
  });
  writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "CHANGE_PASSWORD", "Auth", user.ID, null, null);
  return { success: true, message: "Password berhasil diubah." };
}

// ====================== AUDIT LOG ======================
function writeAuditLog(userId, userName, userRole, action, module, recordId, beforeData, afterData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOG);
    if (!sheet) return;
    sheet.appendRow([
      generateId("AUD"),
      getNow(),
      userId || "",
      userName || "",
      userRole || "",
      action || "",
      module || "",
      recordId || "",
      beforeData ? JSON.stringify(beforeData).substring(0, 45000) : "",
      afterData ? JSON.stringify(afterData).substring(0, 45000) : "",
      "",
      ""
    ]);
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

// ====================== CRUD HELPERS ======================
function updateFieldById(sheetName, id, fields) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      Object.keys(fields).forEach(k => {
        const col = headers.indexOf(k);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(fields[k]);
      });
      return true;
    }
  }
  return false;
}

function getData(sheetName, token, options) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    if (!isAllowedSheet(sheetName)) return { success: false, message: "Sheet tidak diizinkan." };

    // Batasi akses berdasarkan role
    if (sheetName === SHEET_NAMES.USERS && auth.session.role !== "Admin") {
      return { success: false, message: "Akses ditolak." };
    }
    if (sheetName === SHEET_NAMES.AUDIT_LOG && auth.session.role !== "Admin") {
      return { success: false, message: "Akses ditolak." };
    }

    // Selaraskan status TA sebelum dibaca
    if (sheetName === SHEET_NAMES.TAHUN_AJARAN) {
      try { syncStatusTahunAjaranByDate(); } catch (eTa) {}
    }

    let data = getRawData(sheetName, options && options.includeDeleted);

    // Filter kepemilikan untuk Guru
    if (auth.session.role === "Guru") {
      if (sheetName === SHEET_NAMES.JURNAL) {
        data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
      }
      if (sheetName === SHEET_NAMES.ABSENSI) {
        data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
      }
      if (sheetName === SHEET_NAMES.NILAI) {
        data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
      }
    }

    // Filter tambahan dari options
    if (options) {
      if (options.kelas) data = data.filter(r => r.Kelas === options.kelas || r.KelasID === options.kelas);
      if (options.status) data = data.filter(r => r.Status === options.status);
      if (options.tahunAjaran) data = data.filter(r => r.TahunAjaran === options.tahunAjaran);
    }

    return { success: true, data: data };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil data." };
  }
}

function saveData(sheetName, formData, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    if (!isAllowedSheet(sheetName)) return { success: false, message: "Sheet tidak diizinkan." };
    if (!formData || typeof formData !== "object") return { success: false, message: "Data tidak valid." };

    // Otorisasi write
    if (["Admin", "Guru", "Kepala Sekolah"].indexOf(auth.session.role) === -1) {
      return { success: false, message: "Akses ditolak." };
    }
    if (sheetName === SHEET_NAMES.USERS && auth.session.role !== "Admin") {
      return { success: false, message: "Hanya Admin yang boleh mengelola user." };
    }
    if (auth.session.role === "Kepala Sekolah" && [SHEET_NAMES.SISWA, SHEET_NAMES.KELAS, SHEET_NAMES.MAPEL, SHEET_NAMES.GURU, SHEET_NAMES.TAHUN_AJARAN].indexOf(sheetName) !== -1) {
      // Kepala Sekolah default tidak boleh ubah master (kecuali diberi kewenangan)
      // Untuk fondasi, kita izinkan read-only. Bisa diubah nanti.
      if (!formData.ID) return { success: false, message: "Kepala Sekolah tidak diizinkan menambah master data." };
    }

    // Normalisasi key lama → baru
    formData = normalizeFormData(sheetName, formData);

    const errors = validateFormData(sheetName, formData);
    if (errors.length) return { success: false, message: errors.join(" ") };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(sheetName);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const now = getNow();
    const isUpdate = !!(formData.ID && String(formData.ID).trim());
    let beforeData = null;

    // Cek kepemilikan saat update (untuk Guru)
    if (isUpdate && auth.session.role === "Guru") {
      const existingList = getRawData(sheetName, true);
      const existing = existingList.find(r => String(r.ID) === String(formData.ID));
      if (existing) {
        beforeData = existing;
        if (sheetName === SHEET_NAMES.JURNAL || sheetName === SHEET_NAMES.ABSENSI || sheetName === SHEET_NAMES.NILAI) {
          if (existing.GuruID && existing.GuruID !== auth.session.guruId && existing.CreatedBy !== auth.session.userId) {
            return { success: false, message: "Anda hanya boleh mengubah data milik sendiri." };
          }
        }
      }
    }

    // Auto-set GuruID untuk Guru + validasi tugas mengajar
    if (auth.session.role === "Guru" && auth.session.guruId) {
      if ([SHEET_NAMES.ABSENSI, SHEET_NAMES.JURNAL, SHEET_NAMES.NILAI].indexOf(sheetName) !== -1) {
        formData.GuruID = auth.session.guruId;
        const okTugas = guruPunyaTugas(
          auth.session.guruId,
          formData.Kelas || "",
          formData.KelasID || "",
          formData.MataPelajaran || formData["Mata Pelajaran"] || "",
          formData.MapelID || ""
        );
        if (!okTugas) {
          return { success: false, message: "Kelas/mapel di luar tugas mengajar Anda. Data ditolak." };
        }
      }
    }

    if (!isUpdate) {
      const id = generateId(sheetName.replace("DB_", "").substring(0, 3).toUpperCase());
      const row = headers.map(h => {
        if (h === "ID") return id;
        if (h === "Timestamp" || h === "CreatedAt") return now;
        if (h === "UpdatedAt") return now;
        if (h === "CreatedBy" || h === "UpdatedBy") return auth.session.userId;
        if (h === "IsDeleted") return "FALSE";
        if (h === "PasswordHash" && formData.Password) return hashPassword(formData.Password);
        return formData.hasOwnProperty(h) ? sanitizeInput(String(formData[h] ?? "")) : "";
      });
      sheet.appendRow(row);
      writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "CREATE", sheetName, id, null, formData);
      // Status TA ditentukan oleh TanggalMulai–TanggalSelesai
      if (sheetName === SHEET_NAMES.TAHUN_AJARAN) {
        try { syncStatusTahunAjaranByDate(); } catch (eTa) { console.error(eTa); }
      }
      return { success: true, message: "Data berhasil ditambahkan!", id: id };
    }

    // Update
    const all = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(formData.ID)) {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, message: "Data tidak ditemukan." };

    const existing = all[rowIdx - 1];
    const row = headers.map((h, col) => {
      if (h === "ID") return formData.ID;
      if (h === "Timestamp" || h === "CreatedAt") return existing[col];
      if (h === "UpdatedAt") return now;
      if (h === "UpdatedBy") return auth.session.userId;
      if (h === "CreatedBy") return existing[col];
      if (h === "PasswordHash") {
        if (formData.Password) return hashPassword(formData.Password);
        return existing[col];
      }
      if (formData.hasOwnProperty(h)) return sanitizeInput(String(formData[h] ?? ""));
      return existing[col];
    });
    sheet.getRange(rowIdx, 1, 1, headers.length).setValues([row]);
    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "UPDATE", sheetName, formData.ID, beforeData, formData);
    // Status TA ditentukan oleh TanggalMulai–TanggalSelesai
    if (sheetName === SHEET_NAMES.TAHUN_AJARAN) {
      try { syncStatusTahunAjaranByDate(); } catch (eTa) { console.error(eTa); }
    }
    return { success: true, message: "Data berhasil diperbarui!" };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyimpan data." };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function deleteData(sheetName, id, token, hardDelete) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const auth = requireAuth(token, ["Admin", "Guru"]);
    if (!auth.ok) return auth.error;
    if (!isAllowedSheet(sheetName)) return { success: false, message: "Sheet tidak diizinkan." };
    if (!id) return { success: false, message: "ID tidak valid." };

    // Hanya Admin yang boleh hard delete atau hapus user
    if (hardDelete && auth.session.role !== "Admin") {
      return { success: false, message: "Hanya Admin yang boleh menghapus permanen." };
    }
    if (sheetName === SHEET_NAMES.USERS && auth.session.role !== "Admin") {
      return { success: false, message: "Akses ditolak." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        // Cek kepemilikan
        if (auth.session.role === "Guru") {
          const guruIdIdx = headers.indexOf("GuruID");
          const createdByIdx = headers.indexOf("CreatedBy");
          const rowGuruId = guruIdIdx >= 0 ? data[i][guruIdIdx] : "";
          const rowCreatedBy = createdByIdx >= 0 ? data[i][createdByIdx] : "";
          if (rowGuruId && rowGuruId !== auth.session.guruId && rowCreatedBy !== auth.session.userId) {
            return { success: false, message: "Anda hanya boleh menghapus data milik sendiri." };
          }
        }

        const before = {};
        headers.forEach((h, idx) => before[h] = data[i][idx]);

        // Lindungi akun Admin: tidak boleh dihapus (soft/hard)
        if (sheetName === SHEET_NAMES.USERS && String(before.Role) === "Admin") {
          return { success: false, message: "Akun Admin tidak boleh dihapus. Hanya boleh 1 Admin dan harus tetap ada." };
        }

        if (hardDelete || sheetName === SHEET_NAMES.AUDIT_LOG) {
          sheet.deleteRow(i + 1);
          writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "HARD_DELETE", sheetName, id, before, null);
        } else {
          // Soft delete
          const isDeletedIdx = headers.indexOf("IsDeleted");
          const updatedAtIdx = headers.indexOf("UpdatedAt");
          const updatedByIdx = headers.indexOf("UpdatedBy");
          if (isDeletedIdx >= 0) sheet.getRange(i + 1, isDeletedIdx + 1).setValue("TRUE");
          if (updatedAtIdx >= 0) sheet.getRange(i + 1, updatedAtIdx + 1).setValue(getNow());
          if (updatedByIdx >= 0) sheet.getRange(i + 1, updatedByIdx + 1).setValue(auth.session.userId);
          writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "SOFT_DELETE", sheetName, id, before, null);
        }
        return { success: true, message: "Data berhasil dihapus!" };
      }
    }
    return { success: false, message: "Data tidak ditemukan." };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menghapus." };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function normalizeFormData(sheetName, formData) {
  const map = {
    "Mata Pelajaran": "MataPelajaran",
    "Nama Siswa": "NamaSiswa",
    "Status Absen": "StatusAbsen",
    "Materi Pokok": "MateriPokok",
    "Kegiatan Pembelajaran": "KegiatanPembelajaran",
    "Hambatan / Catatan": "Hambatan",
    "Jenis Penilaian": "JenisPenilaian",
    "Catatan Guru": "CatatanGuru"
  };
  const out = {};
  Object.keys(formData).forEach(k => {
    out[map[k] || k] = formData[k];
  });
  return out;
}

function validateFormData(sheetName, formData) {
  const errors = [];

  if (sheetName === SHEET_NAMES.ABSENSI) {
    if (!formData.Tanggal) errors.push("Tanggal wajib.");
    if (!formData.Kelas && !formData.KelasID) errors.push("Kelas wajib.");
    if (!formData.MataPelajaran && !formData.MapelID) errors.push("Mata Pelajaran wajib.");
    if (!formData.NamaSiswa && !formData.SiswaID) errors.push("Nama Siswa wajib.");
    if (!formData.StatusAbsen) errors.push("Status Absen wajib.");
    else if (STATUS_ABSEN_VALID.indexOf(formData.StatusAbsen) === -1) errors.push("Status Absen tidak valid.");
  } else if (sheetName === SHEET_NAMES.JURNAL) {
    if (!formData.Tanggal) errors.push("Tanggal wajib.");
    if (!formData.Kelas && !formData.KelasID) errors.push("Kelas wajib.");
    if (!formData.MataPelajaran && !formData.MapelID) errors.push("Mata Pelajaran wajib.");
    if (!formData.MateriPokok) errors.push("Materi Pokok wajib.");
  } else if (sheetName === SHEET_NAMES.NILAI) {
    if (!formData.NamaSiswa && !formData.SiswaID) errors.push("Nama Siswa wajib.");
    if (!formData.Kelas && !formData.KelasID) errors.push("Kelas wajib.");
    if (!formData.MataPelajaran && !formData.MapelID) errors.push("Mata Pelajaran wajib.");
    if (!formData.JenisPenilaian) errors.push("Jenis Penilaian wajib.");
    const n = Number(formData.Nilai);
    if (formData.Nilai === "" || formData.Nilai === null || isNaN(n) || n < 0 || n > 100) {
      errors.push("Nilai harus 0–100.");
    }
  } else if (sheetName === SHEET_NAMES.SISWA) {
    if (!formData.Nama || String(formData.Nama).trim() === "") errors.push("Nama siswa wajib diisi.");
    if (!formData.Status) formData.Status = "Aktif";
    if (STATUS_SISWA.indexOf(formData.Status) === -1) errors.push("Status siswa tidak valid (Aktif/Nonaktif/Lulus).");
  } else if (sheetName === SHEET_NAMES.KELAS) {
    if (!formData.Nama || String(formData.Nama).trim() === "") errors.push("Nama kelas wajib diisi.");
    if (!formData.Status) formData.Status = "Aktif";
  } else if (sheetName === SHEET_NAMES.MAPEL) {
    if (!formData.Nama || String(formData.Nama).trim() === "") errors.push("Nama mata pelajaran wajib diisi.");
    if (!formData.Status) formData.Status = "Aktif";
  } else if (sheetName === SHEET_NAMES.GURU) {
    if (!formData.Nama || String(formData.Nama).trim() === "") errors.push("Nama guru wajib diisi.");
    if (!formData.Status) formData.Status = "Aktif";
    if (formData.Role && ROLE_VALID.indexOf(formData.Role) === -1) errors.push("Role tidak valid.");
  } else if (sheetName === SHEET_NAMES.TAHUN_AJARAN) {
    if (!formData.TahunAjaran) errors.push("Tahun ajaran wajib.");
    if (!formData.Semester) errors.push("Semester wajib.");
    // Status dihitung dari rentang tanggal (bukan input manual)
    try {
      const today = getTodayYmd();
      formData.Status = isTahunAjaranBerlakuHariIni(formData, today) ? "Aktif" : "Nonaktif";
    } catch (e) {
      if (!formData.Status) formData.Status = "Nonaktif";
    }
  } else if (sheetName === SHEET_NAMES.TUGAS_MENGAJAR) {
    if (!formData.GuruID && !formData.Guru) errors.push("Guru wajib.");
    if (!formData.MapelID && !formData.MataPelajaran) errors.push("Mata pelajaran wajib.");
    if (!formData.KelasID && !formData.Kelas) errors.push("Kelas wajib.");
    if (!formData.Status) formData.Status = "Aktif";
  } else if (sheetName === SHEET_NAMES.JADWAL) {
    if (!formData.Hari) errors.push("Hari wajib.");
    if (!formData.JamMulai) errors.push("Jam mulai wajib.");
    if (!formData.JamSelesai) errors.push("Jam selesai wajib.");
    const jenis = String(formData.JenisJadwal || "Pelajaran").trim() || "Pelajaran";
    formData.JenisJadwal = jenis;
    if (jenis === "Kegiatan") {
      if (!formData.MataPelajaran && !formData.MapelID) {
        errors.push("Nama kegiatan wajib (contoh: Upacara Bendera, Istighosah, Senam Pagi).");
      }
    } else {
      if (!formData.Kelas && !formData.KelasID) errors.push("Kelas wajib.");
      if (!formData.MataPelajaran && !formData.MapelID) errors.push("Mata pelajaran wajib.");
      if (!formData.Guru && !formData.GuruID) errors.push("Guru wajib.");
    }
    if (!formData.Status) formData.Status = "Aktif";
  } else if (sheetName === SHEET_NAMES.CATATAN_SISWA) {
    if (!formData.SiswaID && !formData.NamaSiswa) errors.push("Siswa wajib.");
    if (!formData.Tanggal) errors.push("Tanggal wajib.");
    if (!formData.Jenis) errors.push("Jenis catatan wajib.");
    if (!formData.Judul && !formData.Deskripsi) errors.push("Judul atau deskripsi wajib.");
  } else if (sheetName === SHEET_NAMES.USERS) {
    if (!formData.Email) errors.push("Email wajib.");
    if (!formData.Nama) errors.push("Nama wajib.");
    if (!formData.Role || ROLE_VALID.indexOf(formData.Role) === -1) errors.push("Role tidak valid.");
    if (!formData.ID && !formData.Password) errors.push("Password wajib untuk user baru.");
    // Hanya boleh ada 1 Admin aktif
    if (String(formData.Role) === "Admin" && String(formData.Status || "Aktif") === "Aktif") {
      const nAdmin = countActiveAdmins(formData.ID || null);
      if (nAdmin >= 1) {
        errors.push("Hanya boleh ada 1 akun Admin. Nonaktifkan Admin yang ada terlebih dahulu jika ingin mengganti.");
      }
    }
    // Jangan biarkan Admin terakhir diubah role-nya / dinonaktifkan
    if (formData.ID) {
      const existing = getRawData(SHEET_NAMES.USERS, true).find(u => String(u.ID) === String(formData.ID));
      if (existing && String(existing.Role) === "Admin") {
        const demote = String(formData.Role) !== "Admin";
        const deactivate = String(formData.Status || "Aktif") !== "Aktif";
        if (demote || deactivate) {
          const otherAdmins = countActiveAdmins(formData.ID);
          if (otherAdmins < 1) {
            errors.push("Tidak dapat mengubah/menonaktifkan Admin terakhir. Harus ada minimal 1 Admin aktif.");
          }
        }
      }
    }
  }

  if (formData.Tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(String(formData.Tanggal))) {
    errors.push("Format tanggal tidak valid (YYYY-MM-DD).");
  }
  return errors;
}

// ====================== MASTER OPTIONS ======================
function getMasterOptions(type, token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    let sheetName, extraFilter = null;
    if (type === "kelas") {
      sheetName = SHEET_NAMES.KELAS;
      extraFilter = r => r.Status === "Aktif" || !r.Status;
    } else if (type === "mapel") {
      sheetName = SHEET_NAMES.MAPEL;
      extraFilter = r => r.Status === "Aktif" || !r.Status;
    } else if (type === "siswa") {
      sheetName = SHEET_NAMES.SISWA;
      extraFilter = r => r.Status === "Aktif" || !r.Status;
    } else if (type === "guru") {
      sheetName = SHEET_NAMES.GURU;
      extraFilter = r => r.Status === "Aktif" || !r.Status;
    } else if (type === "tahunajaran") {
      sheetName = SHEET_NAMES.TAHUN_AJARAN;
      extraFilter = r => r.Status === "Aktif" || !r.Status;
    } else {
      return { success: false, message: "Tipe master tidak dikenal." };
    }

    let list = getRawData(sheetName);
    if (extraFilter) list = list.filter(extraFilter);

    const options = list.map(r => ({
      id: r.ID,
      text: r.Nama || r.TahunAjaran || "-",
      extra: r
    }));
    return { success: true, data: options };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil opsi master." };
  }
}

function getSiswaByKelas(kelasIdOrName, token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    const list = getRawData(SHEET_NAMES.SISWA).filter(s => {
      const aktif = !s.Status || s.Status === "Aktif";
      if (!aktif) return false;
      if (s.KelasID && String(s.KelasID) === String(kelasIdOrName)) return true;
      if (s.Kelas && String(s.Kelas).toLowerCase() === String(kelasIdOrName).toLowerCase()) return true;
      return false;
    });
    return { success: true, data: list };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil siswa." };
  }
}


/** Validasi Guru hanya boleh akses kelas+mapel sesuai DB_TugasMengajar */
function guruPunyaTugas(guruId, kelasText, kelasId, mapelText, mapelId) {
  if (!guruId) return false;

  const matchKM = function(row) {
    const kelasOk =
      (kelasId && String(row.KelasID) === String(kelasId)) ||
      (kelasText && (String(row.Kelas) === String(kelasText) || String(row.KelasID) === String(kelasText)));
    const mapelOk =
      (mapelId && String(row.MapelID) === String(mapelId)) ||
      (mapelText && (String(row.MataPelajaran) === String(mapelText) || String(row.MapelID) === String(mapelText)));
    return kelasOk && mapelOk;
  };

  // 1) Cek Tugas Mengajar
  const tugas = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(t =>
    (t.Status === "Aktif" || !t.Status) && String(t.GuruID) === String(guruId)
  );
  if (tugas.some(matchKM)) return true;

  // 2) Fallback: cek Jadwal Mengajar (sumber data)
  const jadwal = getRawData(SHEET_NAMES.JADWAL).filter(j =>
    (j.Status === "Aktif" || !j.Status) && String(j.GuruID) === String(guruId)
  );
  return jadwal.some(matchKM);
}

// ====================== ABSENSI MASSAL ======================
function saveBulkAbsensi(payload, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(45000);
    const auth = requireAuth(token, ["Admin", "Guru"]);
    if (!auth.ok) return auth.error;

    if (!payload || !payload.tanggal || !payload.kelas || !payload.mapel || !Array.isArray(payload.items)) {
      return { success: false, message: "Payload absensi massal tidak lengkap." };
    }

    // Guru: wajib sesuai tugas mengajar
    if (auth.session.role === "Guru") {
      if (!auth.session.guruId) {
        return { success: false, message: "Akun guru belum dihubungkan ke data Guru. Hubungi Admin." };
      }
      const okTugas = guruPunyaTugas(
        auth.session.guruId,
        payload.kelas,
        payload.kelasId || "",
        payload.mapel,
        payload.mapelId || ""
      );
      if (!okTugas) {
        return { success: false, message: "Kelas/mapel di luar tugas mengajar Anda. Absensi massal ditolak." };
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let absSheet = ss.getSheetByName(SHEET_NAMES.ABSENSI);
    if (!absSheet) {
      setupDatabase();
      absSheet = ss.getSheetByName(SHEET_NAMES.ABSENSI);
    }

    const existing = getRawData(SHEET_NAMES.ABSENSI);
    const existingMap = {};
    existing.forEach(r => {
      const key = [r.Tanggal, r.Kelas || r.KelasID, r.MataPelajaran || r.MapelID, r.NamaSiswa || r.SiswaID, r.Sesi || "1"].join("|");
      existingMap[key] = r;
    });

    const headers = absSheet.getRange(1, 1, 1, absSheet.getLastColumn()).getValues()[0];
    const now = getNow();
    const sesi = payload.sesi || "1";
    const guruId = auth.session.role === "Guru" ? auth.session.guruId : (payload.guruId || "");

    let successCount = 0, updateCount = 0, failCount = 0;
    const rowsToAppend = [];
    const errors = [];

    payload.items.forEach((item, idx) => {
      try {
        if (!item.status || STATUS_ABSEN_VALID.indexOf(item.status) === -1) {
          failCount++;
          errors.push(`Baris ${idx + 1}: status tidak valid`);
          return;
        }
        const nama = item.nama || item.Nama || "";
        const siswaId = item.siswaId || item.SiswaID || "";
        if (!nama && !siswaId) {
          failCount++;
          errors.push(`Baris ${idx + 1}: nama/siswa kosong`);
          return;
        }

        const key = [payload.tanggal, payload.kelas, payload.mapel, nama || siswaId, sesi].join("|");
        const exist = existingMap[key];

        const form = {
          Tanggal: payload.tanggal,
          Kelas: payload.kelas,
          MataPelajaran: payload.mapel,
          NamaSiswa: nama,
          StatusAbsen: item.status,
          Keterangan: item.keterangan || "",
          Sesi: sesi,
          KelasID: payload.kelasId || "",
          MapelID: payload.mapelId || "",
          SiswaID: siswaId,
          GuruID: guruId
        };

        if (exist && exist.ID) {
          // Update via saveData (sudah ada lock di luar, tapi saveData juga lock — untuk sederhana kita update langsung)
          const r = saveData(SHEET_NAMES.ABSENSI, Object.assign({ ID: exist.ID }, form), token);
          if (r.success) updateCount++;
          else { failCount++; errors.push(r.message); }
        } else {
          const id = generateId("ABS");
          const row = headers.map(h => {
            if (h === "ID") return id;
            if (h === "Timestamp" || h === "CreatedAt") return now;
            if (h === "UpdatedAt") return now;
            if (h === "CreatedBy" || h === "UpdatedBy") return auth.session.userId;
            if (h === "IsDeleted") return "FALSE";
            return form.hasOwnProperty(h) ? sanitizeInput(String(form[h] ?? "")) : "";
          });
          rowsToAppend.push(row);
          successCount++;
        }
      } catch (err) {
        failCount++;
        errors.push(String(err));
      }
    });

    // Batch append
    if (rowsToAppend.length > 0) {
      absSheet.getRange(absSheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
    }

    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "BULK_ABSENSI", SHEET_NAMES.ABSENSI, "", null, {
      successCount, updateCount, failCount
    });

    return {
      success: true,
      message: `Absensi massal selesai. Baru: ${successCount}, Diperbarui: ${updateCount}, Gagal: ${failCount}`,
      detail: { successCount, updateCount, failCount, errors: errors.slice(0, 10) }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyimpan absensi massal." };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ====================== REKAP & DASHBOARD ======================
function getRekapAbsensi(filters, token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    let data = getRawData(SHEET_NAMES.ABSENSI);

    if (auth.session.role === "Guru") {
      data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
    }

    if (filters) {
      if (filters.tanggalMulai) data = data.filter(r => r.Tanggal >= filters.tanggalMulai);
      if (filters.tanggalSelesai) data = data.filter(r => r.Tanggal <= filters.tanggalSelesai);
      if (filters.kelas) data = data.filter(r => (r.Kelas || "") === filters.kelas || (r.KelasID || "") === filters.kelas);
      if (filters.mapel) data = data.filter(r => (r.MataPelajaran || "") === filters.mapel || (r.MapelID || "") === filters.mapel);
      if (filters.siswa) data = data.filter(r => (r.NamaSiswa || "").toLowerCase().includes(String(filters.siswa).toLowerCase()));
      if (filters.status) data = data.filter(r => r.StatusAbsen === filters.status);
    }

    const rekap = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Total: data.length };
    data.forEach(r => {
      const s = r.StatusAbsen;
      if (rekap.hasOwnProperty(s)) rekap[s]++;
    });
    rekap.PersentaseHadir = rekap.Total > 0 ? Math.round((rekap.Hadir / rekap.Total) * 1000) / 10 : 0;

    return { success: true, data: data, rekap: rekap };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal membuat rekap." };
  }
}

/**
 * Tanggal hari ini (timezone spreadsheet) format YYYY-MM-DD.
 */
function getTodayYmd() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
}

/**
 * Apakah hari ini berada dalam rentang TanggalMulai–TanggalSelesai.
 * - Mulai kosong → dianggap belum mulai (false)
 * - Selesai kosong → tetap aktif setelah Mulai (hingga diisi)
 */
function isTahunAjaranBerlakuHariIni(ta, todayYmd) {
  const today = todayYmd || getTodayYmd();
  const mulai = String(ta.TanggalMulai || "").substring(0, 10);
  const selesai = String(ta.TanggalSelesai || "").substring(0, 10);
  if (!mulai || !/^\d{4}-\d{2}-\d{2}$/.test(mulai)) return false;
  if (today < mulai) return false; // belum mulai
  if (selesai && /^\d{4}-\d{2}-\d{2}$/.test(selesai) && today > selesai) return false; // sudah lewat
  return true;
}

/**
 * Sinkron Status Tahun Ajaran dari rentang tanggal:
 * - Aktif  : TanggalMulai <= hari ini <= TanggalSelesai (atau tanpa batas akhir)
 * - Nonaktif: di luar rentang
 * Jika >1 yang berlaku, hanya 1 yang tetap Aktif (TanggalMulai terbaru),
 * sisanya Nonaktif; pengaturan TA/semester diselaraskan.
 *
 * @returns {{ changed: number, aktif: object|null }}
 */
function syncStatusTahunAjaranByDate() {
  const result = { changed: 0, aktif: null };
  try {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(8000);
    } catch (eLock) {
      // lanjut tanpa lock jika timeout singkat
    }

    const today = getTodayYmd();
    const all = getRawData(SHEET_NAMES.TAHUN_AJARAN, true);
    if (!all.length) {
      try { LockService.getScriptLock().releaseLock(); } catch (e) {}
      return result;
    }

    // Tentukan baris yang "berlaku" hari ini
    const berlaku = all.filter(function(t) {
      if (String(t.IsDeleted).toUpperCase() === "TRUE") return false;
      return isTahunAjaranBerlakuHariIni(t, today);
    });
    berlaku.sort(function(a, b) {
      return String(b.TanggalMulai || "").localeCompare(String(a.TanggalMulai || ""));
    });
    const keepId = berlaku.length ? String(berlaku[0].ID) : null;

    all.forEach(function(t) {
      if (String(t.IsDeleted).toUpperCase() === "TRUE") return;
      const shouldAktif = keepId && String(t.ID) === keepId;
      const desired = shouldAktif ? "Aktif" : "Nonaktif";
      const current = String(t.Status || "").trim();
      // Normalisasi status kosong / beda kapital
      if (current.toLowerCase() !== desired.toLowerCase()) {
        updateFieldById(SHEET_NAMES.TAHUN_AJARAN, t.ID, {
          Status: desired,
          UpdatedAt: getNow(),
          UpdatedBy: "system-date-sync"
        });
        result.changed++;
      }
    });

    if (keepId) {
      result.aktif = all.find(function(t) { return String(t.ID) === keepId; }) || berlaku[0];
      // Pastikan object aktif punya Status terkini
      if (result.aktif) {
        result.aktif = Object.assign({}, result.aktif, { Status: "Aktif" });
        syncPengaturanDariTahunAjaran(result.aktif, "system-date-sync");
      }
    }

    try { LockService.getScriptLock().releaseLock(); } catch (e) {}
  } catch (e) {
    console.error("syncStatusTahunAjaranByDate:", e);
    try { LockService.getScriptLock().releaseLock(); } catch (e2) {}
  }
  return result;
}

/**
 * Ambil Tahun Ajaran + Semester yang Status = Aktif dari master.
 * Status diselaraskan dulu dari TanggalMulai–TanggalSelesai.
 * Jika lebih dari satu, ambil yang TanggalMulai terbaru.
 */
function getAktifTahunAjaran() {
  try {
    // Pastikan status mengikuti tanggal
    try { syncStatusTahunAjaranByDate(); } catch (eSync) {}

    const list = getRawData(SHEET_NAMES.TAHUN_AJARAN).filter(t =>
      String(t.Status || "").toLowerCase() === "aktif"
    );
    if (!list.length) {
      // Fallback: hitung dari tanggal tanpa mengandalkan kolom Status
      const today = getTodayYmd();
      const byDate = getRawData(SHEET_NAMES.TAHUN_AJARAN).filter(t => isTahunAjaranBerlakuHariIni(t, today));
      byDate.sort((a, b) => String(b.TanggalMulai || "").localeCompare(String(a.TanggalMulai || "")));
      return byDate.length ? byDate[0] : null;
    }
    list.sort((a, b) => String(b.TanggalMulai || "").localeCompare(String(a.TanggalMulai || "")));
    return list[0];
  } catch (e) {
    return null;
  }
}

/**
 * Sinkronkan pengaturan tahun_ajaran_aktif & semester_aktif dari master Status=Aktif.
 * Dipanggil setelah simpan DB_TahunAjaran.
 */
function syncPengaturanDariTahunAjaran(taRow, userId) {
  try {
    if (!taRow) return;
    const tahun = String(taRow.TahunAjaran || "").trim();
    const semester = String(taRow.Semester || "").trim();
    if (!tahun) return;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    if (!sheet) return;
    const data = getRawData(SHEET_NAMES.PENGATURAN);
    const upsert = (key, value) => {
      const existing = data.find(r => r.Key === key);
      if (existing) {
        updateFieldById(SHEET_NAMES.PENGATURAN, existing.ID, {
          Value: value,
          UpdatedAt: getNow(),
          UpdatedBy: userId || "system"
        });
      } else {
        sheet.appendRow([generateId("SET"), key, value, getNow(), userId || "system"]);
      }
    };
    upsert("tahun_ajaran_aktif", tahun);
    if (semester) upsert("semester_aktif", semester);
  } catch (e) {
    console.error("syncPengaturanDariTahunAjaran:", e);
  }
}

/**
 * Saat satu baris TA di-set Aktif, nonaktifkan baris TA lain (satu aktif saja).
 */
function ensureSingleAktifTahunAjaran(keepId) {
  try {
    const all = getRawData(SHEET_NAMES.TAHUN_AJARAN, true);
    all.forEach(t => {
      if (String(t.ID) === String(keepId)) return;
      if (String(t.Status || "").toLowerCase() === "aktif") {
        updateFieldById(SHEET_NAMES.TAHUN_AJARAN, t.ID, {
          Status: "Nonaktif",
          UpdatedAt: getNow()
        });
      }
    });
  } catch (e) {
    console.error("ensureSingleAktifTahunAjaran:", e);
  }
}

function getDashboardData(token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    const siswa = getRawData(SHEET_NAMES.SISWA).filter(s => s.Status === "Aktif" || !s.Status);
    const guru = getRawData(SHEET_NAMES.GURU).filter(g => g.Status === "Aktif" || !g.Status);
    const kelas = getRawData(SHEET_NAMES.KELAS).filter(k => k.Status === "Aktif" || !k.Status);
    const mapel = getRawData(SHEET_NAMES.MAPEL).filter(m => m.Status === "Aktif" || !m.Status);
    let jurnal = getRawData(SHEET_NAMES.JURNAL);
    let absensi = getRawData(SHEET_NAMES.ABSENSI);
    let nilai = getRawData(SHEET_NAMES.NILAI);

    if (auth.session.role === "Guru") {
      jurnal = jurnal.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
      absensi = absensi.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
      nilai = nilai.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
    }

    // Rekap absensi
    const rekapAbs = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Total: absensi.length };
    absensi.forEach(r => {
      if (rekapAbs.hasOwnProperty(r.StatusAbsen)) rekapAbs[r.StatusAbsen]++;
    });
    rekapAbs.PersentaseHadir = rekapAbs.Total > 0 ? Math.round((rekapAbs.Hadir / rekapAbs.Total) * 1000) / 10 : 0;

    // Aktivitas terbaru (gabungan)
    const aktivitas = [];
    absensi.slice(-10).reverse().forEach(a => {
      aktivitas.push({
        tipe: "Absensi",
        keterangan: `${a.NamaSiswa || "-"} — ${a.StatusAbsen} (${a.Kelas})`,
        tanggal: a.Tanggal || a.CreatedAt,
        waktu: a.CreatedAt || a.Timestamp
      });
    });
    jurnal.slice(-8).reverse().forEach(j => {
      aktivitas.push({
        tipe: "Jurnal",
        keterangan: `${j.MateriPokok || "-"} — ${j.Kelas} / ${j.MataPelajaran}`,
        tanggal: j.Tanggal || j.CreatedAt,
        waktu: j.CreatedAt || j.Timestamp
      });
    });
    aktivitas.sort((a, b) => (b.waktu || "").localeCompare(a.waktu || ""));

    // Statistik nilai sederhana
    const nilaiNums = nilai.map(n => Number(n.Nilai)).filter(n => !isNaN(n));
    const avgNilai = nilaiNums.length ? Math.round((nilaiNums.reduce((a, b) => a + b, 0) / nilaiNums.length) * 10) / 10 : 0;

    // Pengaturan — badge TA/Semester diutamakan dari master Status=Aktif
    const pengaturan = {};
    getRawData(SHEET_NAMES.PENGATURAN).forEach(p => { pengaturan[p.Key] = p.Value; });
    const taAktif = getAktifTahunAjaran();
    const tahunAjaranAktif = (taAktif && taAktif.TahunAjaran)
      ? String(taAktif.TahunAjaran)
      : (pengaturan.tahun_ajaran_aktif || "-");
    const semesterAktif = (taAktif && taAktif.Semester)
      ? String(taAktif.Semester)
      : (pengaturan.semester_aktif || "-");
    // Perbaiki pengaturan jika tidak sinkron dengan master
    if (taAktif && taAktif.TahunAjaran) {
      if (pengaturan.tahun_ajaran_aktif !== String(taAktif.TahunAjaran) ||
          pengaturan.semester_aktif !== String(taAktif.Semester || "")) {
        syncPengaturanDariTahunAjaran(taAktif, "system");
      }
    }

    return {
      success: true,
      data: {
        totalSiswaAktif: siswa.length,
        totalGuruAktif: guru.length,
        totalKelas: kelas.length,
        totalMapel: mapel.length,
        totalJurnal: jurnal.length,
        totalAbsensi: absensi.length,
        rekapAbsensi: rekapAbs,
        rataRataNilai: avgNilai,
        totalNilai: nilai.length,
        aktivitasTerbaru: aktivitas.slice(0, 12),
        tahunAjaranAktif: tahunAjaranAktif,
        semesterAktif: semesterAktif,
        namaSekolah: pengaturan.nama_sekolah || "SIKAD DIGITAL"
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal memuat dashboard." };
  }
}

// ====================== PENGATURAN ======================
function getPengaturan(token) {
  const auth = requireAuth(token);
  if (!auth.ok) return auth.error;
  const list = getRawData(SHEET_NAMES.PENGATURAN);
  const obj = {};
  list.forEach(p => { obj[p.Key] = p.Value; });
  return { success: true, data: obj };
}

function savePengaturan(key, value, token) {
  const auth = requireAuth(token, ["Admin"]);
  if (!auth.ok) return auth.error;
  if (!key) return { success: false, message: "Key pengaturan wajib." };
  if (value === null || value === undefined) value = "";
  else if (typeof value !== "string") {
    try { value = JSON.stringify(value); } catch (eJ) { value = String(value); }
  }
  if (value.length > 50000) value = value.substring(0, 50000);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  }
  if (!sheet) return { success: false, message: "Sheet pengaturan tidak ditemukan." };

  // Tulis langsung via scan kolom Key (lebih andal daripada updateFieldById)
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  let keyCol = headers.indexOf("Key");
  let valCol = headers.indexOf("Value");
  let idCol = headers.indexOf("ID");
  let updAtCol = headers.indexOf("UpdatedAt");
  let updByCol = headers.indexOf("UpdatedBy");
  if (keyCol < 0) {
    // header rusak — rebuild minimal
    sheet.getRange(1, 1, 1, 5).setValues([["ID", "Key", "Value", "UpdatedAt", "UpdatedBy"]]);
    keyCol = 1; valCol = 2; idCol = 0; updAtCol = 3; updByCol = 4;
  }
  if (valCol < 0) valCol = keyCol + 1;

  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  if (lastRow >= 2) {
    const keys = sheet.getRange(2, keyCol + 1, lastRow, keyCol + 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0] || "").trim() === String(key).trim()) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, valCol + 1).setValue(value);
    if (updAtCol >= 0) sheet.getRange(foundRow, updAtCol + 1).setValue(getNow());
    if (updByCol >= 0) sheet.getRange(foundRow, updByCol + 1).setValue(auth.session.userId || "");
  } else {
    const row = new Array(Math.max(headers.length, 5)).fill("");
    if (idCol >= 0) row[idCol] = generateId("SET");
    else row[0] = generateId("SET");
    row[keyCol] = key;
    row[valCol] = value;
    if (updAtCol >= 0) row[updAtCol] = getNow();
    if (updByCol >= 0) row[updByCol] = auth.session.userId || "";
    sheet.appendRow(row);
  }
  // Verifikasi baca ulang
  let verified = "";
  const lastRow2 = sheet.getLastRow();
  if (lastRow2 >= 2) {
    const keys2 = sheet.getRange(2, keyCol + 1, lastRow2, keyCol + 1).getValues();
    const vals2 = sheet.getRange(2, valCol + 1, lastRow2, valCol + 1).getValues();
    for (let i = 0; i < keys2.length; i++) {
      if (String(keys2[i][0] || "").trim() === String(key).trim()) {
        verified = String(vals2[i][0] || "");
        break;
      }
    }
  }
  return {
    success: true,
    message: "Pengaturan disimpan.",
    key: key,
    valueLength: value.length,
    verifiedLength: verified.length,
    verifiedPreview: verified.substring(0, 120)
  };
}

/**
 * Meta kop surat + pejabat untuk semua cetakan.
 * Logo: URL gambar (Drive/public/CDN). Kosong = tanpa logo.
 * Drive URL dinormalisasi & (jika memungkinkan) diubah ke data-URL agar tampil di cetak.
 */

/**
 * Simpan khusus grup kelas gabungan — menerima array atau JSON string.
 */
function saveKelasGabungGroups(token, groups) {
  const auth = requireAuth(token, ["Admin"]);
  if (!auth.ok) return auth.error;
  let arr = groups;
  if (typeof groups === "string") {
    try { arr = JSON.parse(groups || "[]"); } catch (e) { arr = []; }
  }
  if (!Array.isArray(arr)) arr = [];
  arr = arr.filter(function(g) { return Array.isArray(g); })
    .map(function(g) {
      return g.map(function(x) { return String(x || "").trim(); }).filter(Boolean);
    })
    .filter(function(g) { return g.length >= 2; });
  const json = JSON.stringify(arr);
  const res = savePengaturan("jadwal_kelas_gabung_groups", json, token);
  if (res && res.success) {
    res.groups = arr;
    res.count = arr.length;
    res.message = "Grup kelas gabungan disimpan: " + arr.length + " grup.";
  }
  return res;
}

function extractDriveFileId(url) {
  if (!url) return "";
  var s = String(url).trim();
  var m = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // pure id
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  return "";
}

/**
 * Beberapa bentuk URL Google Drive yang lebih sering bisa diload di browser.
 * Catatan: uc?export=view sering gagal (redirect/CORS) di window cetak.
 */
function normalizeDriveImageUrl(url) {
  if (!url) return "";
  var s = String(url).trim();
  if (!s) return "";
  var id = extractDriveFileId(s);
  if (id) {
    // thumbnail relatif stabil untuk preview & print
    return "https://drive.google.com/thumbnail?id=" + id + "&sz=w400";
  }
  return s;
}

/**
 * Ambil gambar sebagai data-URL (base64) lewat server Apps Script.
 * Ini cara paling andal agar logo muncul di jendela cetak.
 * Gagal → kembalikan URL normalisasi (fallback).
 */
function fetchImageAsDataUrl(url) {
  try {
    if (!url) return "";
    var s = String(url).trim();
    if (!s) return "";
    if (s.indexOf("data:image") === 0) return s;

    var id = extractDriveFileId(s);
    var candidates = [];
    if (id) {
      candidates.push("https://drive.google.com/thumbnail?id=" + id + "&sz=w400");
      candidates.push("https://lh3.googleusercontent.com/d/" + id + "=s400");
      candidates.push("https://drive.google.com/uc?export=download&id=" + id);
      candidates.push("https://drive.google.com/uc?export=view&id=" + id);
    } else {
      candidates.push(s);
    }

    for (var i = 0; i < candidates.length; i++) {
      try {
        var resp = UrlFetchApp.fetch(candidates[i], {
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });
        var code = resp.getResponseCode();
        if (code < 200 || code >= 300) continue;
        var blob = resp.getBlob();
        var ctype = (blob.getContentType() || "").toLowerCase();
        // Kadang Drive mengembalikan HTML login — skip
        if (ctype.indexOf("text/html") !== -1) continue;
        if (ctype.indexOf("image/") === -1) {
          // coba tebak dari ekstensi/bytes
          var name = blob.getName() || "";
          if (!/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name) && ctype.indexOf("octet") === -1) {
            // still try if small binary
            var bytes = blob.getBytes();
            if (!bytes || bytes.length < 50) continue;
          }
          if (ctype.indexOf("image/") === -1) ctype = "image/png";
        }
        var b64 = Utilities.base64Encode(blob.getBytes());
        return "data:" + ctype + ";base64," + b64;
      } catch (eOne) {
        // coba kandidat berikutnya
      }
    }
    return normalizeDriveImageUrl(s);
  } catch (e) {
    console.error("fetchImageAsDataUrl:", e);
    return normalizeDriveImageUrl(url);
  }
}

function findGuruByIdOrRole(guruList, id, roleHints) {
  var g = null;
  if (id) {
    g = guruList.find(function(x) { return String(x.ID) === String(id); });
  }
  if (!g && roleHints && roleHints.length) {
    g = guruList.find(function(x) {
      var role = String(x.Role || "").toLowerCase();
      var aktif = !x.Status || String(x.Status) === "Aktif";
      if (!aktif) return false;
      for (var i = 0; i < roleHints.length; i++) {
        if (role.indexOf(String(roleHints[i]).toLowerCase()) !== -1) return true;
      }
      return false;
    });
  }
  return g || null;
}

function getPrintKopMeta(options) {
  options = options || {};
  var asDataUrl = options.asDataUrl !== false; // default: true untuk cetak

  const pengaturan = {};
  getRawData(SHEET_NAMES.PENGATURAN).forEach(function(p) {
    pengaturan[p.Key] = p.Value;
  });

  var guruList = getRawData(SHEET_NAMES.GURU);

  // Kepala Sekolah: dari guru (kepala_sekolah_guru_id), fallback Role "Kepala Sekolah",
  // fallback teks nama_kepala_sekolah (kompatibilitas lama)
  var kepala = { id: "", nama: "", nip: "" };
  var kepalaId = String(pengaturan.kepala_sekolah_guru_id || "").trim();
  var gKepala = findGuruByIdOrRole(guruList, kepalaId, ["kepala sekolah", "kepala"]);
  if (gKepala) {
    kepala = { id: gKepala.ID || "", nama: gKepala.Nama || "", nip: gKepala.NIP || "" };
  } else if (pengaturan.nama_kepala_sekolah) {
    kepala = {
      id: "",
      nama: String(pengaturan.nama_kepala_sekolah || ""),
      nip: String(pengaturan.nip_kepala_sekolah || "")
    };
  }

  // Kurikulum: dari pengaturan kurikulum_guru_id, fallback Role berisi "Kurikulum"
  var kurikulum = { id: "", nama: "", nip: "" };
  var kid = String(pengaturan.kurikulum_guru_id || "").trim();
  var gKur = findGuruByIdOrRole(guruList, kid, ["kurikulum"]);
  if (gKur) {
    kurikulum = { id: gKur.ID || "", nama: gKur.Nama || "", nip: gKur.NIP || "" };
  }

  var rawLogoKab = String(pengaturan.logo_kabupaten_url || "").trim();
  var rawLogoSek = String(pengaturan.logo_sekolah_url || "").trim();
  var logoKab = rawLogoKab ? (asDataUrl ? fetchImageAsDataUrl(rawLogoKab) : normalizeDriveImageUrl(rawLogoKab)) : "";
  var logoSek = rawLogoSek ? (asDataUrl ? fetchImageAsDataUrl(rawLogoSek) : normalizeDriveImageUrl(rawLogoSek)) : "";

  return {
    sekolah: pengaturan.nama_sekolah || "SIKAD DIGITAL",
    alamatSekolah: pengaturan.alamat_sekolah || "",
    emailSekolah: pengaturan.email_sekolah || "",
    instansiKop: pengaturan.instansi_kop || "PEMERINTAH KABUPATEN JEMBER",
    kopFontInstansi: pengaturan.kop_font_instansi || "11",
    kopFontNama: pengaturan.kop_font_nama || "14",
    kopFontAlamat: pengaturan.kop_font_alamat || "10",
    kopFontJudul: pengaturan.kop_font_judul || "14",
    kopFontSubJudul: pengaturan.kop_font_subjudul || "12",
    kopLogoSize: pengaturan.kop_logo_size || "72",
    logoKabupaten: logoKab,
    logoSekolah: logoSek,
    logoKabupatenRaw: rawLogoKab,
    logoSekolahRaw: rawLogoSek,
    tahunAjaran: pengaturan.tahun_ajaran_aktif || "",
    semester: pengaturan.semester_aktif || "",
    kepalaSekolah: kepala,
    kurikulum: kurikulum
  };
}

/**
 * Preview logo dari pengaturan (untuk UI Admin) — mengembalikan data-URL jika berhasil.
 */
function previewLogoUrl(token, url) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    if (!url) return { success: true, dataUrl: "", message: "URL kosong" };
    var dataUrl = fetchImageAsDataUrl(url);
    var ok = dataUrl && dataUrl.indexOf("data:image") === 0;
    return {
      success: true,
      dataUrl: dataUrl,
      normalized: normalizeDriveImageUrl(url),
      ok: ok,
      message: ok ? "Logo berhasil dimuat" : "Tidak bisa memuat sebagai gambar. Pastikan file Drive di-share: Anyone with the link (Viewer)."
    };
  } catch (e) {
    return { success: false, message: "Gagal preview logo: " + (e.message || String(e)) };
  }
}

function resolveGuruPengampu(filters) {
  filters = filters || {};
  var result = { nama: "", nip: "", id: "" };

  function matchTugas(t) {
    var kelasOk =
      (!filters.kelas && !filters.kelasId) ||
      (filters.kelasId && String(t.KelasID) === String(filters.kelasId)) ||
      (filters.kelas && (String(t.Kelas) === String(filters.kelas) || String(t.KelasID) === String(filters.kelas)));
    var mapelOk =
      (!filters.mapel && !filters.mapelId) ||
      (filters.mapelId && String(t.MapelID) === String(filters.mapelId)) ||
      (filters.mapel && (String(t.MataPelajaran) === String(filters.mapel) || String(t.MapelID) === String(filters.mapel)));
    return kelasOk && mapelOk;
  }

  var guruIdPref = filters.guruId || "";
  var tugas = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(function(t) {
    return (t.Status === "Aktif" || !t.Status) && matchTugas(t);
  });
  if (guruIdPref) {
    var tPref = tugas.find(function(t) { return String(t.GuruID) === String(guruIdPref); });
    if (tPref) {
      result.id = tPref.GuruID || "";
      result.nama = tPref.Guru || "";
    }
  }
  if (!result.id && tugas.length) {
    result.id = tugas[0].GuruID || "";
    result.nama = tugas[0].Guru || "";
  }

  // Fallback jadwal
  if (!result.id) {
    var jadwal = getRawData(SHEET_NAMES.JADWAL).filter(function(j) {
      return (j.Status === "Aktif" || !j.Status) && matchTugas(j);
    });
    if (guruIdPref) {
      var jPref = jadwal.find(function(j) { return String(j.GuruID) === String(guruIdPref); });
      if (jPref) {
        result.id = jPref.GuruID || "";
        result.nama = jPref.Guru || "";
      }
    }
    if (!result.id && jadwal.length) {
      result.id = jadwal[0].GuruID || "";
      result.nama = jadwal[0].Guru || "";
    }
  }

  if (result.id) {
    var g = getRawData(SHEET_NAMES.GURU).find(function(x) { return String(x.ID) === String(result.id); });
    if (g) {
      result.nama = result.nama || g.Nama || "";
      result.nip = g.NIP || "";
    }
  } else if (result.nama) {
    var g2 = getRawData(SHEET_NAMES.GURU).find(function(x) {
      return String(x.Nama || "").toLowerCase() === String(result.nama).toLowerCase();
    });
    if (g2) {
      result.id = g2.ID || "";
      result.nip = g2.NIP || "";
    }
  }
  return result;
}

function attachPrintMeta(dataObj, filters) {
  var kop = getPrintKopMeta();
  dataObj.kop = kop;
  dataObj.logoKabupaten = kop.logoKabupaten;
  dataObj.logoSekolah = kop.logoSekolah;
  dataObj.alamatSekolah = kop.alamatSekolah;
  dataObj.emailSekolah = kop.emailSekolah;
  dataObj.instansiKop = kop.instansiKop;
  dataObj.kopFontInstansi = kop.kopFontInstansi;
  dataObj.kopFontNama = kop.kopFontNama;
  dataObj.kopFontAlamat = kop.kopFontAlamat;
  dataObj.kopFontJudul = kop.kopFontJudul;
  dataObj.kopFontSubJudul = kop.kopFontSubJudul;
  dataObj.kopLogoSize = kop.kopLogoSize;
  dataObj.kepalaSekolah = kop.kepalaSekolah;
  dataObj.kurikulum = kop.kurikulum;
  if (!dataObj.sekolah) dataObj.sekolah = kop.sekolah;
  if (!dataObj.tahunAjaran) dataObj.tahunAjaran = kop.tahunAjaran;
  if (!dataObj.semester) dataObj.semester = kop.semester;
  var guru = resolveGuruPengampu(filters || {});
  dataObj.guruPengampu = guru;
  return dataObj;
}


// ====================== USER MANAGEMENT (Admin) ======================
function getUsers(token) {
  const auth = requireAuth(token, ["Admin"]);
  if (!auth.ok) return auth.error;
  const users = getRawData(SHEET_NAMES.USERS).map(u => {
    const copy = Object.assign({}, u);
    delete copy.PasswordHash;
    return copy;
  });
  return { success: true, data: users };
}

// ====================== TUGAS MENGAJAR ======================
/**
 * Pastikan ada baris Tugas Mengajar untuk kombinasi
 * Guru + Mapel + Kelas (+ TA/Semester) dari satu baris Jadwal.
 * JamPerMinggu dihitung ulang dari jumlah slot jadwal aktif kombinasi tersebut.
 */
function ensureTugasFromJadwal(jadwalRow, userId) {
  try {
    if (!jadwalRow) return null;
    if (String(jadwalRow.JenisJadwal || "Pelajaran") === "Kegiatan") return null;
    const statusJ = String(jadwalRow.Status || "Aktif");
    if (statusJ.toLowerCase() === "nonaktif") return null;

    const guruId = String(jadwalRow.GuruID || "").trim();
    const mapelId = String(jadwalRow.MapelID || "").trim();
    const kelasId = String(jadwalRow.KelasID || "").trim();
    const guru = String(jadwalRow.Guru || "").trim();
    const mapel = String(jadwalRow.MataPelajaran || "").trim();
    const kelas = String(jadwalRow.Kelas || "").trim();
    let ta = String(jadwalRow.TahunAjaran || "").trim();
    let sem = String(jadwalRow.Semester || "").trim();
    // Isi TA/semester dari pengaturan jika jadwal belum punya (penting untuk filter generate)
    if (!ta || !sem) {
      try {
        const peng = getRawData(SHEET_NAMES.PENGATURAN);
        const getP = function(k) {
          const f = peng.find(function(p) { return p.Key === k; });
          return f ? String(f.Value || "").trim() : "";
        };
        if (!ta) ta = getP("tahun_ajaran_aktif");
        if (!sem) sem = getP("semester_aktif") || "Ganjil";
      } catch (eP) {}
    }

    if ((!guruId && !guru) || (!mapelId && !mapel) || (!kelasId && !kelas)) {
      return null;
    }

    // Hitung jam/minggu dari semua jadwal aktif kombinasi yang sama
    const semuaJadwal = getRawData(SHEET_NAMES.JADWAL).filter(function(j) {
      if (String(j.Status || "Aktif").toLowerCase() === "nonaktif") return false;
      const gOk = (guruId && String(j.GuruID) === guruId) || (!guruId && String(j.Guru || "") === guru);
      const mOk = (mapelId && String(j.MapelID) === mapelId) || (!mapelId && String(j.MataPelajaran || "") === mapel);
      const kOk = (kelasId && String(j.KelasID) === kelasId) || (!kelasId && String(j.Kelas || "") === kelas);
      const taOk = !ta || !j.TahunAjaran || String(j.TahunAjaran) === ta;
      const smOk = !sem || !j.Semester || String(j.Semester) === sem;
      return gOk && mOk && kOk && taOk && smOk;
    });
    const jamPerMinggu = String(semuaJadwal.length || 1);

    const existing = getRawData(SHEET_NAMES.TUGAS_MENGAJAR);
    const found = existing.find(function(r) {
      const gOk = (guruId && String(r.GuruID) === guruId) || (!guruId && String(r.Guru || "") === guru);
      const mOk = (mapelId && String(r.MapelID) === mapelId) || (!mapelId && String(r.MataPelajaran || "") === mapel);
      const kOk = (kelasId && String(r.KelasID) === kelasId) || (!kelasId && String(r.Kelas || "") === kelas);
      // Cocokkan TA/sem longgar: kosong di salah satu sisi dianggap match
      const rTA = String(r.TahunAjaran || "").trim();
      const rSem = String(r.Semester || "").trim();
      const taOk = !ta || !rTA || rTA === ta;
      const smOk = !sem || !rSem || rSem === sem;
      return gOk && mOk && kOk && taOk && smOk;
    });

    const payload = {
      GuruID: guruId || (found && found.GuruID) || "",
      Guru: guru || (found && found.Guru) || "",
      MapelID: mapelId || (found && found.MapelID) || "",
      MataPelajaran: mapel || (found && found.MataPelajaran) || "",
      KelasID: kelasId || (found && found.KelasID) || "",
      Kelas: kelas || (found && found.Kelas) || "",
      TahunAjaran: ta,
      Semester: sem,
      JamPerMinggu: jamPerMinggu,
      Status: "Aktif"
    };

    if (found) {
      updateFieldById(SHEET_NAMES.TUGAS_MENGAJAR, found.ID, {
        GuruID: payload.GuruID,
        Guru: payload.Guru,
        MapelID: payload.MapelID,
        MataPelajaran: payload.MataPelajaran,
        KelasID: payload.KelasID,
        Kelas: payload.Kelas,
        TahunAjaran: payload.TahunAjaran,
        Semester: payload.Semester,
        JamPerMinggu: payload.JamPerMinggu,
        Status: "Aktif",
        UpdatedAt: getNow(),
        UpdatedBy: userId || "system"
      });
      return found.ID;
    }

    // Insert langsung ke sheet (hindari requireAuth di saveData recursive)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.TUGAS_MENGAJAR);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEET_NAMES.TUGAS_MENGAJAR);
    }
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const id = generateId("TGS");
    const now = getNow();
    const row = headers.map(function(h) {
      if (h === "ID") return id;
      if (h === "CreatedAt" || h === "Timestamp") return now;
      if (h === "UpdatedAt") return now;
      if (h === "CreatedBy" || h === "UpdatedBy") return userId || "system";
      if (h === "IsDeleted") return "FALSE";
      return payload.hasOwnProperty(h) ? sanitizeInput(String(payload[h] ?? "")) : "";
    });
    sheet.appendRow(row);
    return id;
  } catch (e) {
    console.error("ensureTugasFromJadwal:", e);
    return null;
  }
}

/**
 * Sinkronkan seluruh Tugas Mengajar dari Jadwal aktif.
 * - Setiap kombinasi Guru–Mapel–Kelas–TA–Semester di jadwal → 1 baris tugas
 * - JamPerMinggu = jumlah slot jadwal kombinasi itu
 * Tidak menghapus tugas manual yang tidak ada di jadwal (hanya upsert).
 */
function syncTugasMengajarDariJadwal(token) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;

    const jadwal = getRawData(SHEET_NAMES.JADWAL).filter(function(j) {
      return String(j.Status || "Aktif").toLowerCase() !== "nonaktif";
    });

    // Group unik
    const seen = {};
    let created = 0;
    let updated = 0;
    jadwal.forEach(function(j) {
      const key = [
        j.GuruID || j.Guru || "",
        j.MapelID || j.MataPelajaran || "",
        j.KelasID || j.Kelas || "",
        j.TahunAjaran || "",
        j.Semester || ""
      ].join("|");
      if (seen[key]) return;
      seen[key] = true;

      const before = getRawData(SHEET_NAMES.TUGAS_MENGAJAR);
      const existed = before.some(function(r) {
        const gOk = (j.GuruID && String(r.GuruID) === String(j.GuruID)) || (!j.GuruID && String(r.Guru || "") === String(j.Guru || ""));
        const mOk = (j.MapelID && String(r.MapelID) === String(j.MapelID)) || (!j.MapelID && String(r.MataPelajaran || "") === String(j.MataPelajaran || ""));
        const kOk = (j.KelasID && String(r.KelasID) === String(j.KelasID)) || (!j.KelasID && String(r.Kelas || "") === String(j.Kelas || ""));
        const taOk = String(r.TahunAjaran || "") === String(j.TahunAjaran || "");
        const smOk = String(r.Semester || "") === String(j.Semester || "");
        return gOk && mOk && kOk && taOk && smOk;
      });

      ensureTugasFromJadwal(j, auth.session.userId);
      if (existed) updated++;
      else created++;
    });

    writeAuditLog(
      auth.session.userId,
      auth.session.nama,
      auth.session.role,
      "SYNC_TUGAS_DARI_JADWAL",
      SHEET_NAMES.TUGAS_MENGAJAR,
      "",
      null,
      { created: created, updated: updated, sumberJadwal: jadwal.length }
    );

    return {
      success: true,
      message: "Sinkron selesai. Baru: " + created + ", diperbarui: " + updated + " (dari " + jadwal.length + " slot jadwal).",
      created: created,
      updated: updated
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal sinkron tugas: " + (e.message || String(e)) };
  }
}

function getTugasMengajar(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    let data = getRawData(SHEET_NAMES.TUGAS_MENGAJAR);

    if (auth.session.role === "Guru") {
      data = data.filter(r => r.GuruID === auth.session.guruId);
    }
    if (filters) {
      if (filters.guruId) data = data.filter(r => r.GuruID === filters.guruId);
      if (filters.kelasId) data = data.filter(r => r.KelasID === filters.kelasId);
      if (filters.mapelId) data = data.filter(r => r.MapelID === filters.mapelId);
      if (filters.tahunAjaran) data = data.filter(r => r.TahunAjaran === filters.tahunAjaran);
      if (filters.semester) data = data.filter(r => r.Semester === filters.semester);
      if (filters.status) data = data.filter(r => r.Status === filters.status);
    }
    return { success: true, data: data };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil tugas mengajar." };
  }
}

function saveTugasMengajar(formData, token) {
  // Normalisasi & validasi khusus
  const auth = requireAuth(token, ["Admin"]);
  if (!auth.ok) return auth.error;

  if (!formData.GuruID && !formData.Guru) return { success: false, message: "Guru wajib dipilih." };
  if (!formData.MapelID && !formData.MataPelajaran) return { success: false, message: "Mata pelajaran wajib dipilih." };
  if (!formData.KelasID && !formData.Kelas) return { success: false, message: "Kelas wajib dipilih." };

  // Cegah duplikasi tugas yang sama
  const existing = getRawData(SHEET_NAMES.TUGAS_MENGAJAR);
  const dup = existing.find(r =>
    r.GuruID === formData.GuruID &&
    r.MapelID === formData.MapelID &&
    r.KelasID === formData.KelasID &&
    r.TahunAjaran === (formData.TahunAjaran || "") &&
    r.Semester === (formData.Semester || "") &&
    String(r.ID) !== String(formData.ID || "")
  );
  if (dup) {
    return { success: false, message: "Tugas mengajar untuk kombinasi Guru–Mapel–Kelas–Tahun/Semester ini sudah ada." };
  }

  return saveData(SHEET_NAMES.TUGAS_MENGAJAR, formData, token);
}

function getGuruMapelKelas(token) {
  // Helper: daftar tugas mengajar + opsi mapel/kelas unik untuk guru (atau semua untuk Admin)
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    let data = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(r => r.Status === "Aktif" || !r.Status);
    if (auth.session.role === "Guru") {
      data = data.filter(r => r.GuruID === auth.session.guruId);
    }

    // Unik mapel
    const mapelMap = {};
    data.forEach(r => {
      const key = r.MapelID || r.MataPelajaran;
      if (!key) return;
      if (!mapelMap[key]) {
        mapelMap[key] = { id: r.MapelID || "", text: r.MataPelajaran || r.MapelID || "-" };
      }
    });

    // Unik kelas
    const kelasMap = {};
    data.forEach(r => {
      const key = r.KelasID || r.Kelas;
      if (!key) return;
      if (!kelasMap[key]) {
        kelasMap[key] = { id: r.KelasID || "", text: r.Kelas || r.KelasID || "-" };
      }
    });

    // Fallback: jika Guru belum punya tugas mengajar, kembalikan kosong (bukan semua)
    // Admin tanpa filter tugas → tetap bisa pakai master penuh di frontend
    return {
      success: true,
      data: data,
      mapel: Object.values(mapelMap),
      kelas: Object.values(kelasMap),
      isGuru: auth.session.role === "Guru",
      guruId: auth.session.guruId || ""
    };
  } catch (e) {
    return { success: false, message: "Gagal." };
  }
}

/**
 * Rekap absensi untuk mengisi otomatis form jurnal:
 * jumlah hadir, jumlah tidak hadir, dan ringkasan keterangan (hambatan).
 */
function getAbsensiSummaryForJurnal(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    filters = filters || {};
    if (!filters.tanggal) {
      return { success: false, message: "Tanggal wajib." };
    }

    let data = getRawData(SHEET_NAMES.ABSENSI).filter(a => a.Tanggal === filters.tanggal);

    if (filters.kelas) {
      data = data.filter(a =>
        a.Kelas === filters.kelas ||
        a.KelasID === filters.kelas ||
        (filters.kelasId && a.KelasID === filters.kelasId)
      );
    }
    if (filters.mapel) {
      data = data.filter(a =>
        a.MataPelajaran === filters.mapel ||
        a.MapelID === filters.mapel ||
        (filters.mapelId && a.MapelID === filters.mapelId)
      );
    }
    if (auth.session.role === "Guru" && auth.session.guruId) {
      // Prioritas data absensi guru ini; jika kosong, tetap hitung semua di kelas/mapel itu
      const milikGuru = data.filter(a => a.GuruID === auth.session.guruId || a.CreatedBy === auth.session.userId);
      if (milikGuru.length) data = milikGuru;
    }

    let hadir = 0, izin = 0, sakit = 0, alpha = 0;
    const ketParts = [];
    data.forEach(a => {
      const st = a.StatusAbsen || "";
      if (st === "Hadir") hadir++;
      else if (st === "Izin") { izin++; if (a.NamaSiswa) ketParts.push(a.NamaSiswa + " (Izin" + (a.Keterangan ? ": " + a.Keterangan : "") + ")"); }
      else if (st === "Sakit") { sakit++; if (a.NamaSiswa) ketParts.push(a.NamaSiswa + " (Sakit" + (a.Keterangan ? ": " + a.Keterangan : "") + ")"); }
      else if (st === "Alpha") { alpha++; if (a.NamaSiswa) ketParts.push(a.NamaSiswa + " (Alpha" + (a.Keterangan ? ": " + a.Keterangan : "") + ")"); }
    });

    const tidakHadir = izin + sakit + alpha;
    let hambatan = "";
    if (ketParts.length) {
      hambatan = "Tidak hadir: " + ketParts.join("; ");
    } else if (data.length === 0) {
      hambatan = "";
    } else {
      hambatan = "Semua siswa hadir.";
    }

    return {
      success: true,
      data: {
        jumlahHadir: hadir,
        jumlahTidakHadir: tidakHadir,
        izin: izin,
        sakit: sakit,
        alpha: alpha,
        totalTercatat: data.length,
        hambatan: hambatan
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil ringkasan absensi." };
  }
}

// ====================== DETAIL SISWA & PINDAH KELAS ======================
function getSiswaDetail(siswaId, token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    if (!siswaId) return { success: false, message: "ID siswa wajib." };

    const siswaList = getRawData(SHEET_NAMES.SISWA, true);
    const siswa = siswaList.find(s => String(s.ID) === String(siswaId));
    if (!siswa) return { success: false, message: "Siswa tidak ditemukan." };

    const absensi = getRawData(SHEET_NAMES.ABSENSI).filter(a => a.SiswaID === siswaId || a.NamaSiswa === siswa.Nama);
    const nilai = getRawData(SHEET_NAMES.NILAI).filter(n => n.SiswaID === siswaId || n.NamaSiswa === siswa.Nama);
    const catatan = getRawData(SHEET_NAMES.CATATAN_SISWA).filter(c => c.SiswaID === siswaId);

    const rekapAbs = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Total: absensi.length };
    absensi.forEach(a => { if (rekapAbs.hasOwnProperty(a.StatusAbsen)) rekapAbs[a.StatusAbsen]++; });
    rekapAbs.PersentaseHadir = rekapAbs.Total > 0 ? Math.round((rekapAbs.Hadir / rekapAbs.Total) * 1000) / 10 : 0;

    const nilaiNums = nilai.map(n => Number(n.Nilai)).filter(n => !isNaN(n));
    const avgNilai = nilaiNums.length ? Math.round((nilaiNums.reduce((a, b) => a + b, 0) / nilaiNums.length) * 10) / 10 : 0;

    return {
      success: true,
      data: {
        siswa: siswa,
        rekapAbsensi: rekapAbs,
        totalNilai: nilai.length,
        rataRataNilai: avgNilai,
        catatanCount: catatan.length,
        riwayatKelas: siswa.RiwayatKelas ? (typeof siswa.RiwayatKelas === "string" ? siswa.RiwayatKelas : JSON.stringify(siswa.RiwayatKelas)) : ""
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil detail siswa." };
  }
}

function pindahKelasSiswa(siswaId, kelasBaruId, kelasBaruNama, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    if (!siswaId || (!kelasBaruId && !kelasBaruNama)) {
      return { success: false, message: "Siswa dan kelas tujuan wajib." };
    }

    const siswaList = getRawData(SHEET_NAMES.SISWA, true);
    const siswa = siswaList.find(s => String(s.ID) === String(siswaId));
    if (!siswa) return { success: false, message: "Siswa tidak ditemukan." };

    // Catat riwayat
    let riwayat = [];
    try {
      if (siswa.RiwayatKelas) riwayat = JSON.parse(siswa.RiwayatKelas);
    } catch (e) { riwayat = []; }
    riwayat.push({
      dari: siswa.Kelas || "",
      dariId: siswa.KelasID || "",
      ke: kelasBaruNama || "",
      keId: kelasBaruId || "",
      tanggal: getNow(),
      oleh: auth.session.nama
    });

    const form = {
      ID: siswaId,
      Kelas: kelasBaruNama || siswa.Kelas,
      KelasID: kelasBaruId || siswa.KelasID,
      RiwayatKelas: JSON.stringify(riwayat)
    };
    const res = saveData(SHEET_NAMES.SISWA, form, token);
    if (res.success) {
      writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "PINDAH_KELAS", SHEET_NAMES.SISWA, siswaId, { Kelas: siswa.Kelas }, { Kelas: kelasBaruNama });
    }
    return res;
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal memindahkan kelas." };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ====================== FILTER SISWA BY KELAS (enhanced) ======================
function getSiswaFiltered(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    let data = getRawData(SHEET_NAMES.SISWA);
    if (filters) {
      if (filters.kelasId) data = data.filter(s => s.KelasID === filters.kelasId || s.Kelas === filters.kelasId);
      if (filters.kelas) data = data.filter(s => (s.Kelas || "").toLowerCase().includes(String(filters.kelas).toLowerCase()));
      if (filters.status) data = data.filter(s => s.Status === filters.status);
      if (filters.tahunAjaran) data = data.filter(s => s.TahunAjaran === filters.tahunAjaran);
      if (filters.q) {
        const q = String(filters.q).toLowerCase();
        data = data.filter(s =>
          (s.Nama || "").toLowerCase().includes(q) ||
          (s.NIS || "").toLowerCase().includes(q) ||
          (s.NISN || "").toLowerCase().includes(q)
        );
      }
    }
    return { success: true, data: data };
  } catch (e) {
    return { success: false, message: "Gagal filter siswa." };
  }
}

// ====================== JADWAL MENGAJAR ======================
const HARI_VALID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = String(t).split(":");
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

function isTimeOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}


/**
 * Data jadwal siap cetak (format matriks mirip jadwal resmi sekolah).
 * Guru hanya melihat/cetak jadwal milik sendiri.
 */
function getJadwalCetak(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    filters = filters || {};
    let data = getRawData(SHEET_NAMES.JADWAL).filter(function(r) {
      return String(r.Status || "Aktif").toLowerCase() !== "nonaktif";
    });

    // Role Guru: hanya jadwal sendiri
    if (auth.session.role === "Guru") {
      data = data.filter(function(r) {
        return r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId;
      });
    } else if (filters.guruId) {
      data = data.filter(function(r) { return String(r.GuruID) === String(filters.guruId); });
    }

    if (filters.tahunAjaran) {
      data = data.filter(function(r) { return !r.TahunAjaran || String(r.TahunAjaran) === String(filters.tahunAjaran); });
    }
    if (filters.semester) {
      data = data.filter(function(r) { return !r.Semester || String(r.Semester) === String(filters.semester); });
    }

    // Urut
    const hariOrder = {};
    HARI_VALID.forEach(function(h, i) { hariOrder[h] = i; });
    data.sort(function(a, b) {
      const ha = hariOrder[a.Hari] != null ? hariOrder[a.Hari] : 99;
      const hb = hariOrder[b.Hari] != null ? hariOrder[b.Hari] : 99;
      if (ha !== hb) return ha - hb;
      return timeToMinutes(a.JamMulai) - timeToMinutes(b.JamMulai);
    });

    // Pengaturan sekolah
    const peng = getRawData(SHEET_NAMES.PENGATURAN);
    const getP = function(k, def) {
      const f = peng.find(function(p) { return p.Key === k; });
      return f ? String(f.Value || def) : def;
    };
    const namaSekolah = getP("nama_sekolah", "SIKAD DIGITAL School");
    const taAktif = filters.tahunAjaran || getP("tahun_ajaran_aktif", "");
    const semAktif = filters.semester || getP("semester_aktif", "Ganjil");

    // Kode guru (nomor urut berdasarkan nama unik)
    const guruNames = [];
    data.forEach(function(r) {
      const g = String(r.Guru || "").trim();
      if (g && guruNames.indexOf(g) === -1) guruNames.push(g);
    });
    guruNames.sort();
    const guruKode = {};
    guruNames.forEach(function(g, i) { guruKode[g] = String(i + 1); });

    // Singkatan mapel dari master
    const mapelList = getRawData(SHEET_NAMES.MAPEL);
    const mapelKode = {};
    mapelList.forEach(function(m) {
      if (m.Nama) mapelKode[String(m.Nama).trim()] = String(m.Kode || m.Nama).trim();
    });

    function abbrevMapel(nama) {
      const n = String(nama || "").trim();
      if (mapelKode[n]) return mapelKode[n];
      // fallback: huruf awal tiap kata (maks 4)
      const parts = n.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].substring(0, 4).toUpperCase();
      return parts.map(function(p) { return p.charAt(0); }).join("").substring(0, 5).toUpperCase();
    }

    function tingkatFromKelas(nama) {
      const s = String(nama || "").trim();
      if (!s || /^(semua|all|seluruh|semua kelas|seluruh sekolah)$/i.test(s)) return "";
      if (/VII\b|7\b|^7/i.test(s) && !/VIII|IX/.test(s)) return "7";
      if (/VIII\b|8\b|^8/i.test(s)) return "8";
      if (/IX\b|9\b|^9/i.test(s)) return "9";
      // fallback: digit pertama
      const m = s.match(/(\d+)/);
      return m ? m[1] : s;
    }

    const rows = data.map(function(r) {
      const guru = String(r.Guru || "").trim();
      const mapel = String(r.MataPelajaran || "").trim();
      const kodeM = abbrevMapel(mapel);
      const kodeG = guruKode[guru] || "";
      const jenis = String(r.JenisJadwal || "Pelajaran").trim() || "Pelajaran";
      const kelasNama = String(r.Kelas || "").trim();
      const tingkat = tingkatFromKelas(kelasNama);
      // Hanya kegiatan tanpa tingkat/kelas spesifik yang digabung lintas rombel
      const isGabungan = (jenis === "Kegiatan" && !tingkat);
      return {
        ID: r.ID,
        Hari: r.Hari,
        JamMulai: r.JamMulai,
        JamSelesai: r.JamSelesai,
        JenisJadwal: jenis,
        Kelas: r.Kelas,
        KelasID: r.KelasID,
        Tingkat: isGabungan ? "ALL" : tingkat,
        isGabungan: !!isGabungan,
        MataPelajaran: mapel,
        MapelKode: kodeM,
        Guru: guru,
        GuruID: r.GuruID,
        GuruKode: kodeG,
        Label: isGabungan
          ? (mapel || kodeM || "Kegiatan")
          : (kodeG ? (kodeM + "/" + kodeG) : kodeM),
        Semester: r.Semester || semAktif,
        TahunAjaran: r.TahunAjaran || taAktif
      };
    });

    const legend = guruNames.map(function(g, i) {
      return { kode: String(i + 1), nama: g };
    });

    // Jam istirahat dari pengaturan (untuk baris di cetak jadwal)
    var istirahatCetak = [];
    try {
      var rawIst = getP("jadwal_istirahat", "");
      if (rawIst) {
        var parsedIst = JSON.parse(rawIst);
        if (Array.isArray(parsedIst)) {
          istirahatCetak = parsedIst.filter(function(s) {
            return s && s.jamMulai && s.jamSelesai;
          }).map(function(s) {
            return {
              jamMulai: String(s.jamMulai).substring(0, 5),
              jamSelesai: String(s.jamSelesai).substring(0, 5),
              label: String(s.label || "ISTIRAHAT")
            };
          });
        }
      }
    } catch (eIst) { istirahatCetak = []; }
    if (!istirahatCetak.length) {
      istirahatCetak = [
        { jamMulai: "09:40", jamSelesai: "10:00", label: "ISTIRAHAT" },
        { jamMulai: "12:00", jamSelesai: "12:30", label: "ISTIRAHAT / SHOLAT" }
      ];
    }

    var dataOut = {
      namaSekolah: namaSekolah,
      sekolah: namaSekolah,
      tahunAjaran: taAktif,
      semester: semAktif,
      mode: auth.session.role === "Guru" ? "guru" : "sekolah",
      guruFilter: auth.session.role === "Guru" ? (auth.session.nama || "") : (filters.guruId || ""),
      rows: rows,
      legend: legend,
      hariList: HARI_VALID.slice(),
      istirahat: istirahatCetak,
      dicetakOleh: auth.session.nama || "",
      dicetakPada: getNow()
    };
    attachPrintMeta(dataOut, filters);
    return { success: true, data: dataOut };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyiapkan data cetak jadwal: " + (e.message || String(e)) };
  }
}

function getJadwal(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    let data = getRawData(SHEET_NAMES.JADWAL);

    // Guru: hanya jadwal mengajar miliknya (Pelajaran). Kegiatan rutin tidak ditampilkan.
    if (auth.session.role === "Guru") {
      data = data.filter(r => {
        const jenis = String(r.JenisJadwal || "Pelajaran");
        if (jenis === "Kegiatan") return false;
        return String(r.GuruID || "") === String(auth.session.guruId || "") ||
               String(r.CreatedBy || "") === String(auth.session.userId || "");
      });
    }
    if (filters) {
      if (filters.guruId) data = data.filter(r => r.GuruID === filters.guruId);
      if (filters.kelasId) data = data.filter(r => r.KelasID === filters.kelasId || r.Kelas === filters.kelasId);
      if (filters.hari) data = data.filter(r => r.Hari === filters.hari);
      if (filters.tahunAjaran) data = data.filter(r => r.TahunAjaran === filters.tahunAjaran);
      if (filters.semester) data = data.filter(r => r.Semester === filters.semester);
      if (filters.status) data = data.filter(r => r.Status === filters.status);
      if (filters.jenisJadwal) {
        const jn = String(filters.jenisJadwal);
        data = data.filter(r => {
          const rj = String(r.JenisJadwal || "Pelajaran");
          return rj === jn || (jn === "Pelajaran" && !r.JenisJadwal);
        });
      }
    }

    // Urutkan: hari lalu jam
    const hariOrder = {};
    HARI_VALID.forEach((h, i) => { hariOrder[h] = i; });
    data.sort((a, b) => {
      const ha = hariOrder[a.Hari] ?? 99;
      const hb = hariOrder[b.Hari] ?? 99;
      if (ha !== hb) return ha - hb;
      return timeToMinutes(a.JamMulai) - timeToMinutes(b.JamMulai);
    });

    return { success: true, data: data };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil jadwal." };
  }
}

/**
 * Baca daftar mapel yang diizinkan digabung multi-kelas di slot yang sama.
 * Match case-insensitive terhadap Nama / Kode mapel.
 */
function getMapelGabunganConfig() {
  const peng = getRawData(SHEET_NAMES.PENGATURAN);
  const getP = function(k, def) {
    const f = peng.find(function(p) { return p.Key === k; });
    return f ? String(f.Value != null ? f.Value : def) : def;
  };
  let list = [];
  try {
    const raw = getP("jadwal_mapel_gabungan", "[]");
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) list = parsed.map(function(x) { return String(x || "").trim(); }).filter(Boolean);
  } catch (e) { list = []; }
  let maxKelas = parseInt(getP("jadwal_max_kelas_gabung", "2"), 10);
  if (isNaN(maxKelas) || maxKelas < 1) maxKelas = 2;
  if (maxKelas > 10) maxKelas = 10;
  let groups = [];
  try {
    const rawG = getP("jadwal_kelas_gabung_groups", "[]");
    const parsedG = JSON.parse(rawG || "[]");
    if (Array.isArray(parsedG)) {
      groups = parsedG
        .filter(function(g) { return Array.isArray(g); })
        .map(function(g) {
          return g.map(function(x) { return String(x || "").trim().toLowerCase(); }).filter(Boolean);
        })
        .filter(function(g) { return g.length >= 2; });
    }
  } catch (e) { groups = []; }
  return { mapelList: list, maxKelas: maxKelas, groups: groups };
}

function isMapelAllowedGabung(mapelName, mapelId, config) {
  if (!config || !config.mapelList || !config.mapelList.length) return false;
  const nama = String(mapelName || "").trim().toLowerCase();
  const id = String(mapelId || "").trim().toLowerCase();
  // Tokenisasi nama mapel untuk match longgar (PJOK ↔ Pendidikan Jasmani ...)
  function tokens(s) {
    return String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(function(t) { return t.length >= 2; });
  }
  const namaTok = tokens(nama);
  return config.mapelList.some(function(m) {
    const mm = String(m || "").trim().toLowerCase();
    if (!mm) return false;
    if (nama && (nama === mm || nama.indexOf(mm) !== -1 || mm.indexOf(nama) !== -1)) return true;
    if (id && (id === mm || id.indexOf(mm) !== -1 || mm.indexOf(id) !== -1)) return true;
    // Token overlap (minimal 1 token signifikan sama, mis. "pjok")
    const mmTok = tokens(mm);
    for (var i = 0; i < mmTok.length; i++) {
      if (namaTok.indexOf(mmTok[i]) !== -1) return true;
      if (nama.indexOf(mmTok[i]) !== -1) return true;
    }
    return false;
  });
}

/** Apakah dua kelas boleh digabung menurut groups (kosong = semua boleh). */
function isKelasPairAllowedGabung(kelasA, kelasIdA, kelasB, kelasIdB, config) {
  if (!config || !config.groups || !config.groups.length) return true;
  const keysA = [String(kelasA || "").trim().toLowerCase(), String(kelasIdA || "").trim().toLowerCase()].filter(Boolean);
  const keysB = [String(kelasB || "").trim().toLowerCase(), String(kelasIdB || "").trim().toLowerCase()].filter(Boolean);
  if (!keysA.length || !keysB.length) return true;
  return config.groups.some(function(g) {
    const hasA = keysA.some(function(k) { return g.indexOf(k) !== -1; });
    const hasB = keysB.some(function(k) { return g.indexOf(k) !== -1; });
    return hasA && hasB;
  });
}

function detectJadwalBentrok(formData, excludeId) {
  const all = getRawData(SHEET_NAMES.JADWAL);
  const conflicts = [];
  const cfg = getMapelGabunganConfig();
  const formMapelGabung = isMapelAllowedGabung(
    formData.MataPelajaran || formData["Mata Pelajaran"],
    formData.MapelID,
    cfg
  );

  // Kumpulkan slot overlap yang relevan untuk hitung kuota multi-kelas
  const overlapSameSlot = [];

  all.forEach(j => {
    if (excludeId && String(j.ID) === String(excludeId)) return;
    if (j.Status === "Nonaktif") return;
    if (j.Hari !== formData.Hari) return;
    if ((formData.TahunAjaran && j.TahunAjaran && j.TahunAjaran !== formData.TahunAjaran)) return;
    if ((formData.Semester && j.Semester && j.Semester !== formData.Semester)) return;

    if (!isTimeOverlap(formData.JamMulai, formData.JamSelesai, j.JamMulai, j.JamSelesai)) return;

    const labelJ = (j.JenisJadwal === "Kegiatan" ? "Kegiatan: " : "") + (j.MataPelajaran || "-");
    const kelasJ = j.Kelas || (j.JenisJadwal === "Kegiatan" ? "Semua" : "-");
    const jMapelGabung = isMapelAllowedGabung(j.MataPelajaran || j["Mata Pelajaran"], j.MapelID, cfg);
    const bothGabung = formMapelGabung && jMapelGabung;
    const pairOk = bothGabung && isKelasPairAllowedGabung(
      formData.Kelas, formData.KelasID, j.Kelas, j.KelasID, cfg
    );

    // 1) Bentrok kelas yang SAMA — selalu dilarang (satu kelas tidak bisa 2 mapel di jam sama)
    if (formData.KelasID && j.KelasID && formData.KelasID === j.KelasID) {
      conflicts.push({
        tipe: "Kelas",
        pesan: `Kelas sudah terjadwal: ${labelJ} / ${j.Guru || "-"} (${j.JamMulai}-${j.JamSelesai})`
      });
      return;
    }
    if (formData.Kelas && j.Kelas && !formData.KelasID && !j.KelasID &&
        String(formData.Kelas).trim().toLowerCase() === String(j.Kelas).trim().toLowerCase()) {
      conflicts.push({
        tipe: "Kelas",
        pesan: `Kelas sudah terjadwal: ${labelJ} / ${j.Guru || "-"} (${j.JamMulai}-${j.JamSelesai})`
      });
      return;
    }

    // 2) Kegiatan rutin (tanpa kelas) bentrok slot
    if ((formData.JenisJadwal === "Kegiatan" && !formData.KelasID && !formData.Kelas) ||
        (j.JenisJadwal === "Kegiatan" && !j.KelasID && !j.Kelas)) {
      if (formData.JenisJadwal === "Kegiatan" || j.JenisJadwal === "Kegiatan") {
        conflicts.push({
          tipe: "Kegiatan",
          pesan: `Slot waktu bentrok dengan ${labelJ} (${j.JamMulai}-${j.JamSelesai})`
        });
        return;
      }
    }

    // 3) Guru sama di jam sama
    if (formData.GuruID && j.GuruID && formData.GuruID === j.GuruID) {
      if (bothGabung && pairOk) {
        // Diizinkan: catat untuk cek kuota max kelas
        overlapSameSlot.push(j);
      } else {
        conflicts.push({
          tipe: "Guru",
          pesan: `Guru sudah terjadwal: ${kelasJ} / ${labelJ} (${j.JamMulai}-${j.JamSelesai})`
        });
      }
      return;
    }

    // 4) Kelas berbeda, guru berbeda, mapel gabungan — tetap boleh selama pair & kuota
    if (bothGabung && pairOk) {
      overlapSameSlot.push(j);
    }
  });

  // Kuota multi-kelas untuk mapel gabungan
  if (formMapelGabung && (formData.KelasID || formData.Kelas)) {
    const kelasKeys = {};
    const addKey = function(k) {
      const key = String(k || "").trim().toLowerCase();
      if (key) kelasKeys[key] = true;
    };
    addKey(formData.KelasID);
    addKey(formData.Kelas);
    overlapSameSlot.forEach(function(j) {
      addKey(j.KelasID);
      addKey(j.Kelas);
    });
    // Hitung kelas unik (ID diutamakan; nama tanpa ID dihitung terpisah)
    const uniqueIds = {};
    const uniqueNames = {};
    const mark = function(id, name) {
      if (id) uniqueIds[String(id).trim().toLowerCase()] = true;
      else if (name) uniqueNames[String(name).trim().toLowerCase()] = true;
    };
    mark(formData.KelasID, formData.Kelas);
    overlapSameSlot.forEach(function(j) { mark(j.KelasID, j.Kelas); });
    const totalKelas = Object.keys(uniqueIds).length + Object.keys(uniqueNames).length;
    if (totalKelas > cfg.maxKelas) {
      const names = [];
      if (formData.Kelas) names.push(formData.Kelas);
      overlapSameSlot.forEach(function(j) {
        if (j.Kelas && names.indexOf(j.Kelas) === -1) names.push(j.Kelas);
      });
      conflicts.push({
        tipe: "KuotaGabung",
        pesan: `Mapel gabungan melebihi batas ${cfg.maxKelas} kelas per slot (saat ini: ${names.join(", ") || totalKelas} kelas). Atur di Pengaturan.`
      });
    }
  }

  return conflicts;
}

function saveJadwal(formData, token) {
  const auth = requireAuth(token, ["Admin"]);
  if (!auth.ok) return auth.error;

  if (!formData.Hari || HARI_VALID.indexOf(formData.Hari) === -1) {
    return { success: false, message: "Hari tidak valid." };
  }
  if (!formData.JamMulai || !formData.JamSelesai) {
    return { success: false, message: "Jam mulai dan selesai wajib." };
  }
  if (timeToMinutes(formData.JamSelesai) <= timeToMinutes(formData.JamMulai)) {
    return { success: false, message: "Jam selesai harus setelah jam mulai." };
  }

  const jenis = String(formData.JenisJadwal || "Pelajaran").trim() || "Pelajaran";
  formData.JenisJadwal = jenis;

  if (jenis === "Kegiatan") {
    if (!formData.MataPelajaran && !formData.MapelID) {
      return { success: false, message: "Nama kegiatan wajib (contoh: Upacara Bendera, Istighosah, Senam Pagi)." };
    }
    if (!formData.MapelID) formData.MapelID = "";
  } else {
    if (!formData.KelasID && !formData.Kelas) return { success: false, message: "Kelas wajib." };
    if (!formData.MapelID && !formData.MataPelajaran) return { success: false, message: "Mata pelajaran wajib." };
    if (!formData.GuruID && !formData.Guru) return { success: false, message: "Guru wajib." };
  }

  const conflicts = detectJadwalBentrok(formData, formData.ID);
  if (conflicts.length && !formData.forceSave) {
    return {
      success: false,
      message: "Terdeteksi bentrok jadwal: " + conflicts.map(c => c.pesan).join("; "),
      conflicts: conflicts,
      code: "CONFLICT"
    };
  }

  if (!formData.Status) formData.Status = "Aktif";
  const result = saveData(SHEET_NAMES.JADWAL, formData, token);
  if (result && result.success && jenis !== "Kegiatan") {
    try {
      const rowForSync = Object.assign({}, formData);
      if (result.id) rowForSync.ID = result.id;
      ensureTugasFromJadwal(rowForSync, auth.session.userId);
    } catch (e) {
      console.error("sync tugas after jadwal:", e);
    }
  }
  return result;
}


/**
 * Hapus (soft-delete) banyak jadwal — Pelajaran dan/atau Kegiatan.
 * Admin only. Payload: { ids?: string[], jenis?: "Pelajaran"|"Kegiatan"|"Semua" }
 */
function deleteJadwalMassal(token, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    payload = payload || {};
    let ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    const jenisReq = String(payload.jenis || "Semua").trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.JADWAL);
    if (!sheet) return { success: false, message: "Sheet jadwal tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const isDeletedIdx = headers.indexOf("IsDeleted");
    const updatedAtIdx = headers.indexOf("UpdatedAt");
    const updatedByIdx = headers.indexOf("UpdatedBy");
    const jenisIdx = headers.indexOf("JenisJadwal");
    const mapelIdx = headers.indexOf("MataPelajaran");
    const hariIdx = headers.indexOf("Hari");

    if (!ids.length) {
      for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][idIdx] || "").trim();
        if (!rowId) continue;
        const del = isDeletedIdx >= 0 ? String(data[i][isDeletedIdx] || "").toUpperCase() : "FALSE";
        if (del === "TRUE") continue;
        const j = jenisIdx >= 0 ? String(data[i][jenisIdx] || "Pelajaran") : "Pelajaran";
        if (jenisReq === "Pelajaran" && j === "Kegiatan") continue;
        if (jenisReq === "Kegiatan" && j !== "Kegiatan") continue;
        ids.push(rowId);
      }
    }
    if (!ids.length) return { success: false, message: "Tidak ada jadwal yang cocok untuk dihapus." };

    const idSet = {};
    ids.forEach(function(id) { idSet[String(id)] = true; });
    let ok = 0, skipJenis = 0;
    const detail = [];
    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][idIdx] || "");
      if (!idSet[rowId]) continue;
      const j = jenisIdx >= 0 ? String(data[i][jenisIdx] || "Pelajaran") : "Pelajaran";
      if (jenisReq === "Pelajaran" && j === "Kegiatan") { skipJenis++; continue; }
      if (jenisReq === "Kegiatan" && j !== "Kegiatan") { skipJenis++; continue; }
      if (isDeletedIdx >= 0) sheet.getRange(i + 1, isDeletedIdx + 1).setValue("TRUE");
      if (updatedAtIdx >= 0) sheet.getRange(i + 1, updatedAtIdx + 1).setValue(getNow());
      if (updatedByIdx >= 0) sheet.getRange(i + 1, updatedByIdx + 1).setValue(auth.session.userId);
      ok++;
      detail.push({
        id: rowId, jenis: j,
        label: (mapelIdx >= 0 ? String(data[i][mapelIdx] || "") : "") || rowId,
        hari: hariIdx >= 0 ? String(data[i][hariIdx] || "") : ""
      });
    }
    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role,
      "SOFT_DELETE_MASSAL", SHEET_NAMES.JADWAL, "", null, { count: ok, jenis: jenisReq });
    let msg = "Berhasil menghapus " + ok + " jadwal";
    if (jenisReq === "Pelajaran") msg += " (Pelajaran)";
    else if (jenisReq === "Kegiatan") msg += " (Kegiatan)";
    else msg += " (Pelajaran & Kegiatan)";
    return { success: true, message: msg, detail: { ok: ok, skipJenis: skipJenis, items: detail.slice(0, 30) } };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal hapus massal jadwal: " + (e.message || String(e)) };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function getJadwalHarian(token, hari, filters) {
  const f = Object.assign({}, filters || {}, { hari: hari || getHariIni() });
  return getJadwal(token, f);
}

function getHariIni() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[new Date().getDay()];
}


/**
 * Generate jadwal pelajaran otomatis anti-bentrok dari Tugas Mengajar.
 * - Guru BOLEH mengajar di hari apa saja (tidak ada batasan hari per guru).
 * - Bentrok dicegah: guru tidak double, kelas tidak double, hormati Kegiatan bersama.
 * - Slot waktu dikonfigurasi dari payload (atau default SMP).
 *
 * payload: {
 *   tahunAjaran, semester,
 *   hariAktif: ["Senin",...],          // default Senin–Jumat
 *   slots: [{jamMulai, jamSelesai},...],
 *   mode: "isi_kosong" | "ganti_pelajaran",  // ganti = hapus pelajaran lama TA/sem, pertahankan Kegiatan
 *   sebarHari: true,                   // usahakan sebar slot 1 tugas ke hari berbeda
 *   dryRun: false                      // true = hanya preview, tidak tulis
 * }
 */
function generateJadwalOtomatis(token, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(60000);
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;

    payload = payload || {};
    const peng = getRawData(SHEET_NAMES.PENGATURAN);
    const getP = function(k, def) {
      const f = peng.find(function(p) { return p.Key === k; });
      return f ? String(f.Value || def) : def;
    };

    const tahunAjaran = String(payload.tahunAjaran || getP("tahun_ajaran_aktif", "")).trim();
    const semester = String(payload.semester || getP("semester_aktif", "Ganjil")).trim();
    const mode = String(payload.mode || "isi_kosong").toLowerCase();
    // pisah = JP beda hari; gabung = blok berurutan; campur = blok 2 lalu sebar
    var modeGabung = String(payload.modeGabung || getP("jadwal_mode_gabung", "pisah")).toLowerCase();
    if (["pisah", "gabung", "campur"].indexOf(modeGabung) === -1) modeGabung = "pisah";
    const sebarHari = (modeGabung === "pisah");
    const dryRun = !!payload.dryRun;

    let hariAktif = Array.isArray(payload.hariAktif) && payload.hariAktif.length
      ? payload.hariAktif.filter(function(h) { return HARI_VALID.indexOf(h) !== -1; })
      : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    if (!hariAktif.length) {
      return { success: false, message: "Pilih minimal 1 hari aktif." };
    }

    function parseJsonArr(raw, fallback) {
      if (Array.isArray(raw) && raw.length) return raw;
      if (typeof raw === "string" && raw.trim()) {
        try {
          var p = JSON.parse(raw);
          if (Array.isArray(p)) return p;
        } catch (e) {}
      }
      return fallback || [];
    }

    var defaultSlots = parseJsonArr(getP("jadwal_slots", ""), [
      { jamMulai: "07:00", jamSelesai: "07:40" },
      { jamMulai: "07:40", jamSelesai: "08:20" },
      { jamMulai: "08:20", jamSelesai: "09:00" },
      { jamMulai: "09:00", jamSelesai: "09:40" },
      { jamMulai: "10:00", jamSelesai: "10:40" },
      { jamMulai: "10:40", jamSelesai: "11:20" },
      { jamMulai: "11:20", jamSelesai: "12:00" },
      { jamMulai: "12:30", jamSelesai: "13:10" }
    ]);
    var defaultIstirahat = parseJsonArr(getP("jadwal_istirahat", ""), [
      { jamMulai: "09:40", jamSelesai: "10:00", label: "Istirahat 1" },
      { jamMulai: "12:00", jamSelesai: "12:30", label: "Istirahat / Sholat" }
    ]);

    let slots = parseJsonArr(payload.slots, defaultSlots);
    slots = slots.filter(function(s) {
      return s && s.jamMulai && s.jamSelesai &&
        timeToMinutes(s.jamSelesai) > timeToMinutes(s.jamMulai);
    }).map(function(s) {
      return {
        jamMulai: String(s.jamMulai).substring(0, 5),
        jamSelesai: String(s.jamSelesai).substring(0, 5)
      };
    });
    if (!slots.length) {
      return { success: false, message: "Slot waktu tidak valid." };
    }

    let istirahat = parseJsonArr(payload.istirahat, defaultIstirahat).filter(function(s) {
      return s && s.jamMulai && s.jamSelesai &&
        timeToMinutes(s.jamSelesai) > timeToMinutes(s.jamMulai);
    }).map(function(s) {
      return {
        jamMulai: String(s.jamMulai).substring(0, 5),
        jamSelesai: String(s.jamSelesai).substring(0, 5),
        label: String(s.label || "Istirahat")
      };
    });

    // Buang slot pelajaran yang tumpang tindih dengan istirahat
    slots = slots.filter(function(sl) {
      for (var i = 0; i < istirahat.length; i++) {
        if (isTimeOverlap(sl.jamMulai, sl.jamSelesai, istirahat[i].jamMulai, istirahat[i].jamSelesai)) {
          return false;
        }
      }
      return true;
    });
    if (!slots.length) {
      return { success: false, message: "Semua slot tertutup jam istirahat. Sesuaikan pengaturan slot/istirahat." };
    }

    // Normalisasi string TA/semester agar "2026/2027" == "2026 / 2027" dll.
    function normTA(s) {
      return String(s || "").toLowerCase().replace(/\s+/g, "").replace(/–|—/g, "-");
    }
    function normSem(s) {
      return String(s || "").toLowerCase().replace(/\s+/g, "");
    }
    function matchTA(rowTA, target) {
      if (!target) return true;
      if (!rowTA || !String(rowTA).trim()) return true; // kosong = berlaku semua TA
      return normTA(rowTA) === normTA(target);
    }
    function matchSem(rowSem, target) {
      if (!target) return true;
      if (!rowSem || !String(rowSem).trim()) return true; // kosong = berlaku semua semester
      return normSem(rowSem) === normSem(target);
    }

    function loadTugasFiltered() {
      return getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(function(t) {
        if (String(t.Status || "Aktif").toLowerCase() === "nonaktif") return false;
        if (!matchTA(t.TahunAjaran, tahunAjaran)) return false;
        if (!matchSem(t.Semester, semester)) return false;
        return !!(t.GuruID || t.Guru) && !!(t.KelasID || t.Kelas) && !!(t.MapelID || t.MataPelajaran);
      });
    }

    // Tugas mengajar sumber
    let tugas = loadTugasFiltered();

    // Jika kosong: coba sinkron otomatis dari jadwal pelajaran, lalu muat ulang
    if (!tugas.length) {
      try {
        syncTugasMengajarDariJadwal(token);
      } catch (eSync) {
        console.error("auto-sync tugas:", eSync);
      }
      tugas = loadTugasFiltered();
    }

    // Masih kosong: bangun kebutuhan dari kombinasi unik di jadwal (fallback)
    if (!tugas.length) {
      var jadwalSrc = getRawData(SHEET_NAMES.JADWAL).filter(function(j) {
        if (String(j.Status || "Aktif").toLowerCase() === "nonaktif") return false;
        if (String(j.JenisJadwal || "Pelajaran") === "Kegiatan") return false;
        if (!matchTA(j.TahunAjaran, tahunAjaran)) return false;
        if (!matchSem(j.Semester, semester)) return false;
        return !!(j.GuruID || j.Guru) && !!(j.KelasID || j.Kelas) && !!(j.MapelID || j.MataPelajaran);
      });
      var combo = {};
      jadwalSrc.forEach(function(j) {
        var key = [j.GuruID || j.Guru, j.MapelID || j.MataPelajaran, j.KelasID || j.Kelas].join("|");
        if (!combo[key]) {
          combo[key] = {
            GuruID: j.GuruID || "",
            Guru: j.Guru || "",
            MapelID: j.MapelID || "",
            MataPelajaran: j.MataPelajaran || "",
            KelasID: j.KelasID || "",
            Kelas: j.Kelas || "",
            TahunAjaran: j.TahunAjaran || tahunAjaran,
            Semester: j.Semester || semester,
            Status: "Aktif",
            JamPerMinggu: 0
          };
        }
        combo[key].JamPerMinggu += 1;
      });
      tugas = Object.keys(combo).map(function(k) { return combo[k]; });
    }

    // Diagnostic: total tugas di sheet (tanpa filter TA)
    var allTugasAktif = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(function(t) {
      return String(t.Status || "Aktif").toLowerCase() !== "nonaktif" &&
        !!(t.GuruID || t.Guru) && !!(t.KelasID || t.Kelas) && !!(t.MapelID || t.MataPelajaran);
    });

    if (!tugas.length) {
      var sampleTA = {};
      allTugasAktif.forEach(function(t) {
        var k = String(t.TahunAjaran || "(kosong)") + " / " + String(t.Semester || "(kosong)");
        sampleTA[k] = (sampleTA[k] || 0) + 1;
      });
      var infoTA = Object.keys(sampleTA).slice(0, 5).map(function(k) {
        return k + " (" + sampleTA[k] + ")";
      }).join("; ");
      return {
        success: false,
        message: "Tidak ada Tugas Mengajar untuk " + (tahunAjaran || "TA") + " / " + (semester || "semester") +
          ". Total tugas aktif di sistem: " + allTugasAktif.length +
          (infoTA ? ". Data yang ada: " + infoTA : "") +
          ". Solusi: (1) buka menu Tugas Mengajar → Sinkron dari Jadwal, atau (2) isi Tugas Mengajar + Jam/Minggu manual, atau (3) pastikan Tahun Ajaran di tugas/jadwal sama dengan pengaturan aktif."
      };
    }

    // Normalisasi kebutuhan JP
    const needs = tugas.map(function(t) {
      let jp = parseInt(t.JamPerMinggu, 10);
      if (isNaN(jp) || jp < 1) jp = 1;
      if (jp > 20) jp = 20; // hard cap
      return {
        guruId: String(t.GuruID || "").trim(),
        guru: String(t.Guru || "").trim(),
        kelasId: String(t.KelasID || "").trim(),
        kelas: String(t.Kelas || "").trim(),
        mapelId: String(t.MapelID || "").trim(),
        mapel: String(t.MataPelajaran || "").trim(),
        jp: jp,
        tahunAjaran: tahunAjaran || String(t.TahunAjaran || ""),
        semester: semester || String(t.Semester || "")
      };
    });

    // Peta hari mengajar per guru (kosong = semua hari aktif)
    function parseHariMengajar(raw) {
      if (raw == null || String(raw).trim() === "") return null; // null = semua hari
      var s = String(raw).trim();
      // dukung JSON array atau CSV
      if (s.charAt(0) === "[") {
        try {
          var arr = JSON.parse(s);
          if (Array.isArray(arr)) {
            return arr.map(function(x) { return String(x).trim(); })
              .filter(function(h) { return HARI_VALID.indexOf(h) !== -1; });
          }
        } catch (e) {}
      }
      return s.split(/[,;|\/]+/).map(function(x) { return x.trim(); })
        .filter(function(h) { return HARI_VALID.indexOf(h) !== -1; });
    }
    var guruHariMap = {}; // guruId -> array hari | null (semua)
    getRawData(SHEET_NAMES.GURU).forEach(function(g) {
      var id = String(g.ID || "").trim();
      if (!id) return;
      guruHariMap[id] = parseHariMengajar(g.HariMengajar);
    });
    needs.forEach(function(n) {
      n.hariGuru = (n.guruId && guruHariMap.hasOwnProperty(n.guruId))
        ? guruHariMap[n.guruId]
        : null;
    });

    // Jadwal existing
    let existing = getRawData(SHEET_NAMES.JADWAL).filter(function(j) {
      if (String(j.Status || "Aktif").toLowerCase() === "nonaktif") return false;
      if (tahunAjaran && j.TahunAjaran && String(j.TahunAjaran) !== tahunAjaran) return false;
      if (semester && j.Semester && String(j.Semester) !== semester) return false;
      return true;
    });

    const kegiatan = existing.filter(function(j) {
      return String(j.JenisJadwal || "Pelajaran") === "Kegiatan";
    });
    const pelajaranLama = existing.filter(function(j) {
      return String(j.JenisJadwal || "Pelajaran") !== "Kegiatan";
    });

    // Grid okupansi + Mapel Gabungan (multi-kelas 1 slot)
    const gabCfg = (typeof getMapelGabunganConfig === "function")
      ? getMapelGabunganConfig()
      : { mapelList: [], maxKelas: 2, groups: [] };

    function slotKey(hari, jm, js) {
      return hari + "|" + jm + "|" + js;
    }
    const guruBusy = {};
    const kelasBusy = {};
    const globalBusy = {};
    const guruSlotMeta = {};

    function markBusy(hari, jm, js, guruId, kelasKey, isGlobal, meta) {
      const k = slotKey(hari, jm, js);
      if (isGlobal) globalBusy[k] = true;
      if (kelasKey) {
        if (!kelasBusy[kelasKey]) kelasBusy[kelasKey] = {};
        kelasBusy[kelasKey][k] = true;
      }
      if (guruId) {
        const isGabung = meta && isMapelAllowedGabung(meta.mapel || "", meta.mapelId || "", gabCfg);
        if (isGabung) {
          if (!guruSlotMeta[guruId]) guruSlotMeta[guruId] = {};
          if (!guruSlotMeta[guruId][k]) guruSlotMeta[guruId][k] = [];
          guruSlotMeta[guruId][k].push({
            kelasKey: String(kelasKey || meta.kelasKey || ""),
            kelas: String(meta.kelas || ""),
            kelasId: String(meta.kelasId || ""),
            mapel: String(meta.mapel || ""),
            mapelId: String(meta.mapelId || "")
          });
        } else {
          if (!guruBusy[guruId]) guruBusy[guruId] = {};
          guruBusy[guruId][k] = true;
        }
      }
    }

    function isFree(hari, jm, js, guruId, kelasKey, mapelOpt) {
      const k = slotKey(hari, jm, js);
      if (globalBusy[k]) return false;
      if (kelasKey && kelasBusy[kelasKey] && kelasBusy[kelasKey][k]) return false;
      function overlapsBusyMap(map) {
        if (!map) return false;
        const keys = Object.keys(map);
        for (let i = 0; i < keys.length; i++) {
          if (!map[keys[i]]) continue;
          const parts = keys[i].split("|");
          if (parts[0] !== hari) continue;
          if (isTimeOverlap(jm, js, parts[1], parts[2])) return true;
        }
        return false;
      }
      if (overlapsBusyMap(globalBusy)) return false;
      if (kelasKey && overlapsBusyMap(kelasBusy[kelasKey])) return false;
      if (!guruId) return true;
      const wantGabung = mapelOpt && isMapelAllowedGabung(mapelOpt.mapel || "", mapelOpt.mapelId || "", gabCfg);
      if (guruBusy[guruId] && guruBusy[guruId][k]) return false;
      if (overlapsBusyMap(guruBusy[guruId])) return false;
      function collectMetaForSlot() {
        const list = [];
        const metaMap = guruSlotMeta[guruId];
        if (!metaMap) return list;
        Object.keys(metaMap).forEach(function(mk) {
          const parts = mk.split("|");
          if (parts[0] !== hari) return;
          if (mk === k || isTimeOverlap(jm, js, parts[1], parts[2])) {
            (metaMap[mk] || []).forEach(function(m) { list.push(m); });
          }
        });
        return list;
      }
      const existingMeta = collectMetaForSlot();
      if (!existingMeta.length) return true;
      if (!wantGabung) return false;
      for (let i = 0; i < existingMeta.length; i++) {
        const em = existingMeta[i];
        if (!isMapelAllowedGabung(em.mapel, em.mapelId, gabCfg)) return false;
        if (!isKelasPairAllowedGabung(mapelOpt.kelas || "", mapelOpt.kelasId || "", em.kelas || "", em.kelasId || "", gabCfg)) return false;
      }
      const unique = {};
      function addU(id, name, key) {
        const idk = String(id || "").trim().toLowerCase();
        const nk = String(name || "").trim().toLowerCase();
        const kk = String(key || "").trim().toLowerCase();
        if (idk) unique["id:" + idk] = true;
        else if (nk) unique["nm:" + nk] = true;
        else if (kk) unique["ky:" + kk] = true;
      }
      addU(mapelOpt.kelasId, mapelOpt.kelas, kelasKey);
      existingMeta.forEach(function(em) { addU(em.kelasId, em.kelas, em.kelasKey); });
      if (Object.keys(unique).length > (gabCfg.maxKelas || 2)) return false;
      return true;
    }

    // Seed dari kegiatan (selalu dipertahankan)
    // + petakan ke slot pelajaran yang overlap agar jam ke-1 terblokir jelas
    kegiatan.forEach(function(j) {
      const isGlobal = !j.KelasID && !j.Kelas;
      const kelasKey = j.KelasID ? String(j.KelasID) : (j.Kelas ? String(j.Kelas) : "");
      markBusy(j.Hari, j.JamMulai, j.JamSelesai, j.GuruID || "", kelasKey, isGlobal);
      // Snap ke slot config yang overlap (antisipasi jam kegiatan ≠ batas slot)
      slots.forEach(function(sl) {
        if (isTimeOverlap(j.JamMulai, j.JamSelesai, sl.jamMulai, sl.jamSelesai)) {
          markBusy(j.Hari, sl.jamMulai, sl.jamSelesai, j.GuruID || "", kelasKey, isGlobal);
        }
      });
    });

    // Blok jam istirahat di semua hari aktif (tidak bisa diisi pelajaran)
    hariAktif.forEach(function(hari) {
      istirahat.forEach(function(ir) {
        markBusy(hari, ir.jamMulai, ir.jamSelesai, "", "", true);
        slots.forEach(function(sl) {
          if (isTimeOverlap(ir.jamMulai, ir.jamSelesai, sl.jamMulai, sl.jamSelesai)) {
            markBusy(hari, sl.jamMulai, sl.jamSelesai, "", "", true);
          }
        });
      });
    });

    // Jika jam ke-1 (slot index 0) hari itu sudah terisi kegiatan/global → mulai dari jam ke-2
    // startSlotIdx[hari] = indeks slot pertama yang boleh diisi pelajaran
    var startSlotIdx = {};
    hariAktif.forEach(function(hari) {
      var start = 0;
      if (slots.length && !isFree(hari, slots[0].jamMulai, slots[0].jamSelesai, "", "")) {
        // Slot pertama terblokir (kegiatan/upacara/dll.) → generate dari jam ke-2
        start = 1;
      }
      // Lewati slot awal yang masih terblokir (bisa lebih dari 1 jam kegiatan)
      while (start < slots.length &&
             !isFree(hari, slots[start].jamMulai, slots[start].jamSelesai, "", "")) {
        start++;
      }
      startSlotIdx[hari] = start;
    });

    // Seed dari pelajaran existing jika mode isi_kosong (+ meta mapel gabungan)
    if (mode !== "ganti_pelajaran") {
      pelajaranLama.forEach(function(j) {
        const kelasKey = j.KelasID ? String(j.KelasID) : (j.Kelas ? String(j.Kelas) : "");
        markBusy(j.Hari, j.JamMulai, j.JamSelesai, j.GuruID || "", kelasKey, false, {
          kelasKey: kelasKey,
          kelas: j.Kelas || "",
          kelasId: j.KelasID || "",
          mapel: j.MataPelajaran || j["Mata Pelajaran"] || "",
          mapelId: j.MapelID || ""
        });
      });
    }

    // Urutkan: JP terbanyak dulu (lebih sulit ditempatkan)
    needs.sort(function(a, b) { return b.jp - a.jp; });

    // Hitung berapa yang sudah terisi per tugas (mode isi_kosong)
    function countExistingFor(n) {
      if (mode === "ganti_pelajaran") return 0;
      return pelajaranLama.filter(function(j) {
        const gOk = (n.guruId && j.GuruID === n.guruId) || (!n.guruId && j.Guru === n.guru);
        const kOk = (n.kelasId && j.KelasID === n.kelasId) || (!n.kelasId && j.Kelas === n.kelas);
        const mOk = (n.mapelId && j.MapelID === n.mapelId) || (!n.mapelId && j.MataPelajaran === n.mapel);
        return gOk && kOk && mOk;
      }).length;
    }

    const planned = []; // {hari, jamMulai, jamSelesai, ...need}
    const unmet = [];
    // Beban lintas kelas: guru+mapel di hari yang sama (VII/VIII/IX jangan menumpuk 1 hari)
    // key = guruId|mapelKey|hari → jumlah kelas yang sudah ditempatkan
    var mapelGuruDay = {};
    function mapelKeyOf(n) {
      return String(n.mapelId || n.mapel || "").trim().toLowerCase();
    }
    function crossLoad(n, hari) {
      var k = String(n.guruId || n.guru || "") + "|" + mapelKeyOf(n) + "|" + hari;
      return mapelGuruDay[k] || 0;
    }
    function bumpCross(n, hari) {
      var k = String(n.guruId || n.guru || "") + "|" + mapelKeyOf(n) + "|" + hari;
      mapelGuruDay[k] = (mapelGuruDay[k] || 0) + 1;
    }

    // ---------- Penempatan: mapel gabungan di-co-locate, lainnya sebar ----------
    function isMapelPjok(n) {
      var nama = String((n && n.mapel) || "").toLowerCase();
      var id = String((n && n.mapelId) || "").toLowerCase();
      if (/pjok|penjas|penjaskes|jasmani|olahraga/.test(nama)) return true;
      if (/pjok|penjas/.test(id)) return true;
      return false;
    }
    var PJOK_MAX_SLOT_IDX = 3;
    var PJOK_MAX_JAM_MULAI = 9 * 60;
    function isSlotAllowedForMapel(n, slotIdx, jamMulai) {
      if (!isMapelPjok(n)) return true;
      if (slotIdx != null && slotIdx > PJOK_MAX_SLOT_IDX) return false;
      if (jamMulai != null && timeToMinutes(jamMulai) > PJOK_MAX_JAM_MULAI) return false;
      return true;
    }

    function hariUntukNeed(n) {
      var hariGuru = n.hariGuru;
      var list = hariAktif.filter(function(h) {
        if (!hariGuru || !hariGuru.length) return true;
        return hariGuru.indexOf(h) !== -1;
      });
      return list;
    }

    function pushSlotForNeed(n, c) {
      var kelasKey = n.kelasId || n.kelas;
      markBusy(c.hari, c.jamMulai, c.jamSelesai, n.guruId, kelasKey, false, {
        kelasKey: kelasKey,
        kelas: n.kelas || "",
        kelasId: n.kelasId || "",
        mapel: n.mapel || "",
        mapelId: n.mapelId || ""
      });
      bumpCross(n, c.hari);
      planned.push({
        Hari: c.hari,
        JamMulai: c.jamMulai,
        JamSelesai: c.jamSelesai,
        JenisJadwal: "Pelajaran",
        KelasID: n.kelasId,
        Kelas: n.kelas,
        MapelID: n.mapelId,
        MataPelajaran: n.mapel,
        GuruID: n.guruId,
        Guru: n.guru,
        TahunAjaran: n.tahunAjaran,
        Semester: n.semester,
        Status: "Aktif"
      });
    }

    /**
     * Cari blok slot berurutan (panjang blockSize) yang BEBAS untuk SEMUA needs
     * dalam group (mapel gabungan multi-kelas). Semua kelas mendapat jam yang sama.
     */
    function findSharedBlock(groupNeeds, blockSize) {
      // hari: irisan hari mengajar semua guru di group (biasanya guru sama)
      var hariSet = null;
      groupNeeds.forEach(function(n) {
        var h = hariUntukNeed(n);
        if (hariSet === null) {
          hariSet = h.slice();
        } else {
          hariSet = hariSet.filter(function(x) { return h.indexOf(x) !== -1; });
        }
      });
      if (!hariSet || !hariSet.length) return null;

      // Urutkan hari: lebih sedikit beban dulu
      hariSet.sort(function(a, b) {
        var la = 0, lb = 0;
        groupNeeds.forEach(function(n) {
          la += crossLoad(n, a);
          lb += crossLoad(n, b);
        });
        if (la !== lb) return la - lb;
        return hariAktif.indexOf(a) - hariAktif.indexOf(b);
      });

      for (var di = 0; di < hariSet.length; di++) {
        var hari = hariSet[di];
        var fromIdx = startSlotIdx[hari] != null ? startSlotIdx[hari] : 0;
        for (var si = fromIdx; si <= slots.length - blockSize; si++) {
          var block = [];
          var ok = true;
          for (var k = 0; k < blockSize; k++) {
            var sl = slots[si + k];
            // Semua need harus boleh di slot ini (PJOK pagi, dll.)
            for (var ni = 0; ni < groupNeeds.length; ni++) {
              if (!isSlotAllowedForMapel(groupNeeds[ni], si + k, sl.jamMulai)) {
                ok = false;
                break;
              }
            }
            if (!ok) break;
            // isFree untuk setiap kelas (dengan mapelOpt agar gabungan diizinkan)
            for (var ni2 = 0; ni2 < groupNeeds.length; ni2++) {
              var nn = groupNeeds[ni2];
              var kk = nn.kelasId || nn.kelas;
              if (!isFree(hari, sl.jamMulai, sl.jamSelesai, nn.guruId, kk, {
                mapel: nn.mapel, mapelId: nn.mapelId, kelas: nn.kelas, kelasId: nn.kelasId
              })) {
                ok = false;
                break;
              }
            }
            if (!ok) break;
            block.push({ hari: hari, jamMulai: sl.jamMulai, jamSelesai: sl.jamSelesai, slotIdx: si + k });
          }
          if (ok && block.length === blockSize) return block;
        }
      }
      return null;
    }

    /**
     * Tempatkan group mapel-gabungan: pilih subset kelas (≤ maxKelas) yang saling
     * boleh digabung, cari slot bersama, assign semua ke jam yang sama.
     */
    function placeGabunganGroup(rawGroup) {
      // Hitung sisa JP per need
      var items = rawGroup.map(function(n) {
        var sudah = countExistingFor(n);
        var sisa = Math.max(0, n.jp - sudah);
        return { need: n, sisa: sisa, sudah: sudah };
      }).filter(function(x) { return x.sisa > 0; });

      if (!items.length) return;

      // Kelompokkan ulang: batch ≤ maxKelas yang pair-allowed
      var maxK = gabCfg.maxKelas || 2;
      var remaining = items.slice();

      while (remaining.length) {
        // Ambil seed
        var batch = [remaining.shift()];
        // Tambah kelas lain yang boleh digabung dengan semua di batch
        for (var i = remaining.length - 1; i >= 0 && batch.length < maxK; i--) {
          var cand = remaining[i];
          var pairOk = batch.every(function(b) {
            return isKelasPairAllowedGabung(
              b.need.kelas, b.need.kelasId,
              cand.need.kelas, cand.need.kelasId,
              gabCfg
            );
          });
          // Guru harus sama agar satu slot multi-kelas masuk akal
          var sameGuru = batch.every(function(b) {
            if (b.need.guruId && cand.need.guruId) return b.need.guruId === cand.need.guruId;
            return String(b.need.guru || "") === String(cand.need.guru || "");
          });
          if (pairOk && sameGuru) {
            batch.push(cand);
            remaining.splice(i, 1);
          }
        }

        // JP target = min sisa di batch (semua dapat jumlah sama di slot bersama)
        // Sisa individual di atas min diproses ulang sebagai single / batch berikutnya
        var minSisa = batch.reduce(function(m, x) { return Math.min(m, x.sisa); }, 99);
        var needsBatch = batch.map(function(x) { return x.need; });

        // Tentukan ukuran blok: hormati modeGabung
        function tryPlaceShared(count) {
          if (count < 1) return 0;
          var blk = findSharedBlock(needsBatch, count);
          if (!blk) return 0;
          // Assign ke SEMUA kelas di batch
          needsBatch.forEach(function(n) {
            blk.forEach(function(c) { pushSlotForNeed(n, c); });
          });
          return count;
        }

        var placedShared = 0;
        if (modeGabung === "gabung") {
          var trySize = minSisa;
          while (trySize >= 1 && placedShared === 0) {
            placedShared = tryPlaceShared(trySize);
            trySize--;
          }
        } else if (modeGabung === "campur") {
          if (minSisa >= 2) placedShared = tryPlaceShared(2);
          if (!placedShared) placedShared = tryPlaceShared(1);
        } else {
          // pisah: 1 per 1, tapi tetap shared antar kelas
          while (placedShared < minSisa) {
            var one = tryPlaceShared(1);
            if (!one) break;
            placedShared += one;
          }
        }

        // Update sisa; yang masih sisa masuk ke remaining lagi (sendiri / batch baru)
        batch.forEach(function(x) {
          x.sisa -= placedShared;
          if (x.sisa > 0) {
            // Coba place sisa individu (tanpa paksa share) — fallback
            remaining.push(x);
          }
        });

        if (placedShared === 0) {
          // Gagal total shared: fallback place individual agar tidak kosong
          batch.forEach(function(x) {
            placeIndividual(x.need, x.sisa);
          });
          // jangan loop infinite
          break;
        }
      }

      // Sisa remaining setelah loop (fallback individual)
      remaining.forEach(function(x) {
        if (x.sisa > 0) placeIndividual(x.need, x.sisa);
      });
    }

    /** Penempatan individu (non-gabungan atau fallback). */
    function placeIndividual(n, sisaArg) {
      var sudah = countExistingFor(n);
      var sisa = (sisaArg != null) ? sisaArg : Math.max(0, n.jp - sudah);
      if (sisa <= 0) return;

      var kelasKey = n.kelasId || n.kelas;
      var placedDays = {};
      var isPjok = isMapelPjok(n);
      var hariList = hariUntukNeed(n);
      if (!hariList.length) {
        unmet.push({
          guru: n.guru, kelas: n.kelas, mapel: n.mapel,
          butuh: n.jp, sudah: n.jp - sisa, sisa: sisa,
          alasan: "Tidak ada hari mengajar yang cocok (cek checklist hari di master Guru)"
        });
        return;
      }

      var candidates = [];
      hariList.forEach(function(hari) {
        var fromIdx = startSlotIdx[hari] != null ? startSlotIdx[hari] : 0;
        for (var si = fromIdx; si < slots.length; si++) {
          var sl = slots[si];
          if (!isSlotAllowedForMapel(n, si, sl.jamMulai)) continue;
          candidates.push({ hari: hari, jamMulai: sl.jamMulai, jamSelesai: sl.jamSelesai, slotIdx: si });
        }
      });
      if (!candidates.length) {
        unmet.push({
          guru: n.guru, kelas: n.kelas, mapel: n.mapel,
          butuh: n.jp, sudah: n.jp - sisa, sisa: sisa,
          alasan: isPjok
            ? "PJOK hanya boleh jam ke-1 s/d ke-4 (sampai 09:00); slot pagi penuh atau tidak tersedia"
            : "Tidak ada slot kandidat"
        });
        return;
      }

      var wantGabungMapel = isMapelAllowedGabung(n.mapel || "", n.mapelId || "", gabCfg);

      function gabungOccupancyAt(hari, jm, js) {
        if (!n.guruId || !wantGabungMapel) return 0;
        var metaMap = guruSlotMeta[n.guruId];
        if (!metaMap) return 0;
        var list = [];
        Object.keys(metaMap).forEach(function(mk) {
          var parts = mk.split("|");
          if (parts[0] !== hari) return;
          if (mk === slotKey(hari, jm, js) || isTimeOverlap(jm, js, parts[1], parts[2])) {
            (metaMap[mk] || []).forEach(function(m) { list.push(m); });
          }
        });
        var unique = {};
        list.forEach(function(em) {
          var idk = String(em.kelasId || "").trim().toLowerCase();
          var nk = String(em.kelas || "").trim().toLowerCase();
          if (idk) unique["id:" + idk] = true;
          else if (nk) unique["nm:" + nk] = true;
        });
        return Object.keys(unique).length;
      }

      function sortCandidates(list, preferSebar) {
        return list.slice().sort(function(a, b) {
          if (wantGabungMapel) {
            var oa = gabungOccupancyAt(a.hari, a.jamMulai, a.jamSelesai);
            var ob = gabungOccupancyAt(b.hari, b.jamMulai, b.jamSelesai);
            var maxK = gabCfg.maxKelas || 2;
            var scoreOcc = function(o) {
              if (o <= 0) return 0;
              if (o >= maxK) return -100;
              return o;
            };
            var sa = scoreOcc(oa), sb = scoreOcc(ob);
            if (sa !== sb) return sb - sa;
          }
          var ca = crossLoad(n, a.hari);
          var cb = crossLoad(n, b.hari);
          if (ca !== cb) return ca - cb;
          var da = placedDays[a.hari] || 0;
          var db = placedDays[b.hari] || 0;
          if (preferSebar && da !== db) return da - db;
          var ha = hariAktif.indexOf(a.hari);
          var hb = hariAktif.indexOf(b.hari);
          if (ha !== hb) return ha - hb;
          return timeToMinutes(a.jamMulai) - timeToMinutes(b.jamMulai);
        });
      }

      function pushSlot(c) {
        pushSlotForNeed(n, c);
        placedDays[c.hari] = (placedDays[c.hari] || 0) + 1;
      }

      function findConsecutiveBlock(blockSize, preferSebar) {
        var daysOrder = hariList.slice().sort(function(a, b) {
          if (wantGabungMapel) {
            var caG = crossLoad(n, a);
            var cbG = crossLoad(n, b);
            if ((caG > 0) !== (cbG > 0)) return (cbG > 0) ? 1 : -1;
          }
          var ca = crossLoad(n, a);
          var cb = crossLoad(n, b);
          if (ca !== cb) return ca - cb;
          if (preferSebar) return (placedDays[a] || 0) - (placedDays[b] || 0);
          return (placedDays[b] || 0) - (placedDays[a] || 0);
        });
        for (var di = 0; di < daysOrder.length; di++) {
          var hari = daysOrder[di];
          var fromIdx = startSlotIdx[hari] != null ? startSlotIdx[hari] : 0;
          for (var si = fromIdx; si <= slots.length - blockSize; si++) {
            var ok = true;
            var block = [];
            for (var k = 0; k < blockSize; k++) {
              var sl = slots[si + k];
              if (!isSlotAllowedForMapel(n, si + k, sl.jamMulai)) { ok = false; break; }
              if (!isFree(hari, sl.jamMulai, sl.jamSelesai, n.guruId, kelasKey, {
                mapel: n.mapel, mapelId: n.mapelId, kelas: n.kelas, kelasId: n.kelasId
              })) { ok = false; break; }
              block.push({ hari: hari, jamMulai: sl.jamMulai, jamSelesai: sl.jamSelesai, slotIdx: si + k });
            }
            if (ok) return block;
          }
        }
        return null;
      }

      function placeOne(preferSebar) {
        var ordered = sortCandidates(candidates, preferSebar);
        for (var i = 0; i < ordered.length; i++) {
          var c = ordered[i];
          if (isFree(c.hari, c.jamMulai, c.jamSelesai, n.guruId, kelasKey, {
            mapel: n.mapel, mapelId: n.mapelId, kelas: n.kelas, kelasId: n.kelasId
          })) {
            pushSlot(c);
            return true;
          }
        }
        return false;
      }

      while (sisa > 0) {
        var placedNow = false;
        if (modeGabung === "gabung") {
          var trySize = sisa;
          while (trySize >= 2 && !placedNow) {
            var blk = findConsecutiveBlock(trySize, false);
            if (blk) {
              blk.forEach(pushSlot);
              sisa -= blk.length;
              placedNow = true;
            } else trySize--;
          }
          if (!placedNow) {
            placedNow = placeOne(false);
            if (placedNow) sisa--;
          }
        } else if (modeGabung === "campur") {
          if (sisa >= 2) {
            var blk2 = findConsecutiveBlock(2, true);
            if (blk2) {
              blk2.forEach(pushSlot);
              sisa -= 2;
              placedNow = true;
            }
          }
          if (!placedNow) {
            placedNow = placeOne(true);
            if (placedNow) sisa--;
          }
        } else {
          placedNow = placeOne(true);
          if (placedNow) sisa--;
        }
        if (!placedNow) {
          unmet.push({
            guru: n.guru, kelas: n.kelas, mapel: n.mapel,
            butuh: n.jp, sudah: n.jp - sisa, sisa: sisa,
            alasan: "Slot penuh / tidak ada blok sesuai mode " + modeGabung
          });
          break;
        }
      }
    }

    // Kelompokkan needs: mapel gabungan (guru+mapel sama) vs individu
    var gabunganBuckets = {}; // key → [needs]
    var individualNeeds = [];
    needs.forEach(function(n) {
      var isGab = isMapelAllowedGabung(n.mapel || "", n.mapelId || "", gabCfg);
      if (isGab && n.guruId) {
        var key = String(n.guruId) + "|" + mapelKeyOf(n);
        if (!gabunganBuckets[key]) gabunganBuckets[key] = [];
        gabunganBuckets[key].push(n);
      } else if (isGab && n.guru) {
        var key2 = "name:" + String(n.guru).toLowerCase() + "|" + mapelKeyOf(n);
        if (!gabunganBuckets[key2]) gabunganBuckets[key2] = [];
        gabunganBuckets[key2].push(n);
      } else {
        individualNeeds.push(n);
      }
    });

    // Proses mapel gabungan dulu (agar dapat slot pagi / prioritas)
    Object.keys(gabunganBuckets).forEach(function(key) {
      var group = gabunganBuckets[key];
      if (group.length >= 2) {
        placeGabunganGroup(group);
      } else {
        // Hanya 1 kelas untuk mapel ini — treat as individual
        individualNeeds.push(group[0]);
      }
    });

    // Non-gabungan: urut guru+mapel lalu place individual
    individualNeeds.sort(function(a, b) {
      var ka = String(a.guruId || a.guru) + "|" + mapelKeyOf(a);
      var kb = String(b.guruId || b.guru) + "|" + mapelKeyOf(b);
      if (ka !== kb) return ka.localeCompare(kb);
      return b.jp - a.jp;
    });
    individualNeeds.forEach(function(n) {
      placeIndividual(n, null);
    });


    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: "Preview: " + planned.length + " slot akan dibuat." +
          (unmet.length ? " " + unmet.length + " tugas belum terpenuhi penuh." : " Semua JP terpenuhi."),
        data: {
          akanDibuat: planned.length,
          akanDihapus: mode === "ganti_pelajaran" ? pelajaranLama.length : 0,
          kegiatanDipertahankan: kegiatan.length,
          unmet: unmet,
          sample: planned.slice(0, 30)
        }
      };
    }

    // Tulis: hapus pelajaran lama jika mode ganti
    let deleted = 0;
    if (mode === "ganti_pelajaran" && pelajaranLama.length) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.JADWAL);
      if (sheet) {
        // Soft-delete via update IsDeleted / Status, atau hard delete by ID
        pelajaranLama.forEach(function(j) {
          if (!j.ID) return;
          updateFieldById(SHEET_NAMES.JADWAL, j.ID, {
            IsDeleted: "TRUE",
            Status: "Nonaktif",
            UpdatedAt: getNow(),
            UpdatedBy: auth.session.userId
          });
          deleted++;
        });
      }
    }

    let created = 0;
    const errors = [];
    planned.forEach(function(row) {
      try {
        // forceSave karena sudah dicek di generator
        row.forceSave = true;
        const res = saveData(SHEET_NAMES.JADWAL, row, token);
        if (res && res.success) {
          created++;
        } else {
          errors.push((res && res.message) || "Gagal simpan slot");
        }
      } catch (e) {
        errors.push(String(e.message || e));
      }
    });

    writeAuditLog(
      auth.session.userId, auth.session.nama, auth.session.role,
      "GENERATE_JADWAL", SHEET_NAMES.JADWAL, "",
      null,
      {
        mode: mode,
        created: created,
        deleted: deleted,
        unmet: unmet.length,
        tahunAjaran: tahunAjaran,
        semester: semester
      }
    );

    return {
      success: true,
      message: "Generate selesai. Dibuat: " + created +
        (deleted ? ", dinonaktifkan (pelajaran lama): " + deleted : "") +
        (unmet.length ? ", belum penuh: " + unmet.length + " tugas" : "") + ".",
      data: {
        created: created,
        deleted: deleted,
        kegiatanDipertahankan: kegiatan.length,
        unmet: unmet,
        errors: errors.slice(0, 15)
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal generate jadwal: " + (e.message || String(e)) };
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// ====================== NILAI MASSAL ======================
function saveBulkNilai(payload, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(45000);
    const auth = requireAuth(token, ["Admin", "Guru"]);
    if (!auth.ok) return auth.error;

    if (!payload || !payload.kelas || !payload.mapel || !payload.jenis || !Array.isArray(payload.items)) {
      return { success: false, message: "Payload nilai massal tidak lengkap." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const now = getNow();
    const guruId = auth.session.role === "Guru" ? auth.session.guruId : (payload.guruId || "");
    let successCount = 0, failCount = 0;
    const rowsToAppend = [];
    const errors = [];

    payload.items.forEach((item, idx) => {
      try {
        const nama = item.nama || "";
        const siswaId = item.siswaId || "";
        const nilai = Number(item.nilai);
        if (!nama && !siswaId) {
          failCount++;
          errors.push(`Baris ${idx + 1}: siswa kosong`);
          return;
        }
        if (isNaN(nilai) || nilai < 0 || nilai > 100) {
          failCount++;
          errors.push(`Baris ${idx + 1}: nilai tidak valid`);
          return;
        }

        const id = generateId("NIL");
        const form = {
          NamaSiswa: nama,
          Kelas: payload.kelas,
          MataPelajaran: payload.mapel,
          JenisPenilaian: payload.jenis,
          Nilai: nilai,
          Bobot: payload.bobot || "",
          CatatanGuru: item.keterangan || "",
          SiswaID: siswaId,
          KelasID: payload.kelasId || "",
          MapelID: payload.mapelId || "",
          GuruID: guruId
        };
        const row = headers.map(h => {
          if (h === "ID") return id;
          if (h === "Timestamp" || h === "CreatedAt") return now;
          if (h === "UpdatedAt") return now;
          if (h === "CreatedBy" || h === "UpdatedBy") return auth.session.userId;
          if (h === "IsDeleted") return "FALSE";
          return form.hasOwnProperty(h) ? sanitizeInput(String(form[h] ?? "")) : "";
        });
        rowsToAppend.push(row);
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(String(err));
      }
    });

    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
    }

    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "BULK_NILAI", SHEET_NAMES.NILAI, "", null, {
      successCount, failCount, jenis: payload.jenis, kelas: payload.kelas
    });

    return {
      success: true,
      message: `Nilai massal selesai. Berhasil: ${successCount}, Gagal: ${failCount}`,
      detail: { successCount, failCount, errors: errors.slice(0, 10) }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyimpan nilai massal." };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function getRekapNilai(filters, token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    let data = getRawData(SHEET_NAMES.NILAI);
    if (auth.session.role === "Guru") {
      data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
    }
    if (filters) {
      if (filters.kelas) data = data.filter(r => r.Kelas === filters.kelas || r.KelasID === filters.kelas);
      if (filters.mapel) data = data.filter(r => r.MataPelajaran === filters.mapel || r.MapelID === filters.mapel);
      if (filters.jenis) data = data.filter(r => r.JenisPenilaian === filters.jenis);
      if (filters.siswa) data = data.filter(r => (r.NamaSiswa || "").toLowerCase().includes(String(filters.siswa).toLowerCase()));
    }

    // Group by siswa
    const bySiswa = {};
    data.forEach(n => {
      const key = n.SiswaID || n.NamaSiswa || "unknown";
      if (!bySiswa[key]) {
        bySiswa[key] = { nama: n.NamaSiswa, kelas: n.Kelas, nilai: [], rata: 0 };
      }
      const v = Number(n.Nilai);
      if (!isNaN(v)) bySiswa[key].nilai.push({ jenis: n.JenisPenilaian, nilai: v, bobot: n.Bobot });
    });
    Object.keys(bySiswa).forEach(k => {
      const arr = bySiswa[k].nilai.map(x => x.nilai);
      bySiswa[k].rata = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
      bySiswa[k].jumlah = arr.length;
    });

    return { success: true, data: data, rekap: Object.values(bySiswa) };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal rekap nilai." };
  }
}

// ====================== CATATAN PERKEMBANGAN SISWA ======================
function getCatatanSiswa(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    let data = getRawData(SHEET_NAMES.CATATAN_SISWA);
    if (auth.session.role === "Guru") {
      data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
    }
    if (filters) {
      if (filters.siswaId) data = data.filter(r => r.SiswaID === filters.siswaId);
      if (filters.jenis) data = data.filter(r => r.Jenis === filters.jenis);
      if (filters.tahunAjaran) data = data.filter(r => r.TahunAjaran === filters.tahunAjaran);
      if (filters.q) {
        const q = String(filters.q).toLowerCase();
        data = data.filter(r =>
          (r.NamaSiswa || "").toLowerCase().includes(q) ||
          (r.Judul || "").toLowerCase().includes(q) ||
          (r.Deskripsi || "").toLowerCase().includes(q)
        );
      }
    }
    data.sort((a, b) => String(b.Tanggal || "").localeCompare(String(a.Tanggal || "")));
    return { success: true, data: data };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil catatan siswa." };
  }
}

// ====================== LAPORAN & EXPORT ======================
function getLaporan(token, jenis, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    filters = filters || {};

    if (jenis === "absensi") {
      return getRekapAbsensi(filters, token);
    }
    if (jenis === "nilai") {
      return getRekapNilai(filters, token);
    }
    if (jenis === "jurnal") {
      let data = getRawData(SHEET_NAMES.JURNAL);
      if (auth.session.role === "Guru") {
        data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
      }
      if (filters.tanggalMulai) data = data.filter(r => r.Tanggal >= filters.tanggalMulai);
      if (filters.tanggalSelesai) data = data.filter(r => r.Tanggal <= filters.tanggalSelesai);
      if (filters.kelas) data = data.filter(r => r.Kelas === filters.kelas || r.KelasID === filters.kelas);
      if (filters.mapel) data = data.filter(r => r.MataPelajaran === filters.mapel || r.MapelID === filters.mapel);
      if (filters.guruId) data = data.filter(r => r.GuruID === filters.guruId);
      return { success: true, data: data, total: data.length };
    }
    if (jenis === "aktivitas_guru") {
      let jurnal = getRawData(SHEET_NAMES.JURNAL);
      let absensi = getRawData(SHEET_NAMES.ABSENSI);
      if (auth.session.role === "Guru") {
        jurnal = jurnal.filter(r => r.GuruID === auth.session.guruId);
        absensi = absensi.filter(r => r.GuruID === auth.session.guruId);
      }
      const byGuru = {};
      const ensure = (id, nama) => {
        if (!byGuru[id]) byGuru[id] = { guruId: id, nama: nama || id, jurnal: 0, absensi: 0 };
      };
      jurnal.forEach(j => {
        const id = j.GuruID || j.CreatedBy || "unknown";
        ensure(id, j.Guru);
        byGuru[id].jurnal++;
      });
      absensi.forEach(a => {
        const id = a.GuruID || a.CreatedBy || "unknown";
        ensure(id, "");
        byGuru[id].absensi++;
      });
      return { success: true, data: Object.values(byGuru) };
    }
    if (jenis === "siswa_kelas") {
      let siswa = getRawData(SHEET_NAMES.SISWA).filter(s => s.Status === "Aktif" || !s.Status);
      if (filters.kelas) siswa = siswa.filter(s => s.Kelas === filters.kelas || s.KelasID === filters.kelas);
      return { success: true, data: siswa, total: siswa.length };
    }

    return { success: false, message: "Jenis laporan tidak dikenal." };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal membuat laporan." };
  }
}

/**
 * Kumpulkan data export (shared oleh exportXlsx / alias exportCsv).
 */
function collectExportData_(token, sheetName, filters) {
  const auth = requireAuth(token);
  if (!auth.ok) return auth.error;

  let data = [];
  let headers = [];

  if (sheetName === "DB_Absensi" || sheetName === "absensi") {
    const res = getRekapAbsensi(filters || {}, token);
    if (!res.success) return res;
    data = res.data || [];
    headers = ["Tanggal", "Kelas", "MataPelajaran", "NamaSiswa", "StatusAbsen", "Keterangan", "Sesi"];
  } else if (sheetName === "DB_Nilai" || sheetName === "nilai") {
    const res = getRekapNilai(filters || {}, token);
    if (!res.success) return res;
    data = res.data || [];
    headers = ["NamaSiswa", "Kelas", "MataPelajaran", "JenisPenilaian", "Nilai", "Bobot", "CatatanGuru"];
  } else if (sheetName === "DB_Jurnal" || sheetName === "jurnal") {
    const res = getLaporan(token, "jurnal", filters || {});
    if (!res.success) return res;
    data = res.data || [];
    headers = ["Tanggal", "Kelas", "MataPelajaran", "MateriPokok", "KegiatanPembelajaran", "Hambatan", "Guru"];
  } else if (sheetName === "DB_Siswa" || sheetName === "siswa") {
    data = getRawData(SHEET_NAMES.SISWA);
    headers = ["NIS", "NISN", "Nama", "JenisKelamin", "TempatLahir", "TanggalLahir", "Alamat", "NamaWali", "HPWali", "Kelas", "TahunAjaran", "Status"];
  } else if (sheetName === "DB_Jadwal" || sheetName === "jadwal") {
    const res = getJadwal(token, filters || {});
    if (!res.success) return res;
    data = res.data || [];
    headers = ["Hari", "JamMulai", "JamSelesai", "Kelas", "MataPelajaran", "Guru", "Semester", "TahunAjaran", "Status"];
  } else if (isAllowedSheet(sheetName)) {
    if (sheetName === SHEET_NAMES.USERS && auth.session.role !== "Admin") {
      return { success: false, message: "Akses ditolak." };
    }
    data = getRawData(sheetName);
    if (data.length) headers = Object.keys(data[0]).filter(h => h !== "PasswordHash" && h !== "IsDeleted");
  } else {
    return { success: false, message: "Sheet tidak diizinkan untuk export." };
  }

  if (!headers.length && data.length) {
    headers = Object.keys(data[0]);
  }

  return { success: true, auth: auth, data: data, headers: headers };
}

/**
 * Bangun file .xlsx (Spreadsheet sementara → export Google) lalu hapus temp.
 * Return base64 agar client bisa unduh sebagai .xlsx murni.
 */
function buildXlsxBase64_(headers, data, sheetTitle) {
  const temp = SpreadsheetApp.create("SIKAD_Export_" + new Date().getTime());
  const tempId = temp.getId();
  try {
    const sh = temp.getActiveSheet();
    sh.setName((sheetTitle || "Data").substring(0, 90));
    if (headers && headers.length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#0f172a")
        .setFontColor("#ffffff");
    }
    if (data && data.length && headers && headers.length) {
      const values = data.map(function(row) {
        return headers.map(function(h) {
          const v = row[h];
          return v == null ? "" : v;
        });
      });
      // Batasi baris ekstrem (proteksi memori)
      const maxRows = Math.min(values.length, 5000);
      if (maxRows > 0) {
        sh.getRange(2, 1, maxRows, headers.length).setValues(values.slice(0, maxRows));
      }
    }
    sh.setFrozenRows(1);
    if (headers && headers.length) {
      try { sh.autoResizeColumns(1, headers.length); } catch (e) {}
    }
    SpreadsheetApp.flush();

    const url = "https://docs.google.com/spreadsheets/d/" + tempId + "/export?format=xlsx";
    const token = ScriptApp.getOAuthToken();
    const resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) {
      throw new Error("Gagal export xlsx (HTTP " + resp.getResponseCode() + ")");
    }
    return Utilities.base64Encode(resp.getContent());
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e) {}
  }
}

/**
 * Export data sebagai file Excel (.xlsx).
 */
function exportXlsx(token, sheetName, filters) {
  try {
    const packed = collectExportData_(token, sheetName, filters);
    if (!packed.success) return packed;

    const headers = packed.headers || [];
    const data = packed.data || [];
    const baseName = (String(sheetName).replace("DB_", "") || "export");
    const filename = baseName + "_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmm") + ".xlsx";

    const base64 = buildXlsxBase64_(headers, data, baseName);

    writeAuditLog(
      packed.auth.session.userId,
      packed.auth.session.nama,
      packed.auth.session.role,
      "EXPORT_XLSX",
      sheetName,
      "",
      null,
      { rows: data.length }
    );

    return {
      success: true,
      filename: filename,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: base64,
      rows: data.length
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal export Excel: " + (e.message || String(e)) };
  }
}

/**
 * Alias lama — sekarang juga menghasilkan .xlsx (bukan CSV).
 * Field `csv` tidak diisi; client harus memakai base64 + filename .xlsx.
 */
function exportCsv(token, sheetName, filters) {
  return exportXlsx(token, sheetName, filters);
}

// ====================== IMPORT CSV ======================
/**
 * Parse CSV sederhana (mendukung kutip). Baris pertama = header.
 */
function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;
  let row = [];
  let cell = "";
  let inQuotes = false;
  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cell += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(cell); cell = ""; i++; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(x => String(x).trim() !== "")) rows.push(row);
      row = []; i++; continue;
    }
    cell += c; i++;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(x => String(x).trim() !== "")) rows.push(row);
  }
  return rows;
}

function importCsvSiswa(csvText, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    if (!csvText || String(csvText).trim().length < 5) {
      return { success: false, message: "File CSV kosong atau tidak valid." };
    }
    // Hapus BOM
    csvText = String(csvText).replace(/^\uFEFF/, "");
    const rows = parseCsv(csvText);
    if (rows.length < 2) return { success: false, message: "CSV harus punya header + minimal 1 baris data." };

    const headers = rows[0].map(h => String(h || "").trim());
    // Mapping header fleksibel
    const mapKey = (candidates) => {
      for (let c of candidates) {
        const idx = headers.findIndex(h => h.toLowerCase() === c.toLowerCase());
        if (idx >= 0) return idx;
      }
      return -1;
    };
    const idxNama = mapKey(["Nama", "Nama Lengkap", "Nama Siswa"]);
    const idxNis = mapKey(["NIS", "Nis"]);
    const idxNisn = mapKey(["NISN", "Nisn"]);
    const idxKelas = mapKey(["Kelas", "Nama Kelas"]);
    const idxJk = mapKey(["JenisKelamin", "Jenis Kelamin", "JK", "L/P"]);
    const idxStatus = mapKey(["Status"]);
    const idxTahun = mapKey(["TahunAjaran", "Tahun Ajaran"]);
    const idxWali = mapKey(["NamaWali", "Nama Wali", "Wali", "Nama Orang Tua"]);
    const idxHp = mapKey(["HPWali", "HP Wali", "No HP", "HP", "NoHPWali"]);
    const idxTempat = mapKey(["TempatLahir", "Tempat Lahir"]);
    const idxTglLahir = mapKey(["TanggalLahir", "Tanggal Lahir", "Tgl Lahir"]);
    const idxAlamat = mapKey(["Alamat"]);

    if (idxNama < 0) return { success: false, message: "Kolom Nama wajib ada di file (header baris 1)." };

    // Cache kelas untuk resolve ID
    const kelasList = getRawData(SHEET_NAMES.KELAS);
    const findKelas = (nama) => {
      if (!nama) return null;
      return kelasList.find(k => String(k.Nama).toLowerCase() === String(nama).toLowerCase());
    };

    // Normalisasi tanggal Excel (serial atau string)
    const normDate = (v) => {
      if (!v) return "";
      const s = String(v).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
      // DD/MM/YYYY atau DD-MM-YYYY
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const dd = ("0" + m[1]).slice(-2);
        const mm = ("0" + m[2]).slice(-2);
        return m[3] + "-" + mm + "-" + dd;
      }
      return s;
    };

    let ok = 0, fail = 0;
    const errors = [];
    for (let r = 1; r < rows.length; r++) {
      const line = rows[r];
      const get = (idx) => (idx >= 0 && idx < line.length) ? String(line[idx] || "").trim() : "";
      const nama = get(idxNama);
      if (!nama) { fail++; errors.push("Baris " + (r + 1) + ": nama kosong"); continue; }

      const kelasNama = get(idxKelas);
      const k = findKelas(kelasNama);
      let jk = get(idxJk);
      if (jk === "L" || jk.toLowerCase() === "laki-laki") jk = "Laki-laki";
      else if (jk === "P" || jk.toLowerCase() === "perempuan") jk = "Perempuan";

      const form = {
        Nama: nama,
        NIS: get(idxNis),
        NISN: get(idxNisn),
        Kelas: k ? k.Nama : kelasNama,
        KelasID: k ? k.ID : "",
        JenisKelamin: jk,
        Status: get(idxStatus) || "Aktif",
        TahunAjaran: get(idxTahun),
        NamaWali: get(idxWali),
        HPWali: get(idxHp),
        TempatLahir: get(idxTempat),
        TanggalLahir: normDate(get(idxTglLahir)),
        Alamat: get(idxAlamat)
      };
      const res = saveData(SHEET_NAMES.SISWA, form, token);
      if (res.success) ok++;
      else { fail++; errors.push("Baris " + (r + 1) + ": " + (res.message || "gagal")); }
    }

    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "IMPORT_CSV", SHEET_NAMES.SISWA, "", null, { ok, fail });
    return {
      success: true,
      message: "Import siswa selesai. Berhasil: " + ok + ", Gagal: " + fail,
      detail: { ok, fail, errors: errors.slice(0, 20) }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal import siswa: " + e.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function importCsvNilai(csvText, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const auth = requireAuth(token, ["Admin", "Guru"]);
    if (!auth.ok) return auth.error;
    if (!csvText || String(csvText).trim().length < 5) {
      return { success: false, message: "File CSV kosong atau tidak valid." };
    }
    csvText = String(csvText).replace(/^\uFEFF/, "");
    const rows = parseCsv(csvText);
    if (rows.length < 2) return { success: false, message: "CSV harus punya header + data." };

    const headers = rows[0].map(h => String(h || "").trim());
    const mapKey = (candidates) => {
      for (let c of candidates) {
        const idx = headers.findIndex(h => h.toLowerCase() === c.toLowerCase());
        if (idx >= 0) return idx;
      }
      return -1;
    };
    const idxNama = mapKey(["NamaSiswa", "Nama Siswa", "Nama", "Siswa"]);
    const idxKelas = mapKey(["Kelas"]);
    const idxMapel = mapKey(["MataPelajaran", "Mata Pelajaran", "Mapel"]);
    const idxJenis = mapKey(["JenisPenilaian", "Jenis Penilaian", "Jenis"]);
    const idxNilai = mapKey(["Nilai", "Score", "Skor"]);
    const idxCatatan = mapKey(["CatatanGuru", "Catatan", "Catatan Guru"]);
    const idxBobot = mapKey(["Bobot"]);

    if (idxNama < 0 || idxNilai < 0) {
      return { success: false, message: "Kolom Nama Siswa dan Nilai wajib ada di CSV." };
    }

    const siswaList = getRawData(SHEET_NAMES.SISWA);
    const findSiswa = (nama) => siswaList.find(s => String(s.Nama).toLowerCase() === String(nama).toLowerCase());

    let ok = 0, fail = 0;
    const errors = [];
    const guruId = auth.session.role === "Guru" ? auth.session.guruId : "";

    for (let r = 1; r < rows.length; r++) {
      const line = rows[r];
      const get = (idx) => (idx >= 0 && idx < line.length) ? String(line[idx] || "").trim() : "";
      const nama = get(idxNama);
      const nilaiStr = get(idxNilai);
      if (!nama) { fail++; continue; }
      const nilai = Number(nilaiStr);
      if (isNaN(nilai) || nilai < 0 || nilai > 100) {
        fail++;
        errors.push("Baris " + (r + 1) + ": nilai tidak valid");
        continue;
      }
      const s = findSiswa(nama);
      const form = {
        NamaSiswa: nama,
        SiswaID: s ? s.ID : "",
        Kelas: get(idxKelas) || (s ? s.Kelas : ""),
        KelasID: s ? s.KelasID : "",
        MataPelajaran: get(idxMapel),
        JenisPenilaian: get(idxJenis) || "Tugas",
        Nilai: nilai,
        Bobot: get(idxBobot),
        CatatanGuru: get(idxCatatan),
        GuruID: guruId
      };
      const res = saveData(SHEET_NAMES.NILAI, form, token);
      if (res.success) ok++;
      else { fail++; errors.push("Baris " + (r + 1) + ": " + (res.message || "gagal")); }
    }

    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "IMPORT_CSV", SHEET_NAMES.NILAI, "", null, { ok, fail });
    return {
      success: true,
      message: "Import nilai selesai. Berhasil: " + ok + ", Gagal: " + fail,
      detail: { ok, fail, errors: errors.slice(0, 20) }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal import nilai: " + e.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Data siap cetak daftar hadir per kelas + tanggal (+ mapel opsional)
 */
function getPrintDaftarHadir(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    filters = filters || {};
    if (!filters.kelas && !filters.kelasId) {
      return { success: false, message: "Kelas wajib untuk daftar hadir." };
    }
    if (!filters.tanggal) {
      return { success: false, message: "Tanggal wajib untuk daftar hadir." };
    }

    // Guru: wajib mapel + harus sesuai Tugas Mengajar
    if (auth.session.role === "Guru") {
      if (!filters.mapel && !filters.mapelId) {
        return { success: false, message: "Mata pelajaran wajib untuk cetak daftar hadir guru." };
      }
      const tugas = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(t =>
        (t.Status === "Aktif" || !t.Status) &&
        t.GuruID === auth.session.guruId
      );
      if (!tugas.length) {
        return { success: false, message: "Anda belum memiliki Tugas Mengajar. Hubungi Admin." };
      }
      const allowed = tugas.some(t => {
        const kelasOk =
          (filters.kelasId && t.KelasID === filters.kelasId) ||
          (filters.kelas && (t.Kelas === filters.kelas || t.KelasID === filters.kelas));
        const mapelOk =
          (filters.mapelId && t.MapelID === filters.mapelId) ||
          (filters.mapel && (t.MataPelajaran === filters.mapel || t.MapelID === filters.mapel));
        return kelasOk && mapelOk;
      });
      if (!allowed) {
        return { success: false, message: "Kelas/mapel di luar tugas mengajar Anda." };
      }
    }

    // Daftar siswa kelas
    const siswaRes = getSiswaByKelas(filters.kelasId || filters.kelas, token);
    if (!siswaRes.success) return siswaRes;
    const siswa = siswaRes.data || [];

    // Absensi hari itu
    let absensi = getRawData(SHEET_NAMES.ABSENSI).filter(a => a.Tanggal === filters.tanggal);
    if (filters.kelas) {
      absensi = absensi.filter(a => a.Kelas === filters.kelas || a.KelasID === filters.kelas || a.KelasID === filters.kelasId);
    }
    if (filters.mapel) {
      absensi = absensi.filter(a => a.MataPelajaran === filters.mapel || a.MapelID === filters.mapel);
    }
    if (filters.mapelId) {
      absensi = absensi.filter(a => a.MapelID === filters.mapelId || a.MataPelajaran === filters.mapel);
    }
    if (auth.session.role === "Guru") {
      absensi = absensi.filter(a => a.GuruID === auth.session.guruId || a.CreatedBy === auth.session.userId);
    }

    const bySiswa = {};
    absensi.forEach(a => {
      const key = a.SiswaID || a.NamaSiswa;
      bySiswa[key] = a;
    });

    const rows = siswa.map((s, i) => {
      const a = bySiswa[s.ID] || bySiswa[s.Nama] || null;
      return {
        no: i + 1,
        nis: s.NIS || "",
        nama: s.Nama || "",
        status: a ? (a.StatusAbsen || "") : "",
        keterangan: a ? (a.Keterangan || "") : ""
      };
    });

    const pengaturan = {};
    getRawData(SHEET_NAMES.PENGATURAN).forEach(p => { pengaturan[p.Key] = p.Value; });

    var dataOut = {
      sekolah: pengaturan.nama_sekolah || "SIKAD DIGITAL",
      kelas: filters.kelas || "",
      tanggal: filters.tanggal,
      mapel: filters.mapel || "—",
      tahunAjaran: pengaturan.tahun_ajaran_aktif || "",
      semester: pengaturan.semester_aktif || "",
      rows: rows,
      rekap: {
        hadir: rows.filter(r => r.status === "Hadir").length,
        izin: rows.filter(r => r.status === "Izin").length,
        sakit: rows.filter(r => r.status === "Sakit").length,
        alpha: rows.filter(r => r.status === "Alpha").length,
        kosong: rows.filter(r => !r.status).length,
        total: rows.length
      }
    };
    attachPrintMeta(dataOut, filters);
    return { success: true, data: dataOut };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyiapkan daftar hadir." };
  }
}

/**
 * Data siap cetak JURNAL MENGAJAR (filter: kelas, mapel, tahun ajaran, semester)
 * Tahun ajaran & semester difilter lewat rentang tanggal DB_TahunAjaran
 * (karena sheet jurnal tidak menyimpan kolom TahunAjaran/Semester).
 */
/**
 * Data siap cetak REKAP ABSENSI MATRIX (multi-tanggal)
 * Format: NO | NAMA SISWA | NIS | [tanggal...] | PERSENTASE KEHADIRAN
 * Status: H / I / S / A
 */
function getPrintRekapAbsensiMatrix(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    filters = filters || {};

    // Filter bulan (YYYY-MM) → set rentang tanggal otomatis
    if (filters.bulan && String(filters.bulan).match(/^\d{4}-\d{2}$/)) {
      const parts = String(filters.bulan).split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const lastDay = new Date(y, m, 0).getDate();
      filters.tanggalMulai = parts[0] + "-" + parts[1] + "-01";
      filters.tanggalSelesai = parts[0] + "-" + parts[1] + "-" + String(lastDay).padStart(2, "0");
    }

    if (!filters.kelas && !filters.kelasId) {
      return { success: false, message: "Kelas wajib untuk rekap absensi." };
    }
    if (!filters.tanggalMulai || !filters.tanggalSelesai) {
      return { success: false, message: "Rentang tanggal (mulai & selesai) wajib." };
    }
    if (filters.tanggalMulai > filters.tanggalSelesai) {
      return { success: false, message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai." };
    }

    if (auth.session.role === "Guru") {
      if (!filters.mapel && !filters.mapelId) {
        return { success: false, message: "Mata pelajaran wajib untuk cetak rekap absensi guru." };
      }
      const tugas = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(t =>
        (t.Status === "Aktif" || !t.Status) &&
        t.GuruID === auth.session.guruId
      );
      if (!tugas.length) {
        return { success: false, message: "Anda belum memiliki Tugas Mengajar. Hubungi Admin." };
      }
      const allowed = tugas.some(t => {
        const kelasOk =
          (filters.kelasId && t.KelasID === filters.kelasId) ||
          (filters.kelas && (t.Kelas === filters.kelas || t.KelasID === filters.kelas));
        const mapelOk =
          (filters.mapelId && t.MapelID === filters.mapelId) ||
          (filters.mapel && (t.MataPelajaran === filters.mapel || t.MapelID === filters.mapel));
        return kelasOk && mapelOk;
      });
      if (!allowed) {
        return { success: false, message: "Kelas/mapel di luar tugas mengajar Anda." };
      }
    }

    const siswaRes = getSiswaByKelas(filters.kelasId || filters.kelas, token);
    if (!siswaRes.success) return siswaRes;
    let siswa = (siswaRes.data || []).slice();
    siswa.sort((a, b) => String(a.Nama || "").localeCompare(String(b.Nama || ""), "id"));

    let absensi = getRawData(SHEET_NAMES.ABSENSI).filter(a => {
      const t = a.Tanggal || "";
      return t >= filters.tanggalMulai && t <= filters.tanggalSelesai;
    });

    if (filters.kelas) {
      absensi = absensi.filter(a =>
        a.Kelas === filters.kelas || a.KelasID === filters.kelas || a.KelasID === filters.kelasId
      );
    }
    if (filters.kelasId) {
      absensi = absensi.filter(a =>
        a.KelasID === filters.kelasId || a.Kelas === filters.kelas
      );
    }
    if (filters.mapel) {
      absensi = absensi.filter(a => a.MataPelajaran === filters.mapel || a.MapelID === filters.mapel);
    }
    if (filters.mapelId) {
      absensi = absensi.filter(a => a.MapelID === filters.mapelId || a.MataPelajaran === filters.mapel);
    }
    if (auth.session.role === "Guru") {
      absensi = absensi.filter(a => a.GuruID === auth.session.guruId || a.CreatedBy === auth.session.userId);
    }

    const dateSet = {};
    absensi.forEach(a => {
      if (a.Tanggal) dateSet[a.Tanggal] = true;
    });
    let dates = Object.keys(dateSet).sort();

    if (filters.includeEmptyDates) {
      const all = [];
      const d0 = new Date(filters.tanggalMulai + "T00:00:00");
      const d1 = new Date(filters.tanggalSelesai + "T00:00:00");
      for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        all.push(y + "-" + m + "-" + day);
      }
      dates = all;
    }

    if (dates.length > 31) dates = dates.slice(0, 31);

    const byKey = {};
    absensi.forEach(a => {
      const sid = a.SiswaID || "";
      const nama = a.NamaSiswa || "";
      const t = a.Tanggal || "";
      if (sid) byKey[sid + "|" + t] = a;
      if (nama) byKey[nama + "|" + t] = a;
    });

    const statusToCode = function(s) {
      s = String(s || "").trim();
      if (s === "Hadir") return "H";
      if (s === "Izin") return "I";
      if (s === "Sakit") return "S";
      if (s === "Alpha") return "A";
      if (["H", "I", "S", "A"].indexOf(s.toUpperCase()) !== -1) return s.toUpperCase();
      return "";
    };

    const totalPertemuan = dates.length;
    const rows = siswa.map(function(s, i) {
      const statuses = dates.map(function(t) {
        const a = byKey[s.ID + "|" + t] || byKey[(s.Nama || "") + "|" + t] || null;
        return a ? statusToCode(a.StatusAbsen) : "";
      });
      let hadir = 0;
      statuses.forEach(function(c) { if (c === "H") hadir++; });
      const persen = totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 0;
      return {
        no: i + 1,
        nis: s.NIS || "",
        nama: s.Nama || "",
        statuses: statuses,
        hadir: hadir,
        persen: persen
      };
    });

    const dateLabels = dates.map(function(t) {
      const parts = String(t).split("-");
      if (parts.length === 3) return parts[2] + "/" + parts[1];
      return t;
    });

    const pengaturan = {};
    getRawData(SHEET_NAMES.PENGATURAN).forEach(function(p) { pengaturan[p.Key] = p.Value; });

    var dataOut = {
      sekolah: pengaturan.nama_sekolah || "SIKAD DIGITAL",
      kelas: filters.kelas || "",
      mapel: filters.mapel || "—",
      tanggalMulai: filters.tanggalMulai,
      tanggalSelesai: filters.tanggalSelesai,
      tahunAjaran: pengaturan.tahun_ajaran_aktif || "",
      semester: pengaturan.semester_aktif || "",
      dates: dates,
      dateLabels: dateLabels,
      totalPertemuan: totalPertemuan,
      rows: rows,
      legenda: { H: "Hadir", I: "Izin", S: "Sakit", A: "Alpha" },
      dicetakOleh: auth.session.nama || "",
      dicetakPada: getNow()
    };
    attachPrintMeta(dataOut, filters);
    return { success: true, data: dataOut };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyiapkan rekap absensi: " + (e.message || String(e)) };
  }
}

function getPrintJurnal(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    filters = filters || {};

    let data = getRawData(SHEET_NAMES.JURNAL);

    // Role: Guru hanya jurnal sendiri
    if (auth.session.role === "Guru") {
      data = data.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
    }

    // Filter kelas
    if (filters.kelas || filters.kelasId) {
      data = data.filter(r =>
        (filters.kelas && (r.Kelas === filters.kelas || r.KelasID === filters.kelas)) ||
        (filters.kelasId && (r.KelasID === filters.kelasId || r.Kelas === filters.kelas))
      );
    }

    // Filter mapel
    if (filters.mapel || filters.mapelId) {
      data = data.filter(r =>
        (filters.mapel && (r.MataPelajaran === filters.mapel || r.MapelID === filters.mapel)) ||
        (filters.mapelId && (r.MapelID === filters.mapelId || r.MataPelajaran === filters.mapel))
      );
    }

    // Filter guru (opsional, admin)
    if (filters.guruId) {
      data = data.filter(r => r.GuruID === filters.guruId);
    }

    // Filter tahun ajaran + semester via rentang tanggal master DB_TahunAjaran
    let periodeLabel = "";
    let tanggalMulai = filters.tanggalMulai || "";
    let tanggalSelesai = filters.tanggalSelesai || "";

    // Filter bulan (YYYY-MM) — prioritas di atas jika diisi, set rentang 1..akhir bulan
    if (filters.bulan && String(filters.bulan).match(/^\d{4}-\d{2}$/)) {
      const parts = String(filters.bulan).split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const lastDay = new Date(y, m, 0).getDate();
      tanggalMulai = parts[0] + "-" + parts[1] + "-01";
      tanggalSelesai = parts[0] + "-" + parts[1] + "-" + String(lastDay).padStart(2, "0");
      periodeLabel = "Bulan " + parts[1] + "/" + parts[0];
    }

    if (filters.tahunAjaran || filters.semester) {
      const taList = getRawData(SHEET_NAMES.TAHUN_AJARAN);
      let matched = taList.filter(t => {
        if (filters.tahunAjaran && String(t.TahunAjaran || "") !== String(filters.tahunAjaran)) return false;
        if (filters.semester && String(t.Semester || "") !== String(filters.semester)) return false;
        return true;
      });
      // Jika tidak ketemu exact semester, coba match tahun saja
      if (!matched.length && filters.tahunAjaran) {
        matched = taList.filter(t => String(t.TahunAjaran || "") === String(filters.tahunAjaran));
      }
      if (matched.length) {
        // Ambil rentang terluas dari periode yang match
        const starts = matched.map(t => t.TanggalMulai || "").filter(Boolean).sort();
        const ends = matched.map(t => t.TanggalSelesai || "").filter(Boolean).sort();
        if (starts.length) tanggalMulai = starts[0];
        if (ends.length) tanggalSelesai = ends[ends.length - 1];
        periodeLabel = matched.map(t =>
          (t.TahunAjaran || "") + (t.Semester ? " " + t.Semester : "")
        ).filter((v, i, a) => a.indexOf(v) === i).join(", ");
      } else if (filters.tahunAjaran) {
        // Fallback: tidak ada master — jangan kosongkan semua, hanya label
        periodeLabel = filters.tahunAjaran + (filters.semester ? " " + filters.semester : "");
      }
    }

    if (tanggalMulai) data = data.filter(r => (r.Tanggal || "") >= tanggalMulai);
    if (tanggalSelesai) data = data.filter(r => (r.Tanggal || "") <= tanggalSelesai);

    // Urut tanggal naik
    data.sort((a, b) => String(a.Tanggal || "").localeCompare(String(b.Tanggal || "")));

    const rows = data.map((j, i) => ({
      no: i + 1,
      tanggal: j.Tanggal || "",
      kelas: j.Kelas || "",
      mapel: j.MataPelajaran || j["Mata Pelajaran"] || "",
      materi: j.MateriPokok || j["Materi Pokok"] || "",
      tujuan: j.TujuanPembelajaran || "",
      kegiatan: j.KegiatanPembelajaran || j["Kegiatan Pembelajaran"] || "",
      metode: j.Metode || "",
      media: j.Media || "",
      jam: j.JamPelajaran || "",
      hadir: j.JumlahHadir || "",
      tidakHadir: j.JumlahTidakHadir || "",
      hambatan: j.Hambatan || j["Hambatan / Catatan"] || "",
      tindakLanjut: j.TindakLanjut || "",
      guru: j.Guru || ""
    }));

    const pengaturan = {};
    getRawData(SHEET_NAMES.PENGATURAN).forEach(p => { pengaturan[p.Key] = p.Value; });

    // Meta filter untuk header cetak
    const filterMeta = {
      kelas: filters.kelas || (filters.kelasId ? filters.kelasId : "Semua"),
      mapel: filters.mapel || (filters.mapelId ? filters.mapelId : "Semua"),
      tahunAjaran: filters.tahunAjaran || pengaturan.tahun_ajaran_aktif || "—",
      semester: filters.semester || "—",
      periode: periodeLabel || "",
      tanggalMulai: tanggalMulai || "—",
      tanggalSelesai: tanggalSelesai || "—"
    };

    var dataOut = {
      sekolah: pengaturan.nama_sekolah || "SIKAD DIGITAL",
      tahunAjaranAktif: pengaturan.tahun_ajaran_aktif || "",
      semesterAktif: pengaturan.semester_aktif || "",
      tahunAjaran: filterMeta.tahunAjaran,
      semester: filterMeta.semester,
      filter: filterMeta,
      total: rows.length,
      rows: rows,
      dicetakOleh: auth.session.nama || "",
      dicetakPada: getNow()
    };
    attachPrintMeta(dataOut, filters);
    return { success: true, data: dataOut };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyiapkan jurnal: " + (e.message || String(e)) };
  }
}

/**
 * Backup ringkas: metadata + jumlah baris tiap sheet (bukan full dump besar).
 * Full backup disarankan lewat File → Make a copy di Google Sheets.
 */
/**
 * Cetak nilai format matriks (seperti buku nilai kelas):
 * NO | Nama Siswa | [Jenis1] [Jenis2] ... | Rata-rata
 * Filter wajib: kelas (+ mapel disarankan)
 */
function getPrintNilaiMatrix(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    filters = filters || {};

    if (!filters.kelas && !filters.kelasId) {
      return { success: false, message: "Kelas wajib untuk cetak nilai." };
    }

    // Guru: mapel wajib + sesuai tugas
    if (auth.session.role === "Guru") {
      if (!filters.mapel && !filters.mapelId) {
        return { success: false, message: "Mata pelajaran wajib untuk cetak nilai guru." };
      }
      const tugas = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(t =>
        (t.Status === "Aktif" || !t.Status) && t.GuruID === auth.session.guruId
      );
      if (!tugas.length) {
        return { success: false, message: "Anda belum memiliki Tugas Mengajar. Hubungi Admin." };
      }
      const allowed = tugas.some(t => {
        const kelasOk =
          (filters.kelasId && t.KelasID === filters.kelasId) ||
          (filters.kelas && (t.Kelas === filters.kelas || t.KelasID === filters.kelas));
        const mapelOk =
          (filters.mapelId && t.MapelID === filters.mapelId) ||
          (filters.mapel && (t.MataPelajaran === filters.mapel || t.MapelID === filters.mapel));
        return kelasOk && mapelOk;
      });
      if (!allowed) {
        return { success: false, message: "Kelas/mapel di luar tugas mengajar Anda." };
      }
    }

    // Siswa kelas (urut nama)
    const siswaRes = getSiswaByKelas(filters.kelasId || filters.kelas, token);
    if (!siswaRes.success) return siswaRes;
    let siswa = (siswaRes.data || []).slice();
    siswa.sort((a, b) => String(a.Nama || "").localeCompare(String(b.Nama || ""), "id"));

    // Ambil nilai
    let nilai = getRawData(SHEET_NAMES.NILAI);
    if (auth.session.role === "Guru") {
      nilai = nilai.filter(r => r.GuruID === auth.session.guruId || r.CreatedBy === auth.session.userId);
    }
    if (filters.kelas) {
      nilai = nilai.filter(r => r.Kelas === filters.kelas || r.KelasID === filters.kelas || r.KelasID === filters.kelasId);
    }
    if (filters.kelasId) {
      nilai = nilai.filter(r => r.KelasID === filters.kelasId || r.Kelas === filters.kelas);
    }
    if (filters.mapel) {
      nilai = nilai.filter(r => r.MataPelajaran === filters.mapel || r.MapelID === filters.mapel);
    }
    if (filters.mapelId) {
      nilai = nilai.filter(r => r.MapelID === filters.mapelId || r.MataPelajaran === filters.mapel);
    }
    if (filters.bulan && String(filters.bulan).match(/^\d{4}-\d{2}$/)) {
      const prefix = String(filters.bulan);
      nilai = nilai.filter(r => {
        const t = String(r.Timestamp || r.CreatedAt || r.Tanggal || "");
        return t.indexOf(prefix) === 0;
      });
    }
    if (filters.tanggalMulai) {
      nilai = nilai.filter(r => {
        const t = String(r.Timestamp || r.CreatedAt || "").substring(0, 10);
        return !t || t >= filters.tanggalMulai;
      });
    }
    if (filters.tanggalSelesai) {
      nilai = nilai.filter(r => {
        const t = String(r.Timestamp || r.CreatedAt || "").substring(0, 10);
        return !t || t <= filters.tanggalSelesai;
      });
    }

    // Urutkan nilai kronologis (lama → baru) agar Tugas 1, Tugas 2 berurutan
    nilai.sort(function(a, b) {
      const ta = String(a.Timestamp || a.CreatedAt || a.Tanggal || "");
      const tb = String(b.Timestamp || b.CreatedAt || b.Tanggal || "");
      return ta.localeCompare(tb);
    });

    /**
     * Per siswa + jenis: kumpulkan SEMUA skor (tidak digabung).
     * key siswa: ID atau Nama
     * bySiswaJenis[siswaKey][jenis] = [skor1, skor2, ...] urut waktu
     */
    const bySiswaJenis = {};
    const jenisFirstSeen = [];
    const jenisSeen = {};

    nilai.forEach(function(n) {
      const j = String(n.JenisPenilaian || n["Jenis Penilaian"] || "").trim();
      if (!j) return;
      const v = Number(n.Nilai);
      if (isNaN(v)) return;
      if (!jenisSeen[j]) {
        jenisSeen[j] = true;
        jenisFirstSeen.push(j);
      }
      const keys = [];
      if (n.SiswaID) keys.push("id:" + String(n.SiswaID));
      if (n.NamaSiswa) keys.push("nama:" + String(n.NamaSiswa));
      keys.forEach(function(k) {
        if (!bySiswaJenis[k]) bySiswaJenis[k] = {};
        if (!bySiswaJenis[k][j]) bySiswaJenis[k][j] = [];
        bySiswaJenis[k][j].push(v);
      });
    });

    // Hitung MAX jumlah entri per jenis di antara semua siswa
    // → Tugas muncul 3x pada siswa mana pun → 3 kolom: Tugas 1, Tugas 2, Tugas 3
    const maxPerJenis = {};
    jenisFirstSeen.forEach(function(j) { maxPerJenis[j] = 1; });
    Object.keys(bySiswaJenis).forEach(function(k) {
      const bag = bySiswaJenis[k];
      Object.keys(bag).forEach(function(j) {
        const n = bag[j].length;
        if (!maxPerJenis[j] || n > maxPerJenis[j]) maxPerJenis[j] = n;
      });
    });

    // Bangun daftar kolom: jika jenis hanya 1 kali → "Tugas"; jika >1 → "Tugas 1", "Tugas 2", ...
    // (header ganda T1|T1 seperti buku nilai juga didukung: label sama tanpa nomor jika preferLabelSame)
    const columns = []; // { jenis, index, label }
    jenisFirstSeen.forEach(function(j) {
      const maxN = maxPerJenis[j] || 1;
      for (let i = 0; i < maxN; i++) {
        let label = j;
        if (maxN > 1) {
          // Nama kolom: "Tugas 1", "Tugas 2" — atau "T1", "T1" jika label pendek
          label = j + " " + (i + 1);
        }
        columns.push({ jenis: j, index: i, label: label });
      }
    });

    if (!columns.length) {
      ["Tugas", "UH", "UTS", "UAS"].forEach(function(j) {
        columns.push({ jenis: j, index: 0, label: j });
      });
    }

    const getScoresForSiswa = function(s) {
      const bag =
        bySiswaJenis["id:" + String(s.ID)] ||
        bySiswaJenis["nama:" + String(s.Nama || "")] ||
        {};
      return columns.map(function(col) {
        const arr = bag[col.jenis] || [];
        if (col.index < arr.length) return arr[col.index];
        return null; // belum ada nilai ke-(index+1)
      });
    };

    const rows = siswa.map(function(s, i) {
      const scores = getScoresForSiswa(s);
      // Rata-rata: hanya dari nilai yang terisi (tidak memaksa 0 untuk slot kosong)
      // Agar lebih adil saat ada siswa yang belum ikut semua tugas.
      // Alternatif "termasuk 0": gunakan semua kolom. Ikuti permintaan tampilkan semua tugas:
      // rata-rata dari SEMUA kolom (kosong = 0) agar konsisten dengan format buku nilai sebelumnya.
      let sum = 0;
      let countForAvg = 0;
      scores.forEach(function(v) {
        if (v == null || v === "") {
          sum += 0;
          countForAvg++;
        } else {
          sum += Number(v);
          countForAvg++;
        }
      });
      const rata = countForAvg > 0 ? Math.round((sum / countForAvg) * 10) / 10 : 0;
      return {
        no: i + 1,
        nis: s.NIS || "",
        nama: s.Nama || "",
        scores: scores,
        rata: rata
      };
    });

    const pengaturan = {};
    getRawData(SHEET_NAMES.PENGATURAN).forEach(function(p) { pengaturan[p.Key] = p.Value; });
    const taAktif = (typeof getAktifTahunAjaran === "function") ? getAktifTahunAjaran() : null;

    var dataOut = {
      sekolah: pengaturan.nama_sekolah || "SIKAD DIGITAL",
      kelas: filters.kelas || "",
      mapel: filters.mapel || "—",
      tahunAjaran: (taAktif && taAktif.TahunAjaran) || pengaturan.tahun_ajaran_aktif || "",
      semester: (taAktif && taAktif.Semester) || pengaturan.semester_aktif || "",
      jenis: columns.map(function(c) { return c.label; }),
      columns: columns,
      rows: rows,
      totalSiswa: rows.length,
      dicetakOleh: auth.session.nama || "",
      dicetakPada: getNow()
    };
    attachPrintMeta(dataOut, filters);
    return { success: true, data: dataOut };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal menyiapkan cetak nilai: " + (e.message || String(e)) };
  }
}


function getBackupSummary(token) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const summary = [];
    Object.values(SHEET_NAMES).forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) {
        summary.push({ sheet: name, exists: false, rows: 0 });
        return;
      }
      const lastRow = Math.max(0, sheet.getLastRow() - 1);
      summary.push({ sheet: name, exists: true, rows: lastRow });
    });

    return {
      success: true,
      data: {
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl(),
        spreadsheetName: ss.getName(),
        timezone: ss.getSpreadsheetTimeZone(),
        generatedAt: getNow(),
        sheets: summary,
        catatan: "Untuk backup penuh, gunakan File → Make a copy pada Google Spreadsheet ini, atau File → Download → Microsoft Excel (.xlsx)."
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal membuat ringkasan backup." };
  }
}

// ====================== AUDIT LOG VIEWER ======================
function getAuditLogs(token, filters) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOG);
    if (!sheet) {
      // Pastikan sheet ada
      setupDatabase();
      sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOG);
    }
    if (!sheet) return { success: true, data: [], message: "Sheet audit belum tersedia." };

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 1) return { success: true, data: [] };

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());
    // Pola sama dengan modul lain: baris 2 s/d lastRow (inklusif)
    const data = sheet.getRange(2, 1, lastRow, lastCol).getValues();
    const tz = ss.getSpreadsheetTimeZone();

    // Hanya kolom ringkas — jangan kirim BeforeData/AfterData (bisa sangat besar → gagal di client)
    const lightKeys = ["ID", "Timestamp", "UserID", "UserName", "UserRole", "Action", "Module", "RecordID"];

    let rows = data.map(row => {
      const item = {};
      headers.forEach((h, i) => {
        if (lightKeys.indexOf(h) === -1) return;
        let v = row[i];
        if (v instanceof Date) {
          try { v = Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm:ss"); } catch (e) { v = String(v); }
        }
        item[h] = v == null ? "" : v;
      });
      return item;
    }).filter(r => r.ID && String(r.ID).trim() !== "");

    if (filters) {
      if (filters.action) rows = rows.filter(r => r.Action === filters.action);
      if (filters.module) rows = rows.filter(r => r.Module === filters.module);
      if (filters.userId) rows = rows.filter(r => r.UserID === filters.userId);
      if (filters.q) {
        const q = String(filters.q).toLowerCase();
        rows = rows.filter(r =>
          String(r.UserName || "").toLowerCase().includes(q) ||
          String(r.Action || "").toLowerCase().includes(q) ||
          String(r.Module || "").toLowerCase().includes(q) ||
          String(r.RecordID || "").toLowerCase().includes(q)
        );
      }
    }

    rows.sort((a, b) => String(b.Timestamp || "").localeCompare(String(a.Timestamp || "")));
    rows = rows.slice(0, 300);

    return { success: true, data: rows };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengambil audit log: " + (e.message || String(e)) };
  }
}

// ====================== SELF-TEST / HEALTH CHECK ======================
/**
 * Jalankan dari editor ATAU dari UI Admin untuk verifikasi integritas dasar.
 * Tidak mengubah data produksi (kecuali memastikan sheet ada via setupDatabase).
 */
function runSelfTest(token) {
  const results = [];
  const pass = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail || "" });

  try {
    // Auth
    if (token) {
      const auth = requireAuth(token, ["Admin"]);
      pass("Auth Admin", auth.ok, auth.ok ? "OK" : (auth.error && auth.error.message));
    } else {
      pass("Auth Admin", false, "Token tidak diberikan — partial test");
    }

    // Setup
    try {
      setupDatabase();
      pass("setupDatabase", true, "Sheets siap");
    } catch (e) {
      pass("setupDatabase", false, e.message);
    }

    // Semua sheet ada
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Object.values(SHEET_NAMES).forEach(name => {
      const sh = ss.getSheetByName(name);
      pass("Sheet " + name, !!sh, sh ? "ada" : "HILANG");
    });

    // Header ID di sheet utama
    ["DB_Siswa", "DB_Guru", "DB_Absensi", "DB_Jurnal", "DB_Nilai"].forEach(name => {
      const sh = ss.getSheetByName(name);
      if (!sh) return;
      const headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
      pass("Header ID " + name, headers[0] === "ID" || headers.indexOf("ID") >= 0, headers.slice(0, 5).join(", "));
    });

    // Admin default ada
    const users = getRawData(SHEET_NAMES.USERS);
    const admin = users.find(u => String(u.Email).toLowerCase() === "admin@sikad.local");
    pass("Admin default", !!admin, admin ? "ada" : "tidak ditemukan (mungkin sudah diganti)");

    // Password hashing konsisten
    const h1 = hashPassword("test");
    const h2 = hashPassword("test");
    pass("Hash stabil", h1 === h2 && h1.length === 64, "SHA-256 length=" + (h1 || "").length);

    // Validasi form kosong
    const errAbs = validateFormData(SHEET_NAMES.ABSENSI, {});
    pass("Validasi absensi kosong", errAbs.length > 0, errAbs.join("; "));

    // Session create/destroy
    const fakeUser = { ID: "TEST", Email: "t@t.com", Nama: "Test", Role: "Admin", GuruID: "" };
    const tok = createSession(fakeUser);
    const sess = getSession(tok);
    pass("Session create/read", !!sess && sess.userId === "TEST", tok ? "token ok" : "fail");
    destroySession(tok);
    pass("Session destroy", !getSession(tok), "sesi dihapus");

    // Rate limit function exists
    pass("Rate limit login", typeof checkLoginRateLimit === "function", "aktif");

    const failed = results.filter(r => !r.ok).length;
    return {
      success: true,
      message: failed === 0 ? "Semua tes lulus." : failed + " tes gagal.",
      passed: results.filter(r => r.ok).length,
      failed: failed,
      total: results.length,
      results: results,
      testedAt: getNow()
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Self-test error: " + e.message, results: results };
  }
}

// ====================== HELPER UNTUK TESTING ======================
function createDemoData() {
  // Hanya untuk development — jangan jalankan di produksi dengan data nyata
  const tokenResult = login("admin@sikad.local", "admin123");
  if (!tokenResult.success) return tokenResult;
  const token = tokenResult.token;

  // Tahun ajaran
  saveData(SHEET_NAMES.TAHUN_AJARAN, {
    TahunAjaran: "2025/2026",
    Semester: "Ganjil",
    TanggalMulai: "2025-07-14",
    TanggalSelesai: "2025-12-20",
    Status: "Aktif"
  }, token);

  // Kelas
  saveData(SHEET_NAMES.KELAS, { Nama: "VII A", Tingkat: "7", TahunAjaran: "2025/2026", Status: "Aktif" }, token);
  saveData(SHEET_NAMES.KELAS, { Nama: "VIII B", Tingkat: "8", TahunAjaran: "2025/2026", Status: "Aktif" }, token);

  // Mapel
  saveData(SHEET_NAMES.MAPEL, { Kode: "MTK", Nama: "Matematika", Kelompok: "Wajib", Status: "Aktif" }, token);
  saveData(SHEET_NAMES.MAPEL, { Kode: "BIN", Nama: "Bahasa Indonesia", Kelompok: "Wajib", Status: "Aktif" }, token);

  return { success: true, message: "Demo data dibuat. Login: admin@sikad.local / admin123" };
}

// ==============================================================================
// SIKAD DIGITAL — EXTENSIONS (Redesign Stage 2+)
// Fitur baru: Global Search, Pengumuman, Agenda, Notifikasi, Kenaikan Kelas massal,
// Monitoring Guru, Dark Mode preference, improved security helpers
// Semua fungsi lama tetap utuh. Sheet baru ditambahkan secara idempotent.
// ==============================================================================

// Extend SHEET_NAMES (safe — only adds if not present at runtime via setup)
const SHEET_NAMES_EXT = {
  PENGUMUMAN: "DB_Pengumuman",
  AGENDA: "DB_Agenda",
  NOTIFIKASI: "DB_Notifikasi"
};

const SHEET_SCHEMAS_EXT = {
  [SHEET_NAMES_EXT.PENGUMUMAN]: [
    "ID", "Judul", "Isi", "TargetRole", "TanggalMulai", "TanggalSelesai",
    "Status", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES_EXT.AGENDA]: [
    "ID", "Judul", "Deskripsi", "TanggalMulai", "TanggalSelesai", "Jenis",
    "Lokasi", "Status", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted"
  ],
  [SHEET_NAMES_EXT.NOTIFIKASI]: [
    "ID", "UserID", "Judul", "Pesan", "Tipe", "Link", "IsRead",
    "CreatedAt", "IsDeleted"
  ]
};

// Merge into main constants at runtime
(function() {
  Object.keys(SHEET_NAMES_EXT).forEach(k => {
    if (!SHEET_NAMES[k]) SHEET_NAMES[k] = SHEET_NAMES_EXT[k];
  });
  Object.keys(SHEET_SCHEMAS_EXT).forEach(k => {
    if (!SHEET_SCHEMAS[k]) SHEET_SCHEMAS[k] = SHEET_SCHEMAS_EXT[k];
  });
  Object.values(SHEET_NAMES_EXT).forEach(n => {
    if (ALLOWED_SHEETS.indexOf(n) === -1) ALLOWED_SHEETS.push(n);
  });
})();

/**
 * Dipanggil dari setupDatabase — pastikan sheet baru ada
 */
function ensureExtendedSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_SCHEMAS_EXT).forEach(name => {
    setupSheetHeader(ss, name, SHEET_SCHEMAS_EXT[name]);
  });
}


// ====================== GLOBAL SEARCH ======================
function globalSearch(token, query, limit) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    query = String(query || "").trim().toLowerCase();
    if (query.length < 2) return { success: true, data: [] };
    limit = Math.min(parseInt(limit, 10) || 20, 40);

    const results = [];
    const role = auth.session.role;
    const guruId = auth.session.guruId;

    // Siswa
    if (role === "Admin" || role === "Kepala Sekolah" || role === "Guru") {
      getRawData(SHEET_NAMES.SISWA).filter(s => {
        const hay = ((s.Nama||"") + " " + (s.NIS||"") + " " + (s.NISN||"") + " " + (s.Kelas||"")).toLowerCase();
        return hay.indexOf(query) !== -1;
      }).slice(0, 8).forEach(s => {
        results.push({ type: "siswa", id: s.ID, title: s.Nama, subtitle: (s.NIS || "") + " • " + (s.Kelas || ""), module: "siswa" });
      });
    }

    // Guru
    if (role === "Admin" || role === "Kepala Sekolah") {
      getRawData(SHEET_NAMES.GURU).filter(g => {
        const hay = ((g.Nama||"") + " " + (g.NIP||"") + " " + (g.Email||"")).toLowerCase();
        return hay.indexOf(query) !== -1;
      }).slice(0, 5).forEach(g => {
        results.push({ type: "guru", id: g.ID, title: g.Nama, subtitle: g.NIP || g.Email || "", module: "guru" });
      });
    }

    // Kelas
    getRawData(SHEET_NAMES.KELAS).filter(k => (k.Nama||"").toLowerCase().indexOf(query) !== -1)
      .slice(0, 5).forEach(k => {
        results.push({ type: "kelas", id: k.ID, title: k.Nama, subtitle: (k.TahunAjaran || "") + " • " + (k.Tingkat || ""), module: "kelas" });
      });

    // Mapel
    getRawData(SHEET_NAMES.MAPEL).filter(m => ((m.Nama||"") + " " + (m.Kode||"")).toLowerCase().indexOf(query) !== -1)
      .slice(0, 5).forEach(m => {
        results.push({ type: "mapel", id: m.ID, title: m.Nama, subtitle: m.Kode || "", module: "mapel" });
      });

    // Jurnal (role-aware)
    let jurnal = getRawData(SHEET_NAMES.JURNAL);
    if (role === "Guru") jurnal = jurnal.filter(r => r.GuruID === guruId || r.CreatedBy === auth.session.userId);
    jurnal.filter(j => ((j.MateriPokok||"") + " " + (j.Kelas||"") + " " + (j.MataPelajaran||"")).toLowerCase().indexOf(query) !== -1)
      .slice(0, 5).forEach(j => {
        results.push({ type: "jurnal", id: j.ID, title: j.MateriPokok || "Jurnal", subtitle: (j.Tanggal||"") + " • " + (j.Kelas||"") + " / " + (j.MataPelajaran||""), module: "jurnal" });
      });

    return { success: true, data: results.slice(0, limit) };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal pencarian." };
  }
}

// ====================== PENGUMUMAN ======================
function getPengumuman(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    let data = getRawData(SHEET_NAMES.PENGUMUMAN || "DB_Pengumuman");
    const role = auth.session.role;
    const today = Utilities.formatDate(new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "yyyy-MM-dd");
    data = data.filter(p => {
      if (p.Status && p.Status !== "Aktif") return false;
      if (p.TargetRole && p.TargetRole !== "Semua" && p.TargetRole !== role) return false;
      if (p.TanggalMulai && p.TanggalMulai > today) return false;
      if (p.TanggalSelesai && p.TanggalSelesai < today) return false;
      return true;
    });
    if (filters && filters.includeAll && role === "Admin") {
      data = getRawData(SHEET_NAMES.PENGUMUMAN || "DB_Pengumuman");
    }
    data.sort((a, b) => String(b.CreatedAt || "").localeCompare(String(a.CreatedAt || "")));
    return { success: true, data: data };
  } catch (e) {
    return { success: false, message: "Gagal mengambil pengumuman." };
  }
}

function savePengumuman(formData, token) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    if (!formData || !String(formData.Judul || "").trim()) {
      return { success: false, message: "Judul wajib diisi." };
    }
    formData.Judul = String(formData.Judul).trim();
    formData.Isi = formData.Isi != null ? String(formData.Isi) : "";
    if (!formData.Status) formData.Status = "Aktif";
    if (!formData.TargetRole) formData.TargetRole = "Semua";
    ensureExtendedSheets();
    const sheetName = SHEET_NAMES.PENGUMUMAN || "DB_Pengumuman";
    if (ALLOWED_SHEETS.indexOf(sheetName) === -1) ALLOWED_SHEETS.push(sheetName);
    return saveData(sheetName, formData, token);
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal simpan pengumuman: " + e.message };
  }
}

// ====================== AGENDA / KALENDER ======================
/**
 * Pengumuman + Agenda yang masih dalam masa berlaku (untuk popup login).
 * Filter: Status Aktif, TanggalMulai <= hari ini <= TanggalSelesai (jika diisi).
 */
function getPopupInfoAktif(token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    const role = auth.session.role;
    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    const today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

    // Pengumuman
    let peng = [];
    try {
      peng = getRawData(SHEET_NAMES.PENGUMUMAN || "DB_Pengumuman").filter(function(p) {
        if (p.Status && String(p.Status) !== "Aktif") return false;
        if (p.TargetRole && p.TargetRole !== "Semua" && p.TargetRole !== role) return false;
        const mulai = String(p.TanggalMulai || "").substring(0, 10);
        const selesai = String(p.TanggalSelesai || "").substring(0, 10);
        if (mulai && mulai > today) return false;
        if (selesai && selesai < today) return false;
        return true;
      });
    } catch (e) { peng = []; }

    // Agenda aktif dalam rentang tanggal
    let agenda = [];
    try {
      agenda = getRawData(SHEET_NAMES.AGENDA || "DB_Agenda").filter(function(a) {
        if (a.Status && String(a.Status) !== "Aktif") return false;
        const mulai = String(a.TanggalMulai || "").substring(0, 10);
        const selesai = String(a.TanggalSelesai || a.TanggalMulai || "").substring(0, 10);
        if (mulai && mulai > today) return false;
        if (selesai && selesai < today) return false;
        return true;
      });
    } catch (e) { agenda = []; }

    peng.sort(function(a, b) {
      return String(b.CreatedAt || "").localeCompare(String(a.CreatedAt || ""));
    });
    agenda.sort(function(a, b) {
      return String(a.TanggalMulai || "").localeCompare(String(b.TanggalMulai || ""));
    });

    const items = [];
    peng.forEach(function(p) {
      items.push({
        tipe: "pengumuman",
        id: p.ID,
        judul: p.Judul || "Pengumuman",
        isi: p.Isi || "",
        tanggalMulai: p.TanggalMulai || "",
        tanggalSelesai: p.TanggalSelesai || "",
        meta: p.TargetRole || "Semua"
      });
    });
    agenda.forEach(function(a) {
      items.push({
        tipe: "agenda",
        id: a.ID,
        judul: a.Judul || "Agenda",
        isi: a.Deskripsi || "",
        tanggalMulai: a.TanggalMulai || "",
        tanggalSelesai: a.TanggalSelesai || a.TanggalMulai || "",
        meta: (a.Jenis || "Kegiatan") + (a.Lokasi ? " · " + a.Lokasi : "")
      });
    });

    return {
      success: true,
      data: {
        today: today,
        items: items,
        total: items.length
      }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal memuat info popup: " + (e.message || String(e)) };
  }
}

function getAgenda(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    let data = getRawData(SHEET_NAMES.AGENDA || "DB_Agenda");
    if (filters) {
      if (filters.bulan) { // YYYY-MM
        data = data.filter(a => String(a.TanggalMulai || "").startsWith(filters.bulan));
      }
      if (filters.jenis) data = data.filter(a => a.Jenis === filters.jenis);
      if (filters.status) data = data.filter(a => a.Status === filters.status);
    }
    data.sort((a, b) => String(a.TanggalMulai || "").localeCompare(String(b.TanggalMulai || "")));
    return { success: true, data: data };
  } catch (e) {
    return { success: false, message: "Gagal mengambil agenda." };
  }
}

function saveAgenda(formData, token) {
  try {
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;
    if (!formData || !String(formData.Judul || "").trim()) {
      return { success: false, message: "Judul wajib diisi." };
    }
    if (!formData.TanggalMulai) {
      return { success: false, message: "Tanggal mulai wajib." };
    }
    formData.Judul = String(formData.Judul).trim();
    if (!formData.Status) formData.Status = "Aktif";
    if (!formData.Jenis) formData.Jenis = "Kegiatan";
    ensureExtendedSheets();
    const sheetName = SHEET_NAMES.AGENDA || "DB_Agenda";
    if (ALLOWED_SHEETS.indexOf(sheetName) === -1) ALLOWED_SHEETS.push(sheetName);
    return saveData(sheetName, formData, token);
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal simpan agenda: " + e.message };
  }
}

// ====================== NOTIFIKASI ======================
function getNotifikasi(token, filters) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;
    let data = getRawData(SHEET_NAMES.NOTIFIKASI || "DB_Notifikasi");
    data = data.filter(n => n.UserID === auth.session.userId || n.UserID === "ALL");
    if (filters && filters.unreadOnly) data = data.filter(n => String(n.IsRead).toUpperCase() !== "TRUE");
    data.sort((a, b) => String(b.CreatedAt || "").localeCompare(String(a.CreatedAt || "")));
    return { success: true, data: data.slice(0, 50), unread: data.filter(n => String(n.IsRead).toUpperCase() !== "TRUE").length };
  } catch (e) {
    return { success: false, message: "Gagal notifikasi." };
  }
}

function markNotifikasiRead(token, ids) {
  const auth = requireAuth(token);
  if (!auth.ok) return auth.error;
  if (!ids) ids = [];
  if (!Array.isArray(ids)) ids = [ids];
  ids.forEach(id => {
    updateFieldById(SHEET_NAMES.NOTIFIKASI || "DB_Notifikasi", id, { IsRead: "TRUE" });
  });
  return { success: true, message: "Ditandai dibaca." };
}

function createNotifikasi(userId, judul, pesan, tipe, link) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.NOTIFIKASI || "DB_Notifikasi");
    if (!sheet) {
      ensureExtendedSheets();
      sheet = ss.getSheetByName(SHEET_NAMES.NOTIFIKASI || "DB_Notifikasi");
    }
    if (!sheet) return;
    sheet.appendRow([
      generateId("NTF"), userId || "ALL", judul || "", pesan || "", tipe || "info",
      link || "", "FALSE", getNow(), "FALSE"
    ]);
  } catch (e) { console.error(e); }
}

// ====================== MONITORING GURU ======================
function getMonitoringGuru(token, filters) {
  try {
    const auth = requireAuth(token, ["Admin", "Kepala Sekolah"]);
    if (!auth.ok) return auth.error;

    const guruList = getRawData(SHEET_NAMES.GURU).filter(g => g.Status === "Aktif" || !g.Status);
    let jurnal = getRawData(SHEET_NAMES.JURNAL);
    let absensi = getRawData(SHEET_NAMES.ABSENSI);
    let nilai = getRawData(SHEET_NAMES.NILAI);
    let tugas = getRawData(SHEET_NAMES.TUGAS_MENGAJAR).filter(t => t.Status === "Aktif" || !t.Status);

    if (filters && filters.tanggalMulai) {
      jurnal = jurnal.filter(j => j.Tanggal >= filters.tanggalMulai);
      absensi = absensi.filter(a => a.Tanggal >= filters.tanggalMulai);
    }
    if (filters && filters.tanggalSelesai) {
      jurnal = jurnal.filter(j => j.Tanggal <= filters.tanggalSelesai);
      absensi = absensi.filter(a => a.Tanggal <= filters.tanggalSelesai);
    }

    const rows = guruList.map(g => {
      const j = jurnal.filter(x => x.GuruID === g.ID);
      const a = absensi.filter(x => x.GuruID === g.ID);
      const n = nilai.filter(x => x.GuruID === g.ID);
      const t = tugas.filter(x => x.GuruID === g.ID);
      return {
        guruId: g.ID,
        nama: g.Nama,
        nip: g.NIP || "",
        email: g.Email || "",
        jumlahTugas: t.length,
        jumlahJurnal: j.length,
        jumlahAbsensi: a.length,
        jumlahNilai: n.length,
        lastJurnal: j.length ? j.map(x => x.Tanggal).sort().reverse()[0] : "",
        lastAbsensi: a.length ? a.map(x => x.Tanggal).sort().reverse()[0] : ""
      };
    });

    rows.sort((a, b) => (b.jumlahJurnal + b.jumlahAbsensi) - (a.jumlahJurnal + a.jumlahAbsensi));
    return { success: true, data: rows };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal monitoring guru." };
  }
}

// ====================== KENAIKAN KELAS MASSAL ======================
function kenaikanKelasMassal(payload, token) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const auth = requireAuth(token, ["Admin"]);
    if (!auth.ok) return auth.error;

    if (!payload || !payload.kelasAsalId || !Array.isArray(payload.siswaIds) || !payload.siswaIds.length) {
      return { success: false, message: "Payload kenaikan kelas tidak lengkap." };
    }

    const mode = String(payload.mode || "naik").toLowerCase(); // naik | lulus
    const kelasList = getRawData(SHEET_NAMES.KELAS);
    const kelasAsal = kelasList.find(k => k.ID === payload.kelasAsalId);

    let ok = 0, fail = 0;
    const errors = [];

    if (mode === "lulus") {
      // Tandai siswa Lulus (tidak wajib kelas tujuan)
      payload.siswaIds.forEach(function(sid) {
        try {
          const siswaList = getRawData(SHEET_NAMES.SISWA, true);
          const siswa = siswaList.find(function(s) { return String(s.ID) === String(sid); });
          if (!siswa) { fail++; errors.push("Siswa tidak ditemukan: " + sid); return; }

          let riwayat = [];
          try { if (siswa.RiwayatKelas) riwayat = JSON.parse(siswa.RiwayatKelas); } catch (e) { riwayat = []; }
          riwayat.push({
            dari: siswa.Kelas || "",
            dariId: siswa.KelasID || "",
            ke: "LULUS",
            keId: "",
            status: "Lulus",
            tanggal: getNow(),
            oleh: auth.session.nama
          });

          const form = {
            ID: sid,
            Status: "Lulus",
            // Biarkan kelas terakhir tetap tercatat sebagai referensi
            Kelas: siswa.Kelas || "",
            KelasID: siswa.KelasID || "",
            RiwayatKelas: JSON.stringify(riwayat)
          };
          const res = saveData(SHEET_NAMES.SISWA, form, token);
          if (res.success) {
            ok++;
            writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "LULUS_SISWA", SHEET_NAMES.SISWA, sid,
              { Status: siswa.Status, Kelas: siswa.Kelas }, { Status: "Lulus" });
          } else {
            fail++;
            errors.push(res.message || ("Gagal lulus " + sid));
          }
        } catch (e) {
          fail++;
          errors.push(String(e.message || e));
        }
      });

      writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "LULUS_MASSAL", SHEET_NAMES.SISWA, "", null, {
        kelasAsal: kelasAsal ? kelasAsal.Nama : payload.kelasAsalId,
        ok: ok, fail: fail
      });

      return {
        success: true,
        message: "Proses kelulusan selesai. Berhasil: " + ok + ", Gagal: " + fail,
        detail: { ok: ok, fail: fail, errors: errors.slice(0, 10), mode: "lulus" }
      };
    }

    // Mode naik kelas
    if (!payload.kelasTujuanId) {
      return { success: false, message: "Kelas tujuan wajib untuk kenaikan kelas." };
    }
    const kelasTujuan = kelasList.find(k => k.ID === payload.kelasTujuanId);
    if (!kelasTujuan) return { success: false, message: "Kelas tujuan tidak ditemukan." };

    payload.siswaIds.forEach(sid => {
      const res = pindahKelasSiswa(sid, payload.kelasTujuanId, kelasTujuan.Nama, token);
      if (res.success) ok++;
      else { fail++; errors.push(res.message); }
    });

    writeAuditLog(auth.session.userId, auth.session.nama, auth.session.role, "KENAIKAN_KELAS_MASSAL", SHEET_NAMES.SISWA, "", null, {
      kelasAsal: kelasAsal ? kelasAsal.Nama : payload.kelasAsalId,
      kelasTujuan: kelasTujuan.Nama,
      ok: ok, fail: fail
    });

    return {
      success: true,
      message: "Kenaikan kelas selesai. Berhasil: " + ok + ", Gagal: " + fail,
      detail: { ok: ok, fail: fail, errors: errors.slice(0, 10), mode: "naik" }
    };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal kenaikan kelas massal." };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ====================== DASHBOARD WALI KELAS ======================

function isGuruWaliKelas(guruId, userId) {
  if (!guruId && !userId) return false;
  const kelas = getRawData(SHEET_NAMES.KELAS).filter(function(k) {
    return String(k.Status || "Aktif").toLowerCase() !== "nonaktif";
  });
  return kelas.some(function(k) {
    return (guruId && String(k.WaliKelasID) === String(guruId)) ||
           (userId && String(k.WaliKelasID) === String(userId));
  });
}

function getWaliKelasDashboard(token) {
  try {
    const auth = requireAuth(token);
    if (!auth.ok) return auth.error;

    // Cari kelas yang diampu sebagai wali
    const kelasList = getRawData(SHEET_NAMES.KELAS).filter(k => {
      if (k.Status === "Nonaktif") return false;
      return k.WaliKelasID === auth.session.guruId || k.WaliKelasID === auth.session.userId;
    });

    if (!kelasList.length) {
      return { success: true, data: { isWali: false, kelas: [], message: "Anda belum ditetapkan sebagai wali kelas." } };
    }

    const result = kelasList.map(k => {
      const siswa = getRawData(SHEET_NAMES.SISWA).filter(s =>
        (s.KelasID === k.ID || s.Kelas === k.Nama) && (s.Status === "Aktif" || !s.Status)
      );
      const absensi = getRawData(SHEET_NAMES.ABSENSI).filter(a => a.KelasID === k.ID || a.Kelas === k.Nama);
      const rekap = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Total: absensi.length };
      absensi.forEach(a => { if (rekap.hasOwnProperty(a.StatusAbsen)) rekap[a.StatusAbsen]++; });
      rekap.PersentaseHadir = rekap.Total > 0 ? Math.round((rekap.Hadir / rekap.Total) * 1000) / 10 : 0;

      const catatan = getRawData(SHEET_NAMES.CATATAN_SISWA).filter(c =>
        siswa.some(s => s.ID === c.SiswaID)
      );

      return {
        kelas: k,
        totalSiswa: siswa.length,
        siswa: siswa,
        rekapAbsensi: rekap,
        totalCatatan: catatan.length
      };
    });

    return { success: true, data: { isWali: true, kelas: result } };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal dashboard wali kelas." };
  }
}

// ====================== ENHANCED DASHBOARD (role-aware extras) ======================
function getDashboardDataEnhanced(token) {
  const base = getDashboardData(token);
  if (!base.success) return base;

  try {
    const auth = requireAuth(token);
    if (!auth.ok) return base;

    // Jadwal hari ini
    const hari = getHariIni();
    let jadwal = getRawData(SHEET_NAMES.JADWAL).filter(j => j.Hari === hari && (j.Status === "Aktif" || !j.Status));
    if (auth.session.role === "Guru") {
      jadwal = jadwal.filter(j => j.GuruID === auth.session.guruId);
    }
    jadwal.sort((a, b) => timeToMinutes(a.JamMulai) - timeToMinutes(b.JamMulai));

    // Siswa perlu perhatian (alpha tinggi)
    let absensi = getRawData(SHEET_NAMES.ABSENSI);
    if (auth.session.role === "Guru") {
      absensi = absensi.filter(r => r.GuruID === auth.session.guruId);
    }
    const alphaCount = {};
    absensi.filter(a => a.StatusAbsen === "Alpha").forEach(a => {
      const key = a.SiswaID || a.NamaSiswa;
      if (!key) return;
      if (!alphaCount[key]) alphaCount[key] = { nama: a.NamaSiswa, kelas: a.Kelas, count: 0 };
      alphaCount[key].count++;
    });
    const perluPerhatian = Object.values(alphaCount).filter(x => x.count >= 3).sort((a, b) => b.count - a.count).slice(0, 8);

    // Pengumuman aktif
    const pengRes = getPengumuman(token, {});
    const pengumuman = pengRes.success ? (pengRes.data || []).slice(0, 5) : [];

    // Notifikasi unread
    const notifRes = getNotifikasi(token, { unreadOnly: true });
    const unreadNotif = notifRes.success ? (notifRes.unread || 0) : 0;

    base.data.jadwalHariIni = jadwal.slice(0, 8);
    base.data.siswaPerluPerhatian = perluPerhatian;
    base.data.pengumuman = pengumuman;
    base.data.unreadNotif = unreadNotif;
    base.data.hariIni = hari;
    base.data.role = auth.session.role;

    return base;
  } catch (e) {
    console.error(e);
    return base;
  }
}

// ====================== PREFERENCE (theme) ======================
function saveUserPreference(token, key, value) {
  const auth = requireAuth(token);
  if (!auth.ok) return auth.error;
  // Simpan di PENGATURAN dengan prefix user
  const prefKey = "pref_" + auth.session.userId + "_" + key;
  return savePengaturan(prefKey, String(value), token);
}

function getUserPreference(token, key) {
  const auth = requireAuth(token);
  if (!auth.ok) return auth.error;
  const prefKey = "pref_" + auth.session.userId + "_" + key;
  const list = getRawData(SHEET_NAMES.PENGATURAN);
  const found = list.find(p => p.Key === prefKey);
  return { success: true, value: found ? found.Value : null };
}

