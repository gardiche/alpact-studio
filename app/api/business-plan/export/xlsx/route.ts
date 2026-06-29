import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type {
  Indicators,
  MonthlyBFR,
  MonthlyCashflow,
  MonthlyPnL,
  ProjectData,
} from "@/types/business-plan";

const C = {
  green: "FF1CB785",
  greenLight: "FFE8F8F3",
  orange: "FFFF8F27",
  orangeLight: "FFFFF2E7",
  red: "FFFF4F3F",
  redLight: "FFFFECEA",
  dark: "FF111111",
  muted: "FF888888",
  border: "FFE4E0DB",
  bg: "FFF7F5F2",
  white: "FFFFFFFF",
  black: "FF111111",
  inputBlue: "FF0000FF",
  linkGreen: "FF008000",
};

const MONEY = "#,##0 EUR;[Red](#,##0 EUR);-";
const NUMBER = "#,##0;[Red](#,##0);-";
const PERCENT = "0.0%;[Red](0.0%);-";
const MULTIPLE = "0.00x;[Red](0.00x);-";

const MONTHS = Array.from({ length: 36 }, (_, i) => `M${i + 1}`);

function col(n: number) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

function safeSheet(name: string) {
  return `'${name.replace(/'/g, "''")}'`;
}

function fmtSheet(ws: ExcelJS.Worksheet, widths: number[]) {
  ws.properties.defaultRowHeight = 18;
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3, showGridLines: false }];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function title(ws: ExcelJS.Worksheet, text: string, cols: number) {
  ws.mergeCells(1, 1, 1, cols);
  const cell = ws.getCell(1, 1);
  cell.value = text;
  cell.font = { name: "Calibri", size: 15, bold: true, color: { argb: C.dark } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.greenLight } };
  cell.alignment = { vertical: "middle" };
  ws.getRow(1).height = 28;
}

function header(row: ExcelJS.Row, cols: number) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell, i) => {
    if (i > cols) return;
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: C.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.green } };
    cell.alignment = { horizontal: i === 1 ? "left" : "right", vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: C.border } } };
  });
}

function section(row: ExcelJS.Row, cols: number, label?: string) {
  row.height = 22;
  if (label) row.getCell(1).value = label;
  row.eachCell({ includeEmpty: true }, (cell, i) => {
    if (i > cols) return;
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: C.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.dark } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });
}

function styleRow(row: ExcelJS.Row, cols: number, opts: { total?: boolean; input?: boolean; link?: boolean; alt?: boolean } = {}) {
  row.eachCell({ includeEmpty: true }, (cell, i) => {
    if (i > cols) return;
    cell.font = {
      name: "Calibri",
      size: 9,
      bold: opts.total,
      color: { argb: opts.input ? C.inputBlue : opts.link ? C.linkGreen : C.black },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: opts.total ? C.greenLight : opts.alt ? "FFFAF9F7" : C.white },
    };
    cell.border = {
      bottom: { style: opts.total ? "thin" : "hair", color: { argb: C.border } },
    };
    cell.alignment = { horizontal: i === 1 ? "left" : "right", vertical: "middle" };
  });
}

function money(cell: ExcelJS.Cell) {
  cell.numFmt = MONEY;
}

function pct(cell: ExcelJS.Cell) {
  cell.numFmt = PERCENT;
}

function multiple(cell: ExcelJS.Cell) {
  cell.numFmt = MULTIPLE;
}

function annualSumFormula(sheet: string, row: number, year: number) {
  const start = 2 + year * 12;
  const end = start + 11;
  return `SUM(${safeSheet(sheet)}!${col(start)}${row}:${col(end)}${row})`;
}

function addMonthlyHeader(ws: ExcelJS.Worksheet, row = 3) {
  const r = ws.getRow(row);
  r.values = ["", ...MONTHS];
  header(r, 37);
}

