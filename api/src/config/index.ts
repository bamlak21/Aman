import dotenv from "dotenv";

dotenv.config(); // Load .env variables

export const config = {
  port:
    process.env.PORT ||
    (() => {
      throw new Error("Port is missing");
    })(),
  pgUrl:
    process.env.PG_URL ||
    (() => {
      throw new Error("PG_URL is missing");
    })(),
  secret:
    process.env.SECRET ||
    (() => {
      throw new Error("Secret is missing");
    })(),
  customCallbackUrl:
    process.env.customCallbackUrl ||
    (() => {
      throw new Error("customCallbackUrl is missing");
    })(),
  chapaSecretKey:
    process.env.CHAPA_SECRET_KEY ||
    (() => {
      throw new Error("CHAPA_SECRET_KEY is missing");
    })(),
  frontendUrl:
    process.env.FRONTEND_URL ||
    "http://localhost:5173",
};
