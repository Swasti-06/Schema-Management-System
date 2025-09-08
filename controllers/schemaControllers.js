import { createUploadChain } from "../services/uploadChain.js";
import { createEditChain } from "../services/editChain.js";
import { createGetChain } from "../services/getChain.js";

export async function uploadSchema(req, res) { 
  try {
    const chain = createUploadChain();
    await chain.handle(req);

    // Success response
    res.status(201).json({
      message: "Schema uploaded successfully",
      data: req.savedRecord
    });

    // Return the saved record for CLI or other callers
    return req.savedRecord;

  } catch (err) {
    // Structured errors from handlers
    if (err?.error && err?.details) {
      res.status(400).json({
        error: err.error,
        details: err.details
      });
    } else {
      // Fallback
      res.status(400).json({ error: err.message || "Unknown error" });
    }

    // Re-throw so CLI can detect failure
    throw err;
  }
}


export async function editSchema(req, res) {
  try {
    const chain = createEditChain();
    await chain.handle(req);

    res.status(200).json({
      message: req.existingRecord
        ? "Schema replaced and timestamp updated"
        : "Schema uploaded as new record",
      data: {
        appName: req.appName,
        app_version: req.app_version,   // removed fallback to internal version
        filePath: req.filePath
      }
    });
  } catch (err) {
    if (err?.error && err?.details) {
      return res.status(400).json(err);
    }
    res.status(400).json({ error: err.message || "Unknown error" });
  }
}


export async function getSchema(req, res) {
  try {
    const chain = createGetChain();
    await chain.handle(req);

    const { schemaRow, schemaContent } = req;

    const response = {
      app_name: schemaRow.app_name,
      app_version: schemaRow.app_version,
      created_at: schemaRow.created_at,
      file_path: schemaRow.file_path,
      content: schemaContent,
    };

    // Send JSON if res is provided (Express)
    if (res) {
      res.status(200).json(response);
    }

    // Return the data for CLI or other callers
    return response;

  } catch (err) {
    if (res) {
      res.status(400).json(err);
    }
    throw err; // re-throw for CLI
  }
}

