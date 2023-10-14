import { request } from 'undici';
import { TokenError } from './Errors';
import { YoutubeCompactVideoInfo, YoutubeCompactListInfo, YoutubeCompactChannelInfo } from './YoutubeCompactInfo';
import { YoutubeConfig } from '../util/config';
import { Util } from '../util/Util';

export type YoutubeSearchInfo = YoutubeCompactVideoInfo | YoutubeCompactListInfo | YoutubeCompactChannelInfo;

export const SearchType = {
    video: 'EgIQAQ%3D%3D',
    playlist: 'EgIQAw%3D%3D',
    channel: 'EgIQAg%3D%3D',
    all: ''
} as const;

export class YoutubeSearchResults {
    estimatedResults = 0;
    totalPageCount = 0;
    results: YoutubeSearchInfo[] = [];

    private token: string | null = null;
    private query: string;
    private limit: number;
    private type: keyof typeof SearchType;

    constructor(query: string, limit: number, type: keyof typeof SearchType = 'all') {
        this.query = query;
        this.limit = limit;
        this.type = SearchType[type] ? type : 'all';
    }

    get url(): string {
        return Util.getSearchURL(this.query, SearchType[this.type]);
    }

    allLoaded(): boolean {
        return this.totalPageCount > 0 && !this.token;
    }

    async init(): Promise<void> {
        if (this.allLoaded()) {
            return;
        }

        const { body } = await request(Util.getApiURL('search'), {
            method: 'POST',
            body: JSON.stringify({
                context: YoutubeConfig.INNERTUBE_CONTEXT,
                query: this.query,
                params: SearchType[this.type]
            })
        });
        const json = (await body.json()) as any;

        this.estimatedResults = Number(json.estimatedResults);

        for (const section of json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer
            .contents) {
            if (section.itemSectionRenderer) {
                this.addResults(section.itemSectionRenderer.contents);
            } else if (section.continuationItemRenderer) {
                this.token = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                if (!this.token) {
                    throw new TokenError();
                }
            }
        }
    }

    async next(): Promise<void> {
        if (!this.token) {
            return;
        }

        const { body } = await request(Util.getApiURL('search'), {
            method: 'POST',
            body: JSON.stringify({
                context: YoutubeConfig.INNERTUBE_CONTEXT,
                continuation: this.token
            })
        });
        const json = (await body.json()) as any;

        this.token = null;
        this.estimatedResults = Number(json.estimatedResults);

        for (const section of json.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems) {
            if (section.itemSectionRenderer) {
                this.addResults(section.itemSectionRenderer.contents);
            } else if (section.continuationItemRenderer) {
                this.token = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                if (!this.token) {
                    throw new TokenError();
                }
            }
        }
    }

    private addResults(results: any[]): void {
        for (const data of results) {
            if (this.results.length >= this.limit) {
                break;
            }

            const video = data.videoRenderer;
            const list = data.playlistRenderer;
            const channel = data.channelRenderer;

            if (video && (this.type === 'all' || this.type === 'video')) {
                const rawViewCount: string =
                    video.viewCountText?.simpleText ?? video.viewCountText?.runs[0]?.text ?? '0';
                const durationText: string = video.lengthText?.simpleText ?? '0:00';
                const viewCountText: string =
                    video.shortViewCountText?.simpleText ?? video.shortViewCountText?.runs[0]?.text ?? '0 views';

                this.results.push({
                    type: 'video',
                    id: video.videoId,
                    url: Util.getVideoURL(video.videoId),
                    title: video.title.runs[0].text,
                    thumbnails: video.thumbnail.thumbnails,
                    publishedTimeAgo: video.publishedTimeText?.simpleText,
                    description: video.detailedMetadataSnippets?.[0].snippetText.runs.map((v: any) => v.text).join(''),
                    duration:
                        durationText
                            .split(':')
                            .map(Number)
                            .reduce((acc: number, time: number) => 60 * acc + time) * 1000,
                    durationText,
                    viewCount: Number(rawViewCount.replace(/\D/g, '')),
                    viewCountText,
                    channel: {
                        id: video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                        url: Util.getChannelURL(video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId),
                        title: video.ownerText.runs[0].text,
                        thumbnails:
                            video.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail
                                .thumbnails
                    }
                });
            } else if (list && (this.type === 'all' || this.type === 'playlist')) {
                this.results.push({
                    type: 'playlist',
                    id: list.playlistId,
                    url: Util.getPlaylistURL(list.playlistId),
                    title: list.title.simpleText,
                    thumbnails: list.thumbnails,
                    videoCount: Number(list.videoCount.replace(/\D/g, '')),
                    channel: {
                        id: list.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                        url: Util.getChannelURL(
                            list.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId
                        ),
                        title: list.shortBylineText.runs[0].text
                    }
                });
            } else if (channel && (this.type === 'all' || this.type === 'channel')) {
                const subscriberCountText: string = channel.subscriberCountText?.simpleText ?? '0 subscribers';

                this.results.push({
                    type: 'channel',
                    id: channel.channelId,
                    url: Util.getChannelURL(channel.channelId),
                    title: channel.title.simpleText,
                    thumbnails: channel.thumbnail.thumbnails,
                    verified: Boolean(channel.ownerBadges?.[0]?.metadataBadgeRenderer?.style?.includes('VERIFIED')),
                    subscriberCountText
                });
            }
        }

        this.totalPageCount++;
    }
}
