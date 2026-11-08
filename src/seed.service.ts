import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./catalog/category.entity";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.categories.count()) > 0) return;
    await this.categories.save([
      this.categories.create({ name: "Durian", code: "DR" }),
      this.categories.create({ name: "Avocado", code: "AV" }),
    ]);
  }
}