function buildHypotheses(wb: ExcelJS.Workbook, data: ProjectData | null, scenario: string) {
  const ws = wb.addWorksheet("Hypotheses");
  fmtSheet(ws, [30, 22, 18, 48]);
  title(ws, "Hypotheses - Elyse Business Plan", 4);

  const rows: Array<[string, string | number | null | undefined, string, string]> = [
    ["Projet", data?.project.name, "user_input", "Nom du projet"],
    ["Type d'activite", data?.project.business_type, "user_input", "Digital-first"],
    ["Stade", data?.project.stage, "user_input", ""],
    ["Scenario", scenario, "user_input", "Scenario exporte"],
    ["Tresorerie initiale", data?.treasury.cash_balance, "user_input", "Cash disponible au demarrage"],
    ["Delai paiement clients", data?.treasury.payment_delay_clients_days, "user_input", "Jours"],
    ["Delai paiement fournisseurs", data?.treasury.payment_delay_suppliers_days, "user_input", "Jours"],
    ["TVA", (data?.bpContext.vat_rate ?? 20) / 100, "user_input", "Taux simplifie"],
    ["Pret bancaire", data?.bpContext.bank_loan_amount ?? data?.bpContext.funding_amount_requested, "user_input", ""],
    ["Duree pret", data?.bpContext.loan_duration_months ?? 60, "user_input", "Mois"],
    ["Taux annuel", (data?.bpContext.annual_interest_rate ?? 4.5) / 100, "user_input", ""],
    ["Differe", data?.bpContext.deferment_months ?? 0, "user_input", "Mois"],
    ["Apport fondateurs", data?.bpContext.founder_contribution, "user_input", ""],
    ["Capital social", data?.bpContext.capital_social, "user_input", ""],
    ["Compte courant associe", data?.bpContext.associate_current_account, "user_input", ""],
    ["CAPEX", data?.bpContext.capex_amount, "user_input", "Investissements initiaux"],
    ["Buffer BFR / securite", data?.bpContext.working_capital_buffer, "user_input", ""],
  ];

  const h = ws.addRow(["Hypothese", "Valeur", "Source", "Note"]);
  header(h, 4);
  rows.forEach((item, i) => {
    const r = ws.addRow(item);
    styleRow(r, 4, { input: true, alt: i % 2 === 0 });
    if (typeof item[1] === "number") {
      if (item[0].includes("TVA") || item[0].includes("Taux")) pct(r.getCell(2));
      else if (item[0].includes("Delai") || item[0].includes("Duree") || item[0].includes("Differe")) r.getCell(2).numFmt = NUMBER;
      else money(r.getCell(2));
    }
  });

  ws.addRow([]);
  section(ws.addRow(["Legende"]), 4);
  const l1 = ws.addRow(["Bleu", "Hypothese editable", "", "Donnees issues du wizard Elyse"]);
  styleRow(l1, 4, { input: true });
  const l2 = ws.addRow(["Vert", "Lien interne", "", "Formules liees a d'autres onglets"]);
  styleRow(l2, 4, { link: true });
}

function buildRevenues(wb: ExcelJS.Workbook, data: ProjectData | null, pnl: MonthlyPnL[]) {
  const ws = wb.addWorksheet("Revenus digital");
  fmtSheet(ws, [28, 16, 16, 16, 16, ...Array(36).fill(10)]);
  title(ws, "Revenus digital", 41);

  const h = ws.addRow(["Offre", "Type", "Prix moyen", "Clients actuels", "Nouveaux/mois", ...MONTHS]);
  header(h, 41);
  const lines = data?.revenueLines ?? [];
  lines.forEach((line, i) => {
    const hyp = data?.growthHypotheses.find((g) => g.revenue_line_id === line.id);
    const row = ws.addRow([
      line.name,
      line.type,
      line.unit_price,
      line.current_volume,
      hyp?.monthly_new_customers ?? 0,
      ...Array(36).fill(""),
    ]);
    styleRow(row, 41, { input: true, alt: i % 2 === 0 });
    money(row.getCell(3));
  });

  const totalRow = ws.addRow(["Total CA", "", "", "", "", ...pnl.map((_, i) => ({ formula: `${safeSheet("P&L")}!${col(i + 2)}4` }))]);
  styleRow(totalRow, 41, { total: true, link: true });
  for (let c = 6; c <= 41; c++) money(totalRow.getCell(c));
}

