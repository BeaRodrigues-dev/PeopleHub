import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Filtro global de exceções: normaliza qualquer erro (HttpException do Nest,
 * erro de validação do Mongoose, ou erro inesperado) num payload JSON
 * consistente para o frontend, e loga o erro real no servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const httpResponse = isHttpException ? exception.getResponse() : null;
    const message =
      httpResponse && typeof httpResponse === "object" && "message" in httpResponse
        ? (httpResponse as { message: string | string[] }).message
        : isHttpException
          ? exception.message
          : "Erro interno do servidor";

    if (!isHttpException) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
