import m3u8stream from 'm3u8stream';
import { PassThrough } from 'stream';

declare class YoutubeError extends Error {
    name: string;
    constructor(message?: string);
}
declare class UrlError extends Error {
    name: string;
    constructor(message?: string);
}
declare class FormatError extends Error {
    name: string;
    constructor(message?: string);
}

declare const formats: {
    readonly 5: {
        readonly mimeType: "video/flv; codecs=\"Sorenson H.263, mp3\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 250000;
        readonly audioBitrate: 64;
    };
    readonly 6: {
        readonly mimeType: "video/flv; codecs=\"Sorenson H.263, mp3\"";
        readonly qualityLabel: "270p";
        readonly bitrate: 800000;
        readonly audioBitrate: 64;
    };
    readonly 13: {
        readonly mimeType: "video/3gp; codecs=\"MPEG-4 Visual, aac\"";
        readonly qualityLabel: null;
        readonly bitrate: 500000;
        readonly audioBitrate: null;
    };
    readonly 17: {
        readonly mimeType: "video/3gp; codecs=\"MPEG-4 Visual, aac\"";
        readonly qualityLabel: "144p";
        readonly bitrate: 50000;
        readonly audioBitrate: 24;
    };
    readonly 18: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 500000;
        readonly audioBitrate: 96;
    };
    readonly 22: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 2000000;
        readonly audioBitrate: 192;
    };
    readonly 34: {
        readonly mimeType: "video/flv; codecs=\"H.264, aac\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 500000;
        readonly audioBitrate: 128;
    };
    readonly 35: {
        readonly mimeType: "video/flv; codecs=\"H.264, aac\"";
        readonly qualityLabel: "480p";
        readonly bitrate: 800000;
        readonly audioBitrate: 128;
    };
    readonly 36: {
        readonly mimeType: "video/3gp; codecs=\"MPEG-4 Visual, aac\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 175000;
        readonly audioBitrate: 32;
    };
    readonly 37: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: 3000000;
        readonly audioBitrate: 192;
    };
    readonly 38: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "3072p";
        readonly bitrate: 3500000;
        readonly audioBitrate: 192;
    };
    readonly 43: {
        readonly mimeType: "video/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 500000;
        readonly audioBitrate: 128;
    };
    readonly 44: {
        readonly mimeType: "video/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "480p";
        readonly bitrate: 1000000;
        readonly audioBitrate: 128;
    };
    readonly 45: {
        readonly mimeType: "video/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 2000000;
        readonly audioBitrate: 192;
    };
    readonly 46: {
        readonly mimeType: "audio/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: null;
        readonly audioBitrate: 192;
    };
    readonly 82: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 500000;
        readonly audioBitrate: 96;
    };
    readonly 83: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 500000;
        readonly audioBitrate: 96;
    };
    readonly 84: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 2000000;
        readonly audioBitrate: 192;
    };
    readonly 85: {
        readonly mimeType: "video/mp4; codecs=\"H.264, aac\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: 3000000;
        readonly audioBitrate: 192;
    };
    readonly 91: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "144p";
        readonly bitrate: 100000;
        readonly audioBitrate: 48;
    };
    readonly 92: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 150000;
        readonly audioBitrate: 48;
    };
    readonly 93: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 500000;
        readonly audioBitrate: 128;
    };
    readonly 94: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "480p";
        readonly bitrate: 800000;
        readonly audioBitrate: 128;
    };
    readonly 95: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 1500000;
        readonly audioBitrate: 256;
    };
    readonly 96: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: 2500000;
        readonly audioBitrate: 256;
    };
    readonly 100: {
        readonly mimeType: "audio/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "360p";
        readonly bitrate: null;
        readonly audioBitrate: 128;
    };
    readonly 101: {
        readonly mimeType: "audio/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "360p";
        readonly bitrate: null;
        readonly audioBitrate: 192;
    };
    readonly 102: {
        readonly mimeType: "audio/webm; codecs=\"VP8, vorbis\"";
        readonly qualityLabel: "720p";
        readonly bitrate: null;
        readonly audioBitrate: 192;
    };
    readonly 120: {
        readonly mimeType: "video/flv; codecs=\"H.264, aac\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 2000000;
        readonly audioBitrate: 128;
    };
    readonly 127: {
        readonly mimeType: "audio/ts; codecs=\"aac\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 96;
    };
    readonly 128: {
        readonly mimeType: "audio/ts; codecs=\"aac\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 96;
    };
    readonly 132: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 150000;
        readonly audioBitrate: 48;
    };
    readonly 133: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 200000;
        readonly audioBitrate: null;
    };
    readonly 134: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 300000;
        readonly audioBitrate: null;
    };
    readonly 135: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "480p";
        readonly bitrate: 500000;
        readonly audioBitrate: null;
    };
    readonly 136: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 1000000;
        readonly audioBitrate: null;
    };
    readonly 137: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: 2500000;
        readonly audioBitrate: null;
    };
    readonly 138: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "4320p";
        readonly bitrate: 13500000;
        readonly audioBitrate: null;
    };
    readonly 139: {
        readonly mimeType: "audio/mp4; codecs=\"aac\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 48;
    };
    readonly 140: {
        readonly mimeType: "audio/m4a; codecs=\"aac\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 128;
    };
    readonly 141: {
        readonly mimeType: "audio/mp4; codecs=\"aac\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 256;
    };
    readonly 151: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 50000;
        readonly audioBitrate: 24;
    };
    readonly 160: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "144p";
        readonly bitrate: 100000;
        readonly audioBitrate: null;
    };
    readonly 171: {
        readonly mimeType: "audio/webm; codecs=\"vorbis\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 128;
    };
    readonly 172: {
        readonly mimeType: "audio/webm; codecs=\"vorbis\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 192;
    };
    readonly 242: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "240p";
        readonly bitrate: 100000;
        readonly audioBitrate: null;
    };
    readonly 243: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "360p";
        readonly bitrate: 250000;
        readonly audioBitrate: null;
    };
    readonly 244: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "480p";
        readonly bitrate: 500000;
        readonly audioBitrate: null;
    };
    readonly 247: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 700000;
        readonly audioBitrate: null;
    };
    readonly 248: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: 1500000;
        readonly audioBitrate: null;
    };
    readonly 249: {
        readonly mimeType: "audio/webm; codecs=\"opus\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 48;
    };
    readonly 250: {
        readonly mimeType: "audio/webm; codecs=\"opus\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 64;
    };
    readonly 251: {
        readonly mimeType: "audio/webm; codecs=\"opus\"";
        readonly qualityLabel: null;
        readonly bitrate: null;
        readonly audioBitrate: 160;
    };
    readonly 264: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "1440p";
        readonly bitrate: 4000000;
        readonly audioBitrate: null;
    };
    readonly 266: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "2160p";
        readonly bitrate: 12500000;
        readonly audioBitrate: null;
    };
    readonly 271: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "1440p";
        readonly bitrate: 9000000;
        readonly audioBitrate: null;
    };
    readonly 272: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "4320p";
        readonly bitrate: 20000000;
        readonly audioBitrate: null;
    };
    readonly 278: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "144p 30fps";
        readonly bitrate: 80000;
        readonly audioBitrate: null;
    };
    readonly 298: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 3000000;
        readonly audioBitrate: null;
    };
    readonly 299: {
        readonly mimeType: "video/mp4; codecs=\"H.264\"";
        readonly qualityLabel: "1080p";
        readonly bitrate: 5500000;
        readonly audioBitrate: null;
    };
    readonly 300: {
        readonly mimeType: "video/ts; codecs=\"H.264, aac\"";
        readonly qualityLabel: "720p";
        readonly bitrate: 1318000;
        readonly audioBitrate: 48;
    };
    readonly 302: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "720p HFR";
        readonly bitrate: 2500000;
        readonly audioBitrate: null;
    };
    readonly 303: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "1080p HFR";
        readonly bitrate: 5000000;
        readonly audioBitrate: null;
    };
    readonly 308: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "1440p HFR";
        readonly bitrate: 10000000;
        readonly audioBitrate: null;
    };
    readonly 313: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "2160p";
        readonly bitrate: 13000000;
        readonly audioBitrate: null;
    };
    readonly 315: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "2160p HFR";
        readonly bitrate: 20000000;
        readonly audioBitrate: null;
    };
    readonly 330: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "144p HDR, HFR";
        readonly bitrate: 80000;
        readonly audioBitrate: null;
    };
    readonly 331: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "240p HDR, HFR";
        readonly bitrate: 100000;
        readonly audioBitrate: null;
    };
    readonly 332: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "360p HDR, HFR";
        readonly bitrate: 250000;
        readonly audioBitrate: null;
    };
    readonly 333: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "240p HDR, HFR";
        readonly bitrate: 500000;
        readonly audioBitrate: null;
    };
    readonly 334: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "720p HDR, HFR";
        readonly bitrate: 1000000;
        readonly audioBitrate: null;
    };
    readonly 335: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "1080p HDR, HFR";
        readonly bitrate: 1500000;
        readonly audioBitrate: null;
    };
    readonly 336: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "1440p HDR, HFR";
        readonly bitrate: 5000000;
        readonly audioBitrate: null;
    };
    readonly 337: {
        readonly mimeType: "video/webm; codecs=\"VP9\"";
        readonly qualityLabel: "2160p HDR, HFR";
        readonly bitrate: 12000000;
        readonly audioBitrate: null;
    };
};

