import { readFile } from "fs/promises";
import { join, extname } from "path";
import prisma from "@/app/db";
import { requireSession } from "@/lib/auth/api-auth";
import { getCallSheetIfViewable } from "@/lib/call-sheet/access";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; pictureId: string }> },
) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { id, pictureId } = await params;
    const callSheetId = parseInt(id, 10);
    const parsedPictureId = parseInt(pictureId, 10);
    if (!Number.isFinite(callSheetId) || !Number.isFinite(parsedPictureId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    const sheet = await getCallSheetIfViewable(auth.session, callSheetId);
    if (!sheet) {
      return new Response(JSON.stringify({ error: "Call sheet not found" }), {
        status: 404,
      });
    }

    const picture = await prisma.callSheetPicture.findFirst({
      where: { id: parsedPictureId, callSheetId },
    });
    if (!picture) {
      return new Response(JSON.stringify({ error: "Picture not found" }), {
        status: 404,
      });
    }

    const relative = picture.url.replace(/^\/+/, "");
    const filePath = join(process.cwd(), "public", relative);
    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();

    return new Response(buffer, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to serve call-sheet picture:", error);
    return new Response(JSON.stringify({ error: "Failed to load picture" }), {
      status: 404,
    });
  }
}
