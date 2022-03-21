import { request } from 'undici';
import { YoutubeError, UrlError } from '../classes/Errors';
import { YoutubeVideo, YoutubeVideoFormat } from '../classes/YoutubeVideo';
import { YoutubeConfig } from '../util/config';
import { Util } from '../util/Util';

export async function getVideoInfo(urlOrId: string, getLiveFormats: boolean = false): Promise<YoutubeVideo> {
    const videoId = Util.getVideoId(urlOrId);
    if (!videoId) {
        throw new UrlError();
    }

    const { body } = await request(Util.getApiURL('player'), {
        method: 'POST',
        body: JSON.stringify({
            context: YoutubeConfig.INNERTUBE_ANDROID_CONTEXT,
            videoId: videoId
        })
    });
    const json = await body.json();

    if (json.playabilityStatus?.status === 'ERROR') {
        throw new YoutubeError(json.playabilityStatus.reason);
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
