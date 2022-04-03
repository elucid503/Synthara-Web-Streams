import { request } from 'undici';
import { XMLParser } from 'fast-xml-parser';
import { YoutubeConfig } from './config';
import { formats } from './formats';
import { YoutubeVideoFormat } from '../classes/YoutubeVideo';
const videoRegex = /^[\w-]{11}$/;
const listRegex = /^[A-Z]{2}[\w-]{10,}$/;
const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const validQueryDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];

export class Util extends null {
    static getHomeURL(): string {
        return 'https://www.youtube.com';
    }

    static getTrendingURL(): string {
        return 'https://www.youtube.com/feed/trending';
    }

    static getSearchURL(query: string, type?: string): string {
        const url = new URL('https://www.youtube.com/results');
        url.searchParams.set('search_query', query);
        if (type) {
            url.searchParams.set('sp', type);
        }
        return url.toString();
    }

    static getVideoURL(id: string): string {
        return `https://www.youtube.com/watch?v=${id}`;
    }

    static getChannelURL(id: string): string {
        return `https://www.youtube.com/channel/${id}`;
    }

    static getPlaylistURL(id: string): string {
        return `https://www.youtube.com/playlist?list=${id}`;
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

    static getListId(urlOrId: string, checkUrl: boolean = false): string | null {
        try {
            if (listRegex.test(urlOrId) && !checkUrl) {
                return urlOrId;
            }
            const url = new URL(urlOrId);
            const id = url.searchParams.get('list');
            return validQueryDomains.includes(url.hostname) && listRegex.test(id ?? '') ? id : null;
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
            const { body } = await request(url);
            const parser = new XMLParser({
                attributeNamePrefix: '$',
                ignoreAttributes: false
            });
            const xml = parser.parse(await body.text());

            for (const adaptationSet of xml.MPD.Period.AdaptationSet) {
                for (const representation of [adaptationSet.Representation].flat()) {
                    const itag = Number(representation.$id) as keyof typeof formats;
                    const reservedFormat = formats[itag];

                    if (reservedFormat) {
                        const format: YoutubeVideoFormat = {
                            ...reservedFormat,
                            itag,
                            url,
                            type: reservedFormat.mimeType.split(';')[0],
                            codec: reservedFormat.mimeType.split('"')[1]
                        };

                        if (representation.$height) {
                            format.width = Number(representation.$width);
                            format.height = Number(representation.$height);
                            format.fps = Number(representation.$frameRate);
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
            const { body } = await request(url);

            for (const line of (await body.text()).split('\n')) {
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
