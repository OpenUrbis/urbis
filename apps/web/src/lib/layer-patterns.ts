export type ILayerPattern = "hatch-cross" | "hatch-1x" | "dots" | "full";

export const patterns: { value: ILayerPattern; label: string; x: number; y: number }[] = [
  { value: "full", label: "Cor Cheia", x: 132, y: 4 },
  { value: "hatch-1x", label: "Linhas", x: 4, y: 4 },
  { value: "hatch-cross", label: "Cruzado", x: 4, y: 132 },
  { value: "dots", label: "Pontos", x: 132, y: 132 },
];

export const getPatternStyle = (pattern: ILayerPattern | undefined, color: string, scale = 0.25) => {
    const p = patterns.find(x => x.value === pattern) || patterns[0];
    
    // Scale for 32px/48px icons. 
    // Pattern tile is 120x120.
    // 0.4 scale -> 48px.
    const maskSize = `${256 * scale}px ${256 * scale}px`;
    const x = p.x * scale;
    const y = p.y * scale;
    
    return {
        backgroundColor: color,
        maskImage: 'url(/pattern.png)',
        WebkitMaskImage: 'url(/pattern.png)',
        maskSize,
        WebkitMaskSize: maskSize,
        maskPosition: `-${x}px -${y}px`,
        WebkitMaskPosition: `-${x}px -${y}px`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat'
    };
};
