import axios from 'axios';
import { YoutubeVideo, YoutubeVideoFormat } from '../classes/YoutubeVideo';
import { YoutubeConfig } from '../util/config';
import { ErrorCodes } from '../util/constants';
import { Util } from '../util/Util';

export async function getVideoInfo(urlOrId: string, getLiveFormats: boolean = false): Promise<YoutubeVideo> {
    const videoId = Util.getVideoId(urlOrId);
    if (!videoId) {
        throw new Error(ErrorCodes.INVALID_URL);
    }

    const { data: json } = await axios.post<any>(
        `${Util.getYTApiBaseURL()}/player?key=${YoutubeConfig.INNERTUBE_API_KEY}`,
        {
            context: YoutubeConfig.INNERTUBE_ANDROID_CONTEXT,
            videoId: videoId
        }
    );

    if (json.playabilityStatus?.status === 'ERROR') {
        throw new Error(json.playabilityStatus.reason);
    }

    const video = new YoutubeVideo(json);

    await video.fetchTokens();

    if (getLiveFormats) {
        const dashUrl = json.streamingData?.dashManifestUrl;
        const hlsUrl = json.streamingData?.hlsManifestUrl;

        const pending: Promise<YoutubeVideoFormat[]>[] = [];
        if (dashUrl) {
            pending.push(Util.getDashFormats(dashUrl));
        }
        if (hlsUrl) {
            pending.push(Util.getHlsFormats(hlsUrl));
        }

        for (const liveFormats of await Promise.all(pending)) {
            video.liveFormats.push(...liveFormats);
        }
    }

    return video;
}
