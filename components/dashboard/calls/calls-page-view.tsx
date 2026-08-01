"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  CircleDashed,
  ImageIcon,
  Loader2,
  Phone,
  Pencil,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { apiUrl, callSheetPictureFileUrl } from "@/lib/api-url";
import { useLocalePrefix, withLocalePath } from "@/lib/locale-path";
import { useTranslation } from "react-i18next";

export type CallSheetRow = {
  id: number;
  rate: number | null;
  status: string;
  problemType: string | null;
  problemDescription: string | null;
  callSim: string | null;
  callNumber: string | null;
  observation: string | null;
  isSynced?: boolean;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; CLIENT: string };
  user: { username: string; id: number };
};

const LINE_OPTIONS = [
  { value: "500", label: "500" },
  { value: "501", label: "501" },
  { value: "503", label: "503" },
  { value: "504", label: "504" },
  { value: "816", label: "816" },
  { value: "903", label: "903" },
  { value: "905", label: "905" },
  { value: "907", label: "907" },
] as const;

type CustomerOption = { id: number; CLIENT: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("common");
  const pending = status === "pending";
  const label =
    status === "pending"
      ? t("common.dashboard.calls.statusPending")
      : status === "resolved"
        ? t("common.dashboard.calls.statusResolved")
        : status;
  return (
    <Badge
      variant={pending ? "secondary" : "default"}
      className={cn(
        "font-medium capitalize",
        pending &&
          "bg-amber-500/15 text-amber-950 hover:bg-amber-500/20 dark:text-amber-100",
        !pending &&
          "bg-emerald-600/15 text-emerald-900 hover:bg-emerald-600/20 dark:text-emerald-100",
      )}
    >
      {pending ? (
        <CircleDashed className="mr-1 size-3" aria-hidden />
      ) : (
        <CheckCircle2 className="mr-1 size-3" aria-hidden />
      )}
      {label}
    </Badge>
  );
}

function formatDate(iso: string, locale?: string) {
  try {
    return new Date(iso).toLocaleString(locale || undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}


function getColumnLayoutClass(columnId: string, part: "header" | "cell") {
  const layouts: Record<string, { header: string; cell: string }> = {
    id: { header: "w-[24px]", cell: "w-[24px]" },
    customer: {
      header: "w-[120px]",
      cell: "w-[120px] max-w-[120px] whitespace-normal",
    },
    callNumber: { header: "w-[120px]", cell: "w-[120px] whitespace-normal" },
    callSim: { header: "w-[80px]", cell: "w-[80px]" },
    problemType: {
      header: "w-[100px]",
      cell: "w-[100px] max-w-[100px] whitespace-normal",
    },
    observation: {
      header: "w-[100px]",
      cell: "w-[100px] max-w-[100px] whitespace-normal",
    },
    createdBy: {
      header: "w-[74px]",
      cell: "w-[74px] max-w-[74px] whitespace-normal",
    },
    status: { header: "w-[110px]", cell: "w-[110px]" },
    rate: { header: "w-[130px]", cell: "w-[130px]" },
    sync: { header: "w-[100px]", cell: "w-[100px] whitespace-normal" },
    actions: { header: "w-[64px]", cell: "w-[64px]" },
  };

  return layouts[columnId]?.[part] ?? "";
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`Rate ${star}`}
            className={cn(
              "size-5 transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
            )}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
          >
            <svg
              viewBox="0 0 20 20"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              className={cn(
                filled ? "text-amber-400" : "text-muted-foreground/40",
              )}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
          {value}/5
        </span>
      )}
    </div>
  );
}

