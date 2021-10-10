import axios from 'axios';
import { TypeError } from '../classes/TypeError';
import { YoutubeVideo } from '../classes/YoutubeVideo';
import { ErrorCodes, Regexes } from '../util/constants';
import { Util } from '../util/Util';

export async function getVideoInfo(urlOrId: string, getLiveFormats: boolean = false) {
    const videoId = Util.getVideoId(urlOrId);
    if (!videoId) {
        throw new TypeError(ErrorCodes.INVALID_URL);
    }

    const { data } = await axios.get<string>(`${Util.getYTVideoURL()}${videoId}&hl=en`);

    const json = JSON.parse((Regexes.YOUTUBE_PLAYER_RESPONSE.exec(data) as RegExpExecArray)[1]);

    if (json.playabilityStatus?.status === 'ERROR') {
        throw new Error(json.playabilityStatus.reason);
    }

    const video = new YoutubeVideo(json);

    video.getHtml5Player(data);
    await video.fetchTokens();

    if (getLiveFormats) {
        const dashUrl = json.streamingData?.dashManifestUrl;
        const hlsUrl = json.streamingData?.hlsManifestUrl;

        video.liveFormats = [];
        const pending: Promise<typeof video.liveFormats>[] = [];
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
