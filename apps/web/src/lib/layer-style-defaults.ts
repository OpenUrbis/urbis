export const DEFAULT_LAYER_FILL_COLOR = [55, 126, 184, 0.45] as const;
export const DEFAULT_LAYER_BORDER_COLOR = [31, 41, 55, 1] as const;
export const DEFAULT_LAYER_BACKGROUND_COLOR = [255, 255, 255, 0] as const;
export const DEFAULT_LAYER_TEXT_COLOR = [255, 255, 255, 1] as const;
export const DEFAULT_LAYER_HOVER_COLOR = [255, 255, 255, 0.35] as const;
export const DEFAULT_LAYER_SELECTED_COLOR = [255, 193, 7, 0.85] as const;
export const DEFAULT_LAYER_LINE_WIDTH = 1;

export const DEFAULT_LAYER_FORM_COLOR = {
  fillColor: [...DEFAULT_LAYER_FILL_COLOR],
  borderColor: [...DEFAULT_LAYER_BORDER_COLOR],
  textColor: [...DEFAULT_LAYER_TEXT_COLOR],
  pattern: "full" as const,
};

export const DYNAMIC_LAYER_COLOR_PALETTE = [
  [55, 126, 184, 0.55],
  [77, 175, 74, 0.55],
  [152, 78, 163, 0.55],
  [255, 127, 0, 0.55],
  [255, 255, 51, 0.55],
  [166, 86, 40, 0.55],
  [247, 129, 191, 0.55],
  [153, 153, 153, 0.55],
] as const;
