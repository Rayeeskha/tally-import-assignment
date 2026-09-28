export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const SUCCESS = {
  USER_REGISTER: "User registered successfully",
  USER_LOGIN: "User login successfully",
  USER_LOGOUT: "User logout successfully",
  HEALTH_MSG: "API Server healthy",
};

export const ERRORS = {
  TOKEN_REQUIRED: "Authorization token is required",
  TOKEN_LOGOUT: "Token has been logged out",
  INVALID_CREDENTIALS: "Invalid email or password",
  INVALID_TOKEN: "Invalid or expired token",
  MULTIPART_FILE_REQUIRED: "A multipart file field named 'file' is required",
  XML_UPLOADS_ONLY: "Only XML uploads are supported",
  UPLOAD_LIMIT_INVALID: "TALLY_MAX_UPLOAD_BYTES must be a positive safe integer",
  INVALID_XML: "The uploaded file is not valid XML",
  UNSUPPORTED_TALLY_ROOT: "Unsupported Tally XML root; expected ENVELOPE or RESPONSE",
  IMPORT_NOT_FOUND: "Import not found",
  INTERNAL_SERVER: "Internal server error",
  VALIDATION_FAILED: "validation failed",
  UPLOAD_LIMIT_NOT_CONFIGURED:
    "TALLY_MAX_UPLOAD_BYTES must be configured as a positive safe integer",
  REQUEST_TIMEOUT_NOT_CONFIGURED:
    "TALLY_REQUEST_TIMEOUT_MS must be configured as a positive safe integer",
  XML_EXTERNAL_ENTITIES_NOT_ALLOWED: "DTD and external entity processing are not allowed",
  UPLOAD_SIZE_EXCEEDED: "Uploaded file exceeds the configured size limit",
  UPLOAD_FIELD_INVALID: "Only one multipart XML field named 'file' is accepted",
  UPLOAD_REQUEST_INVALID: "The multipart upload request is invalid",
};

export const WARNINGS = {
  ILLEGAL_XML_CONTROLS_REMOVED: "Illegal XML control references were removed during decoding",
};
