import { UrlError } from '../classes/Errors';
import { YoutubePlaylist } from '../classes/YoutubePlaylist';
import { Util } from '../util/Util';

export async function getPlaylistInfo(urlOrId: string, getAllVideos: boolean = false): Promise<YoutubePlaylist> {
    const listId = Util.getListId(urlOrId);
    if (!listId) {
        throw new UrlError();
    }

    const playlist = new YoutubePlaylist(listId);

    await playlist.init();

    if (getAllVideos) {
        while (!playlist.allLoaded()) {
            await playlist.next();
        }
    }

    return playlist;
}
