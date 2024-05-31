/// <reference types="node" />
import m3u8stream from 'm3u8stream';
import { PassThrough } from 'stream';
import { formats as FormatStructs } from '../util/Formats';
export interface YoutubeVideoDetails {
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
export interface YoutubeVideoFormat {
    itag: keyof typeof FormatStructs;
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
export interface DownloadOptions {
    resource?: PassThrough;
    highWaterMark?: number;
    begin?: number | string;
    liveBuffer?: number;
    chunkSize?: number;
    start?: number;
    remainRetry?: number;
}
export declare class YoutubeVideo {
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
