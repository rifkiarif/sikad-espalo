# SIKAD DIGITAL — GitHub Pages + Apps Script API

Frontend di **GitHub Pages**, backend tetap di **Google Apps Script** (Spreadsheet).

## 1. Deploy backend (Apps Script)

1. Buka Google Spreadsheet SIKAD → **Extensions → Apps Script**
2. Tempel isi `Code.gs` (ganti seluruh file server)
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Salin URL `/macros/s/XXXX/exec`

Uji cepat di browser:
```
https://script.google.com/macros/s/XXXX/exec?api=1&health=1
```
Harus mengembalikan JSON `{ "success": true, "message": "SIKAD API OK", ... }`.

## 2. Deploy frontend (GitHub Pages)

1. Buat repo GitHub, unggah `index.html` (bisa rename jadi root)
2. Settings → Pages → Deploy from branch `main` / folder `/ (root)`
3. Setelah live, buka site → buka Console browser, jalankan sekali:

```js
localStorage.setItem("sikad_api_url", "https://script.google.com/macros/s/XXXX/exec");
location.reload();
```

Atau edit `index.html`, set di dekat atas:

```js
window.SIKAD_API_URL = "https://script.google.com/macros/s/XXXX/exec";
```

## 3. Mode ganda

| Tempat buka UI | Cara panggil backend |
|----------------|----------------------|
| URL Web App GAS (HtmlService) | `google.script.run` otomatis |
| GitHub Pages / domain lain | `fetch` ke URL Web App |

Auth tetap memakai **token session** (CacheService di GAS), tidak bergantung cookie.

## 4. Catatan

- Jangan commit password. Default admin: `admin@sikad.local` / `admin123` (ganti segera).
- Logo cetak: URL harus publik (atau Drive “Anyone with link”).
- Jika `fetch` gagal: pastikan deployment **Anyone**, URL `/exec` (bukan `/dev`), dan hard-refresh frontend.
