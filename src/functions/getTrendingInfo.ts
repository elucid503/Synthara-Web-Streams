import { request } from 'undici';
import { YoutubeTrending } from '../classes/YoutubeTrending';
import { YoutubeConfig } from '../util/config';
import { Util } from '../util/Util';

export async function getTrendingInfo(): Promise<YoutubeTrending> {
    const { body } = await request(Util.getApiURL('browse'), {
        method: 'POST',
        body: JSON.stringify({
            context: YoutubeConfig.INNERTUBE_CONTEXT,
            browseId: 'FEtrending'
        })
    });

    return new YoutubeTrending(
        (
            await body.json()
        ).contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents
    );
}
