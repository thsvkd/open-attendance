import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAdmin,
  parseJsonBody,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

const ALLOWED_UPDATE_FIELDS = [
  "name",
  "email",
  "password",
  "role",
  "joinDate",
  "totalLeaves",
] as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        joinDate: true,
        totalLeaves: true,
        usedLeaves: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return successResponse(users);
  } catch (e) {
    console.error("[USERS_GET]", e);
    return internalErrorResponse();
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody<{
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    joinDate?: string;
  }>(req);

  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const { name, email, password, role, joinDate } = body;

  if (!email || !password || !name) {
    return errorResponse("Missing required fields", 400);
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already in use", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "ADMIN" ? "ADMIN" : "USER",
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        joinDate: true,
        totalLeaves: true,
        usedLeaves: true,
        createdAt: true,
      },
    });

    return successResponse(user);
  } catch (e) {
    console.error("[USERS_POST]", e);
    return internalErrorResponse();
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await parseJsonBody<Record<string, unknown>>(req);
  if (!body) {
    return errorResponse("Invalid request body", 400);
  }

  const { id, currentPassword, ...rawUpdateData } = body;

  if (!id || typeof id !== "string") {
    return errorResponse("User ID required", 400);
  }

  try {
    // Extract only allowed fields (prevent mass assignment)
    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in rawUpdateData && rawUpdateData[field] !== undefined) {
        updateData[field] = rawUpdateData[field];
      }
    }

    // Verify current password when changing password for self-update
    if (id === session!.user.id && updateData.password) {
      if (!currentPassword || typeof currentPassword !== "string") {
        return errorResponse("Current password required for self-update", 400);
      }

      const currentUser = await db.user.findUnique({
        where: { id: session!.user.id },
      });
      if (!currentUser?.password) {
        return errorResponse("User not found", 404);
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password,
      );
      if (!isPasswordValid) {
        return errorResponse("Incorrect current password", 403);
      }
    }

    if (updateData.joinDate && typeof updateData.joinDate === "string") {
      updateData.joinDate = new Date(updateData.joinDate);
    }

    if (updateData.password && typeof updateData.password === "string") {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    // Validate role value
    if (
      updateData.role &&
      updateData.role !== "ADMIN" &&
      updateData.role !== "USER"
    ) {
      return errorResponse("Invalid role value", 400);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        joinDate: true,
        totalLeaves: true,
        usedLeaves: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(user);
  } catch (e) {
    console.error("[USERS_PATCH]", e);
    return internalErrorResponse();
  }
}
