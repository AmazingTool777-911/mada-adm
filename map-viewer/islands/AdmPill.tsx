import { AdmLevelCode } from "@scope/consts/models";

export type AdmPillProps<TValue = unknown> = {
  admLevelCode: AdmLevelCode;
  text: string;
  value?: TValue;
  badge?: string;
  closable?: boolean;
  onClick?: (admLevelCode: AdmLevelCode, value?: TValue) => void;
};

export default function AdmPill<TValue = unknown>(
  { admLevelCode, text, badge = "200", closable = false, value, onClick }:
    AdmPillProps<
      TValue
    >,
) {
  let colorClassName!: string;
  switch (admLevelCode) {
    case AdmLevelCode.PROVINCE:
      colorClassName = "btn-province";
      break;
    case AdmLevelCode.REGION:
      colorClassName = "btn-region";
      break;
    case AdmLevelCode.DISTRICT:
      colorClassName = "btn-district";
      break;
    case AdmLevelCode.COMMUNE:
      colorClassName = "btn-commune";
      break;
    case AdmLevelCode.FOKONTANY:
      colorClassName = "btn-fokontany";
      break;
    default:
      throw new Error(
        `Unknown adm level code for ADM pill component: ${admLevelCode satisfies never}`,
      );
  }

  return (
    <div
      class={`btn ${colorClassName} flex items-center gap-x-2`}
      style="border-radius: 1.25rem"
      onClick={() => onClick?.(admLevelCode, value)}
    >
      <span class="capitalize">
        {text}
      </span>
      {typeof badge === "string" && (
        <strong class="badge badge-sm badge-base-100">
          {badge}
        </strong>
      )}
      {closable && (
        <div class="tooltip tooltip-top" data-tip="Remove">
          <button
            type="button"
            aria-label="Remove"
            class="btn btn-xs btn-neutral"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
