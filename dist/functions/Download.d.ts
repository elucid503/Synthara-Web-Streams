/// <reference types="node" />
import m3u8stream from 'm3u8stream';
import { PassThrough } from 'stream';
import { DownloadOptions } from '../classes';
/**
 * Downloads a YouTube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
export declare function Download(urlOrId: string, options?: DownloadOptions): Promise<m3u8stream.Stream | PassThrough>;
