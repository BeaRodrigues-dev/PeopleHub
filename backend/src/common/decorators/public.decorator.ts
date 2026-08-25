import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Marca uma rota como pública, para quando a autenticação global for ativada. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
