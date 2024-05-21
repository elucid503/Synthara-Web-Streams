import Parser from "m3u8-parser";

import { YoutubeConfig } from './Config';
import { YoutubeVideoFormat } from '../classes';
import { inspect } from 'util';
import { formats } from "./Formats";

const videoRegex = /^[\w-]{11}$/;
const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const validQueryDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];

export class Util extends null {
    static getVideoURL(id: string): string {
        return `https://www.youtube.com/watch?v=${id}`;
    }

    static getApiURL(param: string): string {
        return `https://www.youtube.com/youtubei/v1/${param}?key=${YoutubeConfig.INNERTUBE_API_KEY}`;
    }

    static getVideoId(urlOrId: string, checkUrl: boolean = false): string | null {
        try {
            if (videoRegex.test(urlOrId) && !checkUrl) {
                return urlOrId;
            }
            const url = new URL(urlOrId);
            let id = url.searchParams.get('v');
            if (validPathDomains.test(urlOrId) && !id) {
                const paths = url.pathname.split('/');
                id = paths[url.hostname === 'youtu.be' ? 1 : 2].slice(0, 11);
            } else if (!validQueryDomains.includes(url.hostname)) {
                return null;
            }
            return videoRegex.test(id ?? '') ? id : null;
        } catch {
            return null;
        }
    }

    static getMetadataFormat(format: YoutubeVideoFormat): YoutubeVideoFormat {
        format.hasVideo = Boolean(format.qualityLabel);
        format.hasAudio = Boolean(format.audioBitrate);
        format.isLive = /\bsource[/=]yt_(live|premiere)_broadcast\b/.test(format.url);
        format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
        format.isDashMPD = /\/manifest\/dash\//.test(format.url);
        return format;
    }

    static async GetHLSFormats(URL: string): Promise<YoutubeVideoFormat[]> {

        const Formats: YoutubeVideoFormat[] = [];
        
        try {

            const Resp = await fetch(URL);

            if (!Resp.ok) {

                throw new Error(`HTTP error! status: ${Resp.status}`);

            }

        
            const TxtResp = await Resp.text();

            if (!TxtResp) {

                throw new Error("No response body");

            }
            
            var parser = new Parser.Parser();

            parser.push(TxtResp);
            parser.end();
            
            const Manifest = parser.manifest;

            const audioGroups = Manifest.mediaGroups.AUDIO || {};
            const audioFormats: { [key: string]: YoutubeVideoFormat } = {};

            for (const groupId in audioGroups) {

                for (const variant in audioGroups[groupId]) {

                    const audioVariant = audioGroups[groupId][variant];
                    const itag = parseInt(audioVariant.uri.match(/itag\/(\d+)/)[1]);

                    audioFormats[groupId] = {

                        itag: itag as keyof typeof formats,
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

                const format: YoutubeVideoFormat = {

                    itag: itag as keyof typeof formats,
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

                if (!Formats.some(f => f.url === audioFormats[groupId].url)) {

                    Formats.push(audioFormats[groupId]);

                }

            }

        } catch (error) {
            
            console.error('Error fetching or parsing the HLS formats:', error);
            return [];
            
        }

        return Formats;
    
    }

}

