# =====================================================================
# Dockerfile — Luxio Backend (Rust + Axum)
# =====================================================================
# Multi-stage build: build di rust:1.81-slim, runtime di debian-slim minimal.
# =====================================================================

FROM rust:1.81-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/Cargo.toml backend/Cargo.lock* ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs && echo "" > src/lib.rs && cargo build --release 2>/dev/null || true
COPY backend/src ./src
RUN touch src/main.rs src/lib.rs && cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/backend/target/release/luxio-server /app/luxio-server

ENV PORT=3000
# Neon Object Storage (S3-compatible) — diisi lewat env saat deploy/run.
# Build Docker otomatis memakai Cargo.lock + src, jadi penambahan crate
# (hmac, hex) ikut ter-rebuild tanpa perubahan manual.
ENV AWS_ENDPOINT_URL_S3=""
ENV AWS_ACCESS_KEY_ID=""
ENV AWS_SECRET_ACCESS_KEY=""
ENV AWS_REGION=""
EXPOSE 3000

CMD ["./luxio-server"]