import AdmExplorerPageCountsPills from "@/islands/AdmExplorerPageCountsPills.tsx";

export default function AdmPage() {
  return (
    <main>
      <header class="mb-5">
        <h1 class="font-bold text-lg mb-2">Administrative explorer</h1>
        <p class="text-sm text-base-content/90">
          Discover and query the hierarchical administrative boundaries of
          Madagascar, from major <strong>provinces</strong> down to localized
          {" "}
          <strong>fokontanys</strong>. Use the tools below to check{" "}
          <strong>total counts</strong>{" "}
          or look up specific territories using our{" "}
          <strong>flexible search modes</strong>.
        </p>
      </header>
      <section
        aria-labelledby="territory-distribution-summary-title"
        data-theme="adm"
      >
        <h2 id="territory-distribution-summary-title" class="font-bold mb-2">
          Territory Distribution Summary
        </h2>
        <p className="text-base-content/90 text-sm mb-4">
          A high-level overview of the total recorded administrative divisions
          currently mapped across Madagascar.
        </p>
        <AdmExplorerPageCountsPills />
      </section>
    </main>
  );
}
