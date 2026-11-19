import { LocaleType, mergeLocales, Univer, type IWorkbookData } from "@univerjs/core";
import { FUniver } from "@univerjs/core/facade";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { CalculationMode, UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import SheetsEnUS from "@univerjs/sheets/locale/en-US";
import "@univerjs/engine-formula/facade";
import "@univerjs/sheets/facade";
import "@univerjs/sheets-formula/facade";
import "@univerjs/sheets-numfmt/facade";
import { createPricingWorkbookData } from "./workbook-data";
import type { UniverFacade } from "./sheet-io";

/** Apache-2.0 headless Sheets (no UI, no commercial Server/PDF/AI SDK). */
export function bootHeadlessUniver(snapshot?: IWorkbookData): UniverFacade {
  const univer = new Univer({
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: mergeLocales(SheetsEnUS),
    },
  });
  univer.registerPlugin(UniverRenderEnginePlugin);
  univer.registerPlugin(UniverFormulaEnginePlugin);
  univer.registerPlugin(UniverDocsPlugin);
  univer.registerPlugin(UniverSheetsPlugin);
  univer.registerPlugin(UniverSheetsFormulaPlugin, {
    initialFormulaComputing: CalculationMode.FORCED,
  });
  univer.registerPlugin(UniverSheetsNumfmtPlugin);
  const api = FUniver.newAPI(univer);
  api.createWorkbook(snapshot ?? createPricingWorkbookData());
  return api as unknown as UniverFacade;
}
