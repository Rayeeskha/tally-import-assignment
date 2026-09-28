import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";

import TallyImport from "./tally_import.model";

@Table({
  tableName: "tally_vouchers",
  timestamps: false,
})
export default class TallyVoucher extends Model<TallyVoucher> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TallyImport)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: "import_id",
  })
  declare importId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "voucher_index",
  })
  declare voucherIndex: number;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: false,
    field: "data_json",
  })
  declare dataJson: string;

  @BelongsTo(() => TallyImport, {
    foreignKey: "importId",
    targetKey: "importId",
  })
  declare import: TallyImport;
}
