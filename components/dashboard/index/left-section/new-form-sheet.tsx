"use client";

import createFormSheet from "@/app/actions/form-sheet";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  FormSheetFormSchema,
  type FormSheetFormValues,
} from "@/lib/schemas/formsheetSchema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList,
  Headphones,
  Loader2,
  Phone,
  Plus,
  ChevronsUpDown,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

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

function NewformSheet() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormSheetFormValues>({
    resolver: zodResolver(FormSheetFormSchema),
    defaultValues: {
      problemType: "",
      problemDescription: "",
      callSim: "",
      callNumber: "",
      customerId: 0,
      observation: "",
    },
  });

  const loadCustomers = useCallback(
    async (search = "") => {
      setLoadingCustomers(true);
      try {
        const params = new URLSearchParams({ limit: "100", page: "1" });
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(apiUrl(`/api/customers?${params}`));
        if (!res.ok)
          throw new Error(
            t("common.dashboard.overview.newCallSheet.errors.loadCustomersFailed"),
          );
        const data = (await res.json()) as {
          items: { id: number; CLIENT: string }[];
        };
        setCustomers(
          data.items.map((c) => ({ id: c.id, CLIENT: c.CLIENT })),
        );
      } catch (e) {
        console.error(e);
        toast.error(
          t("common.dashboard.overview.newCallSheet.errors.loadCustomersToast"),
        );
      } finally {
        setLoadingCustomers(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void loadCustomers(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, customerSearch, loadCustomers]);

  const onSubmit: SubmitHandler<FormSheetFormValues> = async (data) => {
    const result = await createFormSheet({
      status: "pending",
      problemType: data.problemType,
      problemDescription: data.problemDescription,
      callSim: data.callSim,
      callNumber: data.callNumber,
      customerId: data.customerId,
      observation: data.observation?.trim() || undefined,
    });

    if (result.success) {
      toast.success(t("common.dashboard.overview.newCallSheet.toastSuccess"));
      reset();
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setCustomerPickerOpen(false);
          setCustomerSearch("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="default"
            size="lg"
            className={cn(
              "gap-2 rounded-xl p-6 shadow-md transition-all",
              "text-primary-foreground hover:bg-primary/90",
              "hover:shadow-lg active:scale-[0.98]",
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Plus className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="flex flex-col items-start text-left leading-tight">
              <span className="text-sm font-semibold">
                {t("common.dashboard.overview.newCallSheet.triggerTitle")}
              </span>
              <span className="text-xs font-normal text-primary-foreground/80">
                {t("common.dashboard.overview.newCallSheet.triggerSubtitle")}
              </span>
            </span>
          </Button>
        }
      />

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[80vw] sm:max-h-[95vh]">
        <div className="border-b bg-gradient-to-br from-primary/12 via-background to-chart-2/10 px-6 pb-4 pt-6">
          <DialogHeader className="gap-1 text-left">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Headphones className="size-6" aria-hidden />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t("common.dashboard.overview.newCallSheet.title")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {t("common.dashboard.overview.newCallSheet.description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[min(90vh,760px)] flex-col"
        >
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <FieldGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="problemType">
                  {t("common.dashboard.overview.newCallSheet.problemTypeLabel")}
                </FieldLabel>
                <FieldDescription>
                  {t("common.dashboard.overview.newCallSheet.problemTypeDescription")}
                </FieldDescription>
                <Input
                  id="problemType"
                  placeholder={t("common.dashboard.overview.newCallSheet.problemTypePlaceholder")}
                  autoComplete="off"
                  className={cn(errors.problemType && "border-destructive")}
                  {...register("problemType")}
                />
                {errors.problemType?.message && (
                  <FieldError>{errors.problemType.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="problemDescription">
                  {t("common.dashboard.overview.newCallSheet.whatHappenedLabel")}
                </FieldLabel>
                <FieldDescription>
                  {t("common.dashboard.overview.newCallSheet.whatHappenedDescription")}
                </FieldDescription>
                <Textarea
                  id="problemDescription"
                  placeholder={t("common.dashboard.overview.newCallSheet.whatHappenedPlaceholder")}
                  rows={4}
                  className={cn(
                    "min-h-[100px] resize-y",
                    errors.problemDescription && "border-destructive",
                  )}
                  {...register("problemDescription")}
                />
                {errors.problemDescription?.message && (
                  <FieldError>{errors.problemDescription.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                {t("common.dashboard.overview.newCallSheet.callDetails")}
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,120px)_1fr]">
                <Field>
                  <FieldLabel htmlFor="callSim">
                    {t("common.dashboard.overview.newCallSheet.lineLabel")}
                  </FieldLabel>
                  <Controller
                    control={control}
                    name="callSim"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="callSim"
                          className={cn(errors.callSim && "border-destructive")}
                          aria-invalid={!!errors.callSim}
                        >
                          <SelectValue placeholder={t("common.dashboard.overview.newCallSheet.linePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {LINE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.callSim?.message && (
                    <FieldError>{errors.callSim.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="callNumber">
                    {t("common.dashboard.overview.newCallSheet.callerNumberLabel")}
                  </FieldLabel>
                  <Input
                    id="callNumber"
                    type="tel"
                    inputMode="tel"
                    placeholder={t("common.dashboard.overview.newCallSheet.callerNumberPlaceholder")}
                    className={cn(errors.callNumber && "border-destructive")}
                    {...register("callNumber")}
                  />
                  {errors.callNumber?.message && (
                    <FieldError>{errors.callNumber.message}</FieldError>
                  )}
                </Field>
              </div>
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <UserRound
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                {t("common.dashboard.overview.newCallSheet.customerSection")}
              </div>
              <Controller
                control={control}
                name="customerId"
                render={({ field }) => (
                  <Field className="mt-3">
                    <FieldLabel htmlFor="customerId">
                      {t("common.dashboard.overview.newCallSheet.accountLabel")}
                    </FieldLabel>
                    <FieldDescription>
                      {t("common.dashboard.overview.newCallSheet.accountDescription")}
                    </FieldDescription>
                    <div className="relative">
                      <Button
                        id="customerId"
                        type="button"
                        variant="outline"
                        onClick={() => setCustomerPickerOpen((prev) => !prev)}
                        disabled={loadingCustomers}
                        className={cn(
                          "w-full justify-between font-normal",
                          errors.customerId && "border-destructive",
                        )}
                        aria-invalid={!!errors.customerId}
                        aria-expanded={customerPickerOpen}
                      >
                        <span className="truncate">
                          {field.value > 0
                            ? (customers.find((c) => c.id === field.value)?.CLIENT ??
                              t("common.dashboard.overview.newCallSheet.selectCustomer"))
                            : loadingCustomers
                              ? t("common.dashboard.overview.newCallSheet.loadingCustomers")
                              : t("common.dashboard.overview.newCallSheet.selectCustomer")}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
                      </Button>
                      {customerPickerOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border bg-popover shadow-lg">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder={t("common.dashboard.overview.newCallSheet.searchCustomerPlaceholder")}
                              value={customerSearch}
                              onValueChange={setCustomerSearch}
                            />
                            <CommandList>
                              <CommandEmpty>{t("common.dashboard.overview.newCallSheet.noCustomersFound")}</CommandEmpty>
                              <CommandGroup heading={t("common.dashboard.overview.newCallSheet.customersHeading")}>
                                {customers.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.CLIENT} ${c.id}`}
                                    data-checked={field.value === c.id}
                                    onSelect={() => {
                                      field.onChange(c.id);
                                      setCustomerPickerOpen(false);
                                    }}
                                  >
                                    <span className="font-mono text-xs text-muted-foreground">
                                      #{c.id}
                                    </span>
                                    <span className="truncate">{c.CLIENT}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </div>
                      )}
                    </div>
                    {errors.customerId?.message && (
                      <FieldError>{errors.customerId.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>

            <Separator />

            <Field>
              <FieldLabel htmlFor="observation">
                {t("common.dashboard.overview.newCallSheet.notesLabel")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("common.dashboard.overview.newCallSheet.optional")}
                </span>
              </FieldLabel>
              <FieldDescription>
                {t("common.dashboard.overview.newCallSheet.notesDescription")}
              </FieldDescription>
              <Textarea
                id="observation"
                placeholder={t("common.dashboard.overview.newCallSheet.notesPlaceholder")}
                rows={3}
                className="resize-y"
                {...register("observation")}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList className="size-3.5 shrink-0" aria-hidden />
              {t("common.dashboard.overview.newCallSheet.savedAs")}{" "}
              <span className="font-medium text-foreground">
                {t("common.dashboard.calls.statusPending")}
              </span>{" "}
              {t("common.dashboard.overview.newCallSheet.untilResolved")}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t("common.dashboard.overview.newCallSheet.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px] gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("common.dashboard.overview.newCallSheet.saving")}
                  </>
                ) : (
                  t("common.dashboard.overview.newCallSheet.submit")
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewformSheet;
