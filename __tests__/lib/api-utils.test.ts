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
    it("지정된 메시지와 상태 코드로 JSON 응답을 반환해야 함", () => {
      const response = errorResponse("Test error", 400);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it("다양한 상태 코드를 처리할 수 있어야 함", () => {
      const response404 = errorResponse("Not found", 404);
      const response403 = errorResponse("Forbidden", 403);

      expect(response404.status).toBe(404);
      expect(response403.status).toBe(403);
    });
  });

  describe("internalErrorResponse", () => {
    it("500 상태 코드로 응답을 반환해야 함", () => {
      const response = internalErrorResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });
  });

  describe("unauthorizedResponse", () => {
    it("401 상태 코드로 응답을 반환해야 함", () => {
      const response = unauthorizedResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
    });
  });

  describe("successResponse", () => {
    it("데이터를 JSON 형식으로 반환해야 함", () => {
      const testData = { id: "1", name: "Test" };
      const response = successResponse(testData);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it("배열 데이터를 처리할 수 있어야 함", () => {
      const testData = [{ id: "1" }, { id: "2" }];
      const response = successResponse(testData);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it("null 값을 처리할 수 있어야 함", () => {
      const response = successResponse(null);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe("parseJsonBody", () => {
    it("유효한 JSON을 올바르게 파싱해야 함", async () => {
      const testData = { name: "test", value: 123 };
      const mockRequest = {
        json: vi.fn().mockResolvedValue(testData),
      } as unknown as Request;

      const result = await parseJsonBody(mockRequest);

      expect(result).toEqual(testData);
    });

    it("잘못된 JSON에 대해 null을 반환해야 함", async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as Request;

      const result = await parseJsonBody(mockRequest);

      expect(result).toBeNull();
    });

    it("빈 객체를 올바르게 파싱해야 함", async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Request;

      const result = await parseJsonBody(mockRequest);

      expect(result).toEqual({});
    });

    it("타입 매개변수를 사용할 수 있어야 함", async () => {
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
