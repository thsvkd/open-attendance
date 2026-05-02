import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  errorResponse,
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
  parseJsonBody,
} from "@/lib/api-utils";

describe("api-utils", () => {
  describe("errorResponse", () => {
    it("should return a JSON response with the specified message and status code", () => {
      const response = errorResponse("Test error", 400);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it("should be able to handle various status codes", () => {
      const response404 = errorResponse("Not found", 404);
      const response403 = errorResponse("Forbidden", 403);

      expect(response404.status).toBe(404);
      expect(response403.status).toBe(403);
    });
  });

  describe("internalErrorResponse", () => {
    it("should return a response with status code 500", () => {
      const response = internalErrorResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });

    it("should return a JSON body with error/message fields when called without args", async () => {
      const response = internalErrorResponse();
      const body = await response.json();

      expect(typeof body.error).toBe("string");
      expect(typeof body.message).toBe("string");
    });

    it("should include the underlying error message and stack in development", async () => {
      const original = process.env.NODE_ENV;
      // @ts-expect-error - test override
      process.env.NODE_ENV = "development";

      try {
        const err = new Error("boom");
        const response = internalErrorResponse(err);
        const body = await response.json();

        expect(body.message).toBe("boom");
        expect(body.error).toBe("boom");
        expect(body.name).toBe("Error");
        expect(typeof body.stack).toBe("string");
      } finally {
        // @ts-expect-error - test override
        process.env.NODE_ENV = original;
      }
    });

    it("should hide details in production", async () => {
      const original = process.env.NODE_ENV;
      // @ts-expect-error - test override
      process.env.NODE_ENV = "production";

      try {
        const err = new Error("sensitive details");
        const response = internalErrorResponse(err);
        const body = await response.json();

        expect(body.message).toBe("Internal Server Error");
        expect(body.stack).toBeUndefined();
      } finally {
        // @ts-expect-error - test override
        process.env.NODE_ENV = original;
      }
    });
  });

  describe("unauthorizedResponse", () => {
    it("should return a response with status code 401", () => {
      const response = unauthorizedResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
    });
  });

  describe("successResponse", () => {
    it("should return data in JSON format", () => {
      const testData = { id: "1", name: "Test" };
      const response = successResponse(testData);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it("should be able to handle array data", () => {
      const testData = [{ id: "1" }, { id: "2" }];
      const response = successResponse(testData);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it("should be able to handle null values", () => {
      const response = successResponse(null);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe("parseJsonBody", () => {
    it("should correctly parse valid JSON", async () => {
      const testData = { name: "test", value: 123 };
      const mockRequest = {
        json: vi.fn().mockResolvedValue(testData),
      } as unknown as Request;

      const result = await parseJsonBody(mockRequest);

      expect(result).toEqual(testData);
    });

    it("should return null for invalid JSON", async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as Request;

      const result = await parseJsonBody(mockRequest);

      expect(result).toBeNull();
    });

    it("should correctly parse an empty object", async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Request;

      const result = await parseJsonBody(mockRequest);

      expect(result).toEqual({});
    });

    it("should be able to use type parameters", async () => {
      interface TestType {
        id: string;
        value: number;
      }

      const testData: TestType = { id: "test", value: 42 };
      const mockRequest = {
        json: vi.fn().mockResolvedValue(testData),
      } as unknown as Request;

      const result = await parseJsonBody<TestType>(mockRequest);

      expect(result).toEqual(testData);
    });
  });
});
