import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "tally_allocations",
  timestamps: false,
})
export default class TallyAllocation extends Model<TallyAllocation> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    field: "ledger_entry_id",
  })
  declare ledgerEntryId: number | null;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    field: "inventory_entry_id",
  })
  declare inventoryEntryId: number | null;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    field: "allocation_type",
  })
  declare allocationType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "allocation_index",
  })
  declare allocationIndex: number;

  @Column({
    type: DataType.TEXT("long"),
    allowNull: false,
    field: "data_json",
  })
  declare dataJson: string;
}
