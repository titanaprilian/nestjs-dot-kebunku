import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("admins")
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
    length: 254,
    unique: true,
    collation: "NOCASE",
    transformer: {
      to: (email: string) => email.trim().toLowerCase(),
      from: (email: string) => email.trim().toLowerCase(),
    },
  })
  email!: string;

  @Column({ name: "password_hash", type: "varchar" })
  passwordHash!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;
}
