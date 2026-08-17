# Map Viewer

This workspace member is the codebase for the **Map Viewer** web application
that allows users to **visualize** and **query** the seeded administrative
boundaries data onto a **map**.

![Landing page of the Map Viewer web app](/readme-images/landing-ss.PNG)

## Tech stack

The web application is built on top of the [Fresh](https://usefresh.dev/)
framework; thus, it uses [Preact](https://preactjs.com/) for the HTML rendering
with a **SSR** layer, all powered by [Vite](https://vitejs.dev/).

The UI styling is done with the [Tailwind CSS](https://tailwindcss.com/) based
framework [daiyUI](https://daisyui.com).

The map library being used is [Maplibre GL JS](https://maplibre.org) coupled
with [OpenFreeMap](https://openfreemap.org/) and
[Esri World Imagery](https://www.esri.com/en-us/arcgis/products/arcgis-online/overview)
as the base map tiles layers providers.

## Getting Started

All the commands below are to be run from the **root directory** of the project.

1. Install the dependencies:

```bash
deno task install
```

2. Start the **REST API**:

```bash
deno task rest-api:start
```

> [!IMPORTANT]
> Make sure to start the **REST API** before starting the web application.
>
> Then, set the `FRESH_PUBLIC_REST_API_BASE_URL` environment variable to the
> **base URL** of the **REST API** you just started.

3. Start the web application in **development mode**:

```bash
deno task map-viewer:dev
```

The web application will be available at `http://localhost:5173` by default.

4. Build the web application for production:

```bash
deno task map-viewer:build
```

5. Start the web application in **production mode**:

```bash
deno task map-viewer:start
```

The web application will be available at `http://localhost:8000` by default.

## Usage

This section introduces to some of the main features of the web application.

### Administrative Explorer

This page is where you can query the adminitrative boundaries data in either of
the following search modes:

- **Global Level Filtering**: Pick a starting administrative tier and search for
  any territory at or beneath that level.
- **Hierarchical Cascade**: Drill down sequentially from Province to Fokontany
  to explore precise nested relationships.

Here is a recording of the **global level filtering** search mode:

![Global level filtering search mode](/readme-images/global-mode.gif)

Here is a recording of the **hierarchical cascade** search mode:

![Hierarchical cascade search mode](/readme-images/cascade-mode.gif)

### Pinned Locations

In this page, you can **pin** custom locations to the map, then view and
organize those pins in one place.

Here is a recording of how you pin your **current location**:

![Pinning your current location](/readme-images/current-location-pin.gif)

Here is a recording of how you pin a **custom location**:

![Pinning a custom location](/readme-images/custom-location-pin.gif)

### Data sources & Map layers

In this page, you can see the **data sources** that powers the whole project's
data as well as downloading and caching those source data's **GeoJSON data** as
the map's layers.

Here is a recording of how you can download and cache the districts layer inside
the data sources page:

![Downloading and caching the districts layer](/readme-images/data-sources.gif)

## Environment Variables

The following environment variables are to be defined inside the `.env` file
located in the root directory of the project if you use a `.env` file.

| Variable Name                                            | Description                                                                                                                                       | Default Value           |
| :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------- |
| `FRESH_PUBLIC_REST_API_BASE_URL`                         | The base URL of the REST API.                                                                                                                     | `http://localhost:8000` |
| `FRESH_PUBLIC_GLOBAL_MODE_ADM_ENTITIES_COUNT`            | Number of administrative entities to display per page in the global level filtering search results (within the Map Viewer's ADM Explorer).        | `10`                    |
| `FRESH_PUBLIC_CASCADE_MODE_ADM_ENTITIES_COUNT`           | Number of administrative entities to display per page in the hierarchical cascade search results (within the Map Viewer's ADM Explorer).          | `10`                    |
| `FRESH_PUBLIC_SEARCH_MIN_LENGTH`                         | Minimum character length required in the ADM Explorer search inputs before triggering an entity search API call.                                  | `3`                     |
| `FRESH_PUBLIC_SEARCH_DEBOUNCE_DELAY`                     | Debounce delay in milliseconds before triggering an ADM entity search API call after typing in the ADM Explorer search inputs.                    | `300`                   |
| `FRESH_PUBLIC_PAGE_CONTENT_DRAWER_DEFAULT_OPEN`          | Whether the page content drawer is open by default.                                                                                               | `false`                 |
| `FRESH_PUBLIC_UNREFERENCED_ADM_GEOJSON_CLEANUP_INTERVAL` | The interval in milliseconds to wait for a geolocation response before cleaning up unreferenced ADM GeoJSON data.                                 | `300`                   |
| `FRESH_PUBLIC_GEOLOCATION_TIMEOUT`                       | The maximum time in milliseconds to wait for a geolocation response.                                                                              | `10000`                 |
| `FRESH_PUBLIC_GEOLOCATION_COORDINDATE_EPSILON`           | The maximum distance in meters between two consecutive geolocation coordinates to be considered as a new coordinate entry. (1.1 meters precision) | `0.00001`               |
| `PROVINCE_ADM_GEOJSON_VERSION`                           | Version integers for the static ADM GeoJSON layer of the provinces.                                                                               | `1`                     |
| `REGION_ADM_GEOJSON_VERSION`                             | Version integers for the static ADM GeoJSON layer of the regions.                                                                                 | `1`                     |
| `DISTRICT_ADM_GEOJSON_VERSION`                           | Version integers for the static ADM GeoJSON layer of the districts.                                                                               | `1`                     |
| `COMMUNE_ADM_GEOJSON_VERSION`                            | Version integers for the static ADM GeoJSON layer of the communes.                                                                                | `1`                     |
| `FOKONTANY_ADM_GEOJSON_VERSION`                          | Version integers for the static ADM GeoJSON layer of the fokontanys.                                                                              | `1`                     |
