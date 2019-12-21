declare namespace Theme {
  export interface ThemeConfig {
    selectionColor: string;
    selectionMode: string;
    allowExport: boolean;
  }
}

declare module "widgets/Theme/layerUtil" {
  import LayerInfos = require("jimu/LayerInfos/LayerInfos");
  import LayerInfo = require("jimu/LayerInfos/LayerInfo");

  class LayerUtil {
    static getLayerInfoArray(
      layerInfosObject: LayerInfos
    ): dojo.Deferred<LayerInfo[]>;
  }

  export = LayerUtil;
}

declare module "widgets/Theme/ClearSelectionAction" {
  import BaseFeatureAction = require("jimu/BaseFeatureAction");

  class ClearSelectionAction extends BaseFeatureAction {}

  export = ClearSelectionAction;
}
