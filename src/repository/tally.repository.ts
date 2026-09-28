import { UniqueConstraintError } from "sequelize";
import Database from "../database";
import { ParsedImport, Voucher } from "../interfaces/tally.types";
import TallyImport from "../models/tally_import.model";
import TallyAllocation from "../models/tally_allocation.model";
import TallyInventoryEntry from "../models/tally_inventory.model";
import TallyLedgerEntry from "../models/tally_edger.model";
import TallyVoucher from "../models/tally_voucher.model";

export type ImportRecord = {
  id: number;
  importId: string;
  documentType: string;
  status: string;
  contentHash: string;
  detectedEncoding: string;
  summary: ParsedImport["summary"];
  warnings: string[];
  errors: string[];
  tallyResponse?: ParsedImport["tallyResponse"];
};

export class TallyRepository {
  private constructor() {}

  static async createProcessing(record: ImportRecord, sourcePath: string): Promise<boolean> {
    try {
      await TallyImport.create({
        importId: record.importId,
        contentHash: record.contentHash,
        documentType: record.documentType,
        status: "processing",
        detectedEncoding: record.detectedEncoding,
        summaryJson: JSON.stringify({
          vouchers: 0,
          ledgerEntries: 0,
          inventoryEntries: 0,
          warnings: 0,
          errors: 0,
        }),
        warningsJson: "[]",
        errorsJson: "[]",
        tallyResponseJson: null,
        rawSource: null,
        rawSourcePath: sourcePath,
      } as any);
      return true;
    } catch (error) {
      if (
        error instanceof UniqueConstraintError &&
        (await TallyRepository.findByHash(record.contentHash))
      )
        return false;
      throw error;
    }
  }

  static async appendVoucherChunk(importId: string, vouchers: Voucher[]): Promise<void> {
    await Database.transaction(async (transaction) => {
      for (const voucher of vouchers) {
        const savedVoucher = await TallyVoucher.create(
          {
            importId,
            voucherIndex: voucher.source.voucherIndex,
            dataJson: JSON.stringify(voucher),
          } as any,
          { transaction },
        );
        for (const [entryIndex, entry] of voucher.ledgerEntries.entries()) {
          const savedEntry = await TallyLedgerEntry.create(
            {
              voucherId: savedVoucher.id,
              sourceTag: entry.sourceTag,
              entryIndex,
              dataJson: JSON.stringify(entry),
            } as any,
            { transaction },
          );
          const allocations = [
            ...entry.billAllocations.map((data) => ({ type: "bill", data })),
            ...entry.bankAllocations.map((data) => ({ type: "bank", data })),
          ];
          await TallyAllocation.bulkCreate(
            allocations.map(
              (allocation, allocationIndex) =>
                ({
                  ledgerEntryId: savedEntry.id,
                  inventoryEntryId: null,
                  allocationType: allocation.type,
                  allocationIndex,
                  dataJson: JSON.stringify(allocation.data),
                }) as any,
            ),
            { transaction },
          );
        }
        for (const [entryIndex, entry] of voucher.inventoryEntries.entries()) {
          const savedEntry = await TallyInventoryEntry.create(
            {
              voucherId: savedVoucher.id,
              entryIndex,
              dataJson: JSON.stringify(entry),
            } as any,
            { transaction },
          );
          const allocations = [
            ...entry.batchAllocations.map((data) => ({ type: "batch", data })),
            ...entry.accountingAllocations.map((data) => ({
              type: "accounting",
              data,
            })),
          ];
          await TallyAllocation.bulkCreate(
            allocations.map(
              (allocation, allocationIndex) =>
                ({
                  ledgerEntryId: null,
                  inventoryEntryId: savedEntry.id,
                  allocationType: allocation.type,
                  allocationIndex,
                  dataJson: JSON.stringify(allocation.data),
                }) as any,
            ),
            { transaction },
          );
        }
      }
    });
  }

  static async completeProcessing(
    importId: string,
    parsed: Pick<
      ParsedImport,
      "detectedEncoding" | "summary" | "warnings" | "errors" | "tallyResponse"
    >,
  ): Promise<void> {
    await TallyImport.update(
      {
        status: "completed",
        detectedEncoding: parsed.detectedEncoding,
        summaryJson: JSON.stringify(parsed.summary),
        warningsJson: JSON.stringify(parsed.warnings),
        errorsJson: JSON.stringify(parsed.errors),
        tallyResponseJson: parsed.tallyResponse ? JSON.stringify(parsed.tallyResponse) : null,
      } as any,
      { where: { importId } },
    );
  }

  static async findByHash(hash: string): Promise<ImportRecord | null> {
    const record = await TallyImport.findOne({ where: { contentHash: hash } });
    return record ? TallyRepository.map(record) : null;
  }
  static async find(importId: string): Promise<ImportRecord | null> {
    const record = await TallyImport.findOne({
      where: { importId },
    });

    console.log("DB RECORD:", record?.toJSON());

    const mapped = record ? TallyRepository.map(record) : null;

    console.log("MAPPED RECORD:", mapped);

    return mapped;
  }
  static async vouchers(importId: string): Promise<Voucher[]> {
    const rows = await TallyVoucher.findAll({
      where: { importId },
      order: [["voucherIndex", "ASC"]],
      attributes: ["dataJson"],
    });
    return rows.map((row) => JSON.parse(row.dataJson));
  }
  private static map(row: TallyImport): ImportRecord {
    return {
      id: row.id,
      importId: row.importId,
      documentType: row.documentType,
      status: row.status,
      contentHash: row.contentHash,
      detectedEncoding: row.detectedEncoding,
      summary: JSON.parse(row.summaryJson),
      warnings: JSON.parse(row.warningsJson),
      errors: JSON.parse(row.errorsJson),
      tallyResponse: row.tallyResponseJson ? JSON.parse(row.tallyResponseJson) : undefined,
    };
  }
}
