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
exports.Util = void 0;
const m3u8_parser_1 = require("m3u8-parser");
const Config_1 = require("./Config");
const videoRegex = /^[\w-]{11}$/;
const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const validQueryDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
class Util extends null {
    static getVideoURL(id) {
        return `https://www.youtube.com/watch?v=${id}`;
    }
    static getApiURL(param) {
        return `https://www.youtube.com/youtubei/v1/${param}?key=${Config_1.YoutubeConfig.INNERTUBE_API_KEY}`;
    }
    static getVideoId(urlOrId, checkUrl = false) {
        try {
            if (videoRegex.test(urlOrId) && !checkUrl) {
                return urlOrId;
            }
            const url = new URL(urlOrId);
            let id = url.searchParams.get('v');
            if (validPathDomains.test(urlOrId) && !id) {
                const paths = url.pathname.split('/');
                id = paths[url.hostname === 'youtu.be' ? 1 : 2].slice(0, 11);
            }
            else if (!validQueryDomains.includes(url.hostname)) {
                return null;
            }
            return videoRegex.test(id !== null && id !== void 0 ? id : '') ? id : null;
        }
        catch (_a) {
            return null;
        }
    }
    static getMetadataFormat(format) {
        format.hasVideo = Boolean(format.qualityLabel);
        format.hasAudio = Boolean(format.audioBitrate);
        format.isLive = /\bsource[/=]yt_(live|premiere)_broadcast\b/.test(format.url);
        format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
        format.isDashMPD = /\/manifest\/dash\//.test(format.url);
        return format;
    }
    static GetHLSFormats(URL) {
        return __awaiter(this, void 0, void 0, function* () {
            const Formats = [];
            try {
                const Resp = yield fetch(URL);
                if (!Resp.ok) {
                    throw new Error(`HTTP error! status: ${Resp.status}`);
                }
                const TxtResp = yield Resp.text();
                if (!TxtResp) {
                    throw new Error('No response body');
                }
                var parser = new m3u8_parser_1.Parser();
                parser.push(TxtResp);
                parser.end();
                const Manifest = parser.manifest;
                const audioGroups = Manifest.mediaGroups.AUDIO || {};
                const audioFormats = {};
                for (const groupId in audioGroups) {
                    for (const variant in audioGroups[groupId]) {
                        const audioVariant = audioGroups[groupId][variant];
                        const itag = parseInt(audioVariant.uri.match(/itag\/(\d+)/)[1]);
                        audioFormats[groupId] = {
                            itag: itag,
                            mimeType: 'audio/mp4', // Assumed based on example
                            qualityLabel: null,
                            bitrate: null,
                            audioBitrate: null,
                            codec: audioVariant.codecs,
                            type: 'audio',
                            url: audioVariant.uri,
                            hasAudio: true,
                            hasVideo: false,
                            isLive: false,
                            isHLS: true,
                            isDashMPD: false
                        };
                    }
                }
                // Process video playlists
                for (const playlist of Manifest.playlists) {
                    const attributes = playlist.attributes;
                    const itag = parseInt(playlist.uri.match(/itag\/(\d+)/)[1]);
                    const audioGroupId = attributes.AUDIO;
                    const format = {
                        itag: itag,
                        mimeType: `video/mp4; codecs="${attributes.CODECS}"`,
                        qualityLabel: `${attributes.RESOLUTION.height}p`,
                        bitrate: attributes.BANDWIDTH,
                        audioBitrate: null,
                        codec: attributes.CODECS,
                        type: 'video',
                        width: attributes.RESOLUTION.width,
                        height: attributes.RESOLUTION.height,
                        fps: attributes['FRAME-RATE'],
                        url: playlist.uri,
                        hasAudio: audioGroupId ? true : false,
                        hasVideo: true,
                        isLive: false,
                        isHLS: true,
                        isDashMPD: false
                    };
                    if (audioGroupId && audioFormats[audioGroupId]) {
                        format.audioBitrate = audioFormats[audioGroupId].audioBitrate;
                    }
                    Formats.push(format);
                }
                // Push any audio formats that were not associated with a video format
                for (const groupId in audioFormats) {
                    if (!Formats.some((f) => f.url === audioFormats[groupId].url)) {
                        Formats.push(audioFormats[groupId]);
                    }
                }
            }
            catch (error) {
                console.error('Error fetching or parsing the HLS formats:', error);
                return [];
            }
            return Formats;
        });
    }
}
exports.Util = Util;
