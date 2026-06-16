"use client";

/**
 * Dependency-free Excel export.
 *
 * Generates a SpreadsheetML 2003 workbook (.xls XML) — the most capable Excel
 * format we can produce without pulling in a library. Unlike CSV it supports
 * multiple worksheets, bold/coloured headers, frozen header rows and real
 * number/currency formatting, and it opens natively in Excel and Google Sheets.
 */

type CellValue = string | number;

export type SheetSpec = {
  /** Worksheet tab name (sanitised to Excel's rules). */
  name: string;
  /** Optional big title row at the top of the sheet. */
  title?: string;
  /** Optional grey metadata lines under the title (e.g. filters, timestamp). */
  meta?: string[];
  /** Column header labels. */
  headers: string[];
  /** Pixel widths per column (optional). */
  widths?: number[];
  /** Column indices whose numeric values render as currency ($#,##0). */
  moneyColumns?: number[];
  /** Data rows, aligned to `headers`. */
  rows: CellValue[][];
};

type Cell = { value: CellValue; style?: string };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Excel worksheet names can't contain : \ / ? * [ ] and max 31 chars. */
function sheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31);
}

function cellXml({ value, style }: Cell): string {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const type = isNumber ? "Number" : "String";
  const data = isNumber ? String(value) : esc(String(value));
  const styleAttr = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${styleAttr}><Data ss:Type="${type}">${data}</Data></Cell>`;
}

function rowXml(cells: Cell[]): string {
  return `<Row>${cells.map(cellXml).join("")}</Row>`;
}

function buildSheet(spec: SheetSpec): string {
  const rows: Cell[][] = [];

  if (spec.title) rows.push([{ value: spec.title, style: "title" }]);
  (spec.meta ?? []).forEach(m => rows.push([{ value: m, style: "meta" }]));
  if (spec.title || (spec.meta && spec.meta.length)) rows.push([]); // spacer

  const headerRowIndex = rows.length;
  rows.push(spec.headers.map(h => ({ value: h, style: "header" })));

  const money = new Set(spec.moneyColumns ?? []);
  spec.rows.forEach(r => {
    rows.push(
      r.map((value, i) => ({
        value,
        style: money.has(i) && typeof value === "number" ? "money" : undefined,
      }))
    );
  });

  // Freeze everything above the first data row (title + meta + header).
  const frozen = headerRowIndex + 1;

  const columns = (spec.widths ?? [])
    .map(w => `<Column ss:Width="${w}"/>`)
    .join("");

  const body = rows.map(rowXml).join("");

  return (
    `<Worksheet ss:Name="${esc(sheetName(spec.name))}">` +
    `<Table>${columns}${body}</Table>` +
    `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">` +
    `<FreezePanes/><FrozenNoSplit/>` +
    `<SplitHorizontal>${frozen}</SplitHorizontal>` +
    `<TopRowBottomPane>${frozen}</TopRowBottomPane>` +
    `<ActivePane>2</ActivePane>` +
    `</WorksheetOptions>` +
    `</Worksheet>`
  );
}

function buildWorkbook(sheets: SheetSpec[]): string {
  return (
    `<?xml version="1.0"?>` +
    `<?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"` +
    ` xmlns:o="urn:schemas-microsoft-com:office:office"` +
    ` xmlns:x="urn:schemas-microsoft-com:office:excel"` +
    ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"` +
    ` xmlns:html="http://www.w3.org/TR/REC-html40">` +
    `<Styles>` +
    `<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/></Style>` +
    `<Style ss:ID="title"><Font ss:Bold="1" ss:Size="15" ss:Color="#111827"/></Style>` +
    `<Style ss:ID="meta"><Font ss:Color="#6B7280" ss:Size="10"/></Style>` +
    `<Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/>` +
    `<Interior ss:Color="#1F5FFF" ss:Pattern="Solid"/>` +
    `<Alignment ss:Vertical="Center"/></Style>` +
    `<Style ss:ID="money"><NumberFormat ss:Format="&quot;$&quot;#,##0"/></Style>` +
    `</Styles>` +
    sheets.map(buildSheet).join("") +
    `</Workbook>`
  );
}

/** Build the workbook and trigger a browser download. */
export function downloadSpreadsheet(filename: string, sheets: SheetSpec[]): void {
  const xml = buildWorkbook(sheets);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
