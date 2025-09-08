import FileValidationHandler from "./handlers/FileValidationHandler.js";
import ParseSpecHandler from "./handlers/ParseSpecHandler.js";
import SaveSchemaHandler from "./handlers/SaveSchemaHandler.js";

export function createUploadChain() {
  const chain = new FileValidationHandler();
  chain
    .setNext(new ParseSpecHandler())
    .setNext(new SaveSchemaHandler());
  return chain;
}
