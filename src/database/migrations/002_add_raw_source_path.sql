ALTER TABLE tally_imports MODIFY raw_source LONGBLOB NULL;
ALTER TABLE tally_imports ADD COLUMN raw_source_path VARCHAR(512) NULL;