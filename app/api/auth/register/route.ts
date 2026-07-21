import prisma from "@/app/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { RegisterSchema } from "@/lib/schemas/authSchema";

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit(request, { tier: "admin" });
  if (rateLimited) return rateLimited;

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(payload);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Invalid registration data";
    return NextResponse.json({ message }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUser) {
    return NextResponse.json({ message: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
    omit: { password: true },
  });

  return NextResponse.json(user);
}
