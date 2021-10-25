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
    private json: any;
    private limit: number;

    constructor(json: any, limit: number) {
        this.json = json;
        this.limit = limit;
    }

    get estimatedResults(): number {
        return Number(this.json.estimatedResults);
    }

    get results(): YoutubeSearchInfo[] {
        const arr: YoutubeSearchInfo[] = [];

        const sectionListDatas =
            this.json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.filter(
                (c: any) => c.itemSectionRenderer
            );
        const datas = sectionListDatas[sectionListDatas.length - 1].itemSectionRenderer.contents;

        for (const data of datas) {
            const video = data.videoRenderer;
            const list = data.playlistRenderer;
            const channel = data.channelRenderer;

            if (video) {
                const rawViewCount: string =
                    video.viewCountText?.simpleText ?? video.viewCountText?.runs[0]?.text ?? '0';
                const durationText: string = video.lengthText?.simpleText ?? '0:00';
                const viewCountText: string =
                    video.shortViewCountText?.simpleText ?? video.shortViewCountText?.runs[0]?.text ?? '0 views';

                arr.push({
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
                arr.push({
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

                arr.push({
                    type: 'channel',
                    id: channel.channelId,
                    url: `${Util.getYTChannelURL()}/${channel.channelId}`,
                    title: channel.title.simpleText,
                    thumbnails: channel.thumbnail.thumbnails,
                    verified: Boolean(channel.ownerBadges?.[0]?.metadataBadgeRenderer?.style?.includes('VERIFIED')),
                    subscriberCountText: subscriberCountText
                });
            }

            if (arr.length === this.limit) {
                break;
            }
        }

        return arr;
    }
}
