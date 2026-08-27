# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# HF Space HANYA berisi 3 file (Dockerfile, README.md, .gitignore).
# Source di-clone langsung dari GitHub (repo public lukris-98/Luxio-Project-Manager),
# hanya folder backend/ yang dipakai. Build otomatis saat push.
# =====================================================================

FROM rust:1.81-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev git ca-certificates && rm -rf /var/lib/apt/lists/*

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
