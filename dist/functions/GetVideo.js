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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetVideo = void 0;
const https_proxy_agent_1 = require("https-proxy-agent");
const axios_1 = __importDefault(require("axios"));
const classes_1 = require("../classes");
const util_1 = require("../util");
function GetVideo(URLorID_1) {
    return __awaiter(this, arguments, void 0, function* (URLorID, GetHLSFormats = false, Proxy) {
        var _a, _b;
        const videoId = util_1.Util.getVideoId(URLorID);
        if (!videoId) {
            throw new classes_1.UrlError();
        }
        const response = yield (0, axios_1.default)({
            url: util_1.Util.getApiURL('player'),
            method: 'post',
            data: {
                context: util_1.YoutubeConfig.INNERTUBE_CONTEXT,
                videoId: videoId,
                playbackContext: {
                    contentPlaybackContext: {
                        vis: 0,
                        splay: false,
                        autoCaptionsDefaultOn: false,
                        autonavState: 'STATE_NONE',
                        html5Preference: 'HTML5_PREF_WANTS',
                        lactMilliseconds: '-1',
                        signatureTimestamp: util_1.YoutubeConfig.STS
                    }
                }
            },
            httpsAgent: Proxy ? new https_proxy_agent_1.HttpsProxyAgent(`http://${Proxy.Host}:${Proxy.Port}`) : undefined,
        });
        const json = (yield response.data);
        if (((_a = json.playabilityStatus) === null || _a === void 0 ? void 0 : _a.status) === 'ERROR') {
            throw new classes_1.YoutubeError(json.playabilityStatus.reason);
        }
        const video = new classes_1.YoutubeVideo(json);
        if (GetHLSFormats) {
            const hlsUrl = (_b = json.streamingData) === null || _b === void 0 ? void 0 : _b.hlsManifestUrl;
            if (hlsUrl) {
                const HLSFormats = yield util_1.Util.GetHLSFormats(hlsUrl);
                video.liveFormats.push(...HLSFormats);
            }
        }
        return video;
    });
}
exports.GetVideo = GetVideo;
