import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { hash } from "bcryptjs";
import { Repository } from "typeorm";
import { Admin } from "./auth/admin.entity";
import { DEMO_ADMIN_EMAIL, getDemoAdminPassword } from "./auth/demo-credentials";
import { Category } from "./catalog/category.entity";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
    if ((await this.categories.count()) > 0) return;
    await this.categories.save([
      this.categories.create({ name: "Durian", code: "DR" }),
      this.categories.create({ name: "Avocado", code: "AV" }),
    ]);
  }

  private async seedAdmin(): Promise<void> {
    const email = DEMO_ADMIN_EMAIL.trim().toLowerCase();
    if (await this.admins.findOneBy({ email })) return;

    const passwordHash = await hash(getDemoAdminPassword(), 10);
    await this.admins.save(
      this.admins.create({ email, passwordHash, name: "Demo Admin" }),
    );
  }
}
