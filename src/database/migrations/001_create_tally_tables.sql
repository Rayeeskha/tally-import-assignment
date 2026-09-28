CREATE TABLE IF NOT EXISTS tally_imports (
  import_id CHAR(36) NOT NULL PRIMARY KEY,
  content_hash CHAR(64) NOT NULL UNIQUE,
  document_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL,
  detected_encoding VARCHAR(32) NOT NULL,
  summary_json LONGTEXT NOT NULL,
  warnings_json LONGTEXT NOT NULL,
  errors_json LONGTEXT NOT NULL,
  tally_response_json LONGTEXT NULL,
  raw_source LONGBLOB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tally_vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  import_id CHAR(36) NOT NULL,
  voucher_index INT UNSIGNED NOT NULL,
  data_json LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tally_voucher_order (import_id, voucher_index),
  CONSTRAINT fk_tally_voucher_import FOREIGN KEY (import_id) REFERENCES tally_imports(import_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tally_ledger_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  voucher_id BIGINT UNSIGNED NOT NULL,
  source_tag VARCHAR(64) NOT NULL,
  entry_index INT UNSIGNED NOT NULL,
  data_json LONGTEXT NOT NULL,
  CONSTRAINT fk_tally_ledger_voucher FOREIGN KEY (voucher_id) REFERENCES tally_vouchers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tally_inventory_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  voucher_id BIGINT UNSIGNED NOT NULL,
  entry_index INT UNSIGNED NOT NULL,
  data_json LONGTEXT NOT NULL,
  CONSTRAINT fk_tally_inventory_voucher FOREIGN KEY (voucher_id) REFERENCES tally_vouchers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tally_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ledger_entry_id BIGINT UNSIGNED NULL,
  inventory_entry_id BIGINT UNSIGNED NULL,
  allocation_type VARCHAR(32) NOT NULL,
  allocation_index INT UNSIGNED NOT NULL,
  data_json LONGTEXT NOT NULL,
  CONSTRAINT fk_tally_allocation_ledger FOREIGN KEY (ledger_entry_id) REFERENCES tally_ledger_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_tally_allocation_inventory FOREIGN KEY (inventory_entry_id) REFERENCES tally_inventory_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB;