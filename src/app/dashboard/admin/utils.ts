import type { ProjectOption } from "./types";

export function normalizeProjectIds(projectIds: number[]) {
  return [...projectIds].sort((left, right) => left - right);
}

export function areProjectIdsEqual(left: number[], right: number[]) {
  const normalizedLeft = normalizeProjectIds(left);
  const normalizedRight = normalizeProjectIds(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

export function summarizeSelectedProjects(
  value: number[],
  options: ProjectOption[],
  andMoreLabel: (count: number) => string,
  noneLabel: string,
) {
  const selectedNames = value
    .map((projectId) => options.find((option) => Number(option.value) === projectId)?.label)
    .filter((label): label is string => Boolean(label));

  if (selectedNames.length === 0) {
    return noneLabel;
  }

  if (selectedNames.length <= 2) {
    return selectedNames.join(", ");
  }

  return `${selectedNames.slice(0, 2).join(", ")} ${andMoreLabel(selectedNames.length - 2)}`;
}
