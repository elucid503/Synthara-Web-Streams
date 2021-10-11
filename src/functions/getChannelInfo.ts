import axios from 'axios';
import { YoutubeChannel } from '../classes/YoutubeChannel';
import { Regexes } from '../util/constants';
import { Util } from '../util/Util';

export async function getChannelInfo(id: string): Promise<YoutubeChannel> {
    const { data } = await axios.get<string>(`${Util.getYTChannelURL()}/${id}?hl=en`);

    const json = JSON.parse((Regexes.YOUTUBE_INITIAL_DATA.exec(data) as RegExpExecArray)[1]);

    return new YoutubeChannel(json);
}
