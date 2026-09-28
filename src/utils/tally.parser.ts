import { XMLParser } from "fast-xml-parser";
import { createReadStream } from "node:fs";
import sax from "sax";
import { ERRORS, WARNINGS } from "../constants";
import {
  InventoryEntry,
  LedgerEntry,
  ParsedImport,
  RateDetail,
  Summary,
  Voucher,
} from "../interfaces/tally.types";

type XmlNode = Record<string, unknown>;
const isElement = (item: unknown): item is XmlNode =>
  typeof item === "object" &&
  item !== null &&
  Object.keys(item as object).some((key) => key !== "#text" && key !== ":@");
const directChildren = (node: XmlNode): XmlNode[] =>
  Object.entries(node).flatMap(([key, value]) =>
    key !== ":@" && Array.isArray(value) ? value.filter(isElement) : [],
  );
const list = (children: XmlNode[], name: string): XmlNode[] =>
  children.filter((child) => Object.hasOwn(child, name));
const value = (children: XmlNode[], name: string): string | null => {
  const node = children.find((child) => Object.hasOwn(child, name));
  const result = node?.[name];
  if (typeof result === "string" || typeof result === "number") return String(result);
  if (Array.isArray(result)) {
    const text = result.find(
      (item) => typeof item === "object" && item !== null && Object.hasOwn(item, "#text"),
    )?.["#text"];
    return typeof text === "string" || typeof text === "number" ? String(text) : null;
  }
  return null;
};
const getAttributes = (node: XmlNode): Record<string, string> => {
  const raw = node[":@"];
  return raw && typeof raw === "object"
    ? Object.fromEntries(
        Object.entries(raw)
          .filter(([, item]) => typeof item === "string")
          .map(([key, item]) => [key.replace(/^@_/, ""), item as string]),
      )
    : {};
};
const parseRates = (children: XmlNode[]): RateDetail[] =>
  list(children, "RATEDETAILS.LIST").map((node) => {
    const fields = directChildren(node);
    return {
      dutyHead: value(fields, "GSTRATEDUTYHEAD"),
      rate: value(fields, "GSTRATE"),
    };
  });

const parseLedger = (node: XmlNode, sourceTag: LedgerEntry["sourceTag"]): LedgerEntry => {
  const fields = directChildren(node);
  return {
    sourceTag,
    ledgerName: value(fields, "LEDGERNAME"),
    isDeemedPositive: value(fields, "ISDEEMEDPOSITIVE"),
    amount: value(fields, "AMOUNT"),
    billAllocations: list(fields, "BILLALLOCATIONS.LIST").map((item) => {
      const children = directChildren(item);
      return {
        name: value(children, "NAME"),
        billType: value(children, "BILLTYPE"),
        amount: value(children, "AMOUNT"),
      };
    }),
    bankAllocations: list(fields, "BANKALLOCATIONS.LIST").map((item) => {
      const children = directChildren(item);
      return {
        date: value(children, "DATE"),
        name: value(children, "NAME"),
        transactionType: value(children, "TRANSACTIONTYPE"),
        amount: value(children, "AMOUNT"),
      };
    }),
    rateDetails: parseRates(fields),
  };
};
const parseInventory = (node: XmlNode): InventoryEntry => {
  const fields = directChildren(node);
  return {
    sourceTag: "ALLINVENTORYENTRIES.LIST",
    stockItemName: value(fields, "STOCKITEMNAME"),
    isDeemedPositive: value(fields, "ISDEEMEDPOSITIVE"),
    actualQty: value(fields, "ACTUALQTY"),
    billedQty: value(fields, "BILLEDQTY"),
    rate: value(fields, "RATE"),
    amount: value(fields, "AMOUNT"),
    batchAllocations: list(fields, "BATCHALLOCATIONS.LIST").map((item) => {
      const children = directChildren(item);
      return {
        godownName: value(children, "GODOWNNAME"),
        batchName: value(children, "BATCHNAME"),
        actualQty: value(children, "ACTUALQTY"),
        billedQty: value(children, "BILLEDQTY"),
        amount: value(children, "AMOUNT"),
      };
    }),
    accountingAllocations: list(fields, "ACCOUNTINGALLOCATIONS.LIST").map((item) => {
      const children = directChildren(item);
      return {
        ledgerName: value(children, "LEDGERNAME"),
        isDeemedPositive: value(children, "ISDEEMEDPOSITIVE"),
        amount: value(children, "AMOUNT"),
        rateDetails: parseRates(children),
      };
    }),
    rateDetails: parseRates(fields),
  };
};

