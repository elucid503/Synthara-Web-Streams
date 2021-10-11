import { TypeError } from '../classes/TypeError';
import { YoutubePlaylist } from '../classes/YoutubePlaylist';
import { ErrorCodes } from '../util/constants';
import { Util } from '../util/Util';

export async function getPlaylistInfo(urlOrId: string, getAllVideos: boolean = false): Promise<YoutubePlaylist> {
    const listId = Util.getListId(urlOrId);
    if (!listId) {
        throw new TypeError(ErrorCodes.INVALID_URL);
    }

    const playlist = new YoutubePlaylist(listId);

    if (getAllVideos) {
        await playlist.fetch();
    } else {
        await playlist.fetchFirstPage();
    }

    return playlist;
}
