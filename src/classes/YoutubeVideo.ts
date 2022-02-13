import m3u8stream from 'm3u8stream';
import { request } from 'undici';
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

    // Provided by formats getter.
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
            const stream =
                options.resource ??
                new PassThrough({
                    highWaterMark: options.highWaterMark ?? 64 * 1024
                });

            const downloadChunkSize = options.chunkSize ?? 256 * 1024;

            let startBytes = options.start ?? 0,
                endBytes = startBytes + downloadChunkSize;

            let awaitDrain: (() => void) | null;

            let nowBody: Readable | null;

            const abortNowBody = async () => {
                try {
                    // Have to use await to catch RequestAbortedError.
                    await nowBody?.destroy();
                } catch {}
                nowBody?.removeAllListeners();
                nowBody = null;
            };

            stream.on('drain', () => {
                awaitDrain?.();
                awaitDrain = null;
            });

            stream.once('close', abortNowBody);

            const getNextChunk = async () => {
                try {
                    const { statusCode, body } = await request(format.url as string, {
                        headers: {
                            Range: `bytes=${startBytes}-${endBytes >= (format.contentLength as number) ? '' : endBytes}`
                        }
                    });
                    if (statusCode === 403) {
                        // Retry download when status code is 403.
                        await abortNowBody();
                        options.resource = stream;
                        options.start = startBytes;
                        download(this.url, options);
                        return;
                    }
                    nowBody = body;

                    nowBody.once('error', (error: Error) => {
                        stream.destroy(error);
                    });

                    nowBody.on('data', (chunk: Buffer) => {
                        if (stream.destroyed) {
                            return;
                        }
                        startBytes += chunk.length;
                        if (!stream.write(chunk)) {
                            nowBody?.pause();
                            awaitDrain = () => nowBody?.resume();
                        }
                    });

                    nowBody.once('end', () => {
                        if (stream.destroyed || startBytes >= (format.contentLength as number)) {
                            return;
                        }
                        endBytes = startBytes + downloadChunkSize;
                        getNextChunk();
                    });
                } catch (error) {
                    stream.destroy(error as Error);
                }
            };

            getNextChunk();

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
