import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type { MonthlyPnL, MonthlyCashflow, MonthlyBFR, Indicators } from "@/types/business-plan";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  green:      "FF1CB785",
  greenLight: "FFE8F8F3",
  orange:     "FFFF8F27",
  red:        "FFFF4F3F",
  dark:       "FF111111",
  muted:      "FF888888",
  border:     "FFE5E1D8",
  bg:         "FFF7F5F2",
  white:      "FFFFFFFF",
  headerBg:   "FF1CB785",
  headerFg:   "FFFFFFFF",
  altRow:     "FFFAF9F7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyHeaderRow(row: ExcelJS.Row, cols: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > cols) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
    cell.font = { bold: true, color: { argb: C.headerFg }, size: 9, name: "DM Sans" };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: C.border } },
    };
  });
  row.height = 22;
}

function styleDataRow(row: ExcelJS.Row, isAlt: boolean, cols: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > cols) return;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isAlt ? C.altRow : C.white },
    };
    cell.font = { size: 9, name: "Calibri", color: { argb: C.dark } };
    cell.alignment = { horizontal: "right", vertical: "middle" };
    cell.border = {
      bottom: { style: "hair", color: { argb: C.border } },
    };
  });
  // First col left-aligned (label)
  const firstCell = row.getCell(1);
  firstCell.alignment = { horizontal: "left", vertical: "middle" };
  row.height = 18;
}

function numFmt(cell: ExcelJS.Cell, isNeg?: boolean) {
  cell.numFmt = "#,##0 €";
  if (isNeg || (typeof cell.value === "number" && cell.value < 0)) {
    cell.font = { ...cell.font, color: { argb: C.red } };
  } else if (typeof cell.value === "number" && cell.value > 0) {
    cell.font = { ...cell.font, color: { argb: C.dark } };
  }
}

function pctFmt(cell: ExcelJS.Cell) {
  cell.numFmt = "0.0%";
}

function setColWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

const MONTH_LABELS = [
  "Jan","Fév","Mar","Avr","Mai","Jun",
  "Jul","Aoû","Sep","Oct","Nov","Déc",
];

function monthLabel(i: number): string {
  return `M${i + 1} ${MONTH_LABELS[i % 12]}`;
}

// ─── Sheet builders ───────────────────────────────────────────────────────────

function buildPnLSheet(wb: ExcelJS.Workbook, pnl: MonthlyPnL[], projectName: string) {
  const ws = wb.addWorksheet("P&L Mensuel", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
  });

  setColWidths(ws, [22, ...Array(36).fill(10)]);

  // Title
  const title = ws.addRow([`P&L Mensuel — ${projectName}`]);
  ws.mergeCells(1, 1, 1, 37);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: C.dark } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
  title.height = 24;

  // Headers
  const header = ws.addRow(["", ...pnl.map((_, i) => monthLabel(i))]);
  applyHeaderRow(header, 37);

  const rows: { label: string; key: keyof MonthlyPnL; isPct?: boolean; isBold?: boolean }[] = [
    { label: "Chiffre d'affaires",    key: "revenue",          isBold: true },
    { label: "Charges variables",     key: "variableCosts" },
    { label: "Marge brute",           key: "grossMargin",      isBold: true },
    { label: "Taux de marge brute",   key: "grossMarginRate",  isPct: true },
    { label: "Charges fixes",         key: "fixedCosts" },
    { label: "Masse salariale",       key: "payroll" },
    { label: "EBITDA",                key: "ebitda",           isBold: true },
    { label: "Impôt sur les sociétés",key: "tax" },
    { label: "Résultat net",          key: "netResult",        isBold: true },
  ];

  rows.forEach(({ label, key, isPct, isBold }, ri) => {
    const values = pnl.map((m) => m[key] as number);
    const row = ws.addRow([label, ...values]);
    styleDataRow(row, ri % 2 === 0, 37);

    if (isBold) {
      row.getCell(1).font = { bold: true, size: 9, name: "Calibri" };
      row.eachCell({ includeEmpty: false }, (cell, ci) => {
        if (ci > 1) cell.font = { bold: true, size: 9, name: "Calibri" };
      });
      // Green background for EBITDA row
      if (key === "ebitda") {
        row.eachCell({ includeEmpty: true }, (cell, ci) => {
          if (ci <= 37) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
          }
        });
      }
    }

    values.forEach((v, vi) => {
      const cell = row.getCell(vi + 2);
      if (isPct) {
        pctFmt(cell);
        cell.value = v;
      } else {
        numFmt(cell, v < 0);
      }
    });
  });

  // Year separator lines
  [12, 24].forEach((col) => {
    ws.getColumn(col + 2).border = {
      right: { style: "medium", color: { argb: C.green } },
    };
  });
}

