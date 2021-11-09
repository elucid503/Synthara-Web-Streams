import axios from 'axios';
import { YoutubeCompactVideoInfo, YoutubeCompactListInfo, YoutubeCompactChannelInfo } from './YoutubeCompactInfo';
import { YoutubeConfig } from '../util/config';
import { ErrorCodes } from '../util/constants';
import { Util } from '../util/Util';

export type YoutubeSearchInfo = YoutubeCompactVideoInfo | YoutubeCompactListInfo | YoutubeCompactChannelInfo;

export class YoutubeSearchResults {
    estimatedResults = 0;
    totalPageCount = 0;
    results: YoutubeSearchInfo[] = [];

    private token: string | null = null;
    private query: string;
    private limit: number;
    private type?: string;

    constructor(query: string, limit: number, type?: string) {
        this.query = query;
        this.limit = limit;
        this.type = type;
    }

    get url(): string {
        const url = new URL(Util.getYTSearchURL());
        url.searchParams.set('search_query', this.query);
        if (this.type) {
            url.searchParams.set('sp', this.type);
        }
        return url.toString();
    }

    allLoaded(): boolean {
        return this.totalPageCount > 0 && !this.token;
    }

    async init(): Promise<void> {
        if (this.allLoaded()) {
            return;
        }

        const { data: json } = await axios.post<any>(
            `${Util.getYTApiBaseURL()}/search?key=${YoutubeConfig.INNERTUBE_API_KEY}`,
            {
                context: YoutubeConfig.INNERTUBE_CONTEXT,
                query: this.query,
                params: this.type ?? ''
            }
        );

        this.estimatedResults = Number(json.estimatedResults);

        for (const section of json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer
            .contents) {
            if (section.itemSectionRenderer) {
                this.addResults(section.itemSectionRenderer.contents);
            } else if (section.continuationItemRenderer) {
                this.token = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                if (!this.token) {
                    throw new Error(ErrorCodes.INVALID_TOKEN);
                }
            }
        }
    }

    async next(): Promise<void> {
        if (!this.token) {
            return;
        }

        const { data: json } = await axios.post<any>(
            `${Util.getYTApiBaseURL()}/search?key=${YoutubeConfig.INNERTUBE_API_KEY}`,
            {
                context: YoutubeConfig.INNERTUBE_CONTEXT,
                continuation: this.token
            }
        );

        this.token = null;
        this.estimatedResults = Number(json.estimatedResults);

        for (const section of json.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems) {
            if (section.itemSectionRenderer) {
                this.addResults(section.itemSectionRenderer.contents);
            } else if (section.continuationItemRenderer) {
                this.token = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                if (!this.token) {
                    throw new Error(ErrorCodes.INVALID_TOKEN);
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

            if (video) {
                const rawViewCount: string =
                    video.viewCountText?.simpleText ?? video.viewCountText?.runs[0]?.text ?? '0';
                const durationText: string = video.lengthText?.simpleText ?? '0:00';
                const viewCountText: string =
                    video.shortViewCountText?.simpleText ?? video.shortViewCountText?.runs[0]?.text ?? '0 views';

                this.results.push({
                    type: 'video',
                    id: video.videoId,
                    url: `${Util.getYTVideoURL()}${video.videoId}`,
                    title: video.title.runs[0].text,
                    thumbnails: video.thumbnail.thumbnails,
                    publishedTimeAgo: video.publishedTimeText?.simpleText,
                    description: video.detailedMetadataSnippets?.[0].snippetText.runs.map((v: any) => v.text).join(''),
                    duration:
                        durationText
                            .split(':')
                            .map((v: string) => Number(v))
                            .reduce((acc: number, time: number) => 60 * acc + time) * 1000,
                    durationText: durationText,
                    viewCount: Number(rawViewCount.replace(/\D/g, '')),
                    viewCountText: viewCountText,
                    channel: {
                        id: video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                        url: `${Util.getYTChannelURL()}/${
                            video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId
                        }`,
                        title: video.ownerText.runs[0].text,
                        thumbnails:
                            video.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail
                                .thumbnails
                    }
                });
            } else if (list) {
                this.results.push({
                    type: 'playlist',
                    id: list.playlistId,
                    url: `${Util.getYTPlaylistURL()}?list=${list.playlistId}`,
                    title: list.title.simpleText,
                    thumbnails: list.thumbnails,
                    videoCount: Number(list.videoCount.replace(/\D/g, '')),
                    channel: {
                        id: list.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                        url: `${Util.getYTChannelURL()}/${
                            list.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId
                        }`,
                        title: list.shortBylineText.runs[0].text
                    }
                });
            } else if (channel) {
                const subscriberCountText: string = channel.subscriberCountText?.simpleText ?? '0 subscribers';

                this.results.push({
                    type: 'channel',
                    id: channel.channelId,
                    url: `${Util.getYTChannelURL()}/${channel.channelId}`,
                    title: channel.title.simpleText,
                    thumbnails: channel.thumbnail.thumbnails,
                    verified: Boolean(channel.ownerBadges?.[0]?.metadataBadgeRenderer?.style?.includes('VERIFIED')),
                    subscriberCountText: subscriberCountText
                });
            }
        }

        this.totalPageCount++;
    }
}
