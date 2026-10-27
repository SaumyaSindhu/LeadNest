process.env.JWT_SECRET = "test-secret-key-for-leadnest";

import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

let tokenA;
let tokenB;
let widgetId;


async function registerUser(name, email) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name,
      email,
      password: "TestPassword123!",
      companyName: `${name} Company`,
    });

  expect(response.status).toBe(201);
  expect(response.body.token).toBeTruthy();

  return response.body.token;
}



beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/leadnest_test");

  // Use only the dedicated test database.
  await mongoose.connection.dropDatabase();

  tokenA = await registerUser("Tenant A", "tenant-a@example.com");

  tokenB = await registerUser("Tenant B", "tenant-b@example.com");

  const widgetResponse = await request(app)
    .post("/api/widgets")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({
      title: "Tenant A Contact Form",
      type: "CONTACT_FORM",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Name",
          required: true,
        },
        {
          name: "email",
          type: "email",
          label: "Email",
          required: true,
        },
      ],
      buttonText: "Submit",
    });

  if (widgetResponse.status !== 201) {
    console.error(
      "Widget creation failed:",
      widgetResponse.status,
      widgetResponse.body,
    );
  }

  expect(widgetResponse.status).toBe(201);
  widgetId =
    widgetResponse.body.widget?._id ||
    widgetResponse.body.widget?.id ||
    widgetResponse.body._id;
  expect(widgetId).toBeTruthy();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe("LeadNest API security", () => {
  test("rejects widget access without authentication", async () => {
    const response = await request(app).get(`/api/widgets/${widgetId}`);

    expect(response.status).toBe(401);
  });

  test("prevents Tenant B from accessing Tenant A's widget", async () => {
    const response = await request(app)
      .get(`/api/widgets/${widgetId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  test("allows the owning tenant to access its widget", async () => {
    const response = await request(app)
      .get(`/api/widgets/${widgetId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.widget.title).toBe("Tenant A Contact Form");
  });

  test("rejects invalid email submissions", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widgetId,
        data: {
          name: "Test Visitor",
          email: "not-an-email",
        },
        sourceUrl: "http://localhost:3000",
      });

    expect([400, 422]).toContain(response.status);
  });

  test("accepts valid public submissions", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widgetId,
        data: {
          name: "Test Visitor",
          email: "visitor@example.com",
        },
        sourceUrl: "http://localhost:3000",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test("rejects a malformed widget ID", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widgetId: "invalid-id",
        data: {
          name: "Test Visitor",
          email: "visitor@example.com",
        },
      });

    expect(response.status).toBe(400);
  });
});
