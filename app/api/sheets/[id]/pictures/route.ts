import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import prisma from "@/app/db";
import { normalizePublicAssetPath } from "@/lib/api-url";
import { requireSession } from "@/lib/auth/api-auth";
import {
  getCallSheetIfAccessible,
  getCallSheetIfViewable,
} from "@/lib/call-sheet/access";

function withFileUrl<T extends { id: number; callSheetId: number }>(picture: T) {
  return {
    ...picture,
    fileUrl: `/api/sheets/${picture.callSheetId}/pictures/${picture.id}/file`,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    const sheet = await getCallSheetIfViewable(auth.session, parsedId);
    if (!sheet) {
      return new Response(JSON.stringify({ error: "Call sheet not found" }), {
        status: 404,
      });
    }

    const pictures = await prisma.callSheetPicture.findMany({
      where: { callSheetId: parsedId },
    });
    return new Response(JSON.stringify(pictures.map(withFileUrl)));
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to fetch pictures" }), {
      status: 500,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    const sheet = await getCallSheetIfAccessible(auth.session, parsedId);
    if (!sheet) {
      return new Response(JSON.stringify({ error: "Call sheet not found" }), {
        status: 404,
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return new Response(
        JSON.stringify({
          error:
            "Invalid upload payload (file too large or corrupted). Try a smaller image.",
        }),
        { status: 413 },
      );
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
      });
    }

    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "call-sheets",
      String(parsedId),
    );
    await mkdir(uploadDir, { recursive: true });

    const savedPictures = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = file.name.split(".").pop() ?? "jpg";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = join(uploadDir, safeName);

        await writeFile(filePath, buffer);

        const url = normalizePublicAssetPath(
          `/uploads/call-sheets/${parsedId}/${safeName}`,
        );

        const created = await prisma.callSheetPicture.create({
          data: { callSheetId: parsedId, url },
        });
        return withFileUrl(created);
      }),
    );

    return new Response(JSON.stringify(savedPictures), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to upload pictures" }),
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    const sheet = await getCallSheetIfAccessible(auth.session, parsedId);
    if (!sheet) {
      return new Response(JSON.stringify({ error: "Call sheet not found" }), {
        status: 404,
      });
    }

    const { pictureId } = (await request.json()) as { pictureId: number };
    if (!pictureId) {
      return new Response(JSON.stringify({ error: "pictureId required" }), {
        status: 400,
      });
    }

    const picture = await prisma.callSheetPicture.findFirst({
      where: { id: pictureId, callSheetId: parsedId },
    });
    if (!picture) {
      return new Response(JSON.stringify({ error: "Picture not found" }), {
        status: 404,
      });
    }

    await prisma.callSheetPicture.delete({ where: { id: pictureId } });
    return new Response(JSON.stringify({ deleted: true }));
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to delete picture" }), {
      status: 500,
    });
  }
}
