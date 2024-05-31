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
exports.YoutubeVideo = void 0;
const axios_1 = __importDefault(require("axios"));
const m3u8stream_1 = __importDefault(require("m3u8stream"));
const stream_1 = require("stream");
const Errors_1 = require("./Errors");
const Decipher_1 = require("../util/Decipher");
const Formats_1 = require("../util/Formats");
const util_1 = require("../util");
const functions_1 = require("../functions");
const https_proxy_agent_1 = require("https-proxy-agent");
class YoutubeVideo {
    constructor(json) {
        var _a, _b, _c, _d;
        this.liveFormats = [];
        this.normalFormats = [];
        this.json = json;
        this.addFormats([...((_b = (_a = json.streamingData) === null || _a === void 0 ? void 0 : _a.formats) !== null && _b !== void 0 ? _b : []), ...((_d = (_c = json.streamingData) === null || _c === void 0 ? void 0 : _c.adaptiveFormats) !== null && _d !== void 0 ? _d : [])]);
    }
    get url() {
        return util_1.Util.getVideoURL(this.json.videoDetails.videoId);
    }
    get details() {
        return {
            id: this.json.videoDetails.videoId,
            url: util_1.Util.getVideoURL(this.json.videoDetails.videoId),
            title: this.json.videoDetails.title,
            thumbnails: this.json.videoDetails.thumbnail.thumbnails,
            description: this.json.videoDetails.shortDescription,
            duration: Number(this.json.videoDetails.lengthSeconds) * 1000,
            viewCount: Number(this.json.videoDetails.viewCount),
            author: this.json.videoDetails.author,
            channelId: this.json.videoDetails.channelId,
            keywords: this.json.videoDetails.keywords,
            allowRatings: this.json.videoDetails.allowRatings,
            averageRating: this.json.videoDetails.averageRating,
            isOwnerViewing: this.json.videoDetails.isOwnerViewing,
            isCrawlable: this.json.videoDetails.isCrawlable,
            isUnpluggedCorpus: this.json.videoDetails.isUnpluggedCorpus,
            isPrivate: this.json.videoDetails.isPrivate,
            isLiveContent: this.json.videoDetails.isLiveContent,
            formats: this.formats
        };
    }
    get formats() {
        return [...this.liveFormats, ...this.normalFormats];
    }
    Download(formatFilter, options = {}, Proxy) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // This format filter is playable video or audio.
        const playableFormats = this.formats.filter((f) => f.isHLS || (f.contentLength && (f.hasVideo || f.hasAudio)));
        const filteredFormats = playableFormats.filter(formatFilter);
        // Choose last available format because format is ascending order.
        const format = (_a = filteredFormats[filteredFormats.length - 1]) !== null && _a !== void 0 ? _a : playableFormats[playableFormats.length - 1];
        if (!format) {
            throw new Errors_1.FormatError();
        }
        if (format.isHLS) {
            const stream = (0, m3u8stream_1.default)(format.url, {
                id: String(format.itag),
                parser: 'm3u8',
                highWaterMark: (_b = options.highWaterMark) !== null && _b !== void 0 ? _b : 64 * 1024,
                begin: (_c = options.begin) !== null && _c !== void 0 ? _c : (format.isLive ? Date.now() : 0),
                liveBuffer: (_d = options.liveBuffer) !== null && _d !== void 0 ? _d : 4000,
                requestOptions: {
                    maxReconnects: Infinity,
                    maxRetries: 10,
                    backoff: { inc: 20, max: 100 },
                    agent: Proxy ? new https_proxy_agent_1.HttpsProxyAgent(`http://${Proxy.Host}:${Proxy.Port}`) : undefined
                }
            });
            stream.once('close', () => {
                stream.end();
            });
            return stream;
        }
        else {
            const downloadChunkSize = (_e = options.chunkSize) !== null && _e !== void 0 ? _e : 256 * 1024, remainRetry = (_f = options.remainRetry) !== null && _f !== void 0 ? _f : 10;
            let startBytes = (_g = options.start) !== null && _g !== void 0 ? _g : 0, endBytes = startBytes + downloadChunkSize;
            let awaitDrain = null;
            let nowBody = null;
            let retryTimer = null;
            const stream = (_h = options.resource) !== null && _h !== void 0 ? _h : new stream_1.PassThrough({
                highWaterMark: (_j = options.highWaterMark) !== null && _j !== void 0 ? _j : 64 * 1024
            })
                .on('drain', () => {
                awaitDrain === null || awaitDrain === void 0 ? void 0 : awaitDrain();
                awaitDrain = null;
            })
                .once('close', () => {
                nowBody === null || nowBody === void 0 ? void 0 : nowBody.destroy();
                nowBody = null;
                clearTimeout(retryTimer);
                retryTimer = null;
            });
            const getRangeChunk = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield (0, axios_1.default)(format.url, {
                        headers: {
                            range: `bytes=${startBytes}-${endBytes >= format.contentLength ? '' : endBytes}`,
                            referer: 'https://www.youtube.com/'
                        },
                        proxy: Proxy ? { host: Proxy.Host, port: Proxy.Port } : false
                    });
                    if (response.status[0] !== 2) {
                        if (response.status === 403 && remainRetry > 0) {
                            // Retry download when status code is 403.
                            options.resource = stream;
                            options.start = startBytes;
                            options.remainRetry = remainRetry - 1;
                            retryTimer = setTimeout(functions_1.Download, 150, this.url, options);
                        }
                        else {
                            stream.destroy(new Error(`Cannot retry download with status code ${response.status}`));
                        }
                        return;
                    }
                    const reader = response.data;
                    if (!reader) {
                        throw new Error('Cannot get readable stream from response body.');
                    }
                    let chunk = yield reader.read();
                    while (!chunk.done) {
                        if (stream.destroyed) {
                            return;
                        }
                        startBytes += chunk.value.length;
                        if (!stream.write(chunk.value)) {
                            yield new Promise((resolve) => stream.once('drain', resolve));
                        }
                        chunk = yield reader.read();
                    }
                    if (stream.destroyed || startBytes >= format.contentLength) {
                        return;
                    }
                    endBytes = startBytes + downloadChunkSize;
                    getRangeChunk();
                }
                catch (error) {
                    stream.destroy(error);
                }
            });
            getRangeChunk();
            return stream;
        }
    }
    addFormats(formats) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        for (const rawFormat of formats) {
            const itag = rawFormat.itag;
            const reservedFormat = Formats_1.formats[itag];
            if (reservedFormat) {
                const mimeType = (_a = rawFormat.mimeType) !== null && _a !== void 0 ? _a : reservedFormat.mimeType;
                let format = {
                    itag,
                    mimeType,
                    codec: mimeType.split('"')[1],
                    type: mimeType.split(';')[0],
                    qualityLabel: (_b = rawFormat.qualityLabel) !== null && _b !== void 0 ? _b : reservedFormat.qualityLabel,
                    bitrate: (_c = rawFormat.bitrate) !== null && _c !== void 0 ? _c : reservedFormat.bitrate,
                    audioBitrate: reservedFormat.audioBitrate,
                    width: rawFormat.width,
                    height: rawFormat.height,
                    initRange: {
                        start: Number((_d = rawFormat.initRange) === null || _d === void 0 ? void 0 : _d.start),
                        end: Number((_e = rawFormat.initRange) === null || _e === void 0 ? void 0 : _e.end)
                    },
                    indexRange: {
                        start: Number((_f = rawFormat.indexRange) === null || _f === void 0 ? void 0 : _f.start),
                        end: Number((_g = rawFormat.indexRange) === null || _g === void 0 ? void 0 : _g.end)
                    },
                    lastModifiedTimestamp: Number(rawFormat.lastModified),
                    contentLength: Number(rawFormat.contentLength),
                    quality: rawFormat.quality,
                    fps: rawFormat.fps,
                    projectionType: rawFormat.projectionType,
                    averageBitrate: rawFormat.averageBitrate,
                    approxDurationMs: Number(rawFormat.approxDurationMs),
                    signatureCipher: (_h = rawFormat.signatureCipher) !== null && _h !== void 0 ? _h : rawFormat.cipher
                };
                if (rawFormat.url && !format.signatureCipher) {
                    format.url = rawFormat.url;
                }
                else if (!rawFormat.url && format.signatureCipher) {
                    format = Object.assign(Object.assign({}, format), Object.fromEntries(new URLSearchParams(format.signatureCipher)));
                }
                const url = new URL(format.url);
                url.searchParams.set('ratebypass', 'yes');
                if (util_1.YoutubeConfig.PLAYER_TOKENS && format.s) {
                    url.searchParams.set((_j = format.sp) !== null && _j !== void 0 ? _j : 'signature', (0, Decipher_1.decipher)(util_1.YoutubeConfig.PLAYER_TOKENS, format.s));
                }
                format.url = url.toString();
                this.normalFormats.push(util_1.Util.getMetadataFormat(format));
            }
        }
    }
}
exports.YoutubeVideo = YoutubeVideo;