function buildTeam(wb: ExcelJS.Workbook, data: ProjectData | null, pnl: MonthlyPnL[]) {
  const ws = wb.addWorksheet("Equipe");
  fmtSheet(ws, [26, 16, 12, 16, 16, ...Array(36).fill(10)]);
  title(ws, "Equipe et masse salariale", 41);
  const h = ws.addRow(["Role", "Type", "Nombre", "Net mensuel", "Statut", ...MONTHS]);
  header(h, 41);
  (data?.teamMembers ?? []).forEach((m, i) => {
    const row = ws.addRow([
      m.role,
      m.type,
      m.count,
      m.net_salary_monthly ?? 0,
      m.is_current ? "En poste" : "A recruter",
      ...Array(36).fill(""),
    ]);
    styleRow(row, 41, { input: true, alt: i % 2 === 0 });
    money(row.getCell(4));
  });
  const total = ws.addRow(["Masse salariale totale", "", "", "", "", ...pnl.map((m) => m.payroll)]);
  styleRow(total, 41, { total: true });
  for (let c = 6; c <= 41; c++) money(total.getCell(c));
}

function buildCharges(wb: ExcelJS.Workbook, data: ProjectData | null, pnl: MonthlyPnL[]) {
  const ws = wb.addWorksheet("Charges");
  fmtSheet(ws, [28, 18, 18, 18, ...Array(36).fill(10)]);
  title(ws, "Charges fixes et variables", 40);
  const h = ws.addRow(["Poste", "Categorie", "Modele", "Montant", ...MONTHS]);
  header(h, 40);
  const rows = [
    ...(data?.fixedCosts ?? []).map((c) => ({
      label: c.label,
      category: c.category,
      model: "fixe mensuel",
      amount: c.amount_monthly,
    })),
    ...(data?.variableCosts ?? []).map((c) => ({
      label: c.label,
      category: c.category,
      model: c.cost_model,
      amount: c.current_amount_monthly ?? c.unit_cost ?? c.percentage ?? 0,
    })),
  ];
  rows.forEach((item, i) => {
    const row = ws.addRow([item.label, item.category, item.model, item.amount, ...Array(36).fill("")]);
    styleRow(row, 40, { input: true, alt: i % 2 === 0 });
    money(row.getCell(4));
  });
  const fixed = ws.addRow(["Total charges fixes", "", "", "", ...pnl.map((m) => m.externalCosts)]);
  styleRow(fixed, 40, { total: true });
  const variable = ws.addRow(["Total charges variables", "", "", "", ...pnl.map((m) => m.variableCosts)]);
  styleRow(variable, 40, { total: true });
  for (const row of [fixed, variable]) for (let c = 5; c <= 40; c++) money(row.getCell(c));
}

function buildPnl(wb: ExcelJS.Workbook, pnl: MonthlyPnL[]) {
  const ws = wb.addWorksheet("P&L");
  fmtSheet(ws, [28, ...Array(36).fill(10)]);
  title(ws, "Compte de resultat previsionnel", 37);
  addMonthlyHeader(ws);

  const rows = [
    ["Chiffre d'affaires", pnl.map((m) => m.revenue), true],
    ["Charges variables", pnl.map((m) => m.variableCosts), false],
    ["Marge brute", null, true],
    ["Taux marge brute", null, false],
    ["Charges fixes", pnl.map((m) => m.externalCosts), false],
    ["Masse salariale", pnl.map((m) => m.payroll), false],
    ["EBITDA", null, true],
    ["Amortissements", pnl.map((m) => m.depreciation), false],
    ["Resultat exploitation", null, true],
    ["Charges financieres", pnl.map((m) => m.financialExpenses), false],
    ["Impot societes", pnl.map((m) => m.tax), false],
    ["Resultat net", null, true],
  ] as const;

  rows.forEach(([label, values, total], idx) => {
    const rowNumber = 4 + idx;
    const row = ws.getRow(rowNumber);
    row.getCell(1).value = label;
    for (let i = 0; i < 36; i++) {
      const c = i + 2;
      if (values) row.getCell(c).value = values[i];
      else if (label === "Marge brute") row.getCell(c).value = { formula: `${col(c)}4-${col(c)}5` };
      else if (label === "Taux marge brute") row.getCell(c).value = { formula: `IF(${col(c)}4=0,0,${col(c)}6/${col(c)}4)` };
      else if (label === "EBITDA") row.getCell(c).value = { formula: `${col(c)}6-${col(c)}8-${col(c)}9` };
      else if (label === "Resultat exploitation") row.getCell(c).value = { formula: `${col(c)}10-${col(c)}11` };
      else if (label === "Resultat net") row.getCell(c).value = { formula: `${col(c)}12-${col(c)}13-${col(c)}14` };
    }
    styleRow(row, 37, { total: Boolean(total), link: !values });
    for (let c = 2; c <= 37; c++) label.includes("Taux") ? pct(row.getCell(c)) : money(row.getCell(c));
  });
}