function CallDetailsDialog({
  row,
  currentUserId,
  canManage,
  onResolved,
}: {
  row: CallSheetRow;
  currentUserId: number | null;
  canManage: boolean;
  onResolved: () => void;
}) {
  const { t, i18n } = useTranslation("common");
  const prefix = useLocalePrefix();
  const [open, setOpen] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);
  const [creatingBon, setCreatingBon] = React.useState(false);
  const [bonResult, setBonResult] = React.useState<string>("");
  const [article, setArticle] = React.useState("");
  const [qte, setQte] = React.useState<number>(1);
  const [pvHtAr, setPvHtAr] = React.useState<number>(0);
  const canResolve = canManage && row.status === "pending";
  const canSyncBon = canManage && row.status === "resolved" && !row.isSynced;

  const [editing, setEditing] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [editError, setEditError] = React.useState("");
  const [customers, setCustomers] = React.useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    problemType: row.problemType ?? "",
    problemDescription: row.problemDescription ?? "",
    callSim: row.callSim ?? "",
    callNumber: row.callNumber ?? "",
    observation: row.observation ?? "",
    customerId: row.customer.id,
  });

  React.useEffect(() => {
    if (!open) {
      setEditing(false);
      setEditError("");
    }
  }, [open]);

  React.useEffect(() => {
    setEditForm({
      problemType: row.problemType ?? "",
      problemDescription: row.problemDescription ?? "",
      callSim: row.callSim ?? "",
      callNumber: row.callNumber ?? "",
      observation: row.observation ?? "",
      customerId: row.customer.id,
    });
  }, [row]);

  const loadCustomers = React.useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams({ limit: "100", page: "1" });
      const res = await fetch(apiUrl(`/api/customers?${params}`), {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { items: CustomerOption[] };
        setCustomers(data.items ?? []);
      }
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && editing) void loadCustomers();
  }, [open, editing, loadCustomers]);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await fetch(apiUrl(`/api/sheets/${row.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditError(
          (data?.error as string) ??
            t("common.dashboard.calls.dialog.editFailed"),
        );
        return;
      }
      setEditing(false);
      onResolved();
    } catch {
      setEditError(t("common.dashboard.calls.dialog.editNetwork"));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/sheets/${row.id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setOpen(false);
        onResolved();
      }
    } finally {
      setDeleting(false);
    }
  };

  // Rating state
  const [rating, setRating] = React.useState<number>(row.rate ?? 0);
  const [savingRating, setSavingRating] = React.useState(false);
  const handleSaveRating = async (newRating: number) => {
    if (!canManage) return;
    setRating(newRating);
    setSavingRating(true);
    try {
      await fetch(apiUrl(`/api/sheets/${row.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: newRating }),
        credentials: "include",
      });
      onResolved(); // refresh list
    } finally {
      setSavingRating(false);
    }
  };

  // Pictures
  type Picture = { id: number; url: string; callSheetId: number };
  const [pictures, setPictures] = React.useState<Picture[]>([]);
  const [loadingPictures, setLoadingPictures] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string>("");
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchPictures = React.useCallback(async () => {
    setLoadingPictures(true);
    try {
      const res = await fetch(apiUrl(`/api/sheets/${row.id}/pictures`), {
        credentials: "include",
      });
      if (res.ok) setPictures(await res.json());
    } finally {
      setLoadingPictures(false);
    }
  }, [row.id]);

  React.useEffect(() => {
    if (open) void fetchPictures();
  }, [open, fetchPictures]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch(apiUrl(`/api/sheets/${row.id}/pictures`), {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(
          (data?.error as string) ??
            t("common.dashboard.calls.dialog.uploadFailed"),
        );
        return;
      }
      await fetchPictures();
    } catch {
      setUploadError(t("common.dashboard.calls.dialog.uploadNetwork"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePicture = async (pictureId: number) => {
    setDeletingId(pictureId);
    try {
      await fetch(apiUrl(`/api/sheets/${row.id}/pictures`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pictureId }),
        credentials: "include",
      });
      setPictures((prev) => prev.filter((p) => p.id !== pictureId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleResolve = async () => {
    if (!currentUserId) return;
    setResolving(true);
    try {
      const res = await fetch(apiUrl(`/api/sheets/${row.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolvedAt: new Date().toISOString(),
          resolvedById: currentUserId,
        }),
        credentials: "include",
      });
      if (res.ok) {
        onResolved();
      }
    } finally {
      setResolving(false);
    }
  };

  const handleCreateBon = async () => {
    setCreatingBon(true);
    setBonResult("");
    try {
      const res = await fetch(apiUrl("/api/firebird/bon1/from-call-sheet"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          callSheetId: row.id,
          observation: row.observation ?? undefined,
          lines: article.trim()
            ? [
                {
                  produit: article.trim(),
                  qte: Number.isFinite(qte) ? qte : 1,
                  PV_HT_AR: Number.isFinite(pvHtAr) ? pvHtAr : 0,
                },
              ]
            : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBonResult(
          data?.details
            ? `${String(data.error ?? "Error")}: ${String(data.details)}`
            : data?.error
              ? String(data.error)
              : "Error Firebird",
        );
        return;
      }
      setBonResult(
        `${data.alreadyExisted ? "Already existed" : "Created"}: NUM_BON=${data.num_bon} (recordid=${data.recordid})` +
          (data.linesInserted ? ` · lignes=${data.linesInserted}` : ""),
      );
      onResolved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      setBonResult(String(msg));
    } finally {
      setCreatingBon(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t("common.dashboard.calls.dialog.details")}
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle>
                {t("common.dashboard.calls.dialog.title", { id: row.id })}
              </DialogTitle>
              <DialogDescription>
                {row.customer.CLIENT} ·{" "}
                {t("common.dashboard.calls.dialog.loggedAt", {
                  date: formatDate(row.createdAt, i18n.language),
                })}
              </DialogDescription>
            </div>
            {canManage && !editing && (
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label={t("common.dashboard.calls.dialog.editAria")}
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={t(
                          "common.dashboard.calls.dialog.deleteAria",
                        )}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("common.dashboard.calls.dialog.deleteTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("common.dashboard.calls.dialog.deleteDescription", {
                          id: row.id,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("common.dashboard.calls.dialog.deleteCancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={deleting}
                        onClick={() => void handleDelete()}
                      >
                        {deleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          t("common.dashboard.calls.dialog.deleteConfirm")
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="grid gap-4 text-sm">
          {editing ? (
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-2">
                <Label>{t("common.dashboard.calls.dialog.problemType")}</Label>
                <Input
                  value={editForm.problemType}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, problemType: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("common.dashboard.calls.dialog.description")}</Label>
                <Textarea
                  value={editForm.problemDescription}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      problemDescription: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>{t("common.dashboard.calls.dialog.simLine")}</Label>
                  <Select
                    value={editForm.callSim}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, callSim: v ?? "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="SIM" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t("common.dashboard.calls.dialog.number")}</Label>
                  <Input
                    value={editForm.callNumber}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, callNumber: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t("common.dashboard.calls.dialog.customer")}</Label>
                <Select
                  value={String(editForm.customerId)}
                  onValueChange={(v) =>
                    setEditForm((f) => ({
                      ...f,
                      customerId: Number(v),
                    }))
                  }
                  disabled={loadingCustomers}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingCustomers
                          ? t(
                              "common.dashboard.overview.newCallSheet.loadingCustomers",
                            )
                          : t(
                              "common.dashboard.overview.newCallSheet.selectCustomer",
                            )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.CLIENT}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("common.dashboard.calls.dialog.observation")}</Label>
                <Textarea
                  value={editForm.observation}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, observation: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              {editError && (
                <p className="text-xs text-destructive">{editError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={savingEdit}
                >
                  {t("common.dashboard.calls.dialog.editCancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("common.dashboard.calls.dialog.saving")}
                    </>
                  ) : (
                    t("common.dashboard.calls.dialog.saveChanges")
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">
                  {t("common.dashboard.calls.dialog.status")}
                </span>
                <StatusBadge status={row.status} />
              </div>
              <dl className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.customer")}
                  </dt>
                  <dd className="mt-0.5 font-medium">{row.customer.CLIENT}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("common.dashboard.calls.dialog.number")}
                    </dt>
                    <dd className="mt-0.5">{row.callNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("common.dashboard.calls.dialog.simLine")}
                    </dt>
                    <dd className="mt-0.5">{row.callSim || "—"}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.problemType")}
                  </dt>
                  <dd className="mt-0.5">{row.problemType || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.description")}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">
                    {row.problemDescription || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.observation")}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">
                    {row.observation || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.createdBy")}
                  </dt>
                  <dd className="mt-0.5">{row.user.username}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.callRating")}
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2">
                    <StarRating
                      value={rating}
                      readonly={!canManage}
                      onChange={(v) => void handleSaveRating(v)}
                    />
                    {savingRating && (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    )}
                  </dd>
                </div>
              </dl>
              {/* ── Pictures ────────────────────────────────────── */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5" />
                    {t("common.dashboard.calls.dialog.pictures")}
                    {pictures.length > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                        {pictures.length}
                      </span>
                    )}
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={uploading || !canManage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {uploading
                      ? t("common.dashboard.calls.dialog.uploading")
                      : t("common.dashboard.calls.dialog.add")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-destructive">{uploadError}</p>
                )}

                {loadingPictures ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : pictures.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    {t("common.dashboard.calls.dialog.noPictures")}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {pictures.map((pic) => (
                      <div
                        key={pic.id}
                        className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={callSheetPictureFileUrl(row.id, pic.id)}
                          alt=""
                          className="size-full object-cover cursor-pointer transition-opacity group-hover:opacity-80"
                          onClick={() =>
                            setLightboxUrl(
                              callSheetPictureFileUrl(row.id, pic.id),
                            )
                          }
                        />
                        {canManage && (
                          <button
                            type="button"
                            aria-label={t(
                              "common.dashboard.calls.dialog.deletePictureAria",
                            )}
                            className="absolute right-1 top-1 hidden rounded-full bg-background/80 p-0.5 text-destructive shadow group-hover:flex items-center justify-center"
                            disabled={deletingId === pic.id}
                            onClick={() => void handleDeletePicture(pic.id)}
                          >
                            {deletingId === pic.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Trash2 className="size-3" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "grid gap-2",
                  row.status !== "resolved" && "hidden",
                )}
              >
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("common.dashboard.calls.dialog.bonTitle")}
                  </p>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <Input
                          value={article}
                          onChange={(e) => setArticle(e.target.value)}
                          placeholder={t(
                            "common.dashboard.calls.dialog.articlePlaceholder",
                          )}
                        />
                      </div>
                      <div className="flex flex-col col-span-1 gap-2">
                        <Label>
                          {t("common.dashboard.calls.dialog.quantity")}
                        </Label>
                        <Input
                          value={String(qte)}
                          onChange={(e) => setQte(Number(e.target.value))}
                          placeholder={t(
                            "common.dashboard.calls.dialog.quantityPlaceholder",
                          )}
                        />
                      </div>
                      <div className="flex flex-col col-span-1 gap-2">
                        <Label>
                          {t("common.dashboard.calls.dialog.price")}
                        </Label>
                        <Input
                          value={String(pvHtAr)}
                          onChange={(e) => setPvHtAr(Number(e.target.value))}
                          placeholder={t(
                            "common.dashboard.calls.dialog.pricePlaceholder",
                          )}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("common.dashboard.calls.dialog.totalHt")}{" "}
                      <span className="font-mono">
                        {Number.isFinite(qte) && Number.isFinite(pvHtAr)
                          ? (qte * pvHtAr).toFixed(2)
                          : "—"}
                      </span>
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleCreateBon}
                  disabled={creatingBon || !canSyncBon}
                  className="w-full"
                >
                  {creatingBon ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("common.dashboard.calls.dialog.creating")}
                    </>
                  ) : row.isSynced ? (
                    t("common.dashboard.calls.dialog.alreadySynchronized")
                  ) : row.status !== "resolved" ? (
                    t("common.dashboard.calls.dialog.resolveBeforeSync")
                  ) : (
                    t("common.dashboard.calls.dialog.createFirebirdNote")
                  )}
                </Button>
                {bonResult ? (
                  <p className="text-xs font-mono text-muted-foreground">
                    {bonResult}
                  </p>
                ) : null}
              </div>
            </>
          )}

          {/* ── Lightbox ─────────────────────────────────────── */}
          {lightboxUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setLightboxUrl(null)}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-background/20 p-1.5 text-white"
                onClick={() => setLightboxUrl(null)}
              >
                <X className="size-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt=""
                className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
        {canResolve && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              onClick={handleResolve}
              disabled={resolving}
              className="w-full gap-2 sm:w-auto"
            >
              {resolving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("common.dashboard.calls.dialog.resolving")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {t("common.dashboard.calls.dialog.markResolved")}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CallsPageView() {
  const { t } = useTranslation("common");
  const prefix = useLocalePrefix();
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id
    ? parseInt(session.user.id, 10)
    : null;
  const isAdmin = session?.user?.role === "admin";

  const { data, error, isLoading, mutate } = useSWR<CallSheetRow[]>(
    apiUrl("/api/sheets"),
    fetcher,
    { refreshInterval: 30000 },
  );

  const rows = data ?? [];

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "pending" | "resolved"
  >("all");

  const filteredRows = React.useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          String(r.id),
          r.customer?.CLIENT ?? "",
          r.callNumber ?? "",
          r.callSim ?? "",
          r.problemType ?? "",
          r.observation ?? "",
          r.problemDescription ?? "",
          r.user?.username ?? "",
          r.status ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [rows, query, statusFilter]);

  const stats = React.useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const resolved = rows.filter((r) => r.status === "resolved").length;
    return { total, pending, resolved };
  }, [rows]);

  const columns = React.useMemo<ColumnDef<CallSheetRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("common.dashboard.calls.colId"),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            #{getValue() as number}
          </span>
        ),
        size: 72,
      },
      {
        id: "customer",
        accessorFn: (r) => r.customer?.CLIENT ?? "",
        header: t("common.dashboard.calls.colCustomer"),
        cell: ({ row }) => {
          const name = row.original.customer?.CLIENT ?? "—";
          return (
            <span
              className="line-clamp-2 break-words font-medium leading-snug"
              title={name !== "—" ? name : undefined}
            >
              {name}
            </span>
          );
        },
      },
      {
        accessorKey: "callNumber",
        header: t("common.dashboard.calls.colNumber"),
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {(getValue() as string | null) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "callSim",
        header: t("common.dashboard.calls.colLine"),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="font-normal">
            {(getValue() as string | null) || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "problemType",
        header: t("common.dashboard.calls.colProblem"),
        cell: ({ getValue }) => {
          const text = (getValue() as string | null) || "—";
          return (
            <span
              className="line-clamp-2 break-words leading-snug"
              title={text !== "—" ? text : undefined}
            >
              {text}
            </span>
          );
        },
      },
      {
        accessorKey: "observation",
        header: t("common.dashboard.calls.colObservation"),
        cell: ({ getValue }) => {
          const text = (getValue() as string | null) || "—";
          return (
            <span
              className="line-clamp-2 break-words leading-snug text-muted-foreground"
              title={text !== "—" ? text : undefined}
            >
              {text}
            </span>
          );
        },
      },
      {
        id: "createdBy",
        accessorFn: (r) => r.user?.username ?? "",
        header: t("common.dashboard.calls.colCreatedBy"),
        cell: ({ row }) => {
          const username = row.original.user?.username ?? "—";
          return (
            <span
              className="line-clamp-2 break-words leading-snug text-muted-foreground"
              title={username !== "—" ? username : undefined}
            >
              {username}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("common.dashboard.calls.colStatus"),
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        accessorKey: "rate",
        header: t("common.dashboard.calls.colRating"),
        cell: ({ getValue }) => {
          const v = (getValue() as number | null) ?? 0;
          return v > 0 ? (
            <StarRating value={v} readonly />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
        size: 130,
      },
      {
        id: "sync",
        accessorFn: (r) => (r.isSynced ? "synced" : "not_synced"),
        header: t("common.dashboard.calls.colSync"),
        cell: ({ row }) =>
          row.original.isSynced ? (
            <Badge className="font-normal" variant="default">
              {t("common.dashboard.calls.synced")}
            </Badge>
          ) : (
            <Badge className="font-normal" variant="secondary">
              {t("common.dashboard.calls.notSynced")}
            </Badge>
          ),
        size: 110,
      },
      {
        id: "actions",
        header: () => (
          <span className="sr-only">
            {t("common.dashboard.calls.colActions")}
          </span>
        ),
        cell: ({ row }) => (
          <CallDetailsDialog
            row={row.original}
            currentUserId={currentUserId}
            canManage={
              isAdmin ||
              (currentUserId != null &&
                row.original.createdById === currentUserId)
            }
            onResolved={() => void mutate()}
          />
        ),
      },
    ],
    [currentUserId, isAdmin, mutate, t],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        {t("common.dashboard.calls.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-4" aria-hidden />
            {t("common.dashboard.calls.pageEyebrow")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("common.dashboard.calls.pageTitle")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {t("common.dashboard.calls.pageDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void window.location.reload()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            {t("common.dashboard.calls.refresh")}
          </Button>
          <Link
            href={withLocalePath(prefix, "/dashboard")}
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            {t("common.dashboard.calls.backOverview")}
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("common.dashboard.calls.statTotal")}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100/90">
              {t("common.dashboard.calls.statPending")}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-amber-950 dark:text-amber-50">
              {stats.pending}
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100/90">
              {t("common.dashboard.calls.statResolved")}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-50">
              {stats.resolved}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            {t("common.dashboard.calls.filters")}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.dashboard.calls.searchPlaceholder")}
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("common.dashboard.calls.searchAria")}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue
                  placeholder={t("common.dashboard.calls.statusPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("common.dashboard.calls.statusAll")}
                </SelectItem>
                <SelectItem value="pending">
                  {t("common.dashboard.calls.statusPendingOnly")}
                </SelectItem>
                <SelectItem value="resolved">
                  {t("common.dashboard.calls.statusResolvedOnly")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="p-6 text-center text-sm text-destructive">
              {t("common.dashboard.calls.loadError")}
            </p>
          )}
          {!error && isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              {t("common.dashboard.calls.loadingCalls")}
            </div>
          )}
          {!error && !isLoading && (
            <>
              <div className="overflow-x-auto">
                <Table className="table-fixed">
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow
                        key={hg.id}
                        className="hover:bg-transparent"
                      >
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                              getColumnLayoutClass(header.column.id, "header"),
                            )}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="group border-b transition-colors hover:bg-muted/40"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "align-middle",
                                getColumnLayoutClass(cell.column.id, "cell"),
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-32 text-center text-muted-foreground"
                        >
                          {rows.length === 0
                            ? t("common.dashboard.calls.emptyNoSheets")
                            : t("common.dashboard.calls.emptyNoMatch")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-3 border-t bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("common.dashboard.calls.paginationShowing")}{" "}
                  <span className="font-medium text-foreground">
                    {table.getRowModel().rows.length
                      ? table.getState().pagination.pageIndex *
                          table.getState().pagination.pageSize +
                        1
                      : 0}
                    –
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) *
                        table.getState().pagination.pageSize,
                      filteredRows.length,
                    )}
                  </span>{" "}
                  {t("common.dashboard.calls.paginationOf")}{" "}
                  <span className="font-medium text-foreground">
                    {filteredRows.length}
                  </span>
                  {filteredRows.length !== rows.length && (
                    <span>
                      {" "}
                      {t("common.dashboard.calls.paginationFiltered", {
                        count: rows.length,
                      })}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    {t("common.dashboard.calls.previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    {t("common.dashboard.calls.next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
