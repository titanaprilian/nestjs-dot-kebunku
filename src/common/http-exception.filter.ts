import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { STATUS_CODES } from "node:http";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const isApi = request.path.startsWith("/api/");
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    if (statusCode === 401 && !isApi) {
      response.redirect("/login");
      return;
    }

    const error = STATUS_CODES[statusCode] ?? "Error";
    const message = this.publicMessage(exception, statusCode);
    if (isApi) {
      response.status(statusCode).json({ statusCode, error, message });
      return;
    }

    response.status(statusCode).render("error", {
      title: `${statusCode} ${error}`,
      adminName: request.session?.adminName ?? null,
      statusCode,
      error,
      message: Array.isArray(message) ? message.join(", ") : message,
    });
  }

  private publicMessage(
    exception: unknown,
    statusCode: number,
  ): string | string[] {
    if (statusCode >= 500 || !(exception instanceof HttpException)) {
      return "Internal server error";
    }

    const body = exception.getResponse();
    if (typeof body === "string") return body;
    const responseBody = body as { message?: unknown };
    if (typeof responseBody.message === "string") return responseBody.message;
    if (
      Array.isArray(responseBody.message) &&
      responseBody.message.every((message) => typeof message === "string")
    ) {
      return responseBody.message;
    }
    return STATUS_CODES[statusCode] ?? "Request failed";
  }
}
