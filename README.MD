# Tally XML Ingestion API

A production-oriented Node.js API for ingesting Tally XML exports, parsing voucher data using a streaming SAX parser, normalizing the data into MySQL, and exposing APIs for import status and voucher retrieval.

The implementation focuses on:

- Streaming XML processing
- Bounded memory usage
- Idempotent imports
- Transactional persistence
- Duplicate file detection
- Authentication and authorization
- Input validation
- Secure XML parsing
- Swagger/OpenAPI documentation
- Scalable database design
- Large-file processing considerations

---

## Tech Stack

- **Node.js**
- **TypeScript**
- **Express.js**
- **MySQL**
- **Sequelize**
- **JWT Authentication**
- **bcrypt**
- **Multer**
- **SAX XML Parser**
- **Swagger / OpenAPI**
- **Jest** _(if applicable)_

---

# Getting Started

## Prerequisites

Make sure the following are installed:

- Node.js 18+
- npm
- MySQL 8+

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Environment Configuration

Copy the example environment file:

cp .env.example .env

Configure the required database, JWT, upload, and seed credentials in .env.

Example:

DB_HOST=localhost
DB_PORT=3306
DB_NAME=tally
DB_USER=root
DB_PASSWORD=your-password

JWT_SECRET=your-jwt-secret

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your-seed-password

TALLY_MAX_UPLOAD_BYTES=10485760

Database Setup

Create the configured MySQL database:

CREATE DATABASE tally
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

Run database migrations:

npm run migrate

The migration process applies pending SQL files from:

src/database/migrations

Runtime repositories do not create or alter database tables.

Seed Admin User

Create the initial admin user:

npm run seed:admin

The seed operation is idempotent:

Existing users are not replaced.
Passwords are stored only as bcrypt hashes.
The password is not printed to the console.
Start the Application

Development mode:

npm run dev

The API will be available at:

http://localhost:3000
Authentication

The protected Tally endpoints require a JWT access token.

Login
curl -X POST http://localhost:3000/api/auth/signin \
-H "Content-Type: application/json" \
-d '{
"email": "admin@example.com",
"password": "your-seed-password"
}'

Example response:

{
"accessToken": "YOUR_ACCESS_TOKEN"
}

Use the returned access token for authenticated requests.

API Endpoints
Method Endpoint Authentication Description
GET /health No Health check
POST /api/auth/signin No Authenticate admin user
POST /api/tally/imports Yes Upload and import Tally XML
GET /api/tally/imports/:importId Yes Get import details
GET /api/tally/imports/:importId/vouchers Yes Retrieve imported vouchers
Tally XML Import

Upload a Tally XML export using multipart form-data.

The expected multipart field name is:

file

Example:

curl -X POST http://localhost:3000/api/tally/imports \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-F "file=@path/to/export.xml"

The import pipeline performs the following steps:

Upload XML
↓
Validate Request
↓
SHA-256 Hash
↓
Duplicate Detection
↓
Streaming XML Parser
↓
Voucher Normalization
↓
Transactional Persistence
↓
Import Result
XML Parsing

The application uses a streaming SAX parser rather than loading the entire XML document into memory.

This provides bounded memory usage when processing large Tally exports.

The parser:

Reads XML incrementally.
Processes one voucher boundary at a time.
Uses 16 KiB parsing chunks.
Does not load the complete XML document into memory.
Rejects unsupported XML roots.
Disables external entity processing.
Does not execute XML content.
Returns structured validation errors.
Avoids exposing internal stack traces or filesystem paths.

Both supported XML root formats are handled according to the documented Tally response/export structure:

<ENVELOPE>
    ...
</ENVELOPE>

and:

<RESPONSE>
    ...
</RESPONSE>
Import Persistence

Normalized data is stored in relational MySQL tables representing:

Imports
Vouchers
Ledger entries
Inventory entries
Allocations
Source-order indexes

The persistence flow is intentionally separated from HTTP and parsing concerns.

Responsibilities
Controller
↓
Application / Import Service
↓
XML Parser
↓
Repository
↓
Sequelize
↓
MySQL

The main responsibilities are:

Controller

Handles:

HTTP requests
Authentication context
Multipart uploads
HTTP responses
Request validation
Parser

Handles:

XML streaming
XML validation
Voucher extraction
Data normalization
Repository

Handles:

Database queries
Transactions
Persistence
Import/voucher retrieval
Migrations

Own:

Database schema
Indexes
Constraints
Schema evolution
Idempotency and Duplicate Imports

Uploaded XML files are hashed using SHA-256.

The source hash is uniquely constrained in MySQL.

This prevents the same uploaded file from being imported multiple times.

Example:

XML File
↓
SHA-256
↓
Source Hash
↓
Unique Constraint
↓
Duplicate Detection

This provides application-level idempotency for repeated uploads of the same source file.

Transaction Handling

Voucher persistence is performed in bounded transaction chunks.

The current implementation commits approximately:

25 vouchers / transaction

This prevents a single transaction from growing indefinitely for large imports while maintaining transactional consistency for each persistence chunk.

Large File Handling

The implementation is designed with large Tally exports in mind.

For example, a 500 MB XML file is not loaded completely into application memory.

The upload and processing flow uses bounded operations:

HTTP Upload
↓
Multer Disk Storage
↓
Streaming SAX Parser
↓
Voucher Boundary
↓
Persistence Callback
↓
Next Voucher
Upload Limits

Uploads default to:

10 MiB

The limit can be configured using:

TALLY_MAX_UPLOAD_BYTES=10485760

Multer disk storage is used instead of unbounded in-memory storage.

The processing pipeline also applies backpressure so that database processing does not unnecessarily outrun the XML parser.
