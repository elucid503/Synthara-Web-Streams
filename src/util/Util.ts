import { request } from 'undici';

import { YoutubeConfig } from './config';
import { formats } from './formats';
import { YoutubeVideoFormat } from '../classes';

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

    static async getHlsFormats(url: string): Promise<YoutubeVideoFormat[]> {
        const hlsFormats: YoutubeVideoFormat[] = [];
        try {
            const { body } = await request(url);

            for (const line of (await body.text()).split('\n')) {
                if (/^https?:\/\//.test(line)) {
                    const itag = Number(/\/itag\/(\d+)\//.exec(line)?.[1]) as keyof typeof formats;
                    const reservedFormat = formats[itag];

                    if (reservedFormat) {
                        const mimeType = reservedFormat.mimeType;
                        const format: Partial<YoutubeVideoFormat> = {
                            ...reservedFormat,
                            itag,
                            url: line,
                            type: mimeType.split(';')[0],
                            codec: mimeType.split('"')[1]
                        };

                        hlsFormats.push(Util.getMetadataFormat(format as YoutubeVideoFormat));
                    }
                }
            }
        } catch {}
        return hlsFormats;
    }
}
