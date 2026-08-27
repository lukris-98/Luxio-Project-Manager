# =====================================================================
# Dockerfile — Luxio Backend untuk Hugging Face Spaces (Docker SDK)
# =====================================================================
# HF Spaces Docker mengharuskan app mendengarkan di port 7860.
# Backend sudah membaca env PORT, jadi cukup EXPOSE 7860 + ENV PORT=7860.
# Layout FLAT: Cargo.toml, Cargo.lock, src/ di root HF Space (tanpa subfolder backend/).
# =====================================================================

FROM rust:1.81-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs && echo "" > src/lib.rs && cargo build --release 2>/dev/null || true
COPY src ./src
RUN touch src/main.rs src/lib.rs && cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/luxio-server /app/luxio-server

ENV PORT=7860
EXPOSE 7860

CMD ["./luxio-server"]
