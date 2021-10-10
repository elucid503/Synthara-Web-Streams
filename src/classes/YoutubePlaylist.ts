import axios from 'axios';
import { TypeError } from './TypeError';
import { DEFAULT_CONTEXT, ErrorCodes } from '../util/constants';
import { Regexes } from '../util/Regexes';
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
    listId: string;
    tracks: PlaylistVideo[] = [];
    data?: PlaylistData;
    totalPageCount = 0;

    private token?: string;
    private apiKey?: string;
    private clientVersion?: string;

    constructor(listId: string) {
        this.listId = listId;
    }

    get url() {
        return `${Util.getYTPlaylistURL()}?list=${this.listId}`;
    }

    get title() {
        return this.data?.title ?? '';
    }

    get description() {
        return this.data?.description ?? '';
    }

    get context() {
        const context = { ...DEFAULT_CONTEXT };

        if (this.clientVersion) {
            context.client.clientVersion = this.clientVersion;
        }

        return context;
    }

    allLoaded() {
        return Boolean(this.token);
    }

    async fetch(): Promise<this> {
        if (this.tracks.length === 0 || !this.token || !this.apiKey) {
            await this.fetchFirstPage();
        }

        if (!this.token) {
            throw new TypeError(ErrorCodes.UNKNOWN_TOKEN);
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
                throw new TypeError(ErrorCodes.UNKNOWN_TOKEN);
            }

            this.addTracks(tracks);
            return this.fetch();
        } else {
            delete this.token;
            this.addTracks(tracks);
            return this;
        }
    }

    async fetchFirstPage() {
        if (this.tracks.length > 100) {
            return this.tracks.slice(0, 100);
        }

        const request = await axios.get<string>(`${Util.getYTPlaylistURL()}?list=${this.listId}&hl=en`).catch(() => {});

        if (!request) {
            throw new TypeError(ErrorCodes.PLAYLIST_LOAD_FAILED);
        }

        const res = Regexes.YOUTUBE_INITIAL_DATA.exec(request.data)?.[1];

        if (!res) {
            throw new TypeError(ErrorCodes.PLAYLIST_LOAD_FAILED);
        }

        const json = JSON.parse(res);

        const apiKey = Regexes.INNERTUBE_API_KEY.exec(request.data)?.[1];

        const version = Regexes.INNERTUBE_CLIENT_VERSION.exec(request.data)?.[1];

        if (!version) {
            throw new TypeError(ErrorCodes.CLIENT_VERSION_FAILED);
        } else if (!apiKey) {
            throw new TypeError(ErrorCodes.API_KEY_FAILED);
        }

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
                throw new TypeError(ErrorCodes.UNKNOWN_TOKEN);
            }
        }

        this.clientVersion = version;
        this.apiKey = apiKey;

        this.addTracks(tracks);

        return this.tracks.slice(0, 100);
    }

    private addTracks(tracks: any[]): this {
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

        return this;
    }
}
