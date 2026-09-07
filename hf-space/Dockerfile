# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# HF Spaces Docker mengharuskan app mendengarkan di port 7860.
# Backend sudah membaca env PORT, jadi cukup EXPOSE 7860 + ENV PORT=7860.
# Multi-stage: build di rust-slim, runtime di debian-slim minimal.
# =====================================================================

FROM rust:1.81-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/Cargo.toml backend/Cargo.lock* ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs && echo "" > src/lib.rs && cargo build --release 2>/dev/null || true
COPY backend/src ./src
RUN touch src/main.rs src/lib.rs && cargo build --release

# Runtime: chromium + ffmpeg untuk render MP4 Bang Motion, node untuk script.
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates chromium ffmpeg nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/backend/target/release/luxio-server /app/luxio-server
COPY backend/scripts/render-mp4.mjs /app/scripts/render-mp4.mjs
COPY backend/scripts/package.json /app/scripts/package.json
RUN cd /app/scripts && npm install --omit=dev 2>/dev/null || true

ENV PORT=7860
ENV CHROME_PATH=/usr/bin/chromium
EXPOSE 7860

CMD ["./luxio-server"]
