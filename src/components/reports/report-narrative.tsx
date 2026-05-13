"use client";

import { Children, isValidElement, useMemo } from "react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";

const reportSectionHeadingClass = "mt-8 break-words text-base font-semibold text-foreground";
const reportSubheadingClass = "mt-6 break-words text-sm font-semibold text-foreground";
const reportBodyClass = "mt-3 break-words pl-5 text-sm leading-7 text-muted";
const reportListClass = "mt-3 space-y-2 break-words pl-9 text-sm leading-7 text-muted";

function getNodeText(node: React.ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: React.ReactNode }>(child)) {
        return getNodeText(child.props.children);
      }

      return "";
    })
    .join("")
    .trim();
}

interface ReportNarrativeProps {
  contentMd: string;
}

export function ReportNarrative({ contentMd }: ReportNarrativeProps) {
  const markdownComponents = useMemo<Components>(
    () => ({
      h1({ children }) {
        return <h2 className={reportSectionHeadingClass}>{children}</h2>;
      },
      h2({ children }) {
        return <h2 className={reportSectionHeadingClass}>{children}</h2>;
      },
      h3({ children }) {
        return <h3 className={reportSubheadingClass}>{children}</h3>;
      },
      p({ children }) {
        const text = getNodeText(children);

        if (text === "Summary") {
          return <h2 className={reportSectionHeadingClass}>Summary</h2>;
        }

        if (text.startsWith("Summary:")) {
          const summaryBody = text.slice("Summary:".length).trim();
          return (
            <>
              <h2 className={reportSectionHeadingClass}>Summary</h2>
              {summaryBody ? <p className={reportBodyClass}>{summaryBody}</p> : null}
            </>
          );
        }

        return <p className={reportBodyClass}>{children}</p>;
      },
      ul({ children }) {
        return <ul className={reportListClass}>{children}</ul>;
      },
      ol({ children }) {
        return <ol className={reportListClass}>{children}</ol>;
      },
      li({ children }) {
        return <li className="pl-1">{children}</li>;
      },
      hr() {
        return <hr className="my-6 border-border/70" />;
      },
      strong({ children }) {
        return <strong className="font-semibold text-foreground">{children}</strong>;
      },
    }),
    [],
  );

  return (
    <div className="prose prose-sm prose-zinc mt-5 max-w-none min-w-0 overflow-x-hidden break-words">
      <Markdown components={markdownComponents}>{contentMd}</Markdown>
    </div>
  );
}
