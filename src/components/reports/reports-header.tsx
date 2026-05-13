"use client";

import { Select } from "@/components/ui/select";
import type { ProgressReportType } from "@/lib/types";

interface ReportOption {
  value: string;
  label: string;
}

interface ReportsHeaderProps {
  activeType: ProgressReportType;
  activeTypeCount: number;
  groupedCounts: Record<ProgressReportType, number>;
  reportOptions: ReportOption[];
  selectedReportId: string;
  onTypeChange: (type: ProgressReportType) => void;
  onReportChange: (reportId: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const selectorTypes: ProgressReportType[] = ["daily", "weekly"];

export function ReportsHeader({
  activeType,
  activeTypeCount,
  groupedCounts,
  reportOptions,
  selectedReportId,
  onTypeChange,
  onReportChange,
  t,
}: ReportsHeaderProps) {
  return (
    <section className="relative z-20 rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("reportsPage.typeSelectorLabel")}
          </p>
          <div className="mt-3 inline-flex rounded-[24px] border border-white/80 bg-white/80 p-1 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.35)]">
            {selectorTypes.map((type) => {
              const active = activeType === type;
              const disabled = groupedCounts[type] === 0;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      onTypeChange(type);
                    }
                  }}
                  disabled={disabled}
                  className={`rounded-[18px] px-4 py-2.5 text-sm font-medium transition-[background-color,color,transform,box-shadow] ${
                    active
                      ? "bg-slate-950 text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.58)]"
                      : "text-foreground hover:bg-accent"
                  } ${disabled ? "cursor-not-allowed opacity-45 hover:bg-transparent" : ""}`}
                  aria-pressed={active}
                >
                  {t(`reportsPage.reportTypes.${type}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-xl self-start lg:self-end">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("reportsPage.reportSelectorLabel")}
          </p>
          <Select
            id="report-picker"
            aria-label={t("reportsPage.reportSelectorLabel")}
            options={reportOptions}
            value={selectedReportId}
            onChange={(event) => {
              const reportId = Number(event.target.value);
              if (!Number.isNaN(reportId)) {
                onReportChange(reportId);
              }
            }}
            className="mt-3 w-full"
            disabled={reportOptions.length === 0}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        {activeTypeCount > 0
          ? t("reportsPage.availableCount", { count: activeTypeCount })
          : t(`reportsPage.sections.${activeType}.empty`)}
      </p>
    </section>
  );
}
