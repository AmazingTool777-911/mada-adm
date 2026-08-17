# REST API

This workspace member of the project is the **REST API** that queries the seeded
administrative boundaries data and was built using [Hono](https://honojs.dev/).

The entry point of the API is the `main.ts` file.

For information about the API endpoints, feel to look around this codebase, the
`routers/` for the routes definitions, as well as the `bruno/` folder to see the
API requests specifications. We plan to add more documentation in the future.

## Getting Started

1. Install the dependencies:

```bash
deno task install
```

2. Start the **REST API**:

```bash
deno task rest-api:start
```

## Environment Variables

| Variable Name   | Description                      | Default Value |
| :-------------- | :------------------------------- | :------------ |
| `REST_API_PORT` | The port the API will listen on. | `8000`        |

The environment variables that define the **database connection parameters** are
the same
[global options environment variables](https://github.com/AmazingTool777-911/madagascar-administrative-boundaries/tree/main#global-options--environment-variables)
that are used by the `mada-adm` **CLI** tool found in the root `.env` file or
provided through the **shell environment**.
