import axios from 'axios';
import { TypeError } from './TypeError';
import { DEFAULT_CONTEXT, ErrorCodes, Regexes } from '../util/constants';
import { Util } from '../util/Util';

export interface PlaylistVideo {
    id: string;
    url: string;
    title: string;
    thumbnails: {
        width: number;
        height: number;
        url: string;
    }[];
    index: number;
    duration: number;
    durationText: string;
    isPlayable: boolean;
}

export interface PlaylistData {
    title: string;
    description: string;
}

export class YoutubePlaylist {
    totalPageCount = 0;
    tracks: PlaylistVideo[] = [];
    listId: string;
    data?: PlaylistData;

    private token: string | null = null;
    private apiKey: string | null = null;
    private clientVersion: string | null = null;

    constructor(listId: string) {
        this.listId = listId;
    }

    get url(): string {
        return `${Util.getYTPlaylistURL()}?list=${this.listId}`;
    }

    get title(): string {
        return this.data?.title ?? '';
    }

    get description(): string {
        return this.data?.description ?? '';
    }

    get context(): typeof DEFAULT_CONTEXT {
        const context = { ...DEFAULT_CONTEXT };

        if (this.clientVersion) {
            context.client.clientVersion = this.clientVersion;
        }

        return context;
    }

    allLoaded(): boolean {
        return Boolean(this.tracks.length > 0 && !this.token && this.apiKey);
    }

    async fetch(): Promise<void> {
        if (this.tracks.length === 0 || !this.token || !this.apiKey) {
            await this.fetchFirstPage();
            if (!this.token) {
                return;
            }
        }

        if (!this.token) {
            throw new TypeError(ErrorCodes.INVALID_TOKEN);
        } else if (!this.apiKey) {
            throw new TypeError(ErrorCodes.API_KEY_FAILED);
        }

        const { data: json } = await axios.post<any>(`${Util.getYTApiBaseURL()}/browse?key=${this.apiKey}`, {
            context: this.context,
            continuation: this.token
        });

        const tracks = json.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;

        const renderer = tracks[tracks.length - 1].continuationItemRenderer;

        if (renderer) {
            this.token = renderer.continuationEndpoint.continuationCommand.token;
            if (!this.token) {
                throw new TypeError(ErrorCodes.INVALID_TOKEN);
            }

            this.addTracks(tracks);
            await this.fetch();
        } else {
            this.token = null;
            this.addTracks(tracks);
        }
    }

    async fetchFirstPage(): Promise<void> {
        if (this.allLoaded()) {
            return;
        }

        const request = await axios.get<string>(`${Util.getYTPlaylistURL()}?list=${this.listId}&hl=en`).catch(() => {});
        if (!request) {
            throw new TypeError(ErrorCodes.PLAYLIST_LOAD_FAILED);
        }

        const res = Regexes.YOUTUBE_INITIAL_DATA.exec(request.data)?.[1];
        if (!res) {
            throw new TypeError(ErrorCodes.PLAYLIST_LOAD_FAILED);
        }

        const apiKey = Regexes.INNERTUBE_API_KEY.exec(request.data)?.[1];
        if (!apiKey) {
            throw new TypeError(ErrorCodes.API_KEY_FAILED);
        }

        const version = Regexes.INNERTUBE_CLIENT_VERSION.exec(request.data)?.[1];
        if (!version) {
            throw new TypeError(ErrorCodes.CLIENT_VERSION_FAILED);
        }

        const json = JSON.parse(res);

        const metadata = json.metadata.playlistMetadataRenderer;

        this.data = {
            title: metadata.title,
            description: metadata.description
        };

        const tracks =
            json.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0]
                .itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;

        const renderer = tracks[tracks.length - 1].continuationItemRenderer;

        if (renderer) {
            this.token = renderer.continuationEndpoint.continuationCommand.token;
            if (!this.token) {
                throw new TypeError(ErrorCodes.INVALID_TOKEN);
            }
        }

        this.clientVersion = version;
        this.apiKey = apiKey;

        this.addTracks(tracks);
    }

    private addTracks(tracks: any[]): void {
        for (const data of tracks) {
            const track = data.playlistVideoRenderer;

            if (track) {
                this.tracks.push({
                    id: track.videoId,
                    url: `${Util.getYTVideoURL()}${track.videoId}`,
                    title: track.title?.runs?.[0].text,
                    thumbnails: track.thumbnail?.thumbnails ?? [],
                    index: Number(track.index?.simpleText ?? '0'),
                    duration: Number(track.lengthSeconds) * 1000,
                    durationText: track.lengthText?.simpleText ?? '0:00',
                    isPlayable: track.isPlayable
                });
            }
        }

        this.totalPageCount++;
    }
}
