import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("POST /login", () => {
  it("logs in with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "hi@bamlak.dev",
      password: "12345678",
    });
    console.log(res.statusCode);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("hi@bamlak.dev");
  });

  it("fails with user don't exist", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User doesn't exist");
  });

  it("fails with invalid password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "hi@bamlak.dev",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid Credentials");
  });
});

describe("POST /register", () => {
  it("Registers users successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "John doe",
      email: "hi@nati.dev",
      password: "12345678",
      role: "payer",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("accessToken");
  });
});
