import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  joinDate: true,
} as const;

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const user = await db.user.findUnique({
      where: { id: session!.user.id },
      select: PROFILE_SELECT,
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(user);
  } catch (e) {
    console.error("[PROFILE_GET]", e);
    return internalErrorResponse();
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await parseJsonBody<{
    name?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
  }>(req);

  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const { name, email, password, currentPassword } = body;

  try {
    const user = await db.user.findUnique({
      where: { id: session!.user.id },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;

    if (email && email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session!.user.id) {
        return errorResponse("Email already in use", 409);
      }

      updateData.email = email;
    }

    if (password) {
      if (!currentPassword) {
        return errorResponse("Current password required", 400);
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password!,
      );
      if (!isPasswordValid) {
        return errorResponse("Incorrect current password", 403);
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    const updatedUser = await db.user.update({
      where: { id: session!.user.id },
      data: updateData,
      select: PROFILE_SELECT,
    });

    return successResponse(updatedUser);
  } catch (e) {
    console.error("[PROFILE_PATCH]", e);
    return internalErrorResponse();
  }
}
