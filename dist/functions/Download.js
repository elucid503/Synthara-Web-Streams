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
exports.Download = void 0;
const GetVideo_1 = require("./GetVideo");
/**
 * Downloads a YouTube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
function Download(urlOrId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = yield (0, GetVideo_1.GetVideo)(urlOrId, true);
        // This format filter is suitable for live video or music bots.
        return video.Download((f) => f.isHLS || (f.codec === 'opus' && !f.hasVideo && f.hasAudio), options);
    });
}
exports.Download = Download;
