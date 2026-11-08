import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { compare } from "bcryptjs";
import { Repository } from "typeorm";
import { Admin } from "./admin.entity";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
  ) {}

  async validate(email: string, password: string): Promise<Admin> {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.admins.findOneBy({ email: normalizedEmail });

    if (!admin || !(await compare(password, admin.passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return admin;
  }
}
