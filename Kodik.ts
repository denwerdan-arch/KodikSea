type SubOrDub = "sub" | "dub" | "both";
type VideoSourceType = "mp4" | "m3u8";

interface SearchOptions {
    query: string;
}

interface SearchResult {
    id: string;
    title: string;
    url: string;
    subOrDub: SubOrDub;
}

interface EpisodeDetails {
    id: string;
    number: number;
    title: string;
    url: string;
}

interface VideoSubtitle {
    id: string;
    url: string;
    language: string;
    isDefault: boolean;
}

interface VideoSource {
    url: string;
    type: VideoSourceType;
    quality: string;
    subtitles?: VideoSubtitle[];
}

interface EpisodeServer {
    server: string;
    headers: Record<string, string>;
    videoSources: VideoSource[];
}

interface Settings {
    episodeServers: string[];
    supportsDub: boolean;
}

interface KodikParams {
    domain: string;
    d_sign: string;
    pd: string;
    pd_sign: string;
    ref: string;
    ref_sign: string;
    type: string;
    hash: string;
    id: string;
}

/// <reference path="./online-streaming-provider.d.ts" />

class Provider {
    private readonly ANIMEGO_BASE = "https://animego.me";
    private readonly PLAYER_API = "https://plapi.cdnvideohub.com/api/v1/player/sv";
    private readonly USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

    getSettings(): Settings {
        return {
            episodeServers: ["AnimeGo"],
            supportsDub: true,
        };
    }

    async search(opts: SearchOptions): Promise<SearchResult[]> {
        try {
            const url = `${this.ANIMEGO_BASE}/api/v2/quick_search?q=${encodeURIComponent(opts.query)}`;
            const response = await fetch(url, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": this.ANIMEGO_BASE + "/",
                    "User-Agent": this.USER_AGENT
                }
            });
            const data = await response.json();

            if (!data || !data.data) return [];

            return data.data.map((item: any) => {
                return {
                    id: String(item.id),
                    title: `${item.title} / ${item.original_title} (${item.year})`,
                    url: item.link,
                    subOrDub: item.translation?.type === "voice" ? "dub" : "sub",
                };
            });
        } catch (e) {
            console.error("AnimeGo Search Error:", e);
            return [];
        }
    }

    async findEpisodes(id: string): Promise<EpisodeDetails[]> {
        try {
            // Using the parameters found in the logs: pub=747, aggr=mali
            const url = `${this.PLAYER_API}/playlist?pub=747&aggr=mali&id=${id}`;
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
                    "Origin": this.ANIMEGO_BASE,
                    "Referer": this.ANIMEGO_BASE + "/",
                    "User-Agent": this.USER_AGENT
                }
            });
            const data = await response.json();
            
            const episodes: EpisodeDetails[] = [];

            // Helper to parse nested playlist structure
            const parsePlaylist = (obj: any, seasonPrefix = "") => {
                if (Array.isArray(obj)) {
                    obj.forEach((item, index) => {
                        if (typeof item === 'object' && item.id) {
                            episodes.push({
                                id: String(item.id), // This is the unitedVideoId
                                number: item.episode ? parseInt(item.episode) : index + 1,
                                title: item.title || `${seasonPrefix}Episode ${index + 1}`,
                                url: `${this.PLAYER_API}/video/${item.id}`
                            });
                        }
                    });
                } else if (typeof obj === 'object') {
                    for (const key in obj) {
                        const val = obj[key];
                        // Check if key is a season number (digits)
                        if (/^\d+$/.test(key)) {
                            // If value is string/number, it's likely an episode ID in a flat list or season list
                            if (typeof val === 'string' || typeof val === 'number') {
                                episodes.push({
                                    id: String(val),
                                    number: parseInt(key),
                                    title: `${seasonPrefix}Episode ${key}`,
                                    url: `${this.PLAYER_API}/video/${val}`
                                });
                            } else {
                                // Recursive for seasons
                                parsePlaylist(val, `Season ${key} `);
                            }
                        }
                    }
                }
            };

            parsePlaylist(data);

            return episodes;
        } catch (e) {
            console.error("AnimeGo Episodes Error:", e);
            return [];
        }
    }

    async findEpisodeServer(episode: EpisodeDetails, _server: string): Promise<EpisodeServer> {
        try {
            const url = `${this.PLAYER_API}/video/${episode.id}`;
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
                    "Origin": this.ANIMEGO_BASE,
                    "Referer": this.ANIMEGO_BASE + "/",
                    "User-Agent": this.USER_AGENT
                }
            });
            const data = await response.json();
            
            const videoSources: VideoSource[] = [];
            
            if (data && data.sources) {
                const s = data.sources;
                
                // HLS
                if (s.hlsUrl) {
                    videoSources.push({
                        url: s.hlsUrl,
                        quality: "auto",
                        type: "m3u8"
                    });
                }

                // MP4 Qualities mapping
                const qualityMap: Record<string, string> = {
                    "mpegFullHdUrl": "1080p",
                    "mpegHighUrl": "720p",
                    "mpegMediumUrl": "480p",
                    "mpegLowUrl": "360p",
                    "mpegLowestUrl": "240p"
                };

                for (const [key, quality] of Object.entries(qualityMap)) {
                    if (s[key]) {
                        videoSources.push({
                            url: s[key],
                            quality: quality,
                            type: "mp4"
                        });
                    }
                }
            }

            return {
                server: _server,
                headers: {
                    "Referer": this.ANIMEGO_BASE + "/",
                    "User-Agent": this.USER_AGENT
                },
                videoSources
            };
        } catch (e) {
            console.error("AnimeGo GetSources Error:", e);
            throw new Error(e instanceof Error ? e.message : "Unknown error");
        }
    }
}
