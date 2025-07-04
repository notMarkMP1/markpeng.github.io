export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function isSameDay(date1: string, date2: string): boolean {
  if (!date1 || !date2) return true; // if either date is empty, consider them the same day
  const [year1, month1, day1] = date1.split('-').map(Number);
  const [year2, month2, day2] = date2.split('-').map(Number);
  const d1 = new Date(year1, month1 - 1, day1);
  const d2 = new Date(year2, month2 - 1, day2);
  return d1.toDateString() === d2.toDateString();
}

export function dateCompare(a: string, b: string): number {
  const [year1, month1, day1] = a.split('-').map(Number);
  const [year2, month2, day2] = b.split('-').map(Number);
  const dateA = new Date(year1, month1 - 1, day1);
  const dateB = new Date(year2, month2 - 1, day2);
  return dateA.getTime() - dateB.getTime();
}