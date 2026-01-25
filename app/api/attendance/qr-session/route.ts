import { db } from "@/lib/db";
import {
  requireAuth,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { randomBytes } from "crypto";

// POST - Create a new QR authentication session
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { action } = body;

    if (action !== "CHECK_IN" && action !== "CHECK_OUT") {
      return errorResponse("Invalid action", 400);
    }

    // Generate unique session token
    const sessionToken = randomBytes(32).toString("hex");

    // Create session with 5 minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const qrSession = await db.attendanceSession.create({
      data: {
        userId: session!.user.id,
        sessionToken,
        action,
        status: "PENDING",
        expiresAt,
      },
    });

    return successResponse({
      sessionToken: qrSession.sessionToken,
      expiresAt: qrSession.expiresAt,
    });
  } catch (e) {
    console.error("CREATE_QR_SESSION_ERROR", e);
    return internalErrorResponse();
  }
}
