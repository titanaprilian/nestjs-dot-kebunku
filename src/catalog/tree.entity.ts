import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Category } from "./category.entity";

@Entity("trees")
export class Tree {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "tree_id", unique: true })
  treeId!: string;

  @Column({ name: "planting_date", type: "date" })
  plantingDate!: string;

  @Column({ type: "text" })
  location!: string;

  @Column({ name: "image_url", type: "text", default: "" })
  imageUrl!: string;

  @Column({ name: "category_id" })
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.trees, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "category_id" })
  category!: Category;
}