interface YoutubeVideoDetails {
    id: string;
    url: string;
    title: string;
    thumbnails: {
        url: string;
        width: string;
        height: string;
    }[];
    description: string;
    duration: number;
    viewCount: number;
    author: string;
    channelId: string;
    keywords: string[];
    allowRatings: boolean;
    averageRating: number;
    isOwnerViewing: boolean;
    isCrawlable: boolean;
    isUnpluggedCorpus: boolean;
    isPrivate: boolean;
    isLiveContent: boolean;
    formats: YoutubeVideoFormat[];
}
interface YoutubeVideoFormat {
    itag: keyof typeof formats;
    mimeType: string;
    qualityLabel: string | null;
    bitrate: number | null;
    audioBitrate: number | null;
    codec: string;
    type: string;
    width?: number;
    height?: number;
    initRange?: {
        start: number;
        end: number;
    };
    indexRange?: {
        start: number;
        end: number;
    };
    lastModifiedTimestamp?: number;
    contentLength?: number;
    quality?: string;
    audioChannels?: number;
    audioSampleRate?: number;
    loudnessDb?: number;
    s?: string;
    sp?: string;
    fps?: number;
    projectionType?: 'RECTANGULAR';
    averageBitrate?: number;
    approxDurationMs?: number;
    signatureCipher?: string;
    url: string;
    hasAudio: boolean;
    hasVideo: boolean;
    isLive: boolean;
    isHLS: boolean;
    isDashMPD: boolean;
}
interface DownloadOptions {
    resource?: PassThrough;
    highWaterMark?: number;
    begin?: number | string;
    liveBuffer?: number;
    chunkSize?: number;
    start?: number;
    remainRetry?: number;
}
declare class YoutubeVideo {
    json: any;
    liveFormats: YoutubeVideoFormat[];
    normalFormats: YoutubeVideoFormat[];
    constructor(json: any);
    get url(): string;
    get details(): YoutubeVideoDetails;
    get formats(): YoutubeVideoFormat[];
    Download(formatFilter: (f: YoutubeVideoFormat) => boolean, options?: DownloadOptions, Proxy?: {
        Host: string;
        Port: number;
    }): m3u8stream.Stream | PassThrough;
    private addFormats;
}

