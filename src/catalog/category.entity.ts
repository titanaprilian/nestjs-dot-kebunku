import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Tree } from "./tree.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ unique: true })
  code!: string;

  @OneToMany(() => Tree, (tree) => tree.category)
  trees!: Tree[];
}
