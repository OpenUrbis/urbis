
const TAGS_PREFIX = '(?:<(?:b|i|s|u|strong|em|strike|span)[^>]*>)*';
const SPACE = '[\\s.-]';
const SPACE_PLUS = SPACE + '+';
const SPACE_OPT = SPACE + '*';

const rules = [
    {
        id: 'alinea',
        name: 'Alínea',
        // PROPOSED FIX: 
        // 1. Allow space between letter and separator: ${SPACE_OPT}
        // 2. Add '-' to separator set: [)..-]
        regex: new RegExp(`^${TAGS_PREFIX}([a-z])${SPACE_OPT}[)..-]${SPACE_OPT}(.*)`),
        type: 'Alínea',
        priority: 35
    },
    {
        id: 'inciso',
        name: 'Inciso',
        regex: new RegExp(`^${TAGS_PREFIX}([IVXLCDM]+)${SPACE_PLUS}(.*)`, 'i'), 
        type: 'Inciso',
        priority: 40
    }
];

const inputs = [
    "a. autorizar", 
    "a . autorizar", 
    "c . decidir",
    "a - autorizar",
    "c - decidir",
    "a bit of text", // Should NOT match
    "i - alinea i",  // Should match Alínea
    "I - inciso I"   // "I" is Uppercase. Alínea expects [a-z]. So "I" fails Alínea. Matches Inciso.
];

console.log("Testing inputs against ROBUST PROPOSED rules...");

inputs.forEach(input => {
    const trimmed = input.trim();
    console.log(`\nInput: "${input}" (trimmed: "${trimmed}")`);
    
    let matched = false;
    for (const rule of rules) {
        if (rule.regex.test(trimmed)) {
            console.log(`MATCHED Rule: ${rule.name} (${rule.id})`);
            const m = trimmed.match(rule.regex);
            console.log(`  Captures: 1='${m[1]}', 2='${m[2]}'`);
            matched = true;
            break; 
        }
    }
    
    if (!matched) {
        console.log("NO MATCH (would be Texto)");
    }
});
