import { Controller, Get } from "@nestjs/common";

@Controller()
export class PagesController {
  @Get()
  getOverview(): string {
    return "Pages feature module active";
  }
}
