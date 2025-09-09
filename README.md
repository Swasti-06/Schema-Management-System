# Upload-Version-Schema-API

## 📦 Schema Management Service

A **Node.js service** to manage application API schemas (JSON/YAML).
Supports **uploading, updating, and fetching** schemas, with validation, version control, and file system + database persistence.

---

## 🚀 Tech Stack

* **Node.js (ESM)** – core runtime
* **Express.js** – REST API layer
* **SQLite (or configured DB)** – stores schema metadata
* **File System (fs)** – persists schema files (`/database/uploads`)
* **YAML / JSON parsing** – via `js-yaml` and native JSON parser
* **Chain of Responsibility Pattern** – modular request processing with handlers:

  * `ParseSpecHandler` – parse and validate schema
  * `ValidateDuplicateVersionHandler` – check duplicates on upload
  * `SaveSchemaHandler` – save schema to disk + DB
  * `ValidateExistingSchemaHandler` – check existing schema before edit
  * `UpdateSchemaHandler` – update schema file and DB record
  * `FetchSchemaHandler` – retrieve schema (latest or by version)
  * `ErrorHandler` – normalize exceptions

---

## 📂 Project Structure

```
.
├── controllers/              # Express controllers
├── database/                 # SQLite DB + SQL queries
├── routes/                   # API routes
├── services/
│   ├── handlers/             # Core business logic handlers
│   │   ├── BaseHandler.js
│   │   ├── ParseSpecHandler.js
│   │   ├── FileValidationHandler.js
│   │   ├── SaveSchemaHandler.js
│   │   ├── UpdateSchemaHandler.js
│   │   ├── FetchSchemaHandler.js
│   │   ├── ValidateExistingSchemaHandler.js
│   │   ├── GetSchemaValidationHandler.js
│   │   └── ExceptionHandler.js
│   ├── uploadChain.js        # Upload pipeline
│   ├── editChain.js          # Edit pipeline
│   └── getChain.js           # Fetch pipeline
├── specs/                    # Example schema specs
├── tests/                    # Unit tests (Jest)
│   ├── FetchSchemaHandler.test.js
│   ├── FileValidationHandler.test.js
│   ├── GetSchemaValidationHandler.test.js
│   ├── ParseSpecHandler.test.js
│   ├── SaveSchemaHandler.test.js
│   ├── UpdateSchemaHandler.test.js
│   └── ValidateExistingChemaHandler.test.js
├── cli.js                    # CLI entry point
├── index.js                  # Server entry point
├── package.json
└── README.md
```

---

## ⚡ CLI Usage

Schemas can be managed directly via CLI commands. Run from the **project root**.

### 1. Upload a schema

```bash
node cli.js upload <path-to-schema-file>
```

* Accepts `.json`, `.yaml`, `.yml`
* Extracts `info.title` (app name) and `info.version` (version)
* Prevents duplicate versions

### 2. Update an existing schema

```bash
node cli.js edit <path-to-schema-file>
```

* Requires `info.version` to already exist for the app
* Replaces schema file and updates DB record

### 3. Fetch a schema

* Get latest schema by app name:

```bash
node cli.js get <appName>
```

* Get specific version (long-form):

```bash
node cli.js get <appName> --spec-version <version>
```

* Get specific version (short-form):

```bash
node cli.js get <appName> -v <version>
```

---

## 🌐 API Endpoints

### Upload

```
POST /upload
Content-Type: multipart/form-data
Body: file=<schema.json|yaml>
```

### Update

```
POST /update
Content-Type: multipart/form-data
Body: file=<schema.json|yaml>
```

### Fetch Latest

```
GET /schema?appName=<appName>
```

### Fetch by Version

```
GET /schema?appName=<appName>&version=<version>
```

---

## 🛡 Error Handling

All errors follow a consistent structure:

```json
{
  "error": "DuplicateAppVersion",
  "details": "Version 1.0.0 already exists for app Flights_API"
}
```

Common error types:

* `DuplicateAppVersion`
* `MissingVersion`
* `AppVersionNotFound`
* `InvalidSpec`
* `FileMissing`
* `FileError`

---

## ⚙️ Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run a single test file:

```bash
npx mocha tests/YourTestFile.test.js

```

---

## 📌 Notes

* Schemas are stored under:
  `database/uploads/<appName>/v<version>.json|yaml`
* DB stores metadata (`id, app_name, app_version, file_path, created_at`)
* Rollback is implemented for upload/edit to ensure consistency between DB and filesystem

## 📌 Versioning Rules & App Naming Rules

* Version numbers are automatically normalized when uploading or fetching schemas.

* You can provide versions in any of these formats:
* 1 → normalized to 1.0.0
* 2.3 → normalized to 2.3.0
* 3.0.0 → stays 3.0.0
* This ensures consistent storage and lookup in the database and file system.

* App names are normalized before saving to disk.

* Spaces (" ") are treated the same as underscores ("_").
* Example:
* "Flight API" → "Flight_API"
* "Flight_API" → "Flight_API"
* This ensures folder and file paths remain safe and consistent.