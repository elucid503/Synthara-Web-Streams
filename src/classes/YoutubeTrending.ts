import { YoutubeCompactVideoInfo } from './YoutubeCompactInfo';
import { Util } from '../util/Util';

export class YoutubeTrending {
    trends: YoutubeCompactVideoInfo[] = [];

    constructor(json: any) {
        for (const itemSection of json) {
            const trends =
                itemSection.itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer?.items;

            if (trends) {
                this.addTrends(trends);
            }
        }
    }

    get url(): string {
        return Util.getTrendingURL();
    }

    private addTrends(trends: any[]): void {
        for (const data of trends) {
            const video = data.videoRenderer;

            if (video) {
                this.trends.push({
                    type: 'video',
                    id: video.videoId,
                    url: Util.getVideoURL(video.videoId),
                    title: video.title.runs[0].text,
                    thumbnails: video.thumbnail.thumbnails,
                    publishedTimeAgo: video.publishedTimeText?.simpleText,
                    description: video.descriptionSnippet?.runs.map((v: any) => v.text).join(''),
                    duration:
                        video.lengthText.simpleText
                            .split(':')
                            .map(Number)
                            .reduce((acc: number, time: number) => 60 * acc + time) * 1000,
                    durationText: video.lengthText.simpleText,
                    viewCount: Number(video.viewCountText.simpleText.replace(/\D/g, '')),
                    viewCountText: video.shortViewCountText.simpleText,
                    channel: {
                        id: video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                        url: Util.getChannelURL(video.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId),
                        title: video.ownerText.runs[0].text,
                        thumbnails:
                            video.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail
                                .thumbnails
                    }
                });
            }
        }
    }
}
