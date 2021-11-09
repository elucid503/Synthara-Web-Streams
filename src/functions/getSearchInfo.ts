import { YoutubeSearchResults } from '../classes/YoutubeSearchResults';

export async function getSearchInfo(query: string, limit: number, type?: string): Promise<YoutubeSearchResults> {
    const searchResults = new YoutubeSearchResults(query, limit, type);

    await searchResults.init();

    while (!searchResults.allLoaded() && searchResults.results.length < limit) {
        await searchResults.next();
    }

    return searchResults;
}
