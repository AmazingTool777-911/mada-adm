import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import AdmLevelDataSourceCard from "@/components/AdmLevelDataSourceCard.tsx";
import DataSourcesPageCacheStatus from "@/islands/DataSourcesPageCacheStatus.tsx";
import { ADM_GEOJSON_DATA_SOURCE_BY_CODE } from "@/consts/adm-geojson.consts.ts";

export default function DataSourcesPage() {
  return (
    <div>
      <main>
        <header class="mb-5">
          <h1 class="font-bold text-lg mb-2">Data sources</h1>
          <p class="text-sm text-base-content/90">
            The map features displayed here are managed by the{" "}
            <a
              href="https://github.com/AmazingTool777-911/madagascar-administrative-boundaries"
              target="_blank"
              class="link link-primary"
            >
              Mada ADM app
            </a>. The primary spatial data is sourced from the{" "}
            <a
              href="https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-madagascar"
              target="_blank"
              class="link link-primary"
            >
              geoBoundaries Open License Dataset for Madagascar via HDX
            </a>, referencing the specific files maintained in the{" "}
            <a
              href="https://github.com/wmgeolab/geoBoundaries/tree/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/MDG"
              target="_blank"
              class="link link-primary"
            >
              geoBoundaries GitHub Repository
            </a>.
          </p>
        </header>
        <section
          aria-labelledby="layers-title"
          aria-describedby="layers-description"
          class="pb-4 space-y-6"
        >
          <header>
            <h2 id="layers-title" class="font-bold text-base mb-2">
              Layers
            </h2>
            <p
              id="layers-description"
              class="text-sm mb-1 text-base-content/90"
            >
              These baseline files that we refer to as{" "}
              <strong class="italic">layers</strong> have been organized into
              {" "}
              <strong>5 distinct tiers</strong>{" "}
              in order to establish a complete hierarchy according to{" "}
              <a
                href="https://en.wikipedia.org/wiki/List_of_administrative_divisions_by_country"
                target="_blank"
                class="link link-primary"
              >
                Madagascar's administrative divisions
              </a>:
            </p>
            <ol
              start={0}
              class="m-0 p-0 pl-4 list-decimal list-inside text-sm mb-4"
            >
              {ADM_GEOJSON_DATA_SOURCE_BY_CODE.entries().toArray().map((
                [admLevelCode, { previewURL }],
              ) => (
                <li key={admLevelCode}>
                  <a
                    href={previewURL}
                    target="_blank"
                    class="link link-primary capitalize"
                  >
                    {ADM_LEVEL_TITLE_BY_CODE.get(admLevelCode)!}s
                  </a>
                </li>
              ))}
            </ol>
          </header>
          <DataSourcesPageCacheStatus />
          {[
            {
              admLevelCode: AdmLevelCode.PROVINCE,
              body: (
                <>
                  Represents the official{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Provinces_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    provinces boundaries of Madagascar
                  </a>. Since the province tier is not present in the original
                  {" "}
                  <a
                    href="https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    geoBoundaries
                  </a>{" "}
                  dataset, its layer consists of custom generated data by the
                  {" "}
                  <a
                    href="https://github.com/AmazingTool777-911/madagascar-administrative-boundaries"
                    target="_blank"
                    class="link link-primary"
                  >
                    Mada ADM app
                  </a>{" "}
                  resulting from the grouping of the spatial features of their
                  respective underlying regions.
                </>
              ),
            },
            {
              admLevelCode: AdmLevelCode.REGION,
              body: (
                <>
                  Represents the official{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Regions_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    regional boundaries of Madagascar
                  </a>{" "}
                  as provided by the original{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Regions_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    geoBoundaries
                  </a>{" "}
                  repository.
                </>
              ),
            },
            {
              admLevelCode: AdmLevelCode.DISTRICT,
              body: (
                <>
                  Represents the official{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Districts_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    district boundaries of Madagascar
                  </a>{" "}
                  as provided by the original{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Regions_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    geoBoundaries
                  </a>{" "}
                  repository.
                </>
              ),
            },
            {
              admLevelCode: AdmLevelCode.COMMUNE,
              body: (
                <>
                  Represents the official{" "}
                  <a
                    href="https://fr.wikipedia.org/wiki/Commune_(Madagascar)"
                    target="_blank"
                    class="link link-primary"
                  >
                    commune boundaries of Madagascar
                  </a>{" "}
                  as provided by the original{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Regions_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    geoBoundaries
                  </a>{" "}
                  repository.
                </>
              ),
            },
            {
              admLevelCode: AdmLevelCode.FOKONTANY,
              body: (
                <>
                  Represents the official{"  "}
                  <a
                    href="https://fr.wikipedia.org/wiki/Fokontany"
                    target="_blank"
                    class="link link-primary"
                  >
                    fokontany boundaries of Madagascar
                  </a>{" "}
                  as provided by the original{" "}
                  <a
                    href="https://en.wikipedia.org/wiki/Regions_of_Madagascar"
                    target="_blank"
                    class="link link-primary"
                  >
                    geoBoundaries
                  </a>{" "}
                  repository.
                </>
              ),
            },
          ].map(({ admLevelCode, body }) => (
            <AdmLevelDataSourceCard
              admLevelCode={admLevelCode}
              body={body}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
