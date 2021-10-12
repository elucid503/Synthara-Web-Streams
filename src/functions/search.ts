import { getSearchInfo } from './getSearchInfo';
import { YoutubeSearchInfo } from '../classes/YoutubeSearchResults';
import { Util } from '../util/Util';

const SearchType = {
    video: 'EgIQAQ%3D%3D',
    playlist: 'EgIQAw%3D%3D',
    channel: 'EgIQAg%3D%3D'
};

export interface SearchOption {
    type?: keyof typeof SearchType;
    limit?: number;
}

/**
 * Search a youtube using query and options.
 * @param query The query of the search.
 * @param options The options to use for the search.
 */
export async function search(
    query: string,
    { type = 'video', limit = Infinity }: SearchOption = {}
): Promise<YoutubeSearchInfo[]> {
    const url = new URL(Util.getYTSearchURL());

    url.searchParams.set('search_query', query.replace(/ /g, '+'));
    url.searchParams.set('sp', SearchType[type]);
    url.searchParams.set('hl', 'en');

    const { results } = await getSearchInfo(url.toString(), limit);

    return results;
}
