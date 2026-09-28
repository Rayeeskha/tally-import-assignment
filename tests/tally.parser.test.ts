import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { parseTallyFile, parseTallyXml } from "../src/utils/tally.parser";

const fixture = (name: string) =>
  fs.readFileSync(`src/documents/Backend_Engineer_Tally_Take_Home_Candidate (1)/fixtures/${name}`);

test("keeps repeated ledger entries ordered", () => {
  const voucher = parseTallyXml(fixture("01_receipt_with_allocations.xml")).vouchers[0];
  assert.deepEqual(
    voucher.ledgerEntries.map((entry) => entry.ledgerName),
    ["Demo Bank", "Demo Customer"],
  );
});

test("keeps every parent amount", () => {
  const voucher = parseTallyXml(fixture("02_sales_invoice_nested.xml")).vouchers[0];
  assert.equal(voucher.ledgerEntries[0].amount, "-118.00");
  assert.equal(voucher.ledgerEntries[0].billAllocations[0].amount, "-118.00");
  assert.equal(voucher.inventoryEntries[0].amount, "100.00");
  assert.equal(voucher.inventoryEntries[0].batchAllocations[0].amount, "100.00");
  assert.equal(voucher.inventoryEntries[0].accountingAllocations[0].amount, "100.00");
});

test("recovers UTF-16 control references with a warning", () => {
  const parsed = parseTallyXml(fixture("04_utf16_invalid_control_ref.xml"));
  assert.equal(parsed.detectedEncoding, "UTF-16LE");
  assert.equal(parsed.warnings.length, 1);
});

test("streaming parser preserves UTF-16 sanitization warnings", async () => {
  const parsed = await parseTallyFile(
    "src/documents/Backend_Engineer_Tally_Take_Home_Candidate (1)/fixtures/04_utf16_invalid_control_ref.xml",
    async () => undefined,
  );
  assert.equal(parsed.warnings.length, 1);
});

test("rejects DTD and external entity declarations", () => {
  assert.throws(
    () =>
      parseTallyXml(
        Buffer.from(
          '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><RESPONSE><LINEERROR>&e;</LINEERROR></RESPONSE>',
        ),
      ),
    /DTD and external entity processing are not allowed|not valid XML/i,
  );
});

test("marks Tally business errors as failed", () => {
  assert.equal(
    parseTallyXml(fixture("03_tally_error_response.xml")).tallyResponse?.businessStatus,
    "failed",
  );
});

test("accepts empty collections", () => {
  assert.equal(parseTallyXml(fixture("05_empty_collection.xml")).summary.vouchers, 0);
});

test("warns on unknown children without crashing", () => {
  assert.equal(
    parseTallyXml(fixture("02_sales_invoice_nested.xml")).vouchers[0].warnings.length,
    1,
  );
});

test("uses exact bytes for duplicate identity", () => {
  const bytes = fixture("01_receipt_with_allocations.xml");
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
  );
});
