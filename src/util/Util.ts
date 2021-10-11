import axios from 'axios';
import { parse as xmlParse } from 'fast-xml-parser';
import { formats } from './formats';
import { YoutubeVideoFormat } from '../classes/YoutubeVideo';
const videoRegex = /^[\w-]{11}$/;
const listRegex = /^[\w-]{12,}$/;
const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const validQueryDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];

export class Util extends null {
    static getYTBaseURL() {
        return 'https://www.youtube.com';
    }

    static getYTSearchURL() {
        return 'https://www.youtube.com/results';
    }

    static getYTVideoURL() {
        return 'https://www.youtube.com/watch?v=';
    }

    static getYTChannelURL() {
        return 'https://www.youtube.com/channel';
    }

    static getYTTrendingURL() {
        return 'https://www.youtube.com/feed/trending';
    }

    static getYTUserURL() {
        return 'https://www.youtube.com/user';
    }

    static getYTPlaylistURL() {
        return 'https://www.youtube.com/playlist';
    }

    static getYTApiBaseURL() {
        return 'https://www.youtube.com/youtubei/v1';
    }

    static getVideoId(urlOrId: string, checkUrl: boolean = false): string | null {
        try {
            if (videoRegex.test(urlOrId) && !checkUrl) {
                return urlOrId;
            }
            const parsed = new URL(urlOrId);
            let id = parsed.searchParams.get('v');
            if (validPathDomains.test(urlOrId) && !id) {
                const paths = parsed.pathname.split('/');
                id = paths[parsed.hostname === 'youtu.be' ? 1 : 2].substring(0, 11);
            } else if (!validQueryDomains.includes(parsed.hostname)) {
                return null;
            }
            return videoRegex.test(id ?? '') ? id : null;
        } catch {
            return null;
        }
    }

    static getListId(urlOrId: string, checkUrl: boolean = false): string | null {
        try {
            if (listRegex.test(urlOrId) && !checkUrl) {
                return urlOrId;
            }
            const parsed = new URL(urlOrId);
            const id = parsed.searchParams.get('list');
            return validQueryDomains.includes(parsed.hostname) && listRegex.test(id ?? '') ? id : null;
        } catch {
            return null;
        }
    }

    static getMetadataFormat(format: YoutubeVideoFormat): YoutubeVideoFormat {
        format = { ...formats[format.itag as keyof typeof formats], ...format };
        format.hasVideo = Boolean(format.qualityLabel);
        format.hasAudio = Boolean(format.audioBitrate);
        format.isLive = /\bsource[/=]yt_(live|premiere)_broadcast\b/.test(format.url as string);
        format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url as string);
        format.isDashMPD = /\/manifest\/dash\//.test(format.url as string);
        return format;
    }

    static async getDashFormats(url: string): Promise<YoutubeVideoFormat[]> {
        const dashFormats: YoutubeVideoFormat[] = [];
        try {
            const { data } = await axios.get<string>(new URL(url, Util.getYTVideoURL()).toString());
            const xml = xmlParse(data, {
                attributeNamePrefix: '$',
                ignoreAttributes: false
            });

            for (const adaptationSet of xml.MPD.Period.AdaptationSet) {
                for (const representation of adaptationSet.Representation) {
                    const itag = Number(representation['$id']) as keyof typeof formats;
                    const reservedFormat = formats[itag];

                    if (reservedFormat) {
                        const format: YoutubeVideoFormat = {
                            ...reservedFormat,
                            itag,
                            url,
                            type: reservedFormat.mimeType.split(';')[0],
                            codec: reservedFormat.mimeType.split('"')[1]
                        };

                        if (representation['$height']) {
                            format.width = Number(representation['$width']);
                            format.height = Number(representation['$height']);
                            format.fps = Number(representation['$frameRate']);
                        }

                        dashFormats.push(Util.getMetadataFormat(format));
                    }
                }
            }
        } catch {}
        return dashFormats;
    }

    static async getHlsFormats(url: string): Promise<YoutubeVideoFormat[]> {
        const hlsFormats: YoutubeVideoFormat[] = [];
        try {
            const { data } = await axios.get<string>(new URL(url, Util.getYTVideoURL()).toString());

            for (const line of data.split('\n')) {
                if (/^https?:\/\//.test(line)) {
                    const itag = Number(/\/itag\/(\d+)\//.exec(line)?.[1]) as keyof typeof formats;
                    const reservedFormat = formats[itag];

                    if (reservedFormat) {
                        const format: YoutubeVideoFormat = {
                            ...reservedFormat,
                            itag,
                            url: line,
                            type: reservedFormat.mimeType.split(';')[0],
                            codec: reservedFormat.mimeType.split('"')[1]
                        };

                        hlsFormats.push(Util.getMetadataFormat(format));
                    }
                }
            }
        } catch {}
        return hlsFormats;
    }
}
