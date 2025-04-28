import type { ScrapingResult } from "@/types/api";

/**
 * Properly escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert multiple ScrapingResult objects to a properly formatted CSV
 */
export function resultsToCSV(results: ScrapingResult[]): string {
  let csv = "Source URLs,Emails,Phone Numbers,Addresses,Postal Codes\n";

  results.forEach(result => {
    const maxLength = Math.max(
      result.emails.length,
      result.phones.length,
      result.addresses.length,
      result.postal_codes.length,
      1
    );

    for (let i = 0; i < maxLength; i++) {
      const url = i === 0 ? escapeCSV(result.url) : "";
      const email = escapeCSV(result.emails[i] || "");
      const phone = escapeCSV(result.phones[i] || "");
      const address = escapeCSV(result.addresses[i] || "");
      const postalCode = escapeCSV(result.postal_codes[i] || "");

      csv += `${url},${email},${phone},${address},${postalCode}\n`;
    }
  });

  return csv;
}

/**
 * Trigger file download with the provided content
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function resultToCSV(result: ScrapingResult): string {
  return resultsToCSV([result]);
}