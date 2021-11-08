import m3u8stream from 'm3u8stream';
import { PassThrough } from 'node:stream';
import { getVideoInfo } from './getVideoInfo';
import { DownloadOptions } from '../classes/YoutubeVideo';
import { ErrorCodes } from '../util/constants';

/**
 * Downloads a youtube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
export async function download(urlOrId: string, options?: DownloadOptions): Promise<m3u8stream.Stream | PassThrough> {
    const video = await getVideoInfo(urlOrId, true);
    // This format is playable video or audio.
    const playableFormats = video.formats.filter((f) =>
        f.isLive ? f.isHLS : f.contentLength && (f.hasVideo || f.hasAudio)
    );
    // This format is suitable for live video or music bots.
    const liveOrOpus = playableFormats.filter((f) => f.isLive || (f.codec === 'opus' && !f.hasVideo && f.hasAudio));

    // Choose last available format because format is ascending order.
    const format = liveOrOpus[liveOrOpus.length - 1] ?? playableFormats[playableFormats.length - 1];
    if (!format) {
        throw new Error(ErrorCodes.NO_SUITABLE_FORMAT);
    }

    return video.download(format, options);
}
