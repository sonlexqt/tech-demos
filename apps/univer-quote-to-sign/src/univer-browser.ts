import { CalculationMode, UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, LocaleType, mergeLocales, type IWorkbookData } from "@univerjs/presets";
import "@univerjs/preset-sheets-core/lib/index.css";
import { createPricingWorkbookData } from "./workbook-data";
import type { UniverFacade } from "./sheet-io";

export function bootBrowserUniver(
  container: HTMLElement,
  snapshot?: IWorkbookData,
): { api: UniverFacade; dispose: () => void } {
  const { univer, univerAPI } = createUniver({
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
    },
    presets: [
      UniverSheetsCorePreset({
        container,
        header: false,
        toolbar: false,
        contextMenu: false,
        formulaBar: true,
        footer: false,
        formula: {
          initialFormulaComputing: CalculationMode.FORCED,
        },
      }),
    ],
  });
  univerAPI.createWorkbook(snapshot ?? createPricingWorkbookData());
  return {
    api: univerAPI as unknown as UniverFacade,
    dispose() {
      try {
        univer.dispose();
      } catch {
        // already torn down
      }
    },
  };
}

export function bootHiddenUniver(snapshot: IWorkbookData): { api: UniverFacade; dispose: () => void } {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-4000px;top:0;width:800px;height:600px;opacity:0;pointer-events:none";
  document.body.appendChild(host);
  try {
    const runtime = bootBrowserUniver(host, snapshot);
    return {
      api: runtime.api,
      dispose() {
        runtime.dispose();
        host.remove();
      },
    };
  } catch (error) {
    host.remove();
    throw error;
  }
}
