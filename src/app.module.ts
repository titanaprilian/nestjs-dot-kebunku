import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PagesModule } from "./pages/pages.module";

@Module({
  imports: [PagesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
