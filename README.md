# Sosialisasi K3L - PLN ULP Empang

Aplikasi Android untuk pelaporan kegiatan sosialisasi bahaya listrik dengan Google Spreadsheet sebagai database dan Google Drive sebagai penyimpanan foto.

## Fitur
- Form laporan kegiatan
- Nama petugas
- Lokasi kegiatan
- Keterangan
- Hari, tanggal dan timestamp otomatis
- Ambil foto kamera / galeri
- Upload foto ke Google Drive
- Data laporan ke Google Spreadsheet
- Rekap laporan
- Dashboard ringkas
- Materi edukasi bahaya listrik
- Kuis K3L

## Backend
Google Apps Script Web App. Isi `backend/Code.gs` ke Apps Script yang terhubung dengan Spreadsheet.

Spreadsheet ID:
`1W-gTVnlCTgEDYyC_dHJnnhxi8SAXcTu-TPvwHejRekY`

## Android
Project Android Studio ada di folder `android/`.

Set URL Web App pada `android/app/src/main/java/com/example/sosialisasik3l/MainActivity.kt`.

