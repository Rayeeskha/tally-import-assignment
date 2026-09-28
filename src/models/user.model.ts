import { Model, Table, Column, DataType, Index, CreatedAt, UpdatedAt } from "sequelize-typescript";

@Table({
  tableName: "users",
  timestamps: true,
})
export default class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "id",
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: "name",
  })
  declare name: string;

  @Index({
    name: "users_email_unique",
    unique: true,
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: "email",
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: "password",
  })
  declare password: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: "created_at",
  })
  declare created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: "updated_at",
  })
  declare updated_at: Date;
}
