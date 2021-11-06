import { getSearchInfo } from './getSearchInfo';
import { YoutubeSearchInfo } from '../classes/YoutubeSearchResults';

const SearchType = {
    video: 'EgIQAQ%253D%253D',
    playlist: 'EgIQAw%253D%253D',
    channel: 'EgIQAg%253D%253D',
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
    { type = 'all', limit = Infinity }: SearchOption = {}
): Promise<YoutubeSearchInfo[]> {
    const { results } = await getSearchInfo(query.replace(/ /g, '+'), limit, SearchType[type]);

    return results;
}
