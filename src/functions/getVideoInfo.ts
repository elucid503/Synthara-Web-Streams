import { request } from 'undici';
import { YoutubeError, UrlError } from '../classes/Errors';
import { YoutubeVideo } from '../classes/YoutubeVideo';
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
            context: YoutubeConfig.INNERTUBE_CONTEXT,
            videoId: videoId,
            playbackContext: {
                contentPlaybackContext: {
                    vis: 0,
                    splay: false,
                    autoCaptionsDefaultOn: false,
                    autonavState: 'STATE_NONE',
                    html5Preference: 'HTML5_PREF_WANTS',
                    lactMilliseconds: '-1',
                    signatureTimestamp: YoutubeConfig.STS
                }
            }
        })
    });
    const json = await body.json();

    if (json.playabilityStatus?.status === 'ERROR') {
        throw new YoutubeError(json.playabilityStatus.reason);
    }

    const video = new YoutubeVideo(json);

    if (getLiveFormats) {
        const hlsUrl = json.streamingData?.hlsManifestUrl;

        if (hlsUrl) {
            video.liveFormats.push(...(await Util.getHlsFormats(hlsUrl)));
        }
    }

    return video;
}
