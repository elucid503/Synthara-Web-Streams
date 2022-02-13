import { request } from 'undici';
import { YoutubeVideo, YoutubeVideoFormat } from '../classes/YoutubeVideo';
import { YoutubeConfig } from '../util/config';
import { ErrorCodes } from '../util/constants';
import { Util } from '../util/Util';

export async function getVideoInfo(urlOrId: string, getLiveFormats: boolean = false): Promise<YoutubeVideo> {
    const videoId = Util.getVideoId(urlOrId);
    if (!videoId) {
        throw new Error(ErrorCodes.INVALID_URL);
    }

    const { body } = await request(`${Util.getYTApiBaseURL()}/player?key=${YoutubeConfig.INNERTUBE_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({
            context: YoutubeConfig.INNERTUBE_ANDROID_CONTEXT,
            videoId: videoId
        })
    });
    const json = await body.json();

    if (json.playabilityStatus?.status === 'ERROR') {
        throw new Error(json.playabilityStatus.reason);
    }

    const video = new YoutubeVideo(json);

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
