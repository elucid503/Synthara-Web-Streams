import m3u8stream from 'm3u8stream';
import { errors, request } from 'undici';
import { PassThrough, Readable } from 'node:stream';
import { download } from '../functions/download';
import { YoutubeConfig } from '../util/config';
import { decipher } from '../util/decipher';
import { Util } from '../util/Util';

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
    itag: number;
    mimeType: string;
    codec: string;
    type: string;
    bitrate: number | null;
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
    qualityLabel: string | null;
    projectionType?: 'RECTANGULAR';
    averageBitrate?: number;
    approxDurationMs?: number;
    signatureCipher?: string;

    // Provided by addFormats().
    url?: string;

    // Provided by itag format.
    audioBitrate?: number | null;

    // Provided by Util.getMetadataFormat().
    hasAudio?: boolean;
    hasVideo?: boolean;
    isLive?: boolean;
    isHLS?: boolean;
    isDashMPD?: boolean;
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
    tokens?: string[];

    constructor(json: any) {
        this.json = json;

        this.addFormats([...(json.streamingData?.formats ?? []), ...(json.streamingData?.adaptiveFormats ?? [])]);
    }

    get url(): string {
        return `${Util.getYTVideoURL()}${this.json.videoDetails.videoId}`;
    }

    get details(): YoutubeVideoDetails {
        return {
            id: this.json.videoDetails.videoId,
            url: `${Util.getYTVideoURL()}${this.json.videoDetails.videoId}`,
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

    download(format: YoutubeVideoFormat, options: DownloadOptions = {}): m3u8stream.Stream | PassThrough {
        if (format.isHLS || format.isDashMPD) {
            const stream = m3u8stream(format.url as string, {
                id: String(format.itag),
                parser: format.isHLS ? 'm3u8' : 'dash-mpd',
                highWaterMark: options.highWaterMark ?? 64 * 1024,
                begin: options.begin ?? (format.isLive ? Date.now() : 0),
                liveBuffer: options.liveBuffer ?? 4000,
                requestOptions: {
                    maxReconnects: Infinity,
                    maxRetries: 10,
                    backoff: { inc: 20, max: 100 }
                }
            });

            stream.once('close', () => {
                stream.end();
            });

            return stream;
        } else {
            const downloadChunkSize = options.chunkSize ?? 256 * 1024;

            let remainRetry = options.remainRetry ?? 10,
                startBytes = options.start ?? 0,
                endBytes = startBytes + downloadChunkSize;

            let awaitDrain: (() => void) | null = null;

            let nowBody: Readable | null = null;

            let retryTimer: NodeJS.Timer | null = null;

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
                        clearTimeout(retryTimer as NodeJS.Timer);
                        retryTimer = null;
                    });

            const getRangeChunk = async () => {
                try {
                    const { statusCode, headers, body } = await request(format.url as string, {
                        headers: {
                            range: `bytes=${startBytes}-${endBytes >= (format.contentLength as number) ? '' : endBytes}`
                        }
                    });
                    nowBody = body.once('error', (error: Error) => {
                        if (!(error instanceof errors.RequestAbortedError)) {
                            stream.destroy(error);
                        }
                    });

                    if (statusCode !== 206) {
                        if ((statusCode === 403 || statusCode === 302) && remainRetry > 0) {
                            // Retry download when status code is 403 or 302.
                            body.destroy();
                            nowBody = null;
                            remainRetry--;
                            if (statusCode === 403) {
                                options.resource = stream;
                                options.start = startBytes;
                                options.remainRetry = remainRetry;
                                retryTimer = setTimeout(download, 150, this.url, options);
                            } else {
                                format.url = headers.location; // Redirect location.
                                retryTimer = setTimeout(getRangeChunk, 150);
                            }
                        } else {
                            stream.destroy(new Error(`Cannot retry download with status code ${statusCode}`));
                        }
                        return;
                    }
                    // Reset remainRetry when request is success.
                    remainRetry = options.remainRetry ?? 10;

                    body.on('data', (chunk: Buffer) => {
                        if (stream.destroyed) {
                            return;
                        }
                        startBytes += chunk.length;
                        if (!stream.write(chunk)) {
                            nowBody?.pause();
                            awaitDrain = () => nowBody?.resume();
                        }
                    }).once('end', () => {
                        if (stream.destroyed || startBytes >= (format.contentLength as number)) {
                            return;
                        }
                        endBytes = startBytes + downloadChunkSize;
                        getRangeChunk();
                    });
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
            let format: YoutubeVideoFormat = {
                itag: rawFormat.itag,
                mimeType: rawFormat.mimeType,
                type: rawFormat.mimeType.split(';')[0],
                codec: rawFormat.mimeType.split('"')[1],
                bitrate: rawFormat.bitrate,
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
                qualityLabel: rawFormat.qualityLabel,
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

            this.normalFormats.push(Util.getMetadataFormat(format));
        }
    }
}
