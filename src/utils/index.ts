export function formatDate(date: Date): string {
  const options = { year: "numeric", month: "short", day: "numeric" } as const;
  const formatter = new Intl.DateTimeFormat("en-US", options);
  return formatter.format(date);
}

export function sortPostByDate(a: any, b: any): number {
  return new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf();
}