function buildCashflowSheet(wb: ExcelJS.Workbook, cashflow: MonthlyCashflow[]) {
  const ws = wb.addWorksheet("Cashflow", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
  });

  setColWidths(ws, [26, ...Array(36).fill(10)]);

  const title = ws.addRow(["Cashflow Mensuel"]);
  ws.mergeCells(1, 1, 1, 37);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: C.dark } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
  title.height = 24;

  const header = ws.addRow(["", ...cashflow.map((_, i) => monthLabel(i))]);
  applyHeaderRow(header, 37);

  const rows: { label: string; key: keyof MonthlyCashflow; isBold?: boolean }[] = [
    { label: "Encaissements clients",      key: "clientReceipts" },
    { label: "Entrées exceptionnelles",    key: "exceptionalInflows" },
    { label: "Total encaissements",        key: "totalInflows",       isBold: true },
    { label: "Décaissements fournisseurs", key: "supplierPayments" },
    { label: "Masse salariale décaissée",  key: "salaryPayments" },
    { label: "Remboursements prêts",       key: "loanRepayments" },
    { label: "Charges fiscales",           key: "taxPayments" },
    { label: "Total décaissements",        key: "totalOutflows",      isBold: true },
    { label: "Flux net opérationnel",      key: "netCashflow",        isBold: true },
    { label: "Variation BFR",              key: "bfrVariation" },
    { label: "Flux ajusté",               key: "adjustedCashflow",   isBold: true },
    { label: "Solde fin de mois",          key: "endingBalance",      isBold: true },
  ];

  rows.forEach(({ label, key, isBold }, ri) => {
    const values = cashflow.map((m) => m[key] as number);
    const row = ws.addRow([label, ...values]);
    styleDataRow(row, ri % 2 === 0, 37);

    if (isBold) row.font = { bold: true, size: 9 };

    values.forEach((v, vi) => {
      const cell = row.getCell(vi + 2);
      numFmt(cell, v < 0);
      // Color ending balance by health
      if (key === "endingBalance") {
        cell.font = {
          bold: true,
          size: 9,
          color: { argb: v < 0 ? C.red : v < 5000 ? C.orange : C.green },
        };
      }
    });
  });
}

function buildBFRSheet(wb: ExcelJS.Workbook, bfr: MonthlyBFR[]) {
  const ws = wb.addWorksheet("BFR", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
  });

  setColWidths(ws, [26, ...Array(36).fill(10)]);

  const title = ws.addRow(["Besoin en Fonds de Roulement"]);
  ws.mergeCells(1, 1, 1, 37);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: C.dark } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
  title.height = 24;

  const header = ws.addRow(["", ...bfr.map((_, i) => monthLabel(i))]);
  applyHeaderRow(header, 37);

  const rows: { label: string; key: keyof MonthlyBFR; isBold?: boolean }[] = [
    { label: "Créances clients",      key: "accountsReceivable" },
    { label: "Dettes fournisseurs",   key: "accountsPayable" },
    { label: "BFR",                   key: "bfr",               isBold: true },
    { label: "Variation BFR",         key: "bfrVariation" },
  ];

  rows.forEach(({ label, key, isBold }, ri) => {
    const values = bfr.map((m) => m[key] as number);
    const row = ws.addRow([label, ...values]);
    styleDataRow(row, ri % 2 === 0, 37);
    if (isBold) row.font = { bold: true, size: 9 };
    values.forEach((v, vi) => numFmt(row.getCell(vi + 2), v < 0));
  });
}

