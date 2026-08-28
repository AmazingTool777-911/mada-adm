# Madagascar Administrative Boundaries - Mada ADM

A [Deno](https://deno.com/)-based **CLI tool** that allows your existing
database to directly incorporate **Madagascar's administrative boundaries data**
for all adminsitrative levels such as **Province**, **Region**, **District**,
**Commune**, and **Fokontany**; also available as a **CLI executable**. It also
includes other toolings such as a **REST API** and a **web GUI** for
**visualizing** and **exploring** the data onto a **map**.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running CLI Tasks](#running-cli-tasks)
  - [Testing](#testing)
  - [Compiling](#compiling)
  - [Using the Compiled Executable](#using-the-compiled-executable)
  - [Usage with Docker](#usage-with-docker)
- [Database Support](#database-support)
- [Fundamental Concepts & Architecture](#fundamental-concepts--architecture)
  - [Worker Pipeline](#worker-pipeline)
  - [Batching & Efficiency](#batching--efficiency)
  - [Fault Tolerance: Redis vs In-Memory](#fault-tolerance-redis-vs-in-memory)
  - [Database Schema Flexibility & Configuration](#database-schema-flexibility--configuration)
    - [Base configuration](#base-configuration)
    - [Prefixed table names configuration](#prefixed-table-names-configuration)
    - [`isFkRepeated` set to `true`](#isfkrepeated-set-to-true)
    - [`isProvinceRepeated` set to `true`](#isprovincerepeated-set-to-true)
    - [`isProvinceFkRepeated` set to `true`](#isprovincefkrepeated-set-to-true)
    - [`hasGeojson` set to `true`](#hasgeojson-set-to-true)
  - [Indexing & Collation](#indexing--collation)
    - [Text Collation Summary](#text-collation-summary)
- [CLI Commands & Usage](#cli-commands--usage)
  - [Global Options & Environment Variables](#global-options--environment-variables)
    - [Common Options](#common-options)
    - [PostgreSQL Configuration](#postgresql-configuration)
    - [MySQL Configuration](#mysql-configuration)
    - [SQLite Configuration](#sqlite-configuration)
    - [MongoDB Configuration](#mongodb-configuration)
  - [Commands](#commands)
    - [Main / Root / Index command](#main--root--index-command)
    - [Query sub-command: `query`](#query-sub-command-query)
    - [Set database configuration sub-command: `set-config`](#set-database-configuration-sub-command-set-config)
    - [Clear database sub-command: `clear`](#clear-database-sub-command-clear)
    - [Update a record's field sub-command: `update-field`](#update-a-records-field-sub-command-update-field)
- [REST API](#rest-api)
- [Map Viewer](#map-viewer)
- [Data catalogs](#data-catalogs)
- [Current Status](#current-status)
- [Known Issues & Future Improvements](#known-issues--future-improvements)
  - [Progress Bar Rendering:](#progress-bar-rendering)
  - [Missing or Inaccurate datasets:](#missing-or-inaccurate-datasets)
  - [Topological Data Inconsistencies:](#topological-data-inconsistencies)
  - [Full REST API](#full-rest-api)
  - [Support for more database adapters](#support-for-more-database-adapters)
- [License & Attribution](#license--attribution)
  - [Software License](#software-license)
  - [Data License & Attribution](#data-license--attribution)
    - [Requirements for Derived Works](#requirements-for-derived-works)

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

1. **Git LFS**: This project uses Git Large File Storage (LFS) to manage the
   `.ndjson` data files. You **must** install Git LFS before cloning the
   repository to ensure the data files are properly downloaded.
   - [Install Git LFS](https://github.com/git-lfs/git-lfs?utm_source=gitlfs_site&utm_medium=installation_link&utm_campaign=gitlfs#installing)
2. **Deno**: The project is built with Deno. You need to have it installed on
   your machine.
   - [Install Deno](https://docs.deno.com/runtime/getting_started/installation/)
3. **Database Software**: This project supports either of **PostgreSQL**,
   **SQLite**, **MySQL**, or **MongoDB**.
   - [Download PostgreSQL](https://www.postgresql.org/download/)
   - [Download SQLite](https://sqlite.org/download.html)
   - [Download MySQL](https://www.mysql.com/downloads/)
   - [Use MongoDB](https://www.mongodb.com/)
4. **Redis (optional)**: Used as a persisted message broker when processing the
   records from the dataset inputs.
   - [Download Redis](https://redis.io/downloads/)

> [!TIP]
> **Skip the setup?** If you have **Docker** installed, you can bypass the local
> installation of both **Deno**, **Redis**, and **SQLite (+ SpatiaLite)** by
> using the [Docker setup](#running-with-docker).

### Installation

1. **Clone the repository** (make sure Git LFS is installed first):
   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies**: Run the following command to install the project
   dependencies:
   ```bash
   deno install
   ```

### Running CLI Tasks

You can also use the **CLI tool** by running the **CLI tasks** defined in the
root `deno.json` by using **Deno**.

```bash
# Main command: Launches the data integration pipeline of the administrative boundaries data into a Postgres database
deno task cli --db-type postgres \
  --pg.user myuser --pg.password mypass --pg.database mada_adm \
  --processing-workers-count 4 --queue-batch-size 10

# Sub-command: Queries for administrative territories that start with the word "Ambohi" and returns 9 results per page
deno task cli:query "Ambohi" --page-size 9 \
  --pg.user myuser --pg.password mypass --pg.database mada_adm \
  --processing-workers-count 4 --queue-batch-size 10
```

You can view the full CLI commands reference in the
[CLI Commands & Usage](#cli-commands--usage) section.

### Testing

To ensure everything is set up correctly, you can run the test suite:

```bash
deno task test
```

### Compiling

To compile the project into standalone **CLI executables** for different host
platforms:

```bash
# Compile for all major platforms
deno task compile:all
```

The compiled binaries have the name of `mada-adm` (or `mada-adm.exe` for a
Windows based compilation target) and are placed in the `bin/<platform>`
directory for each platform respectively.

Here is the reference of the **supported host platforms targets** along with the
**compilation commands** as well as the **compiled binaries path**:

| Host OS | Target Architecture | Compilation Command                | Compiled Binary Path                       |
| :------ | :------------------ | :--------------------------------- | :----------------------------------------- |
| Windows | x86_64              | `deno task compile:windows:x86_64` | `bin/x86_64-pc-windows-msvc/mada-adm.exe`  |
| Windows | arm64               | `deno task compile:windows:arm64`  | `bin/aarch64-pc-windows-msvc/mada-adm.exe` |
| macOS   | x86_64              | `deno task compile:macos:x86_64`   | `bin/x86_64-apple-darwin/mada-adm`         |
| macOS   | arm64               | `deno task compile:macos:arm64`    | `bin/aarch64-apple-darwin/mada-adm`        |
| Linux   | x86_64              | `deno task compile:linux:x86_64`   | `bin/x86_64-unknown-linux-gnu/mada-adm`    |
| Linux   | arm64               | `deno task compile:linux:arm64`    | `bin/aarch64-unknown-linux-gnu/mada-adm`   |

To compile the project for the **current platform's architecture**, you run:

```bash
deno task compile
```

The compiled binary is placed in `bin/current-platform/mada-adm` (or
`mada-adm.exe` for a Windows based compilation target).

### Using the Compiled Executable

Once compiled (or
[downloaded from the releases](https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/releases)),
you can run the `mada-adm` binary directly from its output directory:

```bash
# Example for Linux/macOS
./bin/current-platform/mada-adm --help

# Example for Windows
.\bin\current-platform\mada-adm.exe --help
```

You can optionally add the output directory to your system's `PATH` to run
`mada-adm` from any location without specifying the full path.

> [!WARNING]
> **Unsigned Binaries:** The compiled executables are not digitally signed.
> Depending on your operating system (e.g., Windows SmartScreen or macOS
> Gatekeeper), you may encounter security warnings or blocks when attempting to
> run them. You will need to manually allow or trust the application within your
> system settings to proceed.

### Usage with Docker

The root directory of the project contains 2 docker related files:

- `docker-compose.yml`
- `Dockerfile`

Thus, there are **2 ways** of using the project with Docker:

- **Docker Compose (recommended)**: **Start** (and **Build** if run for the
  first time) the project's services defined by `docker-compose.yml` with the
  `docker-compose up` command. It runs 2 services: `app` for project itself and
  `redis` for the **Redis database instance**.
- **Standalone Docker Container**: **Build** the project's Docker image by using
  the `docker build` command. Then, **run** the image's container by using the
  `docker run` command. In that case, you are responsible for provisioning your
  own **Redis database instance** if required.

> **💡 Note:** In both cases, **SQLite** and its **Spatialite** extension are
> already installed inside the project's Docker image.

Now, assuming that the project's container is up and running, after accessing
the container's shell, you can execute **CLI tasks** from within the container.

```bash
# Running the CLI's main command (data integration pipeline) from within the container
docker compose exec app \
deno task cli --db-type postgres \
  --pg.user myuser --pg.password mypass --pg.database mada_adm \
  --processing-workers-count 4 --queue-batch-size 10
```

> **Environment variables:** The root `.env` file is automatically injected into
> the container's **environment variables**.

## Database Support

The CLI supports multiple database drivers with native spatial capabilities
where available. Minimum supported versions are listed below.

| Database       | Min. Version | Spatial Extension                                                |
| :------------- | :----------- | :--------------------------------------------------------------- |
| **PostgreSQL** | 8.4          | [PostGIS](https://postgis.net/)                                  |
| **SQLite**     | 3.0          | [SpatiaLite](https://www.gaia-gis.it/fossil/libspatialite/index) |
| **MySQL**      | 5.7          | Native                                                           |
| **MongoDB**    | 2.4          | Native                                                           |

> [!IMPORTANT]
> You are responsible for ensuring that the **database** and its **spatial
> extensions** are correctly **installed** and **configured** before using the
> **CLI**.

## Project Structure & Content

This repository serves as a centralized hub for administrative data and the
logic required to process it:

- **CLI commands (`/commands/`)**: The Deno source code for the command-line
  interface's commands.
- **CLI Executables (`bin/`)**: The compiled standalone executables for
  different platforms.
- **Raw Sources (`data/geojson/`)**: Original GeoJSON spatial data files
  collected from external sources.
- **Intermediate Format (`data/ndjson/`)**: Raw sources converted into _Newline
  Delimited JSON (NDJSON)_ for more efficient stream-based processing and
  cleaning.
- **Seeding Inputs (`data/inputs/`)**: The final, optimized, and schema-aware
  datasets generated by the extraction script, in the _NDJSON_ format, **ready
  to be ingested** by the **CLI main command** as the **base inputs**.
- **Data Catalogs (`data/catalogs/`)**: Catalogs of the administrative
  boundaries data, structured and organized in hierarchy, found in both _CSV_
  and _JSON_ formats, and generated from the seeding inputs.
- **Utility Scripts (`scripts/`)**: Utility scripts used to generate both the
  **base data inputs** and the **data catalogs**.
- **Map Viewer (`map-viewer/`)**: A mini web application to visualize and query
  the seeded administrative boundaries.
- **REST API (`rest-api/`)**: A REST API to query the seeded administrative
  boundaries, also used by the map viewer.

## Fundamental Concepts & Architecture

There are a few **fundamental Concepts & Architectures** that are crucial to
understand and remember because the main features of the tool rely on them.

### Worker Pipeline

The notion of **worker pipeline** mostly applies to the **data integration
pipeline** of the **administrative boundaries data** into a **database** that is
launched by the **main command of the CLI tool**.

The **pipeline** is done in **two (2) stages**:

- **Processing stage**
- **Insertion stage**

Those **stages** are performed by **workers**.

A **worker** is a **child process** of the main program that handles **a
simultaneous unit of work at a time** handed down by the main program.

The **processing stage** is responsible for **resolving foreign keys** from the
database of **previously inserted data** that belong to **parent tables** such
that **foreign keys relationships** can be established before _insertion_. This
stage is broken down into **parallel tasks** that are executed by **multiple
workers** in order to **speed up the pipeline's completion time** as well as to
**make efficient use of the computer's resources**. You can configure the number
of **parallel workers** with the `--processing-workers-count` option.

The **insertion stage** is only responsible for **inserting** the **resolved
data** from the _processing workers_ into the database. This stage is executed
by a **only one worker**.

The following is an illustration of how that **2-stage pipeline** actually plays
out assuming that we are working with _SQL_:

![Workers architecture](/readme-images/workers.gif)

### Batching & Efficiency

The notion of **Batching & Efficiency** also mostly applies to the **data
integration pipeline**.

To **reduce** the amount of **round-trips to the database**, the **records**
being **queried to** and **inserted to** the database are **batched together**
such that the _workers_ make a **single database query** with **n-records** at a
time. The **amount of records being batched together** is specified by the
`--queue-batch-size` option.

Here is a simplified _sequence diagram_ of how a **worker** processes **N
records** while **not batching** the **database queries**:

![Workers architecture](/readme-images/not-batched.gif)

In contrast, here is a simplified _sequence diagram_ of how a **worker**
processes **N records** while **batching** the **database queries** into **one
single query**:

![Workers architecture](/readme-images/batched.gif)

### Fault Tolerance: Redis vs In-Memory

That notion of **Fault Tolerance: Redis vs In-Memory** mostly applies to the
**data integration pipeline** as well.

By default, the **data integration pipeline** expects an **external Redis
database instance** that serves as a **message broker** thanks to the
[Redis Streams API](https://redis.io/resources/architecture-diagrams/redis-streams/)
by **persisting** and **queueing** the **records from the dataset inputs** as
**messages** to be pushed to the **pipeline workers**.

As result, we have **2 modes** of running the **data pipeline**:

- **Redis enabled (Default)**: Provides a **resumable**, **fault-tolerant**
  state such that when a pipeline is **interrupted**, it can **pick up** exactly
  **at where it left off**.
- **In-Memory**: The **Redis database instance** is **omitted** so the
  **pipeline** is done **entirely in-memory**. In that case, we do not have any
  means of **state recovery**. Thus, any **interruption** will always result in
  a **complete restart** of the pipeline.

### Database Schema Flexibility & Configuration

To store the **administrative boundaries data**, the project creates and uses
the following set of tables:

- **Configuration table**: A table named `mada_adm_configs` (or
  `madaAdmConfigs`) that stores a set of **configuration properties values**
  that dictates the **schema definitions** of the **administrative levels
  tables**.
- **Administrative levels tables (ADM Tables)**: A set of tables named
  `provinces`, `regions`, `districts`, `communes`, and `fokontanys` that store
  the **administrative boundaries data** for **each administrative level**.
  Those tables names can also include a string **prefix** when a **tables
  prefix** value was specified in the _configuration table_.

Here are the **configuration properties** that the project uses to adapt the
schema to the needs of the user:

| Property               | Description                                                                                                                                                                      |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tablesPrefix`         | **String prefix** for all ADM tables/collections (e.g., `app_`). Has the value of `null` when no prefix is applied.                                                              |
| `isFkRepeated`         | If `true`, **child ADM levels tables** store the **foreign keys** of **all the ADM tables of all the parent administrative levels** except the _province foreign key_.           |
| `isProvinceRepeated`   | If `true`, the **province** name is explicitly included in **all the ADM tables**.                                                                                               |
| `isProvinceFkRepeated` | If `true`, the **province id foreign key** is explicitly included in **all the ADM tables below the province administrative level**.                                             |
| `hasGeojson`           | If `true`, a `geojson` column that stores the **spatial geometry data** of the **administative boundaries on a map** is included in **all the ADM tables**.                      |
| `hasAdmLevel`          | If `true`, a `has_adm_level` (or `hasAdmLevel`) column that stores the **a numerical code of the administrative level** (from `0` to `4`) is included in **all the ADM tables**. |

Let us take a look at how the database schema looks like when each of those
database configuration properties are applied.

#### Base configuration:

With the **base configuration** applied, all the ADM tables names have **no
prefix**, all the child ADM tables include **only the immediate parent
administrative level table's foreign key**, and all the remaining properties are
set to `false`.

| Property               | Value   |
| :--------------------- | :------ |
| `tablesPrefix`         | `null`  |
| `isFkRepeated`         | `false` |
| `isProvinceRepeated`   | `false` |
| `isProvinceFkRepeated` | `false` |
| `hasGeojson`           | `false` |
| `hasAdmLevel`          | `false` |

Here is a screenshot of the database schema with the base configuration applied:

![Database schema with the base configuration applied](/readme-images/database-base.webp)

#### Prefixed table names configuration:

When the `tablesPrefix` configuration property is set to a **non-empty string**,
the tables names become **prefixed** with the provided value.

Here is a screenshot of the database schema with the prefixed configuration
applied:

![Database schema with the prefixed configuration applied](/readme-images/database-prefix-app.webp)

With its database schema configuration values being:

| Property               | Value     |
| :--------------------- | :-------- |
| `tablesPrefix`         | **`app`** |
| `isFkRepeated`         | `false`   |
| `isProvinceRepeated`   | `false`   |
| `isProvinceFkRepeated` | `false`   |
| `hasGeojson`           | `false`   |
| `hasAdmLevel`          | `false`   |

#### `isFkRepeated` set to `true`:

When the `isFkRepeated` configuration property is set to `true`, **all child ADM
levels tables** store foreign keys of all ancestors (not just the immediate
parent) **except** the _province foreign key_.

Here is a screenshot of the database schema with the `isFkRepeated`
configuration property is set to `true`:

![Database schema with the isFkRepeated configuration property is set to true](/readme-images/database-isFkRepeated.webp)

With its database schema configuration values being:

| Property               | Value      |
| :--------------------- | :--------- |
| `tablesPrefix`         | `null`     |
| `isFkRepeated`         | **`true`** |
| `isProvinceRepeated`   | `false`    |
| `isProvinceFkRepeated` | `false`    |
| `hasGeojson`           | `false`    |
| `hasAdmLevel`          | `false`    |

#### `isProvinceRepeated` set to `true`:

When the `isProvinceRepeated` configuration property is set to `true`, a
`province` column that stores the **province name** is included in **all ADM
tables**.

Here is a screenshot of the database schema with the `isProvinceRepeated`
configuration property is set to `true`:

![Database schema with the isProvinceRepeated configuration property is set to true](/readme-images/database-isProvinceRepeated.webp)

With its database schema configuration values being:

| Property               | Value      |
| :--------------------- | :--------- |
| `tablesPrefix`         | `null`     |
| `isFkRepeated`         | `false`    |
| `isProvinceRepeated`   | **`true`** |
| `isProvinceFkRepeated` | `false`    |
| `hasGeojson`           | `false`    |
| `hasAdmLevel`          | `false`    |

#### `isProvinceFkRepeated` set to `true`:

When the `isProvinceFkRepeated` configuration property is set to `true`, a
**province id foreign key** is included in **all ADM tables below the province
administrative level**.

Here is a screenshot of the database schema with the `isProvinceFkRepeated`
configuration property is set to `true`:

![Database schema with the isProvinceFkRepeated configuration property is set to true](/readme-images/database-isProvinceFkRepeated.webp)

With its database schema configuration values being:

| Property               | Value      |
| :--------------------- | :--------- |
| `tablesPrefix`         | `null`     |
| `isFkRepeated`         | `false`    |
| `isProvinceRepeated`   | `false`    |
| `isProvinceFkRepeated` | **`true`** |
| `hasGeojson`           | `false`    |
| `hasAdmLevel`          | `false`    |

#### `hasGeojson` set to `true`:

When the `hasGeojson` configuration property is set to `true`, the `geojson`
column is included in **every ADM table** to store the **spatial geometry data**
of the **administrative boundaries** on a map.

Here is a screenshot of the database schema with the `hasGeojson` configuration
property is set to `true`:

![Database schema with the hasGeojson configuration property is set to true](/readme-images/database-hasGeojson.webp)

With its database schema configuration values being:

| Property               | Value      |
| :--------------------- | :--------- |
| `tablesPrefix`         | `null`     |
| `isFkRepeated`         | `false`    |
| `isProvinceRepeated`   | `false`    |
| `isProvinceFkRepeated` | `false`    |
| `hasGeojson`           | **`true`** |
| `hasAdmLevel`          | `false`    |

#### `hasAdmLevel` set to `true`:

When the `hasAdmLevel` configuration property is set to `true`, the `adm_level`
(or `admLevel`) column that stores a **numerical code of the administrative
level** is included in **every ADM table**.

Here is the mapping of the values of the **numerical code** to the corresponding
**administrative level**:

| ADM Level | Value |
| :-------- | :---- |
| Province  | `0`   |
| Region    | `1`   |
| District  | `2`   |
| Commune   | `3`   |
| Fokontany | `4`   |

Here is a screenshot of the database schema with the `hasAdmLevel` configuration
property is set to `true`:

![Database schema with the hasAdmLevel configuration property is set to true](/readme-images/database-hasAdmLevel.webp)

With its database schema configuration values being:

| Property               | Value      |
| :--------------------- | :--------- |
| `tablesPrefix`         | `null`     |
| `isFkRepeated`         | `false`    |
| `isProvinceRepeated`   | `false`    |
| `isProvinceFkRepeated` | `false`    |
| `hasGeojson`           | `false`    |
| `hasAdmLevel`          | **`true`** |

### Indexing & Collation

To support flexible and efficient data retrieval, the project implements the
following database-level conventions:

- **B-Tree Indexes**: All **primary identification text fields** and **foreign
  key columns** are indexed using **B-tree** structures. This ensures that the
  hierarchical relationship lookups remain fast even as the dataset grows, while
  also providing a foundation for basic _prefix text search_ queries. _Advanced
  full-text indexing strategies_ are left as an **implementation choice** for
  the end-user.
- **Case-Insensitive Unicode Collation**: Text columns (like names of provinces,
  regions, etc.) use both **Case-Insensitive and Unicode collations**. This
  enables **flexible exact matches** and reliable _prefix text search_ queries
  regardless of _casing_ or _accents_.

> **💡 Note:** The indexing strategies for every table for each database type
> have been scrutinized through the database's **query planner** such that the
> existing queries are **the most optimized in average**.

#### Text Collation Summary

| Database       | Strategy                | Collation / Operator                                              |
| :------------- | :---------------------- | :---------------------------------------------------------------- |
| **PostgreSQL** | `CITEXT` data type      | `citext_ops`                                                      |
| **MySQL**      | `utf8mb4` character set | `utf8mb4_0900_as_ci`                                              |
| **SQLite**     | `COLLATE NOCASE`        | `NOCASE`                                                          |
| **MongoDB**    | Collation document      | `locale: "fr", strength: 2, normalization: true, backwards: true` |

## CLI Commands & Usage

The **CLI tool** is the primary feature of the project. We interact with the
**CLI** through a **main command** as well as a set of **sub-commands**.

**Additional values** such as **options** and **arguments** that can be provided
to those commands.

There are **2 types of options**:

- **Global options**: Apply to both the **main command** and the **all
  sub-commands**.
- **Command-scoped options**: Apply only to the **sub-commands** they are
  defined in.

Those are the content that will be covered in this section.

### Global Options & Environment Variables

**Global options** are **additional values** that apply to both the **main
command** and the **sub-commands**. They are **all optional** with **default
values**. Those options are mostly concerned with the **database connection
parameters**.

**Global options** can be provided as either **CLI flags** or **environment
variables**. When both are applied, the **CLI flags** always take precedence.

> [!TIP]
> Since the **global options** can be repetitive across the **main command** and
> multiple **sub-commands**, the recommended workflow is to set those global
> options as **environment variables** so that the **main command** and the
> **sub-commands**' options are filled only with their **command-scoped
> options**.

#### Common Options

| CLI Flag      | Environment Variable | Description                                                                 | Default  |
| :------------ | :------------------- | :-------------------------------------------------------------------------- | :------- |
| `--db-type`   | `DB_TYPE`            | The database type to connect to (`sqlite`, `mysql`, `postgres`, `mongodb`). | `sqlite` |
| `--cli-debug` | `CLI_DEBUG`          | Enable debug logging across the pipeline.                                   | `false`  |

#### PostgreSQL Configuration

| CLI Flag                | Environment Variable  | Description                                               | Default     |
| :---------------------- | :-------------------- | :-------------------------------------------------------- | :---------- |
| `--pg.schema`           | `PG_SCHEMA`           | The PostgreSQL schema to use (e.g. public).               | `public`    |
| `--pg.url`              | `PG_URL`              | The URL to connect to the PostgreSQL database.            | -           |
| `--pg.host`             | `PG_HOST`             | Hostname or IP address of the PostgreSQL server.          | `localhost` |
| `--pg.port`             | `PG_PORT`             | Port number of the PostgreSQL server.                     | `5432`      |
| `--pg.user`             | `PG_USER`             | Username for authenticating with the PostgreSQL server.   | `postgres`  |
| `--pg.password`         | `PG_PASSWORD`         | Password for authenticating with the PostgreSQL server.   | `""`        |
| `--pg.database`         | `PG_DATABASE`         | Name of the database to be used.                          | `postgres`  |
| `--pg.ssl`              | `PG_SSL`              | Whether to use SSL for the connection.                    | `false`     |
| `--pg.ca-cert-file`     | `PG_CA_CERT_FILE`     | Filename of the CA cert under `db/.pki/`. **(Deno only)** | -           |
| `--pg.ca-cert-path`     | `PG_CA_CERT_PATH`     | Full path to the CA cert file.                            | -           |
| `--pg.connection-limit` | `PG_CONNECTION_LIMIT` | Maximum number of connections in the PostgreSQL pool      | `10`        |

#### MySQL Configuration

| CLI Flag                   | Environment Variable     | Description                                                                   | Default     |
| :------------------------- | :----------------------- | :---------------------------------------------------------------------------- | :---------- |
| `--mysql.url`              | `MYSQL_URL`              | The URL to connect to the MySQL database.                                     | -           |
| `--mysql.host`             | `MYSQL_HOST`             | Hostname or IP address of the MySQL server.                                   | `localhost` |
| `--mysql.port`             | `MYSQL_PORT`             | Port number of the MySQL server.                                              | `3306`      |
| `--mysql.user`             | `MYSQL_USER`             | Username for authenticating with the MySQL server.                            | `root`      |
| `--mysql.password`         | `MYSQL_PASSWORD`         | Password for authenticating with the MySQL server.                            | `""`        |
| `--mysql.database`         | `MYSQL_DATABASE`         | Name of the database to be used.                                              | `mysql`     |
| `--mysql.ssl`              | `MYSQL_SSL`              | Whether to use SSL for the connection.                                        | `false`     |
| `--mysql.ca-cert-file`     | `MYSQL_CA_CERT_FILE`     | Filename of the CA cert under `db/.pki/`. **(Deno only)**                     | -           |
| `--mysql.ca-cert-path`     | `MYSQL_CA_CERT_PATH`     | Full path to the CA cert file.                                                | -           |
| `--mysql.cert-file`        | `MYSQL_CERT_FILE`        | Filename of the client certificate under `db/.pki/`. **(Deno only)**          | -           |
| `--mysql.cert-path`        | `MYSQL_CERT_PATH`        | Full path to the client certificate file.                                     | -           |
| `--mysql.key-file`         | `MYSQL_KEY_FILE`         | Filename of the client key under `db.pki/`. **(Deno only)**.                  | -           |
| `--mysql.key-path`         | `MYSQL_KEY_PATH`         | Full path to the client key file on disk.                                     | -           |
| `--mysql.connection-limit` | `MYSQL_CONNECTION_LIMIT` | Maximum number of connections in the MySQL connections pool.                  | `10`        |
| `--mysql.max-idle`         | `MYSQL_MAX_IDLE`         | Maximum number of idle connections in the MySQL connections pool.             | -           |
| `--mysql.idle-timeout`     | `MYSQL_IDLE_TIMEOUT`     | The maximum time a connection can sit unused in the pool before being closed. | -           |

#### SQLite Configuration

| CLI Flag           | Environment Variable | Description                                                          | Default       |
| :----------------- | :------------------- | :------------------------------------------------------------------- | :------------ |
| `--sqlite.db-file` | `SQLITE_DB_FILE`     | Filename of the SQLite database within `db/.sqlite`. **(Deno only)** | `mada-adm.db` |
| `--sqlite.db-path` | `SQLITE_DB_PATH`     | Full absolute or relative path to the SQLite database file.          | -             |

#### MongoDB Configuration

| CLI Flag                                    | Environment Variable                | Description                                                      | Default                     |
| :------------------------------------------ | :---------------------------------- | :--------------------------------------------------------------- | :-------------------------- |
| `--mongo.uri`                               | `MONGO_URI`                         | The URI to connect to the MongoDB database.                      | `mongodb://localhost:27017` |
| `--mongo.database`                          | `MONGO_DATABASE`                    | Name of the target MongoDB database.                             | `mada-adm`                  |
| `--mongo.pool-size`                         | `MONGO_POOL_SIZE`                   | Maximum number of connections in the pool.                       | `10`                        |
| `--mongo.tls`                               | `MONGO_TLS`                         | Whether to use TLS for the connection.                           | `false`                     |
| `--mongo.tls-ca-path`                       | `MONGO_TLS_CA_PATH`                 | Full path to the CA certificate file.                            | -                           |
| `--mongo.tls-cert-key-path`                 | `MONGO_TLS_CERT_KEY_PATH`           | Full path to the client certificate and key PEM file.            | -                           |
| `--mongo.tls-certificate-key-file-password` | `MONGO_TLS_CERT_PASSWORD`           | Password for the client certificate key file if it is encrypted. | -                           |
| `--mongo.tls-allow-invalid-certificates`    | `MONGO_TLS_CERT_PASSWORD`           | Whether to allow invalid certificates for the connection.        | `false`                     |
| `--mongo.tls-allow-invalid-hostnames`       | `MONGO_TLS_ALLOW_INVALID_HOSTNAMES` | Whether to allow invalid hostnames for the connection.           | `false`                     |

> [!WARNING]
> **MongoDB Replica Set:** Since the seeding pipeline utilizes multi-document
> transactions to ensure data consistency, the target MongoDB instance **must**
> be configured as a **Replica Set**. Single-node instances without replica set
> configuration do not support transactions.

> [!WARNING]
> **File options:** Options ending in `-file` (e.g `--sqlite.db-file`,
> `--pg.ca-cert-file`) resolve paths **relative** to the internal project
> structure. However, those options **do not work** with the **compiled
> executables** because those internal directories are no longer accessible when
> compiled. Therefore, when working with the **compiled executables**,
> **always** use the **equivalent** `--**-path`-like option with an **absolute
> full path**.
>
> For instance, if you want to specify a custom **SQLite database file** using
> the compiled executable, you must use the `--sqlite.db-path` instead of
> `--sqlite.db-file`.
>
> Another example is when you want to specify a **PostgreSQL CA certificate
> file** using the compiled executable, you must use the `--pg.ca-cert-path`
> option instead of `--pg.ca-cert-file`.

### Commands

This section describes the **CLI commands** and their **options**.

The CLI can be run in either of the following ways:

- **Local Execution:** `deno task cli [arguments] [options]`: Run the CLI from
  the Deno codebase (requires Deno to be installed either on the local machine
  or inside Docker).
- **Executable Execution:** `mada-adm [arguments] [options]`: Run the CLI from
  the compiled binary. Once the binary executable is compiled after running
  `deno task compile`, the executable is named `mada-adm` (or `mada-adm.exe` if
  the compilation target platform was _Windows_).

#### Main / Root / Index command:

**CLI Execution:** `mada-adm [options]`\
**Local Execution:** `deno task cli [options]`

The **core CLI command** that launches the **data integration pipeline** of the
**administrative boundaries data** into the **database**.

You can pass **options** related to the **workers**, the **batching**, and
**Redis** for a **fault-tolerant** pipeline. The **options** that are **scoped
to only the main command** can be provided as both **CLI flags** or
**environment variables** just like the **global options**.

**Example Usage:**

```bash
deno task cli --db-type postgres \
  --pg.host localhost --pg.user admin --pg.password secret \
  --processing-workers-count 4 --queue-batch-size 50
```

_In that example, we connect to a PostgreSQL database with 4 parallel processing
workers and a batch size of 50 records per database round-trip._

> [!WARNING]
> **Resumable** jobs are only supported when **Redis** is **enabled**, and you
> will have to install
> [Redis](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/)
> in that case. Otherwise, if the job is executed **fully in-memory**, it will
> **restart** from scratch if **interrupted**.

![Seeding command example](/readme-images/main-command.gif)

**Redis connection Options**

| CLI Flag               | Environment Variable | Description                                                      | Default     |
| :--------------------- | :------------------- | :--------------------------------------------------------------- | :---------- |
| `--disable-redis`      | `DISABLE_REDIS`      | Disable Redis connection. Uses the in-memory queue instead.      | `false`     |
| `--redis.url`          | `REDIS_URL`          | Full Redis connection URL.                                       | -           |
| `--redis.host`         | `REDIS_HOST`         | Hostname or IP address of the Redis server.                      | `localhost` |
| `--redis.port`         | `REDIS_PORT`         | TCP port the Redis server listens on.                            | `6379`      |
| `--redis.user`         | `REDIS_USERNAME`     | Username for Redis authentication.                               | -           |
| `--redis.password`     | `REDIS_PASSWORD`     | Password for Redis authentication.                               | -           |
| `--redis.db`           | `REDIS_DB`           | Database index.                                                  | -           |
| `--redis.ssl`          | `REDIS_SSL`          | Enable TLS/SSL for the connection.                               | `false`     |
| `--redis.cert-file`    | `REDIS_CERT_FILE`    | Filename of the client cert under `redis/.pki/`. **(Deno only)** | -           |
| `--redis.cert-path`    | `REDIS_CERT_PATH`    | Full path to the client certificate file.                        | -           |
| `--redis.key-file`     | `REDIS_KEY_FILE`     | Filename of the client key under `redis/.pki/`. **(Deno only)**  | -           |
| `--redis.key-path`     | `REDIS_KEY_PATH`     | Full path to the client key file.                                | -           |
| `--redis.ca-cert-file` | `REDIS_CA_CERT_FILE` | Filename of the CA cert under `redis/.pki/`. **(Deno only)**     | -           |
| `--redis.ca-cert-path` | `REDIS_CA_CERT_PATH` | Full path to the CA cert file for Redis.                         | -           |

> [!WARNING]
> When using the **compiled executables** and if you want to specify **PKI
> files** such as a _client certificate_, a _client key_, or a _CA certificate_,
> you must specify those files using the options that expect **full paths**
> namely `--redis-cert-path`, `--redis-key-path`, or `--redis-ca-cert-path`
> instead of the options that expect only **local files** inside of the
> `redis/.pki` directory namely `--redis-cert-file`, `--redis-key-file`, or
> `--redis-ca-cert-file` because the local directory `redis/.pki` is no longer
> accessible by the compiled executables.

**Queue & Worker Options**

| CLI Flag                                  | Environment Variable                    | Description                                                                        | Default |
| :---------------------------------------- | :-------------------------------------- | :--------------------------------------------------------------------------------- | :------ |
| `--processing-workers-count`              | `PROCESSING_WORKERS_COUNT`              | Number of concurrent processing workers to spawn.                                  | `2`     |
| `--queue-batch-size`                      | `QUEUE_BATCH_SIZE`                      | Batch size for processing messages concurrently.                                   | `1`     |
| `--queue-max-retries`                     | `QUEUE_MAX_RETRIES`                     | Maximum number of retries per batch in case of an error.                           | `3`     |
| `--in-memory-processing-hwm`              | `IN_MEMORY_PROCESSING_HWM`              | High water mark for in-memory processing workers.                                  | `1`     |
| `--in-memory-insert-hwm`                  | `IN_MEMORY_INSERT_HWM`                  | High water mark for the in-memory insert worker.                                   | `1`     |
| `--worker-healthcheck-interval`           | `WORKER_HEALTHCHECK_INTERVAL`           | Interval for worker healthcheck in milliseconds.                                   | `10000` |
| `--worker-pending-min-duration-threshold` | `WORKER_PENDING_MIN_DURATION_THRESHOLD` | Threshold for claiming pending messages from Redis Streams' queue in milliseconds. | `60000` |
| `--xread-block-duration`                  | `XREAD_BLOCK_DURATION`                  | Duration in milliseconds for XREAD BLOCK calls in Redis Streams' queue.            | `5000`  |

#### Query sub-command: `query`:

**CLI Execution:** `mada-adm query <search>`\
**Local Execution:** `deno task cli:query <search>`

Queries the administrative boundaries data inside the database.

**Arguments:**

- `<search>`: The search term. Can be an **ADM territory name**, an **id**, or
  **geographic coordinates**. If passing coordinates, they must be **valid**
  geographic coordinates values; wrap them inside double quotes `""` if
  space-separated.

**Options:**

- `--type <type>`: The type of the query. Value: `name` (default), `id`, or
  `coordinates`. For `coordinates`, the search term must be **valid** geographic
  coordinates; wrap them inside double quotes `""` if space-separated.
- `--level <level>`: The administrative level to query (`province`, `region`,
  `district`, `commune`, `fokontany`). Required for **id** query type.
- `--page-size <pageSize>`: The number of records to return per page in the
  results of a query by **ADM territory name**.

Here is a recording of the `query` sub-command in action:

![Example of a query](/readme-images/query-sub-command.gif)

**Examples:**

This command searches for any ADM territory that starts with the word "Ambohi"
and returns 9 results per page:

```bash
deno task cli:query "Ambohi" --page-size 9
```

This command searches for the district with the **ID** of `6`:

```bash
deno task cli:query 6 --type id --level district
```

This command searches for the commune that is located at the geographic
coordinates `-18.9189 47.55295`:

```bash
deno task cli:query "-18.9189 47.55295" --type coordinates --level commune
```

#### Set database configuration sub-command: `set-config`:

**CLI Execution:** `mada-adm set-config`\
**Local Execution:** `deno task cli:set-config`

Interactively sets or updates the Mada ADM configuration stored in the database.

Here is a recording of the `set-config` sub-command in action:

![Example of the set-config command](/readme-images/set-config-sub-command.gif)

> **💡 Why use `set-config`?** This command is extremely useful for keeping
> different environments isolated. By changing the configuration (e.g. setting
> unique table prefixes), you can prevent different sets of tables or
> configurations from overriding each other. This allows you to work safely in
> the same database while running automated tests, performing experimentations,
> or maintaining separate project schemas without destructive interference.

#### Clear database sub-command: `clear`:

**CLI Execution:** `mada-adm clear`\
**Local Execution:** `deno task cli:clear`

Drops all ADM tables and the configuration table from the database, effectively
resetting the project state.

Here is a recording of the `clear` sub-command in action:

![Example of the clear command](/readme-images/clear-sub-command.gif)

#### Update a record's field sub-command: `update-field`:

**CLI Execution:** `mada-adm update-field <adm-level> <field> [options]`\
**Local Execution:** `deno task cli:update-field <adm-level> <field> [options]`

Updates a specific field (like names or spatial GeoJSON boundaries) of an
existing ADM record in the database.

**Arguments:**

- `<adm-level>`: The ADM level of the record (`province`, `region`, `district`,
  `commune`, `fokontany`).
- `<field>`: The specific field to update. Can be one of:
  - `value`: Updates the name/value of the administrative record (i.e., the
    `province` column for a province level, `region` for a region level, etc.).
  - `geojson`: Updates the spatial geometry of the administrative boundary.

**Value Options:**

- `--value <value>`: The literal value to set for the field.
- `--value-file <filename>`: Only applies to the update of the `geojson`
  geometry data field. It points to a file that contains the **geometry data
  (GeoJSON format)** that should be the new value of the `geojson` field. The
  provided file is expected to be found within the `commands/.args/` directory.
  By default, it looks for a file at `commands/.args/value.txt` if not provided.
- `--value-path <path>`: Same as `--value-file` but for a full absolute path to
  the **geometry data file**. When using the compiled CLI executable, only
  `--value-path <path>` must used instead of `--value-file <filename>` since the
  `commands/.args/` directory is no longer accessible when compiled.

> [!WARNING]
> The file provided by `--value-file` or `--value-path` must be a valid
> **GeoJSON Geometry** object (not a _Feature_ or _FeatureCollection_). If the
> provided data is not in the correct format, a validation error will be thrown.

Here are some samples of the **GeoJSON geometry data** that can be provided
inside the file specified by `--value-file` or `--value-path`:

When a **polygon** geometry is provided:

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [47.534, -18.879],
      [47.538, -18.879],
      [47.538, -18.883],
      [47.534, -18.883],
      [47.534, -18.879]
    ]
  ]
}
```

When a **multi-polygon** geometry is provided:

```json
{
  "type": "MultiPolygon",
  "coordinates": [
    [
      [
        [47.534, -18.879],
        [47.538, -18.879],
        [47.538, -18.883],
        [47.534, -18.883],
        [47.534, -18.879]
      ]
    ],
    [
      [
        [47.540, -18.885],
        [47.544, -18.885],
        [47.544, -18.889],
        [47.540, -18.889],
        [47.540, -18.885]
      ]
    ]
  ]
}
```

**Identification Options:**

Depending on the `<adm-level>` argument provided, you must provide the following
identifier options to correctly locate the administrative boundary:

| `<adm-level>` | Required Identifier Options                                        | Example                                                                                              |
| :------------ | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `province`    | `--province`                                                       | `--province "Antananarivo"`                                                                          |
| `region`      | `--region`                                                         | `--region "Analamanga"`                                                                              |
| `district`    | `--district`                                                       | `--district "Ambohidratrimo"`                                                                        |
| `commune`     | `--commune.value`, `--commune.district`                            | `--commune.value "Ivato" --commune.district "Ambohidratrimo"`                                        |
| `fokontany`   | `--fokontany.value`, `--fokontany.commune`, `--fokontany.district` | `--fokontany.value "Ivato Centre" --fokontany.commune "Ivato" --fokontany.district "Ambohidratrimo"` |

Here is a recording of the `update-field` sub-command in action:

![Example of the update-field command](/readme-images/update-field-sub-command.gif)

**Examples:**

- Updates the name of the `Antananarivo` province to `Tananarive`:
  ```bash
  deno task cli:update-field province value --province "Antananarivo" --value "Tananarive"
  ```
- Update the `geojson` field of the `Analamanga` region with the GeoJSON data
  contained in the `commands/.args/analamanga.json` file:
  ```bash
  deno task cli:update-field region geojson --region "Analamanga" --value-file "analamanga.json"
  ```
- Updates the name of the `Ambohidratrimo` district to `Ambohidratrimo New`:
  ```bash
  deno task cli:update-field district value --district "Ambohidratrimo" --value "Ambohidratrimo New"
  ```
- Updates the `geojson` field of the `Ivato` commune with the GeoJSON data
  contained in the `/tmp/ivato.json` file:
  ```bash
  deno task cli:update-field commune geojson --commune.value "Ivato" --commune.district "Ambohidratrimo"  --value-path "/tmp/ivato.json"
  ```
- Updates the name of the `Ivato Centre` fokontany to `Ivato City`:
  ```bash
  deno task cli:update-field fokontany value --fokontany.value "Ivato Centre" --fokontany.commune "Ivato" --fokontany.district "Ambohidratrimo" --value "Ivato City"
  ```

## REST API

The current **REST API** that lies inside the `rest-api/` directory is only
**limited** to the endpoints that are needed by the _**Map Viewer**_ web
application
([see here for more details](https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/tree/main/rest-api)).

It is possible that there may be a need to fully extend the REST API in the
future to support various flexible use cases for a general purpose
**administrative boundaries data API**.

To lauch the **REST API** server, you run:

```bash
deno task rest-api:start
```

## Map Viewer

A mini **web application** to **visualize** and **query** the seeded
administrative boundaries data onto a **map**. You can also **pin** custom
locations to the map.

![Landing page of the Map Viewer web app](/readme-images/landing-ss.PNG)

This is a workspace member of the project and its codebase can be found inside
the `map-viewer/` directory
([see here for more details](https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/tree/main/map-viewer)).

To start the **Map Viewer** server in development mode, you run:

```bash
deno task map-viewer:dev
```

> [!IMPORTANT]
> Make sure that the `FRESH_PUBLIC_REST_API_BASE_URL` **environment variable**
> is set to the actual **URL of the REST API** that feeds the **Map Viewer** web
> application.

To build the **Map Viewer** for production, you run:

```bash
deno task map-viewer:build
```

To start the **Map Viewer** server in **production mode**, you run:

```bash
deno task map-viewer:start
```

## Data catalogs

There are also **data catalogs** generated from the _seeding inputs_ that
represent the administrative boundaries data **in hierarachy** for each level in
both the **CSV** format and the **JSON** format. They can be found inside the
`data/catalogs/` directory
([see here for more details](https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/tree/main/data/catalogs)).

## Known Issues & Future Improvements

### Progress Bar Rendering:

The real-time terminal **progress bar** may occasionally **flicker** depending
on the terminal emulator and environment.

![Progress bar flickering](/readme-images/flicker.gif)

### Missing or Inaccurate datasets:

It is possible that some **official admnistrative boundaries data** are
**missing** from the original
[datasets](https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-madagascar).
In fact, there are reportedly between `1,693` and `1,695` official communes per
[wikipedia](https://fr.wikipedia.org/wiki/Commune_(Madagascar)) whereas the
original dataset only contains `1,579` communes. Thus, any **public data
contributions** or **clarifications** on these missing records are highly
welcome.

Also, **inaccuracies** might exist in the project's **inputs** data
(`data/inputs/` directory) and it can take one of the following ways:

- **Incomplete territory name**: We have noticed that some territories' names
  were **truncated** in other words **cut right at the middle of the words** to
  accommodate to a **certain text length**. For instance, instead of having
  `Tsararivotra Mandrosoa Ambohimandroso`, we would have an incomplete territory
  name like `Tsararivotra Mandrosoa Ambohi`.
- **Parent administrative subdivision territory mismatch**: It is possible that
  the **parent administrative subdivision territory** of a given territory does
  not match the actual territory found in the official records of the
  administrative subdivisions. For example, we could have a **district** named
  `Ambohidratrimo` in the **region** of `Bongolava` while its **official parent
  region** is `Analamanga`.

### Topological Data Inconsistencies:

The current official GeoJSON data for regions is **not fully topologically
inclusive** of the geometrical boundaries of the underlying districts. This
results in visual inconsistencies between these parent-child levels, likely due
to oversimplified or outdated source features.

In the images below, you can see how the boundaries of some districts (in
orange) slightly overflow from the boundaries of their parent region Analamanga
(in green).

![Topological boundaries inconsistencies between the region Analamanga and its
underlying districts 2](/readme-images/topo-icon-2.png)

![Topological boundaries inconsistencies between the region Analamanga and its
underlying districts 1](/readme-images/topo-icon-1.png)

> **💡 Note:** If you are in any capacity able to **contribute** to the project,
> whether it is a matter of introducing **changes to the codebase**, or
> contributing **missing or accurate data** to the project, you can do that by
> either submitting a **Pull Request (PR)**, opening an **issue**, or by
> **contacting us** directly.

### Full REST API

The current **REST API** that lies inside the `rest-api/` directory is only
**limited** to the endpoints that are needed by the _**Map Viewer**_ web
application. It is possible that there may be a need to fully extend the REST
API in the future to support various flexible use cases for a general purpose
**administrative boundaries data API**.

### Support for more database adapters

Currently, the project supports **PostgreSQL**, **SQLite**, **MySQL**, and
**MongoDB**. However, depending on the future needs for the support for other
database types such as
[Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) or
[Oracle Database](https://www.oracle.com/database), it may be necessary to
extend the project to support these databases.

## License & Attribution

### Software License

The source code of this project is licensed under the [MIT License](LICENSE).

### Data License & Attribution

The administrative boundary data distributed in this repository (found in
`data/geojson/`) is the **geoBoundaries Administrative Boundaries for
Madagascar**, sourced from the
[Humanitarian Data Exchange (HDX)](https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-madagascar).

All other data files (found in `data/ndjson/` and `data/inputs/`) are
**derived** from this original source through cleaning, optimization, and
transformation processes.

Each data directory contains a formal `LICENSE.md` file specifying these terms
in detail.

This data is made available under the **Open Data Commons Open Database License
(ODbL)**.

#### Requirements for Derived Works

If you use, distribute, or create derived works from the datasets provided in
this repository, you must:

1. **Attribute the original source**: Credit the geoBoundaries project and the
   Humanitarian Data Exchange.
2. **Attribute this repository**: Credit the **Mada ADM** project for the
   cleaning, optimization, and processing of the data.
3. **Share-Alike**: Any derived database must also be made available under the
   ODbL license.

---

_Note: This project is a utility tool intended for developers and data engineers
looking to integrate Madagascar's administrative data into their own
applications._
