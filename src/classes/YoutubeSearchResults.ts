import axios from 'axios';
import { YoutubeConfig } from '../util/config';
import { ErrorCodes } from '../util/constants';
import { Util } from '../util/Util';

export interface YoutubeSearchBaseInfo {
    type: 'video' | 'playlist' | 'channel';
    id: string;
    url: string;
    title: string;
    thumbnails: {
        url: string;
        width: string;
        height: string;
    }[];
}

export interface YoutubeSearchVideoInfo extends YoutubeSearchBaseInfo {
    type: 'video';
    publishedTimeAgo?: string;
    description?: string;
    duration: number;
    durationText: string;
    viewCount: number;
    viewCountText: string;
    channel: {
        id: string;
        url: string;
        title: string;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    };
}

export interface YoutubeSearchListInfo extends YoutubeSearchBaseInfo {
    type: 'playlist';
    videoCount: number;
    channel: {
        id: string;
        url: string;
        title: string;
    };
}

export interface YoutubeSearchChannelInfo extends YoutubeSearchBaseInfo {
    type: 'channel';
    verified: boolean;
    subscriberCountText: string;
}

export type YoutubeSearchInfo = YoutubeSearchVideoInfo | YoutubeSearchListInfo | YoutubeSearchChannelInfo;

export class YoutubeSearchResults {
    estimatedResults = 0;
    totalPageCount = 0;
    results: YoutubeSearchInfo[] = [];

    private query: string;
    private limit: number;
    private type: string;
    private token: string | null = null;

    constructor(query: string, limit: number, type: string) {
        this.query = query;
        this.limit = limit;
        this.type = type;
    }

    allLoaded(): boolean {
        return this.totalPageCount > 0 && !this.token;
    }

    async init(): Promise<void> {
        if (this.allLoaded()) {
            return;
        }

        const url = new URL(`${Util.getYTApiBaseURL()}/search`);

        url.searchParams.set('key', YoutubeConfig.INNERTUBE_API_KEY);
        if (this.type) {
            url.searchParams.set('params', this.type);
        }

        const { data: json } = await axios.post<any>(url.toString(), {
            context: YoutubeConfig.INNERTUBE_CONTEXT,
            query: this.query.replace(/ /g, '+')
        });

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

            if (this.results.length === this.limit) {
                break;
            }
        }

        this.totalPageCount++;
    }
}
