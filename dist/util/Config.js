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
exports.YoutubeConfig = void 0;
const Decipher_1 = require("./Decipher");
// IMPORTANT: INNERTUBE_CONTEXT client must be set to IOS in order to get HLS live formats
class YoutubeConfig extends null {
    static fetchConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('https://www.youtube.com/?hl=en');
                const json = JSON.parse(/ytcfg.set\(({.+?})\);/s.exec(yield response.text())[1]);
                YoutubeConfig.INNERTUBE_API_KEY = json.INNERTUBE_API_KEY;
                YoutubeConfig.INNERTUBE_API_VERSION = json.INNERTUBE_API_VERSION;
                YoutubeConfig.STS = json.STS;
                if (YoutubeConfig.PLAYER_JS_URL !== json.PLAYER_JS_URL) {
                    const response = yield fetch(`https://www.youtube.com${json.PLAYER_JS_URL}`);
                    const player = yield response.text();
                    YoutubeConfig.PLAYER_JS_URL = json.PLAYER_JS_URL;
                    YoutubeConfig.PLAYER_TOKENS = (0, Decipher_1.extractTokens)(player);
                }
                setTimeout(YoutubeConfig.fetchConfig, 120 * 60 * 1000);
            }
            catch (_a) { }
        });
    }
}
exports.YoutubeConfig = YoutubeConfig;
YoutubeConfig.INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
YoutubeConfig.INNERTUBE_API_VERSION = 'v1';
YoutubeConfig.INNERTUBE_CLIENT_NAME = 'WEB';
YoutubeConfig.INNERTUBE_CLIENT_VERSION = '2.20231012.01.03';
YoutubeConfig.INNERTUBE_CONTEXT = {
    client: {
        clientName: 'IOS',
        clientVersion: '19.09.3',
        deviceModel: 'iPhone14,3',
        userAgent: 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)'
    }
};
YoutubeConfig.STS = 0;
YoutubeConfig.PLAYER_JS_URL = '';
YoutubeConfig.PLAYER_TOKENS = null;
YoutubeConfig.fetchConfig();
