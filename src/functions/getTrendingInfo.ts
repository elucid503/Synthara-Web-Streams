import axios from 'axios';
import { YoutubeTrending } from '../classes/YoutubeTrending';
import { YoutubeConfig } from '../util/config';
import { Util } from '../util/Util';

export async function getTrendingInfo(): Promise<YoutubeTrending> {
    const { data: json } = await axios.post<any>(
        `${Util.getYTApiBaseURL()}/browse?key=${YoutubeConfig.INNERTUBE_API_KEY}`,
        {
            context: YoutubeConfig.INNERTUBE_CONTEXT,
            browseId: 'FEtrending'
        }
    );

    return new YoutubeTrending(
        json.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents
    );
}
