const SPREADSHEET_ID = '1W-gTVnlCTgEDYyC_dHJnnhxi8SAXcTu-TPvwHejRekY';
const APP_NAME = 'Sosialisasi Bahaya Listrik';
const UNIT = 'PLN ULP Empang';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = {
    'Laporan_Sosialisasi': ['ID','Timestamp','Nama Petugas','Unit','Hari','Tanggal','Jam','Lokasi','Keterangan','Foto URL','Status'],
    'Materi': ['ID','Judul','Kategori','Isi','Urutan','Aktif'],
    'Kuis': ['ID','Pertanyaan','Opsi A','Opsi B','Opsi C','Opsi D','Jawaban','Aktif'],
    'Peserta_Kuis': ['Timestamp','Nama','Nilai','Total','Persentase'],
    'Pengaturan': ['Kunci','Nilai']
  };
  Object.keys(sheets).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(sheets[name]);
    sh.getRange(1,1,1,sheets[name].length).setFontWeight('bold');
  });
  if (ss.getSheetByName('Pengaturan').getLastRow() === 1) {
    ss.getSheetByName('Pengaturan').appendRow(['UNIT', UNIT]);
  }
  return 'Database siap digunakan';
}

function getData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const laporan = readSheet_(ss.getSheetByName('Laporan_Sosialisasi'));
  const materi = readSheet_(ss.getSheetByName('Materi')).filter(r => String(r.Aktif).toLowerCase() !== 'false');
  const kuis = readSheet_(ss.getSheetByName('Kuis')).filter(r => String(r.Aktif).toLowerCase() !== 'false');
  return {unit: UNIT, laporan, materi, kuis};
}

function saveReport(data) {
  if (!data || !String(data.nama || '').trim()) throw new Error('Nama petugas wajib diisi.');
  if (!String(data.keterangan || '').trim()) throw new Error('Keterangan wajib diisi.');
  if (!data.photoBase64) throw new Error('Foto kegiatan wajib diunggah.');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('Laporan_Sosialisasi');
  if (!sh) { setupDatabase(); sh = ss.getSheetByName('Laporan_Sosialisasi'); }

  const now = new Date();
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Makassar';
  const id = Utilities.getUuid().slice(0,8).toUpperCase();
  let photoUrl = '';

  try {
    const folder = getOrCreateFolder_('SosialisasiK3L_Foto');
    const bytes = Utilities.base64Decode(String(data.photoBase64).split(',').pop());
    const blob = Utilities.newBlob(bytes, data.mimeType || 'image/jpeg', id + '_' + sanitize_(data.nama) + '.jpg');
    const file = folder.createFile(blob);
    photoUrl = file.getUrl();
  } catch (e) {
    throw new Error('Upload foto gagal: ' + e.message);
  }

  const hari = Utilities.formatDate(now, tz, 'EEEE');
  const tanggal = Utilities.formatDate(now, tz, 'dd-MM-yyyy');
  const jam = Utilities.formatDate(now, tz, 'HH:mm:ss');
  sh.appendRow([id, now, data.nama, UNIT, hari, tanggal, jam, data.lokasi || '', data.keterangan, photoUrl, 'Terkirim']);
  return {ok:true, id, hari, tanggal, jam, photoUrl};
}

function saveQuizResult(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName('Peserta_Kuis') || ss.insertSheet('Peserta_Kuis');
  if (sh.getLastRow() === 0) sh.appendRow(['Timestamp','Nama','Nilai','Total','Persentase']);
  sh.appendRow([new Date(), data.nama || 'Anonim', Number(data.nilai||0), Number(data.total||0), Number(data.persentase||0)]);
  return {ok:true};
}

function readSheet_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const heads = values.shift();
  return values.map(row => {
    const o = {};
    heads.forEach((h,i) => {
      let v = row[i];
      if (v instanceof Date) v = v.toISOString();
      o[h] = v;
    });
    return o;
  });
}

function getOrCreateFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function sanitize_(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,40);
}
