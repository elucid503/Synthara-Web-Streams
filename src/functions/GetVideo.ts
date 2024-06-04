import https from 'https';

import { HttpsProxyAgent } from 'https-proxy-agent';

import Axios from 'axios';

import { YoutubeError, UrlError, YoutubeVideo } from '../classes';
import { Util, YoutubeConfig } from '../util';

export async function GetVideo(
    URLorID: string,
    GetHLSFormats: boolean = false,
    Proxy?: { Host: string; Port: number, UserPass?: string }
): Promise<YoutubeVideo> {
    const videoId = Util.getVideoId(URLorID);
    if (!videoId) {
        throw new UrlError();
    }

    const response = await Axios({
        url: Util.getApiURL('player'),
        method: 'post',
        data: {
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
        },
        httpsAgent: Proxy ? new HttpsProxyAgent(`http://${Proxy.UserPass ? Proxy.UserPass + '@' : ''}${Proxy.Host}:${Proxy.Port}`) : undefined
    });

    const json = (await response.data) as any;

    if (json.playabilityStatus?.status === 'ERROR') {
        throw new YoutubeError(json.playabilityStatus.reason);
    }

    const video = new YoutubeVideo(json);

    if (GetHLSFormats) {
        const hlsUrl = json.streamingData?.hlsManifestUrl;

        if (hlsUrl) {
            const HLSFormats = await Util.GetHLSFormats(hlsUrl);

            video.liveFormats.push(...HLSFormats);
        }
    }

    return video;
}
