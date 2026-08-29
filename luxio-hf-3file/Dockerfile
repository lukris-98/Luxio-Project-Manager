# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# HF Space HANYA berisi 3 file (Dockerfile, README.md, .gitignore).
# Source di-clone langsung dari GitHub (repo public lukris-98/Luxio-Project-Manager),
# hanya folder backend/ yang dipakai.
# =====================================================================

FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev git ca-certificates && rm -rf /var/lib/apt/lists/*

# Naikkan CACHE_BUST tiap kali ingin menarik kode terbaru dari GitHub.
# Docker meng-cache layer RUN git clone — mengubah ARG CACHE_BUST
# akan mematahkan cache dan memaksa clone ulang.
ARG CACHE_BUST=18

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
