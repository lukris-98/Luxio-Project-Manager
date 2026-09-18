# Kemampuan NASA GIBS & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** NASA GIBS (Global Imagery Browse Services) dan **kode mana yang melakukan apa** untuk menampilkan citra satelit di aplikasi web.

- root WMTS: `https://gibs.earthdata.nasa.gov/wmts/{epsg}/best/`
- **Tanpa API key** — gratis, tapi atribusi wajib: "NASA GIBS (EOSDIS)" + sumber instrumen (MODIS/VIIRS/…).
- Dokumentasi resmi: https://nasa-gibs.github.io/gibs-api-docs/

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| Daftar semua layer (WMTS 3857) | `.../wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&Request=GetCapabilities` | XML 1000+ layer, format & tanggal per layer |
| Ambil tile citra | `GET .../wmts/epsg3857/best/{Layer}/{Time}/{TileMatrix}/{TileRow}/{TileCol}.{ext}` | JPEG/PNG, per-hari (time-aware) |
| Projection | `epsg3857` (web), `epsg4326` (geographic), `epsg3413` (Arctic), `epsg3031` (Antarctic) | 3857 = langsung cocok Leaflet/MapLibre |
| WMS non-tiled | `.../wms/epsg3857/best/wms.cgi` `GetMap` | gambar bebas ukuran per bbox |
| TWMS | `.../twms/epsg{}/ best/twms.cgi` | WMS + tile grid |
| Cek tanggal tersedia layer | REST `DescribeDomains` / `GetTimeDimensions` | `.../wmts/epsg3857/best/Rest/GetTimeDimensions/{Layer}` |
| Layer full configuration (JSON) | https://nasa-gibs.github.io/gibs-web-layers-config/out/public/gibs001.json | daftar lengkap + metadata machine-readable |
| True-color harian | layer `VIIRS_SNPP_CorrectedReflectance_TrueColor`, `MODIS_Terra_CorrectedReflectance_TrueColor` | resolusi ~250 m per hari |
| Basis peta statis | `BlueMarble_ShadedRelief_Bathymetry` (tanpa tanggal) | cocok jadi basemap global |
| Layer tematik | SST, aerosol,火灾 fires (`MODIS/Terra_Thermal_Anomalies`), NDVI, snow, malam (`VIIRS_SNPP_DayNightBand_ENCC`) | ratusan pilihan — cek `reference/available-visualizations.md` |
| Overlay vector batas | `Reference_Features`, `Reference_Labels` (PNG 32-bit alpha) | di atas citra lain |
| GDAL/WCS | `.../wcs/{epsg}/best/wcs.cgi` | potong area untuk analisis (Advanced Topics) |

## 2. Alur Tampil Citra di Web App

```
Pilih basemap (BlueMarble / TrueColor harian) ──► URL template tile
        │                                            │
        ▼                                            ▼
GetCapabilities (opsional, sekali)          Leaflet/MapLibre tileLayer
menemukan layer+tanggal valid               {TileMatrix}/{TileRow}/{TileCol}.jpeg
        │                                            │
        ▼                                            ▼
time = YYYY-MM-DD terbaru tersedia ◄── GetTimeDimensions   peta interaktif + tanggal
```

## 3. Penjelasan Kode

### 3.1 Tile URL (WMTS REST) — access-basics.md

```
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/
  MODIS_Terra_CorrectedReflectance_TrueColor/   ← layer
  default/                                      ← style (selalu "default")
  2026-09-09/                                   ← tanggal ISO (layer time-aware)
  GoogleMapsCompatible_Level7/{z}/{y}/{x}.jpeg ← TileMatrixSet + zoom/row/col
```

- `Level{n}` = jumlah level zoom layer (dari `GetCapabilities`); `{z}/{y}/{x}` = pola klasik Leaflet/XYZ.

### 3.2 Leaflet

```js
L.tileLayer(
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/' +
  'MODIS_Terra_CorrectedReflectance_TrueColor/default/' +
  '2026-09-09/GoogleMapsCompatible_Level7/{z}/{y}/{x}.jpeg',
  { minZoom: 0, maxNativeZoom: 7, attribution: 'NASA GIBS' }
).addTo(map);
```

- Contoh library lain (OpenLayers, MapLibre GL, Cesium) di `reference/map-library-usage.md`.

### 3.3 Pilih tanggal otomatis (access-advanced-topics.md)

```
GET .../wmts/epsg3857/best/Rest/GetTimeDimensions/MODIS_Terra_CorrectedReflectance_TrueColor
→ daftar tanggal; pakai yang paling akhir ≤ hari ini.
```

- Layer butuh ±1–2 hari processing; fallback mundur sampai tanggal tersedia.

### 3.4 Menumpuk overlay referensi

```
Reference_Features/.../transparent → layer vektor garis batas (PNG)
Reference_Labels/.../transparent   → label negara/kota
```

- Urutan z-index: True-color terbawah → overlay di atas.

### 3.5 WCS potongan (gis-usage.md)

```
GET .../wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&Request=GetMap
   &Layers=MODIS_Terra_CorrectedReflectance_TrueColor&Time=2026-09-08
   &BBOX=...&Width=800&Height=600&Format=image/jpeg&CRS=EPSG:3857
```

- Untuk gambar resolusi bebas/ekspor statistik; bukan untuk peta interaktif.

## 4. Batasan & Etika (overview, access-basics)

- Bukan data arsip sains — untuk visualisasi; data asli: Worldview/LAADS/Earthdata Search.
- Caching dibolehkan (tile publik); jangan scrape berlebihan — GIBS punya fair-use policy.
- Atribusi wajib di UI peta.