function decode(source: Buffer) {
  let encoding = "UTF-8";
  let text: string;
  if (source.subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))) {
    encoding = "UTF-16LE";
    text = new TextDecoder("utf-16le").decode(source.subarray(2));
  } else if (source.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
    encoding = "UTF-16BE";
    text = new TextDecoder("utf-16be").decode(source.subarray(2));
  } else {
    text = new TextDecoder("utf-8").decode(source);
    if (source.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) encoding = "UTF-8 BOM";
  }
  const before = text;
  text = text.replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, (match, hex, decimal) => {
    const code = Number.parseInt(hex || decimal, hex ? 16 : 10);
    return code === 0 || (code < 0x20 && ![9, 10, 13].includes(code)) || code > 0x10ffff
      ? ""
      : match;
  });
  return { text, encoding, sanitized: before !== text };
}

export function parseTallyXml(source: Buffer): ParsedImport {
  const decoded = decode(source);
  let root: XmlNode;
  try {
    const parsed = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      trimValues: false,
      parseTagValue: false,
      parseAttributeValue: false,
      processEntities: false,
    }).parse(decoded.text) as XmlNode[];
    root = parsed.find(
      (item) => Object.hasOwn(item, "ENVELOPE") || Object.hasOwn(item, "RESPONSE"),
    ) as XmlNode;
  } catch {
    throw Object.assign(new Error(ERRORS.INVALID_XML), {
      statusCode: 400,
    });
  }
  const rootName = root && Object.keys(root).find((key) => key !== ":@");
  if (rootName !== "ENVELOPE" && rootName !== "RESPONSE")
    throw Object.assign(new Error(ERRORS.UNSUPPORTED_TALLY_ROOT), {
      statusCode: 400,
    });
  const warnings = decoded.sanitized ? [WARNINGS.ILLEGAL_XML_CONTROLS_REMOVED] : [];
  if (rootName === "RESPONSE") {
    const fields = directChildren(root);
    const counters = Object.fromEntries(
      ["CREATED", "ALTERED", "DELETED", "IGNORED", "ERRORS"].map((key) => [
        key,
        value(fields, key) ?? "0",
      ]),
    );
    const lineError = value(fields, "LINEERROR");
    const failed = Number(counters.ERRORS) > 0 || Boolean(lineError);
    return {
      documentType: "tallyResponse",
      detectedEncoding: decoded.encoding,
      warnings,
      errors: [],
      vouchers: [],
      tallyResponse: {
        businessStatus: failed ? "failed" : "succeeded",
        counters,
        lineError,
      },
      summary: {
        vouchers: 0,
        ledgerEntries: 0,
        inventoryEntries: 0,
        warnings: warnings.length,
        errors: 0,
      },
    };
  }
  const envelope = directChildren(root);
  const body = envelope.find((item) => Object.hasOwn(item, "BODY"));
  const data = directChildren(body ?? {}).find((item) => Object.hasOwn(item, "DATA"));
  const collection = directChildren(data ?? {}).find((item) => Object.hasOwn(item, "COLLECTION"));
  const voucherNodes = directChildren(collection ?? {}).filter((item) =>
    Object.hasOwn(item, "VOUCHER"),
  );
  const vouchers = voucherNodes.map((node) => {
    const fields = directChildren(node);
    const known = new Set([
      "DATE",
      "VOUCHERTYPENAME",
      "VOUCHERNUMBER",
      "PARTYLEDGERNAME",
      "NARRATION",
      "ALLLEDGERENTRIES.LIST",
      "LEDGERENTRIES.LIST",
      "ALLINVENTORYENTRIES.LIST",
    ]);
    const unknown = fields.some(
      (child) => !known.has(Object.keys(child).find((key) => key !== ":@") ?? ""),
    );
    return {
      attributes: getAttributes(node),
      date: value(fields, "DATE"),
      voucherType: value(fields, "VOUCHERTYPENAME"),
      voucherNumber: value(fields, "VOUCHERNUMBER"),
      partyLedgerName: value(fields, "PARTYLEDGERNAME"),
      narration: value(fields, "NARRATION"),
      ledgerEntries: fields.flatMap((item) =>
        Object.hasOwn(item, "ALLLEDGERENTRIES.LIST")
          ? [parseLedger(item, "ALLLEDGERENTRIES.LIST")]
          : Object.hasOwn(item, "LEDGERENTRIES.LIST")
            ? [parseLedger(item, "LEDGERENTRIES.LIST")]
            : [],
      ),
      inventoryEntries: list(fields, "ALLINVENTORYENTRIES.LIST").map(parseInventory),
      warnings: unknown
        ? ["Unknown voucher child retained in the raw source but not normalized"]
        : [],
    } as Omit<Voucher, "source">;
  });
  const summary: Summary = {
    vouchers: vouchers.length,
    ledgerEntries: vouchers.reduce((sum, item) => sum + item.ledgerEntries.length, 0),
    inventoryEntries: vouchers.reduce((sum, item) => sum + item.inventoryEntries.length, 0),
    warnings: warnings.length + vouchers.reduce((sum, item) => sum + item.warnings.length, 0),
    errors: 0,
  };
  return {
    documentType: "voucherExport",
    detectedEncoding: decoded.encoding,
    warnings,
    errors: [],
    summary,
    vouchers,
  };
}

