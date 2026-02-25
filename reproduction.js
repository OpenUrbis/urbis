var TAGS_PREFIX = '(?:<(?:b|i|s|u|strong|em|strike|span)[^>]*>)*';
var SPACE = '[\\s.-]';
var SPACE_PLUS = SPACE + '+';
var SPACE_OPT = SPACE + '*';
var rules = [
    {
        id: 'alinea',
        name: 'Alínea',
        // Note: I'm copying the regex construction from the file string
        regex: new RegExp("^".concat(TAGS_PREFIX, "([a-z])[)..]").concat(SPACE_OPT, "(.*)")),
        type: 'Alínea',
        priority: 35
    },
    {
        id: 'inciso',
        name: 'Inciso',
        regex: new RegExp("^".concat(TAGS_PREFIX, "([IVXLCDM]+)").concat(SPACE_PLUS, "(.*)"), 'i'),
        type: 'Inciso',
        priority: 40
    }
];
var inputs = [
    "a - autorizar a abertura",
    "b - designar a comissão",
    "c - decidir sobre representações",
    "a) autorizar",
    "a. autorizar"
];
console.log("Testing inputs against rules...");
inputs.forEach(function (input) {
    var trimmed = input.trim();
    console.log("\nInput: \"".concat(input, "\" (trimmed: \"").concat(trimmed, "\")"));
    var matched = false;
    for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
        var rule = rules_1[_i];
        if (rule.regex.test(trimmed)) {
            console.log("MATCHED Rule: ".concat(rule.name, " (").concat(rule.id, ")"));
            var m = trimmed.match(rule.regex);
            console.log("  Captures: 1='".concat(m[1], "', 2='").concat(m[2], "'"));
            matched = true;
            break;
        }
    }
    if (!matched) {
        console.log("NO MATCH (would be Texto)");
    }
});
