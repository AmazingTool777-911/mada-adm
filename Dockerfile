FROM denoland/deno:debian

# Install SpatiaLite
RUN apt-get update && apt-get install -y \
    libsqlite3-mod-spatialite \
    spatialite-bin \
    libspatialite-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Set environment
ENV LD_LIBRARY_PATH /usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

WORKDIR /app

COPY . .

RUN deno install

# Just to keep the container running
CMD ["tail", "-f", "/dev/null"]