/** Public entry of the alcohol and tobacco service; the registration form renders here. */
export const ALCOHOL_PERMIT_SERVICE_PATH = '/alkoholtillstand';

/** An existing errand inside the service. */
export const errandPath = (errandNumber: string | undefined): string =>
  `${ALCOHOL_PERMIT_SERVICE_PATH}/arende/${errandNumber}/grundinformation`;
