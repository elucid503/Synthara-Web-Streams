import { YoutubePlaylist } from '../structures/YoutubePlaylist';
import { Util } from '../util/Util';
import { ErrorCodes } from '../util/constants';

export interface GetPlaylistInfoOptions {
    full?: boolean;
}

export async function getPlaylistInfo(urlOrId: string, options: GetPlaylistInfoOptions = {}): Promise<YoutubePlaylist> {
    const listId = Util.getListId(urlOrId);
    if (!listId) {
        throw new Error(ErrorCodes.INVALID_URL);
    }

    const playlist = new YoutubePlaylist(listId);

    if (options.full) {
        await playlist.fetch();
    } else {
        await playlist.fetchFirstPage();
    }

    return playlist;
}
