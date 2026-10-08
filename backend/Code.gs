const SPREADSHEET_ID = '1W-gTVnlCTgEDYyC_dHJnnhxi8SAXcTu-TPvwHejRekY';
const UNIT = 'ULP Empang';
const SHEET_NAME = 'Laporan_Sosialisasi';

const HEADERS = [
  'ID','Timestamp','Nama Petugas','Unit','Hari',
  'Tanggal','Jam','Lokasi','Keterangan','Foto URL','Status'
];

function doGet() {
  ensureDatabase_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sosialisasi K3L - ULP Empang')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupDatabase() {
  ensureDatabase_();
  return 'Database Sosialisasi K3L siap digunakan.';
}

function ensureDatabase_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  const firstRow = sh.getRange(1,1,1,HEADERS.length).getValues()[0];
  const headerBenar = HEADERS.every((h,i) => String(firstRow[i] || '').trim() === h);

  if (!headerBenar) {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  }

  sh.setFrozenRows(1);
  sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold');
  return sh;
}

function saveReport(data) {
  if (!data || !String(data.nama || '').trim()) throw new Error('Nama Petugas wajib diisi.');
  if (!String(data.lokasi || '').trim()) throw new Error('Lokasi kegiatan wajib diisi.');
  if (!String(data.keterangan || '').trim()) throw new Error('Keterangan wajib diisi.');
  if (!data.photoBase64) throw new Error('Foto dokumentasi wajib diisi.');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ensureDatabase_();
  const now = new Date();
  const timezone = ss.getSpreadsheetTimeZone() || 'Asia/Makassar';

  const hari = Utilities.formatDate(now, timezone, 'EEEE');
  const tanggal = Utilities.formatDate(now, timezone, 'dd-MM-yyyy');
  const jam = Utilities.formatDate(now, timezone, 'HH:mm:ss');

  const lastRow = sh.getLastRow();
  let id = 1;
  if (lastRow >= 2) {
    const lastId = sh.getRange(lastRow,1).getValue();
    if (lastId !== '' && !isNaN(lastId)) id = Number(lastId) + 1;
  }

  const folder = getFolder_('SosialisasiK3L_Foto');
  const base64 = String(data.photoBase64).split(',').pop();
  const bytes = Utilities.base64Decode(base64);
  const ext = String(data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
  const namaFile = 'SosialisasiK3L_' + String(id).padStart(4,'0') + '_' +
    Utilities.formatDate(now, timezone, 'yyyyMMdd_HHmmss') + '.' + ext;

  const file = folder.createFile(
    Utilities.newBlob(bytes, data.mimeType || 'image/jpeg', namaFile)
  );

  sh.appendRow([
    id, now, String(data.nama).trim(), UNIT, hari, tanggal, jam,
    String(data.lokasi).trim(), String(data.keterangan).trim(),
    file.getUrl(), 'DONE'
  ]);

  return {ok:true,id:id,hari:hari,tanggal:tanggal,jam:jam,status:'DONE',photoUrl:file.getUrl()};
}

function getReports() {
  const sh = ensureDatabase_();
  if (sh.getLastRow() < 2) return [];

  const values = sh.getDataRange().getValues();
  return values.slice(1).map(function(row) {
    return {
      id: row[0],
      timestamp: row[1] instanceof Date ? row[1].toISOString() : String(row[1] || ''),
      nama: String(row[2] || ''),
      unit: String(row[3] || ''),
      hari: String(row[4] || ''),
      tanggal: String(row[5] || ''),
      jam: String(row[6] || ''),
      lokasi: String(row[7] || ''),
      keterangan: String(row[8] || ''),
      foto: String(row[9] || ''),
      status: String(row[10] || '')
    };
  });
}

function getDashboardData() {
  const reports = getReports();
  const now = new Date();
  const tz = SpreadsheetApp.openById(SPREADSHEET_ID).getSpreadsheetTimeZone() || 'Asia/Makassar';
  const today = Utilities.formatDate(now,tz,'dd-MM-yyyy');
  const month = Utilities.formatDate(now,tz,'MM-yyyy');

  const todayReports = reports.filter(r => r.tanggal === today);
  const monthReports = reports.filter(r => String(r.tanggal).slice(3) === month);

  const petugas = [...new Set(reports.map(r => r.nama).filter(Boolean))];
  const lokasi = [...new Set(reports.map(r => r.lokasi).filter(Boolean))];

  const byPetugas = {};
  const byTanggal = {};
  const byLokasi = {};

  reports.forEach(r => {
    byPetugas[r.nama] = (byPetugas[r.nama] || 0) + 1;
    byTanggal[r.tanggal] = (byTanggal[r.tanggal] || 0) + 1;
    byLokasi[r.lokasi] = (byLokasi[r.lokasi] || 0) + 1;
  });

  return {
    total: reports.length,
    today: todayReports.length,
    month: monthReports.length,
    petugas: petugas.length,
    lokasi: lokasi.length,
    done: reports.filter(r => r.status === 'DONE').length,
    recent: reports.slice(-10).reverse(),
    byPetugas: byPetugas,
    byTanggal: byTanggal,
    byLokasi: byLokasi
  };
}

function getFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}