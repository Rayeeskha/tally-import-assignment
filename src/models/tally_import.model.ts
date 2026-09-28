import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import TallyVoucher from "./tally_voucher.model";

@Table({
  tableName: "tally_imports",
  timestamps: false,
})
export default class TallyImport extends Model<TallyImport> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.CHAR(36),
    unique: true,
    allowNull: false,
    field: "import_id",
  })
  declare importId: string;

  @Column({
    type: DataType.CHAR(64),
    unique: true,
    allowNull: false,
    field: "content_hash",
  })
  declare contentHash: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    field: "document_type",
  })
  declare documentType: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
  })
  declare status: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    field: "detected_encoding",
  })
  declare detectedEncoding: string;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: false,
    field: "summary_json",
  })
  declare summaryJson: string;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: false,
    field: "warnings_json",
  })
  declare warningsJson: string;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: false,
    field: "errors_json",
  })
  declare errorsJson: string;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: true,
    field: "tally_response_json",
  })
  declare tallyResponseJson: string | null;

  @Column({
    type: DataType.BLOB("long"),
    allowNull: true,
    field: "raw_source",
  })
  declare rawSource: Buffer | null;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    field: "raw_source_path",
  })
  declare rawSourcePath: string | null;

  @HasMany(() => TallyVoucher, {
    foreignKey: "importId",
    sourceKey: "importId",
  })
  declare vouchers: TallyVoucher[];
}
