import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export async function POST(req: Request) {
  const body = await parseJsonBody<{
    name?: string;
    email?: string;
    password?: string;
  }>(req);

  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const { name, email, password } = body;

  if (!email || !password || !name) {
    return errorResponse("Missing required fields", 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return errorResponse("Invalid email format", 400);
  }

  // Validate password length
  if (password.length < 6) {
    return errorResponse("Password must be at least 6 characters", 400);
  }

  try {
    const exists = await db.user.findUnique({
      where: { email },
    });

    if (exists) {
      return errorResponse("User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: (await db.user.count()) === 0 ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return successResponse(user);
  } catch (e) {
    console.error("REGISTRATION_ERROR", e);
    return internalErrorResponse();
  }
}
