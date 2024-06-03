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
const classes_1 = require("./classes");
const functions_1 = require("./functions");
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const info = yield (0, functions_1.GetVideo)(url, true);
        const NewVideo = new classes_1.YoutubeVideo(info.json, info.liveFormats);
        const format = NewVideo.formats.filter((f) => !f.hasVideo && f.hasAudio && f.isHLS);
        console.log(format);
    });
}
setTimeout(Main, 1000);
