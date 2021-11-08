import { getSearchInfo } from './getSearchInfo';
import { YoutubeSearchInfo } from '../classes/YoutubeSearchResults';

const SearchType = {
    video: 'EgIQAQ%3D%3D',
    playlist: 'EgIQAw%3D%3D',
    channel: 'EgIQAg%3D%3D',
    all: ''
} as const;

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
    { type = 'all', limit = 10 }: SearchOption = {}
): Promise<YoutubeSearchInfo[]> {
    const { results } = await getSearchInfo(query, limit, SearchType[type]);

    return results;
}
