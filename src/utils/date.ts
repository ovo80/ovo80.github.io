export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`
}
