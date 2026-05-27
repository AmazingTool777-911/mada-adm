import { ADM_LEVEL_TITLE_BY_CODE, AdmLevelCode } from "@scope/consts/models";
import type { MadaAdmConfigValues } from "@scope/types/models";

export type MadaAdmConfigConflictErrorData = {
  current: {
    admLevel: AdmLevelCode;
    title: string;
  };
  parent: {
    admLevel: AdmLevelCode;
    title: string;
  };
  config: Partial<MadaAdmConfigValues>;
};

export abstract class MadaAdmConfigConflictError extends Error {
  constructor(
    public readonly data: MadaAdmConfigConflictErrorData,
    message: string,
  ) {
    super(message);
  }
}

export class ForeignKeysNotRepeatedError extends MadaAdmConfigConflictError {
  constructor(
    currentAdmLevel: AdmLevelCode,
    parentAdmLevel: AdmLevelCode,
  ) {
    const currentAdmLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(currentAdmLevel)!;
    const parentAdmLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(parentAdmLevel)!;
    const message =
      `Cannot directly fetch the ${parentAdmLevelTitle}s of ${currentAdmLevelTitle}s because the foreign keys are not repeated in the database configuration.`;
    super(
      {
        current: {
          admLevel: currentAdmLevel,
          title: currentAdmLevelTitle,
        },
        parent: {
          admLevel: parentAdmLevel,
          title: parentAdmLevelTitle,
        },
        config: { isFkRepeated: false },
      },
      message,
    );
  }
}

export class ProvinceForeignKeyNotRepeatedError
  extends MadaAdmConfigConflictError {
  constructor(
    currentAdmLevel: AdmLevelCode,
  ) {
    const currentAdmLevelTitle = ADM_LEVEL_TITLE_BY_CODE.get(currentAdmLevel)!;
    const message =
      `Cannot directly fetch the provinces of ${currentAdmLevelTitle}s because the province foreign key is not repeated in the database configuration.`;
    super(
      {
        current: {
          admLevel: currentAdmLevel,
          title: currentAdmLevelTitle,
        },
        parent: {
          admLevel: AdmLevelCode.PROVINCE,
          title: ADM_LEVEL_TITLE_BY_CODE.get(AdmLevelCode.PROVINCE)!,
        },
        config: { isProvinceFkRepeated: false },
      },
      message,
    );
  }
}