function buildCashflow(wb: ExcelJS.Workbook, cashflow: MonthlyCashflow[]) {
  const ws = wb.addWorksheet("Tresorerie");
  fmtSheet(ws, [30, ...Array(36).fill(10)]);
  title(ws, "Plan de tresorerie mensuel", 37);
  addMonthlyHeader(ws);

  const rows: Array<[string, keyof MonthlyCashflow | null, boolean]> = [
    ["Encaissements clients HT", "clientReceipts", false],
    ["TVA collectee", "vatCollected", false],
    ["Entrees exceptionnelles", "exceptionalInflows", false],
    ["Total encaissements", null, true],
    ["Decaissements fournisseurs HT", "supplierPayments", false],
    ["TVA deductible", "vatDeductible", false],
    ["TVA payee", "vatPayments", false],
    ["Masse salariale decaissee", "salaryPayments", false],
    ["Remboursement capital", "loanRepayments", false],
    ["Interets", "interestPayments", false],
    ["CAPEX", "capexPayments", false],
    ["Impots", "taxPayments", false],
    ["Total decaissements", null, true],
    ["Flux net", null, true],
    ["Solde fin de mois", "endingBalance", true],
  ];

  rows.forEach(([label, key, total], idx) => {
    const rowNumber = 4 + idx;
    const row = ws.getRow(rowNumber);
    row.getCell(1).value = label;
    for (let i = 0; i < 36; i++) {
      const c = i + 2;
      if (key) row.getCell(c).value = cashflow[i]?.[key] as number;
      else if (label === "Total encaissements") row.getCell(c).value = { formula: `SUM(${col(c)}4:${col(c)}6)` };
      else if (label === "Total decaissements") row.getCell(c).value = { formula: `SUM(${col(c)}8:${col(c)}14)` };
      else if (label === "Flux net") row.getCell(c).value = { formula: `${col(c)}7-${col(c)}16` };
    }
    styleRow(row, 37, { total });
    for (let c = 2; c <= 37; c++) money(row.getCell(c));
  });

  ws.addConditionalFormatting({
    ref: "B18:AK18",
    rules: [
      {
        type: "cellIs",
        operator: "lessThan",
        formulae: ["0"],
        style: {
          font: { color: { argb: C.red }, bold: true },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.redLight } },
        },
      } as ExcelJS.ConditionalFormattingRule,
    ],
  });
}

