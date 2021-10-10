import axios from 'axios';
import miniget from 'miniget';
import m3u8stream from 'm3u8stream';
import { parse as queryParse } from 'querystring';
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
        height: string;
        width: string;
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
    url: string;
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

    /* Provided by itag format. */
    audioBitrate?: number | null;

    /* These come from metadata and not by youtube. */
    hasAudio?: boolean;
    hasVideo?: boolean;
    isLive?: boolean;
    isHLS?: boolean;
    isDashMPD?: boolean;
}

export interface DownloadOptions {
    chunkMode?: {
        chunkSize?: number;
    };
    highWaterMark?: number;
    resource?: PassThrough;
    begin?: number | string;
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

    get url() {
        return `${Util.getYTVideoURL()}${this.json.videoDetails.videoId}`;
    }

    get formats(): YoutubeVideoFormat[] {
        const arr = [...(this.liveFormats ?? [])];

        for (const format of [
            ...(this.json.streamingData?.adaptiveFormats ?? []),
            ...(this.json.streamingData?.formats ?? [])
        ] as any[]) {
            let frmt: YoutubeVideoFormat = {
                itag: format.itag,
                url: format.url,
                mimeType: format.mimeType,
                type: format.mimeType.split(';')[0],
                codec: format.mimeType.split('"')[1],
                bitrate: format.bitrate,
                width: format.width,
                height: format.height,
                initRange: {
                    start: Number(format.initRange?.start),
                    end: Number(format.initRange?.end)
                },
                indexRange: {
                    start: Number(format.indexRange?.start),
                    end: Number(format.indexRange?.end)
                },
                lastModifiedTimestamp: Number(format.lastModified),
                contentLength: Number(format.contentLength),
                quality: format.quality,
                fps: format.fps,
                qualityLabel: format.qualityLabel,
                projectionType: format.projectionType,
                averageBitrate: format.averageBitrate,
                approxDurationMs: Number(format.approxDurationMs),
                signatureCipher: format.signatureCipher ?? format.cipher
            };

            if (format.url && !frmt.signatureCipher) {
                frmt.url = format.url;
            }

            if (!frmt.url) {
                frmt = { ...frmt, ...queryParse(frmt.signatureCipher as string) };
            }

            const url = new URL(decodeURIComponent(frmt.url as string));

            url.searchParams.set('ratebypass', 'yes');

            if (this.tokens && frmt.s) {
                url.searchParams.set(frmt.sp ?? 'signature', decipher(this.tokens, frmt.s));
            }

            frmt.url = url.toString();

            arr.push(Util.addMetadataToFormat(frmt));
        }

        return arr;
    }

    download(format: YoutubeVideoFormat, options: DownloadOptions = {}) {
        if (format.isHLS || format.isDashMPD) {
            return m3u8stream(format.url as string, {
                id: String(format.itag),
                parser: format.isHLS ? 'm3u8' : 'dash-mpd',
                highWaterMark: options.highWaterMark ?? 64 * 1024,
                begin: options.begin ?? (format.isLive ? Date.now() : 0),
                liveBuffer: 4000,
                requestOptions: {
                    maxReconnects: Infinity,
                    maxRetries: 10,
                    backoff: { inc: 20, max: 100 }
                }
            });
        } else {
            if (options.chunkMode) {
                const stream =
                    options.resource ??
                    new PassThrough({
                        highWaterMark: options.highWaterMark ?? 64 * 1024
                    });

                const downloadChunkSize = options.chunkMode.chunkSize ?? 256 * 1024;

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

                    request.once('error', (error) => {
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
                const stream = options.resource ?? new PassThrough({ highWaterMark: format.contentLength });

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

                request.once('error', (error) => {
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

    get info(): YoutubeVideoDetails & { formats: YoutubeVideoFormat[] } {
        return { ...this.details, formats: this.formats };
    }

    getHtml5Player(body: string): string {
        const playerURL = (Regexes.PLAYER_URL.exec(body) as RegExpExecArray)[1];

        this.html5Player = `${Util.getBaseYTURL()}${playerURL}`;

        return this.html5Player;
    }

    async fetchTokens() {
        if (cachedTokens.has(this.html5Player as string) || this.tokens) {
            this.tokens = cachedTokens.get(this.html5Player as string) ?? this.tokens;
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
