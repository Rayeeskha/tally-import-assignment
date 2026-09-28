import { ImportRecord } from "../repository/tally.repository";
import { Voucher } from "../interfaces/tally.types";

export class TallyResource {
  static transformImport(record: ImportRecord) {
    return {
      id: record.id,
      importId: record.importId,
      documentType: record.documentType,
      status: record.status,
      contentHash: record.contentHash,
      detectedEncoding: record.detectedEncoding,
      summary: record.summary,
      warnings: record.warnings,
      errors: record.errors,
      ...(record.tallyResponse && { tallyResponse: record.tallyResponse }),
    };
  }

  static transformImportResult(record: ImportRecord, duplicate: boolean) {
    const details = TallyResource.transformImport(record);
    return {
      importId: details.importId,
      documentType: details.documentType,
      status: details.status,
      duplicate,
      summary: details.summary,
    };
  }

  static transformVouchers(items: Voucher[]) {
    return { items, count: items.length };
  }
}
