import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "tally_ledger_entries",
  timestamps: false,
})
export default class TallyLedgerEntry extends Model<TallyLedgerEntry> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    field: "voucher_id",
  })
  declare voucherId: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: "source_tag",
  })
  declare sourceTag: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "entry_index",
  })
  declare entryIndex: number;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: false,
    field: "data_json",
  })
  declare dataJson: string;
}
