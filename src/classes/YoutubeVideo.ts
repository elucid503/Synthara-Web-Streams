import axios from 'axios';
import miniget from 'miniget';
import m3u8stream from 'm3u8stream';
import { PassThrough } from 'stream';
import { download } from '../functions/download';
import { decipher, extractTokens } from '../util/decipher';
import { Regexes } from '../util/constants';
import { Util } from '../util/Util';
const cachedTokens: Map<string, string[]> = new Map();

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
    /* Provided by formats getter. */
    url?: string;
    /* Provided by itag format. */
    audioBitrate?: number | null;
    /* Provided by Util.getMetadataFormat(). */
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
    chunkMode?: number | boolean;
    start?: number;
}

export class YoutubeVideo {
    private json: any;

    liveFormats?: YoutubeVideoFormat[];
    html5Player?: string;
    tokens?: string[];

    constructor(json: any) {
        this.json = json;
    }

    get url(): string {
        return `${Util.getYTVideoURL()}${this.json.videoDetails.videoId}`;
    }

    get info(): YoutubeVideoDetails & { formats: YoutubeVideoFormat[] } {
        return { ...this.details, formats: this.formats };
    }

    get formats(): YoutubeVideoFormat[] {
        const arr = [...(this.liveFormats ?? [])];

        for (const rawFormat of [
            ...(this.json.streamingData?.formats ?? []),
            ...(this.json.streamingData?.adaptiveFormats ?? [])
        ]) {
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

            if (this.tokens && format.s) {
                url.searchParams.set(format.sp ?? 'signature', decipher(this.tokens, format.s));
            }

            format.url = url.toString();

            arr.push(Util.getMetadataFormat(format));
        }

        return arr;
    }

    download(format: YoutubeVideoFormat, options: DownloadOptions = {}): m3u8stream.Stream | PassThrough {
        if (format.isHLS || format.isDashMPD) {
            return m3u8stream(format.url as string, {
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
        } else {
            const stream =
                options.resource ??
                new PassThrough({
                    highWaterMark: options.highWaterMark ?? 64 * 1024
                });

            if (options.chunkMode) {
                const downloadChunkSize = options.chunkMode === true ? 256 * 1024 : options.chunkMode;

                let startBytes = options.start ?? 0,
                    endBytes = startBytes + downloadChunkSize;

                let awaitDrain: (() => void) | null;

                let request: miniget.Stream | null;

                stream.on('drain', () => {
                    awaitDrain?.();
                    awaitDrain = null;
                });

                stream.once('close', () => {
                    request?.destroy();
                    request?.removeAllListeners();
                    request = null;
                });

                const getNextChunk = () => {
                    request = miniget(format.url as string, {
                        headers: {
                            Range: `bytes=${startBytes}-${endBytes >= (format.contentLength as number) ? '' : endBytes}`
                        }
                    });

                    request.once('error', (error: Error) => {
                        request?.destroy();
                        if (error.message === 'Status code: 403') {
                            // Retry download when error code is 403.
                            request?.removeAllListeners();
                            request = null;
                            options.resource = stream;
                            options.start = startBytes;
                            download(this.details.url, options);
                        } else {
                            stream.destroy(error);
                        }
                    });

                    request.on('data', (chunk: Buffer) => {
                        if (stream.destroyed) {
                            request?.destroy();
                            return;
                        }
                        startBytes += chunk.length;

                        if (!stream.write(chunk)) {
                            request?.pause();
                            awaitDrain = () => request?.resume();
                        }
                    });

                    request.once('end', () => {
                        if (stream.destroyed || endBytes >= (format.contentLength as number)) {
                            return;
                        }
                        endBytes = startBytes + downloadChunkSize;
                        getNextChunk();
                    });
                };

                getNextChunk();

                return stream;
            } else {
                let startBytes = options.start ?? 0;

                const request = miniget(format.url as string, {
                    headers: {
                        Range: `bytes=${startBytes}-`
                    }
                });

                stream.once('close', () => {
                    request.destroy();
                    request.unpipe(stream);
                    request.removeAllListeners();
                });

                request.pipe(stream);

                request.once('error', (error: Error) => {
                    request.destroy();
                    if (error.message === 'Status code: 403') {
                        // Retry download when error code is 403.
                        request.unpipe(stream);
                        request.removeAllListeners();
                        options.resource = stream;
                        options.start = startBytes;
                        download(this.details.url, options);
                    } else {
                        stream.destroy(error);
                    }
                });

                request.on('data', (chunk: Buffer) => {
                    startBytes += chunk.length;
                });

                return stream;
            }
        }
    }

    getHtml5Player(body: string): string {
        const playerURL = (Regexes.PLAYER_URL.exec(body) as RegExpExecArray)[1];

        this.html5Player = `${Util.getYTBaseURL()}${playerURL}`;

        return this.html5Player;
    }

    async fetchTokens(): Promise<string[]> {
        const existing = cachedTokens.get(this.html5Player as string);
        if (existing) {
            this.tokens = existing;
            return this.tokens;
        }

        const { data } = await axios.get<string>(this.html5Player as string);

        const tokens = extractTokens(data) as string[];

        cachedTokens.set(this.html5Player as string, tokens);

        this.tokens = tokens;

        return tokens;
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
            isLiveContent: this.json.videoDetails.isLiveContent
        };
    }
}
