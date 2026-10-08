const SPREADSHEET_ID='1W-gTVnlCTgEDYyC_dHJnnhxi8SAXcTu-TPvwHejRekY';
const UNIT='ULP Empang';
const SHEET_NAME='Laporan_Sosialisasi';
const HEADERS=['Timestamp','Nama Petugas','Unit','Hari','Tanggal','Lokasi','Keterangan','Foto'];

function doGet(){
  ensureDatabase_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sosialisasi Bahaya Listrik - ULP Empang')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupDatabase(){
  ensureDatabase_();
  return 'Database siap';
}

function ensureDatabase_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName(SHEET_NAME);
  if(!sh) sh=ss.insertSheet(SHEET_NAME);
  const firstRow=sh.getRange(1,1,1,HEADERS.length).getValues()[0];
  const same=HEADERS.every((h,i)=>String(firstRow[i]||'').trim()===h);
  if(!same){
    const empty=sh.getLastRow()===0 || sh.getDataRange().isBlank();
    if(empty){
      sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    }else{
      // Only repair the header row; never delete existing reports.
      sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    }
  }
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold');
  sh.autoResizeColumns(1,HEADERS.length);
  return sh;
}

function saveReport(data){
  if(!data || !String(data.nama||'').trim()) throw new Error('Nama Petugas wajib diisi.');
  if(!String(data.lokasi||'').trim()) throw new Error('Lokasi wajib diisi.');
  if(!String(data.keterangan||'').trim()) throw new Error('Keterangan wajib diisi.');
  if(!data.photoBase64) throw new Error('Foto wajib diisi.');

  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh=ensureDatabase_();
  const now=new Date();
  const tz=ss.getSpreadsheetTimeZone()||'Asia/Makassar';
  const hari=Utilities.formatDate(now,tz,'EEEE');
  const tanggal=Utilities.formatDate(now,tz,'dd-MM-yyyy');
  const folder=getFolder_('SosialisasiK3L_Foto');
  const bytes=Utilities.base64Decode(String(data.photoBase64).split(',').pop());
  const name='Sosialisasi_'+Utilities.formatDate(now,tz,'yyyyMMdd_HHmmss')+'.jpg';
  const file=folder.createFile(Utilities.newBlob(bytes,data.mimeType||'image/jpeg',name));
  sh.appendRow([now,String(data.nama).trim(),UNIT,hari,tanggal,String(data.lokasi).trim(),String(data.keterangan).trim(),file.getUrl()]);
  return {ok:true,hari,tanggal,photoUrl:file.getUrl()};
}

function getReports(){
  const sh=ensureDatabase_();
  if(sh.getLastRow()<2) return [];
  return sh.getDataRange().getValues().slice(1).map(r=>({
    timestamp:r[0],nama:r[1],unit:r[2],hari:r[3],tanggal:r[4],
    lokasi:r[5],keterangan:r[6],foto:r[7]
  }));
}

function getFolder_(name){
  const i=DriveApp.getFoldersByName(name);
  return i.hasNext()?i.next():DriveApp.createFolder(name);
}