# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# HF Space HANYA berisi 3 file (Dockerfile, README.md, .gitignore).
# Source di-clone langsung dari GitHub (repo public lukris-98/Luxio-Project-Manager),
# hanya folder backend/ yang dipakai.
#
# CARA KERJA AUTO-REBUILD:
#   HF Spaces otomatis rebuild container SETIAP KALI ada file yang berubah
#   di repo Space ini. Untuk deploy versi baru backend:
#     1. Push kode backend ke GitHub (branch master)
#     2. Update CACHE_BUST value di bawah (increment angkanya)
#     3. Commit & push Dockerfile ini ke HF Space
#     4. HF akan detect perubahan → auto rebuild → pull kode terbaru dari GitHub
#
# ENVIRONMENT VARIABLES (Set di HF Space Settings → Variables):
#   - DATABASE_URL (required)
#   - NEON_API_KEY (required - Organization API Key)
#   - NEON_ORG_ID (required - organization ID, e.g. org-curly-bonus-71722205)
#   - OWNER_EMAIL, OWNER_PASSWORD
#   - SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD (optional)
#   - Dan lainnya sesuai .env.example
#
# CACHE BUST:
#   Increment CACHE_BUST setiap kali mau pull kode GitHub terbaru.
#   Docker cache layer RUN git clone — ubah ARG ini = force rebuild layer.
# =====================================================================

FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev git ca-certificates && rm -rf /var/lib/apt/lists/*

# INCREMENT CACHE_BUST untuk pull kode GitHub terbaru
# Update terakhir: 2026-09-10 - Fix Neon Organization ID Error
ARG CACHE_BUST=27

WORKDIR /build
RUN git clone --depth 1 --branch master https://github.com/lukris-98/Luxio-Project-Manager.git repo

WORKDIR /build/repo/backend
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /build/repo/backend/target/release/luxio-server /app/luxio-server

ENV PORT=7860
EXPOSE 7860

CMD ["./luxio-server"]
