[] `Initializing Administrative Data pipeline` log in global action []
mada-adm-config table name to plural [] import remote modules first before local
modules in ts files [] Collation remarks in README [] Change MySQL collation to
utf8mb4_0900_as_ci and store it as a constant [] Replica set required for
MongoDB in README [] Explanation of processing worker and insert worker in README [] Fix not clearing context at the end of a job [] Rename build task to compile task

### Recently Completed Refactorings
- **Shared CLI Helper**: Created `promptMadaAdmConfig` in `helpers/cli.helper.ts` to centralize the interactive configuration flow.
- **DML Adapter Constructor Requirements**: Moved `admLevel` injection into the constructor for `BaseAdmTablePostgresDML`, `BaseAdmMySQLTableDML`, and `BaseAdmTableSqliteDML`. All derived DML classes (e.g. Regions, Districts) now pass their `AdmLevelCode` via `super()` and rely on class-level getters rather than method arguments.
