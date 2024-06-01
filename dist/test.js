"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("./functions");
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        let url = 'https://www.youtube.com/watch?v=XDMg06hw97U';
        console.time('Time taken to fetch video info');
        const info = yield (0, functions_1.GetVideo)(url, true);
        console.log(info);
        const format = info.formats.filter((f) => !f.hasVideo && f.hasAudio && f.isHLS);
        console.log(format);
    });
}
Main();
