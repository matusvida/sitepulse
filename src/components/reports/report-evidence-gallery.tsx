"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportEvidenceImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReportEvidenceGalleryLabels {
  sectionTitle: string;
  sectionDescription: string;
  fallbackImageLabel: string;
  previousImage: string;
  nextImage: string;
  thumbnailRail: string;
}

interface ReportEvidenceGalleryProps {
  images: ReportEvidenceImage[];
  labels: ReportEvidenceGalleryLabels;
  getEvidenceLabel: (image: ReportEvidenceImage, index: number) => string;
}

export function ReportEvidenceGallery({
  images,
  labels,
  getEvidenceLabel,
}: ReportEvidenceGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const boundedSelectedIndex = useMemo(() => {
    if (images.length === 0) {
      return 0;
    }

    return Math.min(selectedIndex, images.length - 1);
  }, [images.length, selectedIndex]);

  const selectedImage = images[boundedSelectedIndex] ?? null;
  const selectedLabel = selectedImage ? getEvidenceLabel(selectedImage, boundedSelectedIndex) : "";
  const selectedSourceLabel = selectedImage?.key || selectedImage?.url || "";
  const selectedPositionLabel = useMemo(() => {
    if (!images.length) return "";
    return `${boundedSelectedIndex + 1}/${images.length}`;
  }, [boundedSelectedIndex, images.length]);

  const selectPrevious = () => {
    setSelectedIndex((current) => (current - 1 + images.length) % images.length);
  };

  const selectNext = () => {
    setSelectedIndex((current) => (current + 1) % images.length);
  };

  useEffect(() => {
    const rails = [thumbnailRailRef.current];

    for (const rail of rails) {
      const target = rail?.querySelector<HTMLElement>(
        `[data-evidence-index="${boundedSelectedIndex}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [boundedSelectedIndex]);

  if (!selectedImage) {
    return null;
  }

  return (
      <section className="mt-5 min-w-0 max-w-full overflow-hidden rounded-[24px] border border-border/70 bg-accent/30 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/80 p-2 text-primary shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)]">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{labels.sectionTitle}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{labels.sectionDescription}</p>
          </div>
        </div>

        <div className="mt-4 min-w-0 space-y-3">
          <div className="relative block w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-white/85 bg-slate-950 text-left shadow-[0_26px_70px_-42px_rgba(15,23,42,0.72)]">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
              <Image
                src={selectedImage.url}
                alt={selectedLabel || `${labels.fallbackImageLabel} ${boundedSelectedIndex + 1}`}
                fill
                unoptimized
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/88 via-slate-950/36 to-transparent px-4 pb-4 pt-10 text-white sm:px-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">
                      {selectedPositionLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold sm:text-base">{selectedLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 max-w-full flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[20px] border border-border/70 bg-white/78 px-4 py-3 text-xs text-muted shadow-[0_20px_44px_-34px_rgba(15,23,42,0.34)]">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                {selectedPositionLabel}
              </span>
              <span className="min-w-0 truncate text-foreground">{selectedLabel}</span>
              {selectedSourceLabel ? (
                <span className="min-w-0 w-full truncate text-[11px] text-muted sm:flex-1">
                  {selectedSourceLabel}
                </span>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={selectPrevious}
                  className="h-9 w-9 rounded-full bg-white/92 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.48)]"
                  aria-label={labels.previousImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={selectNext}
                  className="h-9 w-9 rounded-full bg-white/92 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.48)]"
                  aria-label={labels.nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>

          <div
            className="w-full max-w-full overflow-x-auto overflow-y-hidden scroll-smooth pb-1"
            aria-label={labels.thumbnailRail}
            ref={thumbnailRailRef}
          >
            <div className="flex w-max min-w-full snap-x snap-mandatory gap-3 pr-1">
              {images.map((image, index) => {
                const imageLabel = getEvidenceLabel(image, index);
                const active = index === boundedSelectedIndex;

                return (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      "group shrink-0 snap-start overflow-hidden rounded-[20px] border bg-white/82 text-left shadow-[0_20px_40px_-34px_rgba(15,23,42,0.42)] transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                      "w-[148px] sm:w-[172px]",
                      active
                        ? "border-primary/75 shadow-[0_24px_54px_-34px_rgba(14,116,144,0.5)]"
                        : "border-border/70 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_54px_-34px_rgba(15,23,42,0.42)]",
                    )}
                    aria-pressed={active}
                    aria-label={imageLabel}
                    data-evidence-index={index}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <Image
                        src={image.url}
                        alt={imageLabel || `${labels.fallbackImageLabel} ${index + 1}`}
                        fill
                        unoptimized
                        sizes="172px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {active ? (
                        <span className="absolute left-2 top-2 rounded-full bg-slate-950/74 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                          {`${index + 1}/${images.length}`}
                        </span>
                      ) : null}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-foreground">{imageLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
  );
}