function buildFinancing(wb: ExcelJS.Workbook, data: ProjectData | null, indicators: Indicators) {
  const ws = wb.addWorksheet("Financement");
  fmtSheet(ws, [34, 18, 18, 18, 18]);
  title(ws, "Plan de financement", 5);
  header(ws.addRow(["Poste", "Annee 1", "Annee 2", "Annee 3", "Note"]), 5);

  section(ws.addRow(["EMPLOIS"]), 5);
  const emplois = [
    ["CAPEX", data?.bpContext.capex_amount ?? 0, 0, 0, "Investissements initiaux"],
    ["Variation / besoin BFR", indicators.financingNeed, 0, 0, "Besoin estime par le modele"],
    ["Coussin de securite", data?.bpContext.working_capital_buffer ?? 0, 0, 0, "Buffer discretionnaire"],
    ["Total emplois", { formula: "SUM(B4:B6)" }, { formula: "SUM(C4:C6)" }, { formula: "SUM(D4:D6)" }, ""],
  ];
  emplois.forEach((r, i) => {
    const row = ws.addRow(r);
    styleRow(row, 5, { total: i === emplois.length - 1, input: i < emplois.length - 1 });
    for (let c = 2; c <= 4; c++) money(row.getCell(c));
  });

  section(ws.addRow(["RESSOURCES"]), 5);
  const ressources = [
    ["Apport fondateurs", data?.bpContext.founder_contribution ?? 0, 0, 0, ""],
    ["Capital social", data?.bpContext.capital_social ?? 0, 0, 0, ""],
    ["Compte courant associe", data?.bpContext.associate_current_account ?? 0, 0, 0, ""],
    ["Pret bancaire", data?.bpContext.bank_loan_amount ?? data?.bpContext.funding_amount_requested ?? 0, 0, 0, ""],
    ["Tresorerie initiale", data?.treasury.cash_balance ?? 0, 0, 0, ""],
    ["Total ressources", { formula: "SUM(B9:B13)" }, { formula: "SUM(C9:C13)" }, { formula: "SUM(D9:D13)" }, ""],
    ["Ecart ressources - emplois", { formula: "B14-B7" }, { formula: "C14-C7" }, { formula: "D14-D7" }, "Doit etre positif"],
  ];
  ressources.forEach((r, i) => {
    const row = ws.addRow(r);
    styleRow(row, 5, { total: i >= ressources.length - 2, input: i < ressources.length - 2 });
    for (let c = 2; c <= 4; c++) money(row.getCell(c));
  });
}

function buildBfr(wb: ExcelJS.Workbook, bfr: MonthlyBFR[]) {
  const ws = wb.addWorksheet("BFR");
  fmtSheet(ws, [28, ...Array(36).fill(10)]);
  title(ws, "BFR simplifie", 37);
  addMonthlyHeader(ws);
  const rows: Array<[string, keyof MonthlyBFR, boolean]> = [
    ["Creances clients", "accountsReceivable", false],
    ["Dettes fournisseurs", "accountsPayable", false],
    ["BFR", "bfr", true],
    ["Variation BFR", "bfrVariation", false],
  ];
  rows.forEach(([label, key, total], idx) => {
    const row = ws.getRow(4 + idx);
    row.getCell(1).value = label;
    bfr.forEach((m, i) => (row.getCell(i + 2).value = m[key]));
    styleRow(row, 37, { total });
    for (let c = 2; c <= 37; c++) money(row.getCell(c));
  });
}

function buildControls(wb: ExcelJS.Workbook, indicators: Indicators) {
  const ws = wb.addWorksheet("Controles");
  fmtSheet(ws, [32, 18, 18, 18, 48]);
  title(ws, "Controles de coherence", 5);
  header(ws.addRow(["Controle", "Valeur", "Seuil", "Statut", "Note"]), 5);
  const rows = [
    ["Tresorerie minimale", indicators.minCashBalance, 0, { formula: 'IF(B3>=C3,"OK","ALERTE")' }, "Le point bas ne doit pas etre negatif"],
    ["DSCR minimum", indicators.minDscr ?? 99, 1.2, { formula: 'IF(B4>=C4,"OK","ALERTE")' }, "Capacite de remboursement"],
    ["Gap financement", indicators.financingGap, 0, { formula: 'IF(B5<=C5,"OK","ALERTE")' }, "Les ressources doivent couvrir les emplois"],
    ["Runway", indicators.runway ?? 36, 12, { formula: 'IF(B6>=C6,"OK","A SURVEILLER")' }, "Runway cible pour une banque"],
  ];
  rows.forEach((r, i) => {
    const row = ws.addRow(r);
    styleRow(row, 5, { alt: i % 2 === 0 });
    if (i === 1) {
      multiple(row.getCell(2));
      multiple(row.getCell(3));
    } else if (i === 3) {
      row.getCell(2).numFmt = NUMBER;
      row.getCell(3).numFmt = NUMBER;
    } else {
      money(row.getCell(2));
      money(row.getCell(3));
    }
  });
}

