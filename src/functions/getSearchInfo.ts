import axios from 'axios';
import { SearchError } from '../classes/SearchError';
import { YoutubeSearchResults } from '../classes/YoutubeSearchResults';
import { YoutubeConfig } from '../util/config';
import { Util } from '../util/Util';

export async function getSearchInfo(query: string, limit: number, type: string): Promise<YoutubeSearchResults> {
    try {
        const url = new URL(`${Util.getYTApiBaseURL()}/search`);

        url.searchParams.set('key', YoutubeConfig.INNERTUBE_API_KEY);
        if (type) {
            url.searchParams.set('params', type);
        }

        const { data: json } = await axios.post<any>(url.toString(), {
            context: YoutubeConfig.INNERTUBE_CONTEXT,
            query: query.replace(/ /g, '+')
        });

        return new YoutubeSearchResults(json, limit);
    } catch (error) {
        throw new SearchError((error as Error).message);
    }
}