function buildAnnualSheet(wb: ExcelJS.Workbook, pnl: MonthlyPnL[], cashflow: MonthlyCashflow[]) {
  const ws = wb.addWorksheet("Résumé Annuel");

  setColWidths(ws, [28, 16, 16, 16]);

  const title = ws.addRow(["Résumé Annuel"]);
  ws.mergeCells(1, 1, 1, 4);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: C.dark } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
  title.height = 24;

  const header = ws.addRow(["Indicateur", "Année 1", "Année 2", "Année 3"]);
  applyHeaderRow(header, 4);

  function sumKey(arr: MonthlyPnL[], key: keyof MonthlyPnL, from: number, to: number) {
    return arr.slice(from, to).reduce((s, m) => s + (m[key] as number), 0);
  }
  function sumCF(arr: MonthlyCashflow[], key: keyof MonthlyCashflow, from: number, to: number) {
    return arr.slice(from, to).reduce((s, m) => s + (m[key] as number), 0);
  }

  const annualRows = [
    {
      label: "Chiffre d'affaires",
      values: [sumKey(pnl, "revenue", 0, 12), sumKey(pnl, "revenue", 12, 24), sumKey(pnl, "revenue", 24, 36)],
      bold: true,
    },
    {
      label: "Marge brute",
      values: [sumKey(pnl, "grossMargin", 0, 12), sumKey(pnl, "grossMargin", 12, 24), sumKey(pnl, "grossMargin", 24, 36)],
    },
    {
      label: "Taux de marge brute",
      values: [
        sumKey(pnl, "revenue", 0, 12) > 0 ? sumKey(pnl, "grossMargin", 0, 12) / sumKey(pnl, "revenue", 0, 12) : 0,
        sumKey(pnl, "revenue", 12, 24) > 0 ? sumKey(pnl, "grossMargin", 12, 24) / sumKey(pnl, "revenue", 12, 24) : 0,
        sumKey(pnl, "revenue", 24, 36) > 0 ? sumKey(pnl, "grossMargin", 24, 36) / sumKey(pnl, "revenue", 24, 36) : 0,
      ],
      isPct: true,
    },
    {
      label: "Charges fixes",
      values: [sumKey(pnl, "fixedCosts", 0, 12), sumKey(pnl, "fixedCosts", 12, 24), sumKey(pnl, "fixedCosts", 24, 36)],
    },
    {
      label: "Masse salariale",
      values: [sumKey(pnl, "payroll", 0, 12), sumKey(pnl, "payroll", 12, 24), sumKey(pnl, "payroll", 24, 36)],
    },
    {
      label: "EBITDA",
      values: [sumKey(pnl, "ebitda", 0, 12), sumKey(pnl, "ebitda", 12, 24), sumKey(pnl, "ebitda", 24, 36)],
      bold: true,
      isGreen: true,
    },
    {
      label: "Résultat net",
      values: [sumKey(pnl, "netResult", 0, 12), sumKey(pnl, "netResult", 12, 24), sumKey(pnl, "netResult", 24, 36)],
      bold: true,
    },
    {
      label: "Flux de trésorerie net",
      values: [sumCF(cashflow, "adjustedCashflow", 0, 12), sumCF(cashflow, "adjustedCashflow", 12, 24), sumCF(cashflow, "adjustedCashflow", 24, 36)],
    },
    {
      label: "Solde fin de période",
      values: [
        cashflow[11]?.endingBalance ?? 0,
        cashflow[23]?.endingBalance ?? 0,
        cashflow[35]?.endingBalance ?? 0,
      ],
      bold: true,
    },
  ];

  annualRows.forEach(({ label, values, bold, isPct, isGreen }, ri) => {
    const row = ws.addRow([label, ...values]);
    styleDataRow(row, ri % 2 === 0, 4);
    if (bold) row.getCell(1).font = { bold: true, size: 9 };

    values.forEach((v, vi) => {
      const cell = row.getCell(vi + 2);
      if (isPct) {
        pctFmt(cell);
        cell.value = v;
      } else {
        numFmt(cell, v < 0);
        if (bold) cell.font = { bold: true, size: 9, color: { argb: v < 0 ? C.red : C.dark } };
      }
      if (isGreen && !isPct) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
        cell.font = { bold: true, size: 9, color: { argb: v >= 0 ? C.green : C.red } };
      }
    });
  });
}

