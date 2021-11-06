import axios from 'axios';
import { YoutubeChannel } from '../classes/YoutubeChannel';
import { YoutubeConfig } from '../util/config';
import { Util } from '../util/Util';

export async function getChannelInfo(id: string): Promise<YoutubeChannel> {
    const { data: json } = await axios.post<any>(
        `${Util.getYTApiBaseURL()}/browse?key=${YoutubeConfig.INNERTUBE_API_KEY}`,
        {
            context: YoutubeConfig.INNERTUBE_CONTEXT,
            browseId: id
        }
    );

    return new YoutubeChannel(json);
}
