export interface YoutubeCompactBaseInfo {
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

export interface YoutubeListVideoInfo extends YoutubeCompactBaseInfo {
    type: 'video';
    index: number;
    duration: number;
    durationText: string;
    isPlayable: boolean;
}

export interface YoutubeCompactVideoInfo extends YoutubeCompactBaseInfo {
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

export interface YoutubeCompactListInfo extends YoutubeCompactBaseInfo {
    type: 'playlist';
    videoCount: number;
    channel: {
        id: string;
        url: string;
        title: string;
    };
}

export interface YoutubeCompactChannelInfo extends YoutubeCompactBaseInfo {
    type: 'channel';
    verified: boolean;
    subscriberCountText: string;
}
