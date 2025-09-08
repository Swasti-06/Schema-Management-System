import GetSchemaValidationHandler from "./handlers/GetSchemaValidationHandler.js";
import FetchSchemaHandler from "./handlers/FetchSchemaHandler.js";

export function createGetChain() {
  const validation = new GetSchemaValidationHandler();
  const coreHandler = new FetchSchemaHandler();

  validation.setNext(coreHandler);

  return validation;
}
