/**
 * Formats a date string or Date object to DD/MM/YYYY format
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date"
  }

  // Format as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0") // Months are 0-indexed
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}
