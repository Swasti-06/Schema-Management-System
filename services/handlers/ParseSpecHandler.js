import Handler from "./BaseHandler.js";
import yaml from "js-yaml";
import ExceptionHandler from "./ExceptionHandler.js";

export default class ParseSpecHandler extends Handler {
  async handle(req) {
    try {
      const text = req.file.buffer.toString("utf8").trim();
      let parsed;

      try {
        parsed = JSON.parse(text);
      } catch (jsonErr) {
        try {
          parsed = yaml.load(text);
        } catch (yamlErr) {
          throw {
            error: "InvalidFile",
            details: yamlErr?.message || jsonErr?.message || "Unknown parsing error",
          };
        }
      }

      if (!parsed.info || !parsed.info.title) {
        throw { error: "InvalidSpec", details: "Missing 'info.title' in the file" };
      }

      if (!parsed.info.version) {
        throw { error: "MissingAppVersion", details: "info.version is required and cannot be empty" };
      }

      req.parsedSpec = parsed;
      req.appName = parsed.info.title.replace(/\s+/g, "_");
      req.app_version = parsed.info.version;

      return super.handle(req);

    } catch (err) {
      const formatted = ExceptionHandler.handle(err);
      throw formatted;
    }
  }
}
