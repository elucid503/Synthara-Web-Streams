import m3u8stream from 'm3u8stream';
import { PassThrough } from 'node:stream';
import { getVideoInfo } from './getVideoInfo';
import { DownloadOptions } from '../classes/YoutubeVideo';

/**
 * Downloads a youtube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
export async function download(urlOrId: string, options?: DownloadOptions): Promise<m3u8stream.Stream | PassThrough> {
    const video = await getVideoInfo(urlOrId, true);

    // This format filter is suitable for live video or music bots.
    return video.download((f) => f.isHLS || (f.codec === 'opus' && !f.hasVideo && f.hasAudio), options);
}
