import { Settings } from "lucide-preact";

export default function ViewConfigModal() {
  const label = "View the database configuration";

  return (
    <div class="flex justify-center">
      <div className="tooltip tooltip-right" data-tip={label}>
        <button
          type="button"
          class="btn btn-circle btn-lg"
          aria-label={label}
        >
          <Settings />
        </button>
      </div>
    </div>
  );
}
