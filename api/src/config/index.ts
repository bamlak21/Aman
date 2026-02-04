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
};
