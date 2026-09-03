export interface ProspectiveColor {
    fill: [number, number, number, number];
    hex: string;
}
export interface ProspectiveColorPalette {
    P: ProspectiveColor;
    C: ProspectiveColor;
    E: ProspectiveColor;
    V: ProspectiveColor;
    Z: ProspectiveColor;
    GREY: ProspectiveColor;
    SELECTED: {
        outline: string;
    };
}
export declare const LIGHT_COLORS: ProspectiveColorPalette;
export declare const DARK_COLORS: ProspectiveColorPalette;
//# sourceMappingURL=colors.d.ts.map