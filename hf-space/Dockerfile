# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# Menarik kode terbaru dari GitHub (lukris-98/Luxio-Project-Manager)
# dan mengompilasi backend Axum secara otomatis saat rebuild.
# =====================================================================

FROM rust:1.81-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev git ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN git clone https://github.com/lukris-98/Luxio-Project-Manager.git repo

WORKDIR /app/repo/backend
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates chromium ffmpeg nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/repo/backend/target/release/luxio-server /app/luxio-server
COPY --from=builder /app/repo/backend/scripts/render-mp4.mjs /app/scripts/render-mp4.mjs
COPY --from=builder /app/repo/backend/scripts/package.json /app/scripts/package.json
RUN cd /app/scripts && npm install --omit=dev 2>/dev/null || true

ENV PORT=7860
ENV CHROME_PATH=/usr/bin/chromium
EXPOSE 7860

CMD ["./luxio-server"]
