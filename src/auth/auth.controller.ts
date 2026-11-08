import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { SessionAuthGuard } from "../common/session-auth.guard";
import { Request, Response } from "express";
import { Admin } from "./admin.entity";
import { AuthService } from "./auth.service";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const SESSION_COOKIE_NAME = "connect.sid";

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("login")
  loginPage(@Res() response: Response) {
    return response.render("login", {
      title: "Sign in",
      adminName: null,
      email: "",
      error: null,
    });
  }

  @Post("login")
  async login(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    try {
      const admin = await this.auth.validate(email, password);
      await this.startSession(request, admin);
      return response.redirect("/");
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
      return response.status(401).render("login", {
        title: "Sign in",
        adminName: null,
        email,
        error: INVALID_CREDENTIALS_MESSAGE,
      });
    }
  }

  @Post("api/auth/login")
  async apiLogin(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const admin = await this.auth.validate(email, password);
    await this.startSession(request, admin);

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post("logout")
  async logout(@Req() request: Request, @Res() response: Response) {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) =>
        error ? reject(error) : resolve(),
      );
    });

    return response
      .clearCookie(SESSION_COOKIE_NAME, { path: "/" })
      .redirect("/login");
  }

  private async startSession(request: Request, admin: Admin): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error) =>
        error ? reject(error) : resolve(),
      );
    });

    request.session.adminId = admin.id;
    request.session.adminName = admin.name;

    await new Promise<void>((resolve, reject) => {
      request.session.save((error) =>
        error ? reject(error) : resolve(),
      );
    });
  }
}
