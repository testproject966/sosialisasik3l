const SPREADSHEET_ID='1W-gTVnlCTgEDYyC_dHJnnhxi8SAXcTu-TPvwHejRekY';
const UNIT='ULP Empang';

function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('Sosialisasi Bahaya Listrik').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
function setupDatabase(){
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 let sh=ss.getSheets()[0];
 sh.setName('Laporan_Sosialisasi');
 sh.clear();
 sh.appendRow(['Timestamp','Nama Petugas','Unit','Hari','Tanggal','Lokasi','Keterangan','Foto']);
 sh.getRange(1,1,1,8).setFontWeight('bold');
 return 'Database siap';
}
function saveReport(data){
 if(!data.nama)throw new Error('Nama Petugas wajib diisi');
 if(!data.keterangan)throw new Error('Keterangan wajib diisi');
 if(!data.photoBase64)throw new Error('Foto wajib diisi');
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 let sh=ss.getSheetByName('Laporan_Sosialisasi');
 if(!sh){setupDatabase();sh=ss.getSheetByName('Laporan_Sosialisasi');}
 const now=new Date(),tz=ss.getSpreadsheetTimeZone()||'Asia/Makassar';
 const hari=Utilities.formatDate(now,tz,'EEEE'),tanggal=Utilities.formatDate(now,tz,'dd-MM-yyyy');
 const folder=getFolder_('SosialisasiK3L_Foto');
 const bytes=Utilities.base64Decode(data.photoBase64.split(',').pop());
 const file=folder.createFile(Utilities.newBlob(bytes,data.mimeType||'image/jpeg','Sosialisasi_'+Utilities.formatDate(now,tz,'yyyyMMdd_HHmmss')+'.jpg'));
 sh.appendRow([now,data.nama,UNIT,hari,tanggal,data.lokasi||'',data.keterangan,file.getUrl()]);
 return {ok:true,hari,tanggal,photoUrl:file.getUrl()};
}
function getReports(){
 const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Laporan_Sosialisasi');
 if(!sh||sh.getLastRow()<2)return[];
 return sh.getDataRange().getValues().slice(1).map(r=>({timestamp:r[0],nama:r[1],unit:r[2],hari:r[3],tanggal:r[4],lokasi:r[5],keterangan:r[6],foto:r[7]}));
}
function getFolder_(name){const i=DriveApp.getFoldersByName(name);return i.hasNext()?i.next():DriveApp.createFolder(name);}