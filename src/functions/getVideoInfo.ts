import axios from 'axios';
import { YoutubeVideo } from '../structures/YoutubeVideo';
import { ErrorCodes } from '../util/constants';
import { Regexes } from '../util/Regexes';
import { Util } from '../util/Util';

export async function getVideoInfo(urlOrId: string, getLiveFormats: boolean = false) {
    const videoId = Util.getVideoId(urlOrId);
    if (!videoId) {
        throw new Error(ErrorCodes.INVALID_URL);
    }

    const { data } = await axios.get<string>(`${Util.getYTVideoURL()}${videoId}&hl=en`);

    const json = JSON.parse((Regexes.YOUTUBE_PLAYER_RESPONSE.exec(data) as RegExpExecArray)[1]);

    if (json.playabilityStatus?.status === 'ERROR') {
        throw Error(json.playabilityStatus.reason);
    }

    const video = new YoutubeVideo(json);

    video.getHtml5Player(data);
    await video.fetchTokens();

    const dashUrl = json.streamingData?.dashManifestUrl;
    const hlsUrl = json.streamingData?.hlsManifestUrl;

    if (getLiveFormats) {
        video.liveFormats = [];
        const pending: Promise<typeof video.liveFormats>[] = [];
        if (dashUrl) {
            pending.push(Util.dashMpdFormat(dashUrl));
        }
        if (hlsUrl) {
            pending.push(Util.m3u8Format(hlsUrl));
        }

        for (const liveFormats of await Promise.all(pending)) {
            video.liveFormats.push(...liveFormats);
        }
    }

    return video;
}