function buildIndicatorsSheet(wb: ExcelJS.Workbook, indicators: Indicators, scenario: string) {
  const ws = wb.addWorksheet("Indicateurs Clés");

  setColWidths(ws, [30, 20]);

  const title = ws.addRow([`Indicateurs Clés — Scénario ${scenario}`]);
  ws.mergeCells(1, 1, 1, 2);
  title.getCell(1).font = { bold: true, size: 11, color: { argb: C.dark } };
  title.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
  title.height = 24;

  const rows: { label: string; value: string | number; isGood?: boolean; isBad?: boolean }[] = [
    {
      label: "MRR actuel",
      value: indicators.mrr,
    },
    {
      label: "ARR actuel",
      value: indicators.arr,
    },
    {
      label: "Runway",
      value: indicators.runway === null ? "+36 mois" : `${indicators.runway} mois`,
      isGood: indicators.runway === null || indicators.runway >= 12,
      isBad: indicators.runway !== null && indicators.runway < 6,
    },
    {
      label: "Break-even",
      value: indicators.breakEvenMonth === null ? "Non atteint" : `Mois ${indicators.breakEvenMonth}`,
      isGood: indicators.breakEvenMonth !== null && indicators.breakEvenMonth <= 18,
    },
    {
      label: "Burn rate mensuel",
      value: indicators.burnRate,
      isBad: true,
    },
    ...(indicators.ltv != null ? [{ label: "LTV", value: indicators.ltv, isGood: true }] : []),
    ...(indicators.ltvCacRatio != null
      ? [
          {
            label: "LTV/CAC",
            value: indicators.ltvCacRatio,
            isGood: indicators.ltvCacRatio >= 3,
            isBad: indicators.ltvCacRatio < 1,
          },
        ]
      : []),
  ];

  rows.forEach(({ label, value, isGood, isBad }, ri) => {
    const row = ws.addRow([label, value]);
    styleDataRow(row, ri % 2 === 0, 2);
    const cell = row.getCell(2);
    if (typeof value === "number") {
      cell.numFmt = "#,##0 €";
    }
    cell.font = {
      bold: true,
      size: 10,
      color: { argb: isBad ? C.red : isGood ? C.green : C.dark },
    };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      pnl: MonthlyPnL[];
      cashflow: MonthlyCashflow[];
      bfr: MonthlyBFR[];
      indicators: Indicators;
      projectName: string;
      scenario: string;
    };

    const { pnl, cashflow, bfr, indicators, projectName, scenario } = body;

    if (!pnl?.length || !cashflow?.length || !bfr?.length) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "Alpact Studio — Elyse";
    wb.created = new Date();
    wb.properties.date1904 = false;

    buildPnLSheet(wb, pnl, projectName);
    buildCashflowSheet(wb, cashflow);
    buildBFRSheet(wb, bfr);
    buildAnnualSheet(wb, pnl, cashflow);
    buildIndicatorsSheet(wb, indicators, scenario);

    const buffer = await wb.xlsx.writeBuffer();

    const safeName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `bp_${safeName}_${scenario}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("XLSX export error:", err);
    return NextResponse.json({ error: "Export échoué" }, { status: 500 });
  }
}
