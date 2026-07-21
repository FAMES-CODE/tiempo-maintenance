import type { Session } from "next-auth";

import prisma from "@/app/db";

export const callSheetNotDeleted = { isDelete: false } as const;

export function isCallSheetAdmin(session: Session): boolean {
  return session.user.role === "admin";
}

export function getSessionUserId(session: Session): number {
  return Number(session.user.id);
}

/** All authenticated users can browse every non-deleted call sheet. */
export function getCallSheetListWhere(_session: Session) {
  return callSheetNotDeleted;
}

export function canModifyCallSheet(
  session: Session,
  sheet: { createdById: number },
): boolean {
  return (
    isCallSheetAdmin(session) ||
    getSessionUserId(session) === sheet.createdById
  );
}

export async function getCallSheetIfViewable(_session: Session, id: number) {
  return prisma.callSheet.findFirst({
    where: { id, ...callSheetNotDeleted },
    select: { id: true, createdById: true, status: true },
  });
}

/** Returns the sheet only when the user may edit, delete, or upload to it. */
export async function getCallSheetIfAccessible(session: Session, id: number) {
  const sheet = await getCallSheetIfViewable(session, id);
  if (!sheet || !canModifyCallSheet(session, sheet)) {
    return null;
  }
  return sheet;
}
