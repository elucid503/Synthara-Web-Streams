import { getVideoInfo } from './getVideoInfo';
import { TypeError } from '../structures/TypeError';
import { DownloadOptions } from '../structures/YoutubeVideo';
import { ErrorCodes } from '../util/constants';

/**
 * Downloads a youtube stream using its url or id.
 * @param urlOrId The url or id of the song to download its stream.
 * @param options The options to use for the song.
 */
export async function download(urlOrId: string, options?: DownloadOptions) {
    const video = await getVideoInfo(urlOrId, true);
    // This format is playable video or audio.
    const liveOrNormal = video.formats.filter((c) =>
        c.isLive ? c.isHLS : c.contentLength && (c.hasVideo || c.hasAudio)
    );
    // This format is suitable for live video or music bots.
    const hlsOrOpus = liveOrNormal.filter((c) =>
        c.isLive ? c.isHLS : c.codec === 'opus' && !c.hasVideo && c.hasAudio
    );
    // Choose last available format because format is ascending order.
    const format = hlsOrOpus[hlsOrOpus.length - 1] ?? liveOrNormal[liveOrNormal.length - 1];

    if (!format) {
        throw new TypeError(ErrorCodes.NO_SUITABLE_FORMAT);
    }

    return video.download(format, options);
}
