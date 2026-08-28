FROM denoland/deno:debian

# Install SpatiaLite
RUN apt-get update && apt-get install -y \
    libsqlite3-mod-spatialite \
    spatialite-bin \
    libspatialite-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN deno install

# Just to keep the container running
CMD ["tail", "-f", "/dev/null"]