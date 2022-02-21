import { request } from 'undici';
import { YoutubeListVideoInfo } from './YoutubeCompactInfo';
import { YoutubeConfig } from '../util/config';
import { ErrorCodes } from '../util/constants';
import { Util } from '../util/Util';

export class YoutubePlaylist {
    totalPageCount = 0;
    title = '';
    description = '';
    tracks: YoutubeListVideoInfo[] = [];
    listId: string;
    isMix: boolean;

    private token: string | null = null;

    constructor(listId: string) {
        this.listId = listId;
        this.isMix = listId.startsWith('RD');
    }

    get url(): string {
        return `${Util.getYTPlaylistURL()}?list=${this.listId}`;
    }

    allLoaded(): boolean {
        return this.totalPageCount > 0 && !this.token;
    }

    async init(): Promise<void> {
        if (this.allLoaded()) {
            return;
        }

        if (this.isMix) {
            const { body } = await request(`${Util.getYTApiBaseURL()}/next?key=${YoutubeConfig.INNERTUBE_API_KEY}`, {
                method: 'POST',
                body: JSON.stringify({
                    context: YoutubeConfig.INNERTUBE_CONTEXT,
                    playlistId: this.listId
                })
            });
            const json = await body.json();

            const { playlist } = json.contents.twoColumnWatchNextResults.playlist;

            this.title = playlist.title;

            this.addTracks(playlist.contents);
        } else {
            const { body } = await request(`${Util.getYTApiBaseURL()}/browse?key=${YoutubeConfig.INNERTUBE_API_KEY}`, {
                method: 'POST',
                body: JSON.stringify({
                    context: YoutubeConfig.INNERTUBE_CONTEXT,
                    browseId: `VL${this.listId}`
                })
            });
            const json = await body.json();

            const metadata = json.metadata.playlistMetadataRenderer;

            this.title = metadata.title;
            this.description = metadata.description;

            const tracks =
                json.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0]
                    .itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;

            this.addTracks(tracks);
        }
    }

    async next(): Promise<void> {
        if (!this.token) {
            return;
        }

        const { body } = await request(`${Util.getYTApiBaseURL()}/browse?key=${YoutubeConfig.INNERTUBE_API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                context: YoutubeConfig.INNERTUBE_CONTEXT,
                continuation: this.token
            })
        });
        const json = await body.json();

        this.token = null;

        const tracks = json.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;

        this.addTracks(tracks);
    }

    private addTracks(tracks: any[]): void {
        for (const data of tracks) {
            if (this.isMix) {
                const track = data.playlistPanelVideoRenderer;

                if (track) {
                    const durationText: string = track.lengthText?.simpleText ?? '0:00';

                    this.tracks.push({
                        type: 'video',
                        id: track.videoId,
                        url: `${Util.getYTVideoURL()}${track.videoId}`,
                        title: track.title?.simpleText,
                        thumbnails: track.thumbnail?.thumbnails ?? [],
                        index: track.navigationEndpoint.watchEndpoint.index + 1,
                        duration:
                            durationText
                                .split(':')
                                .map(Number)
                                .reduce((acc: number, time: number) => 60 * acc + time) * 1000,
                        durationText: durationText,
                        isPlayable: true
                    });
                }
            } else {
                const track = data.playlistVideoRenderer;
                const renderer = data.continuationItemRenderer;

                if (track) {
                    this.tracks.push({
                        type: 'video',
                        id: track.videoId,
                        url: `${Util.getYTVideoURL()}${track.videoId}`,
                        title: track.title?.runs?.[0].text,
                        thumbnails: track.thumbnail?.thumbnails ?? [],
                        index: Number(track.index?.simpleText ?? '0'),
                        duration: Number(track.lengthSeconds) * 1000,
                        durationText: track.lengthText?.simpleText ?? '0:00',
                        isPlayable: track.isPlayable
                    });
                } else if (renderer) {
                    this.token = renderer.continuationEndpoint.continuationCommand.token;
                    if (!this.token) {
                        throw new Error(ErrorCodes.INVALID_TOKEN);
                    }
                }
            }
        }

        this.totalPageCount++;
    }
}
