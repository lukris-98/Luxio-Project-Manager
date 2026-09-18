# NASA GIBS API Documentation

Dokumentasi **NASA GIBS (Global Imagery Browse Services)** — citra satelit gratis (MODIS, VIIRS, Landsat WELD, Blue Marble) via WMTS/WMS/TWMS/WCS. **Tanpa API key**, cocok untuk menampilkan citra satelit di Leaflet/MapLibre/OpenLayers/Cesium.

- Root: `https://gibs.earthdata.nasa.gov/wmts/{epsg}/best/`
- Dokumentasi resmi: https://nasa-gibs.github.io/gibs-api-docs/
- Repo sumber: https://github.com/nasa-gibs/gibs-api-docs · Contoh web: https://github.com/nasa-gibs/gibs-web-examples
- Ringkasan kemampuan & alur kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [kemampuan-dan-alur.md](kemampuan-dan-alur.md) | Daftar kemampuan + alur tile + penjelasan kode |
| [getting-started/overview.md](getting-started/overview.md) | Intro GIBS, cakupan data, kontak |
| [getting-started/access-basics.md](getting-started/access-basics.md) | WMTS/WMS/TWMS/XYZ: endpoint, format URL, projection, time dimension |
| [getting-started/access-advanced-topics.md](getting-started/access-advanced-topics.md) | DescribeDomains, layer combination/band, full layer config JSON, best practices |

### Reference

| File | Isi |
|---|---|
| [reference/available-visualizations.md](reference/available-visualizations.md) | Kategori & daftar layer visualisasi |
| [reference/map-library-usage.md](reference/map-library-usage.md) | Leaflet/OpenLayers/MapLibre/Cesium + GDAL gdal2tiles |
| [reference/gis-usage.md](reference/gis-usage.md) | Integrasi GIS desktop (QGIS/ArcGIS) & WCS |
| [reference/contact-us.md](reference/contact-us.md) | Kontak & support |

### Resource Penting (URL langsung, tidak didownload karena besar)

| URL | Isi |
|---|---|
| `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml` | daftar seluruh layer + tanggal + format |
| `https://nasa-gibs.github.io/gibs-web-layers-config/out/public/gibs001.json` | konfigurasi layer machine-readable (resmi dipakai Worldview) |