function buildSummary(wb: ExcelJS.Workbook, projectName: string, scenario: string, indicators: Indicators) {
  const ws = wb.addWorksheet("Synthese");
  fmtSheet(ws, [34, 18, 18, 18, 22]);
  title(ws, `Synthese bancaire - ${projectName}`, 5);
  header(ws.addRow(["Indicateur", "Annee 1", "Annee 2", "Annee 3", "Lecture"]), 5);
  const rows = [
    ["Chiffre d'affaires", { formula: annualSumFormula("P&L", 4, 0) }, { formula: annualSumFormula("P&L", 4, 1) }, { formula: annualSumFormula("P&L", 4, 2) }, scenario],
    ["Marge brute", { formula: annualSumFormula("P&L", 6, 0) }, { formula: annualSumFormula("P&L", 6, 1) }, { formula: annualSumFormula("P&L", 6, 2) }, ""],
    ["EBITDA", { formula: annualSumFormula("P&L", 10, 0) }, { formula: annualSumFormula("P&L", 10, 1) }, { formula: annualSumFormula("P&L", 10, 2) }, ""],
    ["Resultat net", { formula: annualSumFormula("P&L", 15, 0) }, { formula: annualSumFormula("P&L", 15, 1) }, { formula: annualSumFormula("P&L", 15, 2) }, ""],
    ["Solde tresorerie fin annee", { formula: `${safeSheet("Tresorerie")}!M18` }, { formula: `${safeSheet("Tresorerie")}!Y18` }, { formula: `${safeSheet("Tresorerie")}!AK18` }, ""],
    ["DSCR minimum", indicators.minDscr ?? 0, "", "", indicators.minDscr == null ? "Pas de dette" : indicators.minDscr >= 1.2 ? "Defendable" : "Fragile"],
    ["Tresorerie minimale", indicators.minCashBalance, "", "", indicators.minCashBalance >= 0 ? "OK" : "Alerte"],
    ["Ecart financement", indicators.financingGap, "", "", indicators.financingGap <= 0 ? "Couvert" : "A completer"],
  ];
  rows.forEach((r, i) => {
    const row = ws.addRow(r);
    styleRow(row, 5, { total: [0, 2, 4].includes(i), link: i < 5 });
    for (let c = 2; c <= 4; c++) {
      if (i === 5) multiple(row.getCell(c));
      else money(row.getCell(c));
    }
  });
  ws.getCell("A13").value = "Note";
  ws.getCell("B13").value = "Les onglets bleus contiennent les hypotheses; les onglets verts/noirs contiennent les calculs et controles.";
  ws.mergeCells("B13:E13");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      pnl: MonthlyPnL[];
      cashflow: MonthlyCashflow[];
      bfr: MonthlyBFR[];
      indicators: Indicators;
      dataSnapshot?: ProjectData | null;
      projectName: string;
      scenario: string;
    };

    const { pnl, cashflow, bfr, indicators, dataSnapshot, projectName, scenario } = body;
    if (!pnl?.length || !cashflow?.length || !bfr?.length || !indicators) {
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "Alpact Studio - Elyse";
    wb.created = new Date();
    wb.properties.date1904 = false;
    wb.calcProperties.fullCalcOnLoad = true;

    buildSummary(wb, projectName, scenario, indicators);
    buildHypotheses(wb, dataSnapshot ?? null, scenario);
    buildRevenues(wb, dataSnapshot ?? null, pnl);
    buildTeam(wb, dataSnapshot ?? null, pnl);
    buildCharges(wb, dataSnapshot ?? null, pnl);
    buildPnl(wb, pnl);
    buildCashflow(wb, cashflow);
    buildFinancing(wb, dataSnapshot ?? null, indicators);
    buildBfr(wb, bfr);
    buildControls(wb, indicators);

    for (const ws of wb.worksheets) {
      ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          cell.protection = { locked: false };
        });
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const safeName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bp_${safeName}_${scenario}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("XLSX export error:", err);
    return NextResponse.json({ error: "Export echoue" }, { status: 500 });
  }
}
