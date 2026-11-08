import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(UnauthorizedException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (!request.originalUrl.startsWith("/api/")) {
      response.redirect("/login");
      return;
    }

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
