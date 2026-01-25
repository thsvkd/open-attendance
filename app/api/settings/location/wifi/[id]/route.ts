import { db } from "@/lib/db";
import {
  requireAdmin,
  errorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-utils";

// DELETE - Remove a WiFi network
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    await db.registeredWifiNetwork.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (e) {
    console.error("DELETE_WIFI_ERROR", e);
    return internalErrorResponse();
  }
}