type StreamVoucher = Omit<Voucher, "source">;

export async function parseTallyFile(
  filePath: string,
  onVoucher: (voucher: StreamVoucher, sourceIndex: number) => Promise<void>,
): Promise<Omit<ParsedImport, "vouchers" | "summary"> & { summary: Summary }> {
  let encoding = "UTF-8";
  let firstChunk = true;
  let decoder: TextDecoder | undefined;
  let sanitized = false;
  let root = "";
  let voucherXml = "";
  let responseXml = "";
  let voucherIndex = 0;
  let parserError: Error | undefined;
  const stream = createReadStream(filePath, { highWaterMark: 16 * 1024 });
  const parser = sax.parser(true, {
    trim: false,
    normalize: false,
    lowercase: false,
  });
  const vouchersSummary: Summary = {
    vouchers: 0,
    ledgerEntries: 0,
    inventoryEntries: 0,
    warnings: 0,
    errors: 0,
  };
  let currentTagDepth = 0;
  let pendingVoucher: Promise<void> = Promise.resolve();
  let sanitizerRemainder = "";
  const escapeXml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const write = (chunk: string, flush = false) => {
    const input = sanitizerRemainder + chunk;
    const safeLength = flush ? input.length : Math.max(0, input.length - 12);
    const sanitizable = input.slice(0, safeLength);
    sanitizerRemainder = input.slice(safeLength);
    const sanitizedChunk = sanitizable.replace(
      /&#(?:x([0-9a-f]+)|([0-9]+));/gi,
      (match, hex, decimal) => {
        const code = Number.parseInt(hex || decimal, hex ? 16 : 10);
        if (code === 0 || (code < 0x20 && ![9, 10, 13].includes(code)) || code > 0x10ffff) {
          sanitized = true;
          return "";
        }
        return match;
      },
    );
    parser.write(sanitizedChunk);
  };
  parser.ondoctype = () => {
    throw Object.assign(new Error(ERRORS.XML_EXTERNAL_ENTITIES_NOT_ALLOWED), {
      statusCode: 400,
    });
  };
  parser.onerror = (error) => {
    parserError = error;
    parser.resume();
  };
  parser.onopentag = (tag) => {
    if (!root) root = tag.name;
    if (tag.name === "VOUCHER") {
      voucherXml = `<VOUCHER${Object.entries(tag.attributes)
        .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
        .join("")}>`;
      currentTagDepth = 1;
      return;
    }
    if (currentTagDepth > 0) {
      currentTagDepth += 1;
      voucherXml += `<${tag.name}${Object.entries(tag.attributes)
        .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
        .join("")}>`;
    }
    if (root === "RESPONSE") responseXml += `<${tag.name}>`;
  };
  parser.ontext = (text) => {
    if (currentTagDepth > 0) voucherXml += escapeXml(text);
    else if (root === "RESPONSE") responseXml += escapeXml(text);
  };
  parser.oncdata = (text) => {
    if (currentTagDepth > 0) voucherXml += `<![CDATA[${text}]]>`;
  };
  parser.onclosetag = (tagName) => {
    if (currentTagDepth > 0) {
      voucherXml += `</${tagName}>`;
      currentTagDepth -= 1;
      if (tagName === "VOUCHER") {
        const parsed = parseTallyXml(
          Buffer.from(
            `<ENVELOPE><BODY><DATA><COLLECTION>${voucherXml}</COLLECTION></DATA></BODY></ENVELOPE>`,
          ),
        );
        const voucher = parsed.vouchers[0];
        vouchersSummary.vouchers += 1;
        vouchersSummary.ledgerEntries += voucher.ledgerEntries.length;
        vouchersSummary.inventoryEntries += voucher.inventoryEntries.length;
        vouchersSummary.warnings += voucher.warnings.length;
        pendingVoucher = pendingVoucher.then(() => onVoucher(voucher, voucherIndex++));
        voucherXml = "";
      }
    } else if (root === "RESPONSE" && tagName !== "RESPONSE") responseXml += `</${tagName}>`;
  };
  for await (const chunk of stream) {
    if (firstChunk) {
      firstChunk = false;
      const bytes = chunk as Buffer;
      if (bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))) {
        encoding = "UTF-16LE";
      } else if (bytes.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
        encoding = "UTF-16BE";
      } else if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])))
        encoding = "UTF-8 BOM";
    }
    if (!decoder)
      decoder = new TextDecoder(
        encoding === "UTF-16LE" ? "utf-16le" : encoding === "UTF-16BE" ? "utf-16be" : "utf-8",
      );
    write(decoder.decode(chunk as Buffer, { stream: true }));
    await pendingVoucher;
  }
  if (decoder) write(decoder.decode(), true);
  if (sanitizerRemainder) {
    write(sanitizerRemainder, true);
    sanitizerRemainder = "";
  }
  parser.close();
  if (parserError || (root !== "ENVELOPE" && root !== "RESPONSE")) {
    throw Object.assign(new Error(ERRORS.INVALID_XML), { statusCode: 400 });
  }
  if (root === "RESPONSE") {
    const parsed = parseTallyXml(Buffer.from(`<RESPONSE>${responseXml}</RESPONSE>`));
    return {
      documentType: "tallyResponse",
      detectedEncoding: encoding,
      warnings: sanitized ? [WARNINGS.ILLEGAL_XML_CONTROLS_REMOVED] : [],
      errors: [],
      tallyResponse: parsed.tallyResponse,
      summary: parsed.summary,
    };
  }
  return {
    documentType: "voucherExport",
    detectedEncoding: encoding,
    warnings: sanitized ? [WARNINGS.ILLEGAL_XML_CONTROLS_REMOVED] : [],
    errors: [],
    summary: vouchersSummary,
  };
}
