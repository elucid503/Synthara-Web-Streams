import { Util } from '../util/Util';

export interface YoutubeTrendingVideo {
    id: string;
    url: string;
    title: string;
    thumbnails: {
        url: string;
        width: string;
        height: string;
    }[];
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

export class YoutubeTrending {
    private json: any;

    constructor(json: any) {
        this.json = json;
    }

    get trends(): YoutubeTrendingVideo[] {
        const arr: YoutubeTrendingVideo[] = [];

        for (const data of this.json) {
            const video = data.videoRenderer;

            if (video) {
                arr.push({
                    id: video.videoId,
                    url: `${Util.getYTVideoURL()}${video.videoId}`,
                    title: video.title.runs[0].text,
                    thumbnails: video.thumbnail.thumbnails,
                    publishedTimeAgo: video.publishedTimeText?.simpleText,
                    description: video.descriptionSnippet?.runs.map((e: any) => e.text).join(''),
                    duration:
                        video.lengthText.simpleText
                            .split(':')
                            .map((d: string) => Number(d))
                            .reduce((acc: number, time: number) => 60 * acc + time) * 1000,
                    durationText: video.lengthText.simpleText,
                    viewCount: Number(video.viewCountText.simpleText.replace(/\D/g, '')),
                    viewCountText: video.shortViewCountText.simpleText,
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
            }
        }

        return arr;
    }
}
