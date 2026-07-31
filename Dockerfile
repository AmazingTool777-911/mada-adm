FROM denoland/deno:alpine

# Install SQLite with spatialite extension
RUN apk add --no-cache libspatialite libspatialite-dev

RUN apk add --no-cache libstdc++

WORKDIR /app

COPY . .

RUN deno install

RUN deno task map-viewer:build

# Just to keep the container running
CMD ["tail", "-f", "/dev/null"]