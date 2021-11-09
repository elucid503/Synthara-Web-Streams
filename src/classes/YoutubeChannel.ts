import { Util } from '../util/Util';

export interface YoutubeChannelDetails {
    id: string;
    url: string;
    title: string;
    avatars: {
        url: string;
        width: number;
        height: number;
    }[];
    banners: {
        url: string;
        width: number;
        height: number;
    }[];
    description: string;
    subscriberCountText: string;
    isFamilySafe: boolean;
    keywords: string;
    rssUrl: string;
    availableCountryCodes: string[];
}

export class YoutubeChannel {
    private json: any;

    constructor(json: any) {
        this.json = json;
    }

    get url(): string {
        return `${Util.getYTChannelURL()}/${this.json.header.c4TabbedHeaderRenderer.channelId}`;
    }

    get details(): YoutubeChannelDetails {
        const header = this.json.header.c4TabbedHeaderRenderer;
        const metadata = this.json.metadata.channelMetadataRenderer;

        return {
            id: header.channelId,
            url: `${Util.getYTChannelURL()}/${header.channelId}`,
            title: header.title,
            avatars: header.avatar.thumbnails,
            banners: header.banner.thumbnails,
            description: metadata.description,
            subscriberCountText: header.subscriberCountText?.simpleText ?? '0 subscribers',
            isFamilySafe: metadata.isFamilySafe,
            keywords: metadata.keywords,
            rssUrl: metadata.rssUrl,
            availableCountryCodes: metadata.availableCountryCodes
        };
    }
}
