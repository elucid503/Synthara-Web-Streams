import { getSearchInfo } from './getSearchInfo';
import { YoutubeSearchInfo, SearchType } from '../classes/YoutubeSearchResults';

export interface SearchOptions {
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
    { type = 'all', limit = 10 }: SearchOptions = {}
): Promise<YoutubeSearchInfo[]> {
    const { results } = await getSearchInfo(query, limit, type);

    return results;
}
