import FileValidationHandler from "./handlers/FileValidationHandler.js";
import ParseSpecHandler from "./handlers/ParseSpecHandler.js";
import ValidateExistingSchemaHandler from "./handlers/ValidateExistingSchemaHandler.js";
import UpdateSchemaHandler from "./handlers/UpdateSchemaHandler.js"; 

export function createEditChain() {
  const chain = new FileValidationHandler();
  chain
    .setNext(new ParseSpecHandler())
    .setNext(new ValidateExistingSchemaHandler())
    .setNext(new UpdateSchemaHandler()); 
  return chain;
}