/**
 * Downloads a YouTube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
declare function Download(urlOrId: string, options?: DownloadOptions): Promise<m3u8stream.Stream | PassThrough>;

declare function GetVideo(URLorID: string, GetHLSFormats?: boolean, Proxy?: {
    Host: string;
    Port: number;
}): Promise<YoutubeVideo>;

declare class YoutubeConfig extends null {
    static INNERTUBE_API_KEY: string;
    static INNERTUBE_API_VERSION: string;
    static INNERTUBE_CLIENT_NAME: string;
    static INNERTUBE_CLIENT_VERSION: string;
    static INNERTUBE_CONTEXT: {
        client: {
            clientName: string;
            clientVersion: string;
            deviceModel: string;
            userAgent: string;
        };
    };
    static STS: number;
    static PLAYER_JS_URL: string;
    static PLAYER_TOKENS: string[] | null;
    static fetchConfig(): Promise<void>;
}

declare class Util extends null {
    static getVideoURL(id: string): string;
    static getApiURL(param: string): string;
    static getVideoId(urlOrId: string, checkUrl?: boolean): string | null;
    static getMetadataFormat(format: YoutubeVideoFormat): YoutubeVideoFormat;
    static GetHLSFormats(URL: string): Promise<YoutubeVideoFormat[]>;
}

export { Download, type DownloadOptions, FormatError, GetVideo, UrlError, Util, YoutubeConfig, YoutubeError, YoutubeVideo, type YoutubeVideoDetails, type YoutubeVideoFormat, formats };
