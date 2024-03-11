import m3u8stream from 'm3u8stream';

import { PassThrough, Readable } from 'stream';

import { FormatError } from './Errors';

import { decipher } from '../util/Decipher';

import { formats as FormatStructs } from '../util/Formats';
import { Util, YoutubeConfig } from '../util';

import { Download } from '../functions';
import { HttpsProxyAgent } from 'https-proxy-agent';

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

    // Provided by addFormats().
    url: string;

    // Provided by Util.getMetadataFormat().
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

export class YoutubeVideo {
    private json: any;

    liveFormats: YoutubeVideoFormat[] = [];
    normalFormats: YoutubeVideoFormat[] = [];

    constructor(json: any) {
        this.json = json;

        this.addFormats([...(json.streamingData?.formats ?? []), ...(json.streamingData?.adaptiveFormats ?? [])]);
    }

    get url(): string {
        return Util.getVideoURL(this.json.videoDetails.videoId);
    }

    get details(): YoutubeVideoDetails {
        return {
            id: this.json.videoDetails.videoId,
            url: Util.getVideoURL(this.json.videoDetails.videoId),
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

    get formats(): YoutubeVideoFormat[] {
        return [...this.liveFormats, ...this.normalFormats];
    }

    Download(
        formatFilter: (f: YoutubeVideoFormat) => boolean,
        options: DownloadOptions = {},
        Proxy?: { Host: string, Port: number }
    ): m3u8stream.Stream | PassThrough {
        // This format filter is playable video or audio.
        const playableFormats = this.formats.filter((f) => f.isHLS || (f.contentLength && (f.hasVideo || f.hasAudio)));
        const filteredFormats = playableFormats.filter(formatFilter);

        // Choose last available format because format is ascending order.
        const format = filteredFormats[filteredFormats.length - 1] ?? playableFormats[playableFormats.length - 1];
        if (!format) {
            throw new FormatError();
        }

        if (format.isHLS) {
            const stream = m3u8stream(format.url, {
                id: String(format.itag),
                parser: 'm3u8',
                highWaterMark: options.highWaterMark ?? 64 * 1024,
                begin: options.begin ?? (format.isLive ? Date.now() : 0),
                liveBuffer: options.liveBuffer ?? 4000,
                requestOptions: {
                    maxReconnects: Infinity,
                    maxRetries: 10,
                    backoff: { inc: 20, max: 100 },
                    agent: Proxy ? new HttpsProxyAgent(`http://${Proxy.Host}:${Proxy.Port}`) : undefined
                }
            });

            stream.once('close', () => {
                stream.end();
            });

            return stream;
        } else {
            const downloadChunkSize = options.chunkSize ?? 256 * 1024,
                remainRetry = options.remainRetry ?? 10;

            let startBytes = options.start ?? 0,
                endBytes = startBytes + downloadChunkSize;

            let awaitDrain: (() => void) | null = null;

            let nowBody: Readable | null = null;

            let retryTimer: Timer | null = null;

            const stream =
                options.resource ??
                new PassThrough({
                    highWaterMark: options.highWaterMark ?? 64 * 1024
                })
                    .on('drain', () => {
                        awaitDrain?.();
                        awaitDrain = null;
                    })
                    .once('close', () => {
                        nowBody?.destroy();
                        nowBody = null;
                        clearTimeout(retryTimer as NodeJS.Timeout);
                        retryTimer = null;
                    });

            const getRangeChunk = async () => {

                try {

                    const response = await fetch(format.url, {

                        headers: {
                            range: `bytes=${startBytes}-${
                                endBytes >= (format.contentLength as number) ? '' : endBytes
                            }`,
                            referer: 'https://www.youtube.com/'
                        },
                        redirect: "follow",
                        proxy: Proxy ? `http://${Proxy.Host}:${Proxy.Port}` : undefined,
                        tls: { rejectUnauthorized: false }

                    });

                    if (!response.ok) {

                        if (response.status === 403 && remainRetry > 0) {

                            // Retry download when status code is 403.
                            options.resource = stream;
                            options.start = startBytes;
                            options.remainRetry = remainRetry - 1;
                            retryTimer = setTimeout(Download, 150, this.url, options)

                        } else {

                            stream.destroy(new Error(`Cannot retry download with status code ${response.status}`));

                        }

                        return;

                    }

                    const reader = response.body?.getReader();
                    if (!reader) { throw new Error('Cannot get readable stream from response body.'); }

                    let chunk = await reader.read();

                    while (!chunk.done) {

                        if (stream.destroyed) {
                            return;
                        }

                        startBytes += chunk.value.length;
                        if (!stream.write(chunk.value)) {
                            await new Promise(resolve => stream.once('drain', resolve));
                        }

                        chunk = await reader.read();

                    }

                    if (stream.destroyed || startBytes >= (format.contentLength as number)) {
                        return;
                    }

                    endBytes = startBytes + downloadChunkSize;
                    getRangeChunk();

                } catch (error) {
                    stream.destroy(error as Error);
                }

            };

            getRangeChunk();
            return stream;

        }
    }

    private addFormats(formats: any[]): void {
        for (const rawFormat of formats) {
            const itag = rawFormat.itag as keyof typeof FormatStructs;
            const reservedFormat = FormatStructs[itag];

            if (reservedFormat) {
                const mimeType = rawFormat.mimeType ?? reservedFormat.mimeType;
                let format: Partial<YoutubeVideoFormat> = {
                    itag,
                    mimeType,
                    codec: mimeType.split('"')[1],
                    type: mimeType.split(';')[0],
                    qualityLabel: rawFormat.qualityLabel ?? reservedFormat.qualityLabel,
                    bitrate: rawFormat.bitrate ?? reservedFormat.bitrate,
                    audioBitrate: reservedFormat.audioBitrate,
                    width: rawFormat.width,
                    height: rawFormat.height,
                    initRange: {
                        start: Number(rawFormat.initRange?.start),
                        end: Number(rawFormat.initRange?.end)
                    },
                    indexRange: {
                        start: Number(rawFormat.indexRange?.start),
                        end: Number(rawFormat.indexRange?.end)
                    },
                    lastModifiedTimestamp: Number(rawFormat.lastModified),
                    contentLength: Number(rawFormat.contentLength),
                    quality: rawFormat.quality,
                    fps: rawFormat.fps,
                    projectionType: rawFormat.projectionType,
                    averageBitrate: rawFormat.averageBitrate,
                    approxDurationMs: Number(rawFormat.approxDurationMs),
                    signatureCipher: rawFormat.signatureCipher ?? rawFormat.cipher
                };

                if (rawFormat.url && !format.signatureCipher) {
                    format.url = rawFormat.url;
                } else if (!rawFormat.url && format.signatureCipher) {
                    format = { ...format, ...Object.fromEntries(new URLSearchParams(format.signatureCipher)) };
                }

                const url = new URL(format.url as string);

                url.searchParams.set('ratebypass', 'yes');
                if (YoutubeConfig.PLAYER_TOKENS && format.s) {
                    url.searchParams.set(format.sp ?? 'signature', decipher(YoutubeConfig.PLAYER_TOKENS, format.s));
                }

                format.url = url.toString();

                this.normalFormats.push(Util.getMetadataFormat(format as YoutubeVideoFormat));
            }
        }
    }
}
