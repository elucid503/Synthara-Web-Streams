import axios from 'axios';
import { YoutubeVideo } from '../structures/YoutubeVideo';
import { Regexes } from '../util/Regexes';
import { Util } from '../util/Util';
import { ErrorCodes } from '../util/constants';

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

    const dashMpdUrl = json.streamingData?.dashManifestUrl;
    const m3u8Url = json.streamingData?.hlsManifestUrl;

    if (getLiveFormats) {
        video.moreFormats = [];
        const pending: Promise<typeof video.moreFormats>[] = [];
        if (dashMpdUrl) {
            pending.push(Util.dashMpdFormat(dashMpdUrl));
        }
        if (m3u8Url) {
            pending.push(Util.m3u8Format(m3u8Url));
        }

        for (const moreFormat of await Promise.all(pending)) {
            video.moreFormats.push(...moreFormat);
        }
    }

    return video;
}
