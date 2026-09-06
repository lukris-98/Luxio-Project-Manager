# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# HF Space HANYA berisi 3 file (Dockerfile, README.md, .gitignore).
# Source di-clone langsung dari GitHub (repo lukris-98/Luxio-Project-Manager),
# hanya folder backend/ yang dipakai.
#
# CARA KERJA REBUILD OTOMATIS:
#   HF Spaces me-rebuild container SETIAP KALI ada file yang berubah di
#   repo Space ini. Jadi untuk deploy versi baru backend:
#     1. Push kode backend ke GitHub (utama/master) lalu buat tag versi,
#        mis. v1.0.6 — setiap tag bisa diunduh dari GitHub Releases.
#     2. Di Space HF, edit BARIS "ARG RELEASE=..." di bawah menjadi tag
#        tersebut → perubahan file memicu rebuild → source baru di-clone
#        dari tag yang dipin dan di-build ulang.
#   Kalau RELEASE dibiarkan "master", setiap rebuild mengambil HEAD terbaru.
#
# Tip hemat build: kosongkan cache Space (Settings → Factory reset) hanya
# kalau build macet; cargo build di sini tanpa cache dan butuh ±10 menit.
# =====================================================================

FROM rust:1.81-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev git ca-certificates && rm -rf /var/lib/apt/lists/*

# ---- PIN VERSI DI SINI -------------------------------------------------
# master = branch utama. Untuk versi rilis, ganti jadi nama tag, mis. v1.0.6
# (tag dibuat di GitHub; daftar tag: repo → Releases/Tags).
ARG RELEASE=master
# ------------------------------------------------------------------------

WORKDIR /build
# --single-branch + --depth 1: hanya satu ref, clone cepat.
RUN git clone --depth 1 --single-branch --branch ${RELEASE} https://github.com/lukris-98/Luxio-Project-Manager.git repo

WORKDIR /build/repo/backend
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /build/repo/backend/target/release/luxio-server /app/luxio-server

ENV PORT=7860
EXPOSE 7860

CMD ["./luxio-server"]
