import { createReadStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { ParsedImport, Voucher } from "../interfaces/tally.types";
import { ImportRecord, TallyRepository } from "../repository/tally.repository";
import { parseTallyFile } from "../utils/tally.parser";
import { ERRORS } from "../constants";

export class TallyService {
  private static readonly CHUNK_SIZE = 25;

  static async importFile(filePath: string): Promise<{ record: ImportRecord; duplicate: boolean }> {
    const contentHash = await TallyService.hashFile(filePath);
    const existing = await TallyRepository.findByHash(contentHash);
    if (existing) return { record: existing, duplicate: true };
    const importId = randomUUID();
    const created = await TallyRepository.createProcessing(
      TallyService.initialRecord(importId, contentHash),
      filePath,
    );
    if (!created)
      return {
        record: (await TallyRepository.findByHash(contentHash))!,
        duplicate: true,
      };
    let chunk: Voucher[] = [];
    const parsed = await parseTallyFile(filePath, async (voucher, voucherIndex) => {
      chunk.push({
        ...voucher,
        source: { importId, contentHash, voucherIndex },
      });
      if (chunk.length >= TallyService.CHUNK_SIZE) {
        await TallyRepository.appendVoucherChunk(importId, chunk);
        chunk = [];
      }
    });
    if (chunk.length) await TallyRepository.appendVoucherChunk(importId, chunk);
    await TallyRepository.completeProcessing(importId, parsed);
    return {
      record: (await TallyRepository.findByHash(contentHash))!,
      duplicate: false,
    };
  }

  static async getImport(importId: string): Promise<ImportRecord> {
    const record = await TallyRepository.find(importId);
    if (!record)
      throw Object.assign(new Error(ERRORS.IMPORT_NOT_FOUND), {
        statusCode: 404,
      });
    return record;
  }

  static async getVouchers(importId: string): Promise<Voucher[]> {
    const record = await TallyService.getImport(importId);
    return TallyRepository.vouchers(record.importId);
  }

  private static initialRecord(importId: string, contentHash: string): ImportRecord {
    return {
      id: 0,
      importId,
      contentHash,
      documentType: "voucherExport",
      status: "processing",
      detectedEncoding: "unknown",
      summary: {
        vouchers: 0,
        ledgerEntries: 0,
        inventoryEntries: 0,
        warnings: 0,
        errors: 0,
      },
      warnings: [],
      errors: [],
    };
  }

  private static hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(hash.digest("hex")));
    });
  }
}
