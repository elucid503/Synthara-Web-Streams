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
    // This format is suitable for live video or music bots.
    const liveOrOpus = video.formats.filter((c) =>
        c.isLive ? c.isHLS : c.codec === 'opus' && c.hasAudio && !c.hasVideo
    );

    if (liveOrOpus.length === 0) {
        throw new TypeError(ErrorCodes.NO_SUITABLE_FORMAT);
    }

    // Choose last available format because format is ascending order.
    return video.download(liveOrOpus[liveOrOpus.length - 1], options);
}
