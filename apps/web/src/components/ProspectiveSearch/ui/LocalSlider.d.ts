import * as React from "react";
import { SliderPrimitive } from "@open-urbis/map-ui";
interface LocalSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Slider> {
    ticks?: number;
    tickLabels?: (string | number)[];
    min?: number;
    max?: number;
    step?: number;
    value?: number[];
    defaultValue?: number[];
}
declare const LocalSlider: React.ForwardRefExoticComponent<LocalSliderProps & React.RefAttributes<HTMLSpanElement>>;
export { LocalSlider };
//# sourceMappingURL=LocalSlider.d.ts.map