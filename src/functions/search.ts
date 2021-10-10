import { getSearchInfo } from './getSearchInfo';
import { Util } from '../util/Util';

enum SearchType {
    video = 'EgIQAQ%3D%3D',
    playlist = 'EgIQAw%3D%3D',
    channel = 'EgIQAg%3D%3D'
}

export interface SearchOption {
    type?: keyof typeof SearchType;
    limit?: number;
}

/**
 * Search a youtube using query and options.
 * @param query The query of the search.
 * @param options The options to use for the search.
 */
export async function search(query: string, { type = 'video', limit = Infinity }: SearchOption = {}) {
    const params = new URLSearchParams();

    params.append('search_query', query.replace(/ /g, '+'));
    params.append('hl', 'en');
    params.append('sp', SearchType[type]);

    const { results } = await getSearchInfo(`${Util.getYTSearchURL()}?${params}`, limit);

    return results;
}
