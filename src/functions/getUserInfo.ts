import axios from 'axios';
import { YoutubeChannel } from '../classes/YoutubeChannel';
import { Regexes } from '../util/constants';
import { Util } from '../util/Util';

/**
 * Same as getChannelInfo function but it uses the author name or id.
 * @param id The id or name of the owner.
 */
export async function getUserInfo(id: string): Promise<YoutubeChannel> {
    const { data } = await axios.get<string>(`${Util.getYTUserURL()}/${id}?hl=en`);

    const json = JSON.parse((Regexes.YOUTUBE_INITIAL_DATA.exec(data) as RegExpExecArray)[1]);

    return new YoutubeChannel(json);
}
