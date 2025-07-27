import { StringValue } from "ms";

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 4000;
export const JWT_SECRET: string = process.env.JWT_SECRET!;
export const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET!;
export const ACCESS_TOKEN_EXPIRES_IN: StringValue = (process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue) || "15m";
export const REFRESH_TOKEN_EXPIRES_IN: StringValue = (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue) || "7d";