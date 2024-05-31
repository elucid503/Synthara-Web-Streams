"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokens = exports.decipher = void 0;
const jsVarStr = '[a-zA-Z_\\$]\\w*';
const jsSingleQuoteStr = `'[^'\\\\]*(:?\\\\[\\s\\S][^'\\\\]*)*'`;
const jsDoubleQuoteStr = `"[^"\\\\]*(:?\\\\[\\s\\S][^"\\\\]*)*"`;
const jsQuoteStr = `(?:${jsSingleQuoteStr}|${jsDoubleQuoteStr})`;
const jsKeyStr = `(?:${jsVarStr}|${jsQuoteStr})`;
const jsPropStr = `(?:\\.${jsVarStr}|\\[${jsQuoteStr}\\])`;
const jsEmptyStr = `(?:''|"")`;
const reverseStr = ':function\\(a\\)\\{(?:return )?a\\.reverse\\(\\)\\}';
const sliceStr = ':function\\(a,b\\)\\{return a\\.slice\\(b\\)\\}';
const spliceStr = ':function\\(a,b\\)\\{a\\.splice\\(0,b\\)\\}';
const swapStr = ':function\\(a,b\\)\\{' +
    'var c=a\\[0\\];a\\[0\\]=a\\[b(?:%a\\.length)?\\];a\\[b(?:%a\\.length)?\\]=c' +
    '(?:;return a)?\\}';
const actionsObjRegexp = new RegExp(`var (${jsVarStr})=\\{((?:(?:${jsKeyStr}${reverseStr}|${jsKeyStr}${sliceStr}|${jsKeyStr}${spliceStr}|${jsKeyStr}${swapStr}),?\\r?\\n?)+)\\};`);
const actionsFuncRegexp = new RegExp(`function(?: ${jsVarStr})?\\(a\\)\\{` +
    `a=a\\.split\\(${jsEmptyStr}\\);\\s*` +
    `((?:(?:a=)?${jsVarStr}${jsPropStr}\\(a,\\d+\\);)+)` +
    `return a\\.join\\(${jsEmptyStr}\\)\\}`);
const reverseRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${reverseStr}`, 'm');
const sliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${sliceStr}`, 'm');
const spliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${spliceStr}`, 'm');
const swapRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${swapStr}`, 'm');
function decipher(tokens, sig) {
    let arr = sig.split('');
    for (const token of tokens) {
        const position = Number(token.slice(1));
        switch (token[0]) {
            case 'r':
                arr.reverse();
                break;
            case 's':
                arr = arr.slice(position);
                break;
            case 'p':
                arr.splice(0, position);
                break;
            case 'w':
                [arr[0], arr[position % arr.length]] = [arr[position % arr.length], arr[0]];
                break;
        }
    }
    return arr.join('');
}
exports.decipher = decipher;
function extractTokens(body) {
    var _a, _b, _c, _d;
    const objResult = actionsObjRegexp.exec(body);
    const funcResult = actionsFuncRegexp.exec(body);
    if (!objResult || !funcResult) {
        return null;
    }
    const obj = objResult[1].replace(/\$/g, '\\$');
    const objBody = objResult[2].replace(/\$/g, '\\$');
    const funcBody = funcResult[1].replace(/\$/g, '\\$');
    const reverseKey = (_a = reverseRegexp
        .exec(objBody)) === null || _a === void 0 ? void 0 : _a[1].replace(/\$/g, '\\$').replace(/\$|^'|^"|'$|"$/g, '');
    const sliceKey = (_b = sliceRegexp
        .exec(objBody)) === null || _b === void 0 ? void 0 : _b[1].replace(/\$/g, '\\$').replace(/\$|^'|^"|'$|"$/g, '');
    const spliceKey = (_c = spliceRegexp
        .exec(objBody)) === null || _c === void 0 ? void 0 : _c[1].replace(/\$/g, '\\$').replace(/\$|^'|^"|'$|"$/g, '');
    const swapKey = (_d = swapRegexp
        .exec(objBody)) === null || _d === void 0 ? void 0 : _d[1].replace(/\$/g, '\\$').replace(/\$|^'|^"|'$|"$/g, '');
    const keys = `(${reverseKey}|${sliceKey}|${spliceKey}|${swapKey})`;
    const tokenizeRegexp = new RegExp(`(?:a=)?${obj}(?:\\.${keys}|\\[(?:'${keys}'|"${keys}")\\])\\(a,(\\d+)\\)`, 'g');
    const tokens = [];
    for (const result of funcBody.matchAll(tokenizeRegexp)) {
        const key = result[1] || result[2] || result[3];
        switch (key) {
            case reverseKey:
                tokens.push('r');
                break;
            case sliceKey:
                tokens.push(`s${result[4]}`);
                break;
            case spliceKey:
                tokens.push(`p${result[4]}`);
                break;
            case swapKey:
                tokens.push(`w${result[4]}`);
                break;
        }
    }
    return tokens;
}
exports.extractTokens = extractTokens;
