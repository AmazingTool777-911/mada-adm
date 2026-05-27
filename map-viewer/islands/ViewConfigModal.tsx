import { Settings } from "lucide-preact";

export default function ViewConfigModal() {
  const label = "Database configuration";

  return (
    <div class="flex justify-center">
      <div className="tooltip tooltip-right" data-tip={label}>
        <button
          type="button"
          class="btn btn-circle btn-lg text-base-content/90 hover:text-base-content duration-300"
          aria-label={label}
        >
          <Settings />
        </button>
      </div>
    </div>
  );
}
