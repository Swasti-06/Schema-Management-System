#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { normalizeVersion } from "./utils/normalizeVersions.js";

// Import your API functions
import { uploadSchema, editSchema, getSchema } from "./controllers/schemaControllers.js";

// Create a mock req/res for your Express-style handlers
function createReqRes(filePath, query = {}) {
  const req = { file: null, query };
  if (filePath) {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    req.file = {
      path: resolvedPath,
      originalname: path.basename(resolvedPath),
      buffer: fs.readFileSync(resolvedPath),
    };
  }

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      console.log(obj);
      return obj;
    },
  };

  return { req, res };
}

const program = new Command();

program
  .name("spec-cli")
  .description("CLI for managing OpenAPI/Schema specs")
  .version("1.0.0");

// --- Upload Command ---
program
  .command("upload <file>")
  .description("Upload a new spec")
  .action(async (file) => {
    try {
      const { req, res } = createReqRes(file);
      await uploadSchema(req, res);
      console.log("✅ Upload successful");
    } catch (err) {
      if (err?.message) console.error("❌ Upload failed:", err.message);
      else if (err?.error) console.error("❌ Upload failed:", err.error, "-", err.details || "");
      else console.error("❌ Upload failed:", err);
    }
  });

// --- Edit Command ---
program
  .command("edit <file>")
  .description("Edit/replace an existing spec")
  .action(async (file) => {
    try {
      const { req, res } = createReqRes(file);
      await editSchema(req, res);
      console.log("✅ Edit successful");
    } catch (err) {
      if (err?.message) console.error("❌ Edit failed:", err.message);
      else if (err?.error) console.error("❌ Edit failed:", err.error, "-", err.details || "");
      else console.error("❌ Edit failed:", err);
    }
  });

// CLI get command
program
  .command("get <appName>")
  .option("-v, --spec-version <version>", "specific version to fetch")
  .description("Get a spec by appName and optional version")
  .action(async (appName, cmdObj) => {
    try {
      // Pass the version string exactly
      const version = cmdObj.specVersion ? normalizeVersion(String(cmdObj.specVersion)) : undefined;
      const req = { query: { appName, version } };
      const res = {
        status(code) { this.statusCode = code; return this; },
        json(obj) { return obj; },
      };


      const result = await getSchema(req, null); // pass `null` for res
      console.log(`App: ${result.app_name}`);
      console.log(`Version: ${result.app_version}`);
      console.log(`File: ${result.file_path}`);
      console.log("Content preview:", result.content.slice(0, 300));

    } catch (err) {
      if (err?.error && err?.details) {
        console.error(`❌ Error: ${err.error} - ${err.details}`);
      } else if (err?.message) {
        console.error(`❌ Error: ${err.message}`);
      } else {
        console.error("❌ Unknown error", err);
      }
    }
  });


program.parse(process.argv);
