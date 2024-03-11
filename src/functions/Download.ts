import m3u8stream from 'm3u8stream';
import { PassThrough } from 'stream';

import { GetVideo } from './GetVideo';
import { DownloadOptions } from '../classes';

/**
 * Downloads a YouTube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
export async function Download(urlOrId: string, options?: DownloadOptions): Promise<m3u8stream.Stream | PassThrough> {
    const video = await GetVideo(urlOrId, true);

    // This format filter is suitable for live video or music bots.
    return video.Download((f) => f.isHLS || (f.codec === 'opus' && !f.hasVideo && f.hasAudio), options);
}
