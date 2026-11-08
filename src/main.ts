import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import session from "express-session";
import { join } from "node:path";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { AppModule } from "./app.module";

async function bootstrap() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) throw new Error("SESSION_SECRET must be configured.");

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );
  app.use((request, response, next) => {
    response.locals.adminName = request.session?.adminName ?? null;
    next();
  });
  app.setBaseViewsDir(join(process.cwd(), "views"));
  app.setViewEngine("ejs");
  app.useStaticAssets(join(process.cwd(), "public"));
  app.useStaticAssets(
    join(process.cwd(), "node_modules", "bootstrap", "dist", "css"),
    {
      prefix: "/vendor/bootstrap/css",
    },
  );
  app.useStaticAssets(
    join(process.cwd(), "node_modules", "bootstrap-icons", "font"),
    { prefix: "/vendor/bootstrap-icons/font" },
  );
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();
