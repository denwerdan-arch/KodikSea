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

class Provider {
    private readonly KODIK_TOKEN = "8e329159687fc1a2f5af99a50bf57070";
    private readonly BASE_URL = "https://kodikapi.com";

    getSettings(): Settings {
        return {
            episodeServers: ["Kodik"],
            supportsDub: true,
        };
    }

    async search(opts: SearchOptions): Promise<SearchResult[]> {
        try {
            const url = `${this.BASE_URL}/search?token=${this.KODIK_TOKEN}&title=${encodeURIComponent(opts.query)}&types=anime,anime-serial&with_material_data=true&limit=20`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (!data.results || data.results.length === 0) return [];

            return data.results.map((item: any) => {
                let displayTitle = item.title;
                if (item.translation && item.translation.title) {
                    displayTitle += ` [${item.translation.title}]`;
                }
                return {
                    id: item.id,
                    title: displayTitle,
                    url: item.link,
                    subOrDub: item.translation?.type === "voice" ? "dub" : "sub",
                };
            });
        } catch (e) {
            console.error("Kodik Search Error:", e);
            return [];
        }
    }

    async findEpisodes(id: string): Promise<EpisodeDetails[]> {
        try {
            const url = `${this.BASE_URL}/search?token=${this.KODIK_TOKEN}&id=${id}&with_episodes=true`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) return [];
            
            const item = data.results[0];
            const episodes: EpisodeDetails[] = [];

            if (item.seasons) {
                for (const seasonNum in item.seasons) {
                    const season = item.seasons[seasonNum];
                    for (const episodeNum in season.episodes) {
                        const epLink = season.episodes[episodeNum];
                        episodes.push({
                            id: epLink,
                            number: parseInt(episodeNum),
                            title: `Серия ${episodeNum}`,
                            url: epLink
                        });
                    }
                }
            } else {
                episodes.push({
                    id: item.link,
                    number: 1,
                    title: "Фильм",
                    url: item.link
                });
            }

            return episodes.sort((a, b) => a.number - b.number);
        } catch (e) {
            console.error("Kodik Episodes Error:", e);
            return [];
        }
    }

    async findEpisodeServer(episode: EpisodeDetails, _server: string): Promise<EpisodeServer> {
        try {
            const fetchUrl = episode.id.startsWith("//") ? "https:" + episode.id : episode.id;
            const html = await this.fetchPlayerPage(fetchUrl);
            const params = this.parseParameters(html);
            const subtitles = this.extractSubtitles(html);
            const links = await this.getStreamLinks(params, fetchUrl);
            const videoSources = await this.processLinks(links, subtitles);

            return {
                server: _server,
                headers: {
                    "Referer": "https://kodik.info/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                videoSources
            };
        } catch (e) {
            console.error("Kodik GetSources Error:", e);
            throw new Error(e instanceof Error ? e.message : "Unknown error");
        }
    }

    private async fetchPlayerPage(url: string): Promise<string> {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        if (!response.ok) throw new Error(`Failed to fetch player: ${response.status}`);
        return response.text();
    }

    private parseParameters(html: string): KodikParams {
        const extract = (key: string) => html.match(new RegExp(`var\\s+${key}\\s*=\\s*["']([^"']*)["']`))?.[1];
        const extractInfo = (key: string) => html.match(new RegExp(`videoInfo\\.${key}\\s*=\\s*["']([^"']*)["']`))?.[1];

        const params: Partial<KodikParams> = {
            domain: extract("domain"),
            d_sign: extract("d_sign"),
            pd: extract("pd"),
            pd_sign: extract("pd_sign"),
            ref: extract("ref"),
            ref_sign: extract("ref_sign"),
            type: extractInfo("type"),
            hash: extractInfo("hash"),
            id: extractInfo("id"),
        };

        if (!params.domain || !params.d_sign || !params.pd || !params.pd_sign || !params.type || !params.hash || !params.id) {
            throw new Error("Kodik protection parameters not found");
        }

        return params as KodikParams;
    }

    private extractSubtitles(html: string): VideoSubtitle[] {
        const subtitles: VideoSubtitle[] = [];
        const trackRegex = /<track[^>]+src=([^ >]+)[^>]*label="([^"]+)"[^>]*srclang="([^"]+)"[^>]*(default)?/gi;
        let trackMatch;
        while ((trackMatch = trackRegex.exec(html)) !== null) {
            const [, src, label, lang, isDefault] = trackMatch;
            subtitles.push({
                id: lang,
                url: src,
                language: label.replace(/_/g, " ").replace(/\[(.*?)]/g, "($1)").replace(/\s+/g, " ").trim(),
                isDefault: Boolean(isDefault),
            });
        }
        return subtitles;
    }

    private async getStreamLinks(params: KodikParams, referer: string): Promise<any> {
        const ftorUrl = `https://${params.pd}/ftor`;
        const postParams = new URLSearchParams();
        postParams.append("d", params.domain);
        postParams.append("d_sign", params.d_sign);
        postParams.append("pd", params.pd);
        postParams.append("pd_sign", params.pd_sign);
        postParams.append("ref", params.ref || "");
        postParams.append("ref_sign", params.ref_sign || "");
        postParams.append("bad_user", "true");
        postParams.append("cdn_is_working", "true");
        postParams.append("info", JSON.stringify({ advImps: {} }));
        postParams.append("type", params.type);
        postParams.append("hash", params.hash);
        postParams.append("id", params.id);

        const response = await fetch(ftorUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": referer,
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: postParams
        });

        const data = await response.json();
        if (!data.links) throw new Error("Kodik decoder returned no links");
        return data.links;
    }

    private decodeUrl(src: string): string {
        const rot13 = (str: string) => str.replace(/[a-zA-Z]/g, (char) => {
            const c = char.charCodeAt(0);
            const base = c <= 90 ? 90 : 122;
            return String.fromCharCode(c + 13 <= base ? c + 13 : c - 13);
        });
        const isUrl = (s: string) => s.startsWith("//") || s.startsWith("http");
        const normalize = (s: string) => s.startsWith("//") ? "https:" + s : s;

        if (isUrl(src)) return normalize(src);
        
        const r = rot13(src);
        if (isUrl(r)) return normalize(r);

        try {
            const b64 = atob(src);
            if (isUrl(b64)) return normalize(b64);
        } catch {}

        try {
            const rb64 = atob(r);
            if (isUrl(rb64)) return normalize(rb64);
        } catch {}

        try {
            const b64r = rot13(atob(src));
            if (isUrl(b64r)) return normalize(b64r);
        } catch {}

        return src;
    }

    private async processLinks(links: any, subtitles: VideoSubtitle[]): Promise<any[]> {
        const sources: any[] = [];
        
        // Find M3U8 first
        let m3u8Link: string | null = null;
        for (const key in links) {
            const arr = links[key];
            if (arr?.[0]?.src) {
                const decoded = this.decodeUrl(arr[0].src);
                if (decoded.includes(".m3u8")) {
                    m3u8Link = decoded;
                    break;
                }
            }
        }

        if (m3u8Link) {
            try {
                const m3u8Content = await fetch(m3u8Link, { headers: { "Referer": "https://kodik.info/" } }).then(r => r.text());
                const resolutionRegex = /#EXT-X-STREAM-INF:[^\n]*RESOLUTION=\d+x(\d+)/g;
                let match;
                while ((match = resolutionRegex.exec(m3u8Content)) !== null) {
                    sources.push({
                        url: m3u8Link,
                        quality: `${match[1]}p`,
                        type: "m3u8",
                        subtitles: subtitles.length ? subtitles : undefined
                    });
                }
            } catch {}
            
            if (sources.length === 0) {
                sources.push({ url: m3u8Link, quality: "auto", type: "m3u8", subtitles: subtitles.length ? subtitles : undefined });
            }
        } else {
            // Fallback to MP4
            for (const key in links) {
                const arr = links[key];
                if (arr?.[0]?.src) {
                    sources.push({
                        url: this.decodeUrl(arr[0].src),
                        quality: key + "p",
                        type: "mp4",
                        subtitles: subtitles.length ? subtitles : undefined
                    });
                }
            }
        }
        return sources;
    }
}
