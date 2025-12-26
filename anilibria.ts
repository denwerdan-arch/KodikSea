// anilibria.ts

export interface SearchResult {
    id: string;           // Уникальный ID
    title: string;        // Название
    cover: string;        // Ссылка на обложку
    url: string;          // Ссылка на страницу (опционально)
    year?: number;
    rating?: number;
}

export interface Episode {
    id: string;           // ID эпизода
    number: number;       // Номер серии
    title: string;        // Название (например, "Эпизод 1")
    image?: string;       // Превью
    description?: string;
}

export interface VideoSource {
    url: string;          // Прямая ссылка (mp4/m3u8)
    quality: string;      // "1080p", "720p", "auto"
    format: "mp4" | "m3u8"; // Формат
    headers?: Record<string, string>; // Заголовки (User-Agent, Referer)
}

// Интерфейс самого провайдера
export interface SeanimeProvider {
    search(query: string): Promise<SearchResult[]>;
    getEpisodes(id: string): Promise<Episode[]>;
    getSources(episodeId: string): Promise<VideoSource[]>;
}

const BASE_URL = "https://api.anilibria.tv/v3";
const CONTENT_URL = "https://cache.libria.fun"; // Хост для статики (обложки)

export default class AnilibriaProvider implements SeanimeProvider {

    // 1. ПОИСК
    async search(query: string): Promise<SearchResult[]> {
        try {
            // Кодируем запрос, чтобы корректно передать кириллицу
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`${BASE_URL}/title/search?search=${encodedQuery}&limit=20`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            
            const data = await response.json();
            
            // Маппинг ответа API в формат Seanime
            // data.list содержит массив найденных тайтлов
            return data.list.map((item: any) => ({
                id: item.id.toString(),
                title: item.names.ru, // Предпочитаем русское название
                cover: `${CONTENT_URL}${item.posters.medium.url}`,
                year: item.season.year,
                url: `https://anilibria.tv/release/${item.code}.html`
            }));
        } catch (error) {
            console.error("Anilibria search error:", error);
            return [];
        }
    }

    // 2. ПОЛУЧЕНИЕ ЭПИЗОДОВ
    async getEpisodes(id: string): Promise<Episode[]> {
        try {
            const response = await fetch(`${BASE_URL}/title?id=${id}`);
            const data = await response.json();
            
            const episodes: Episode[] = [];
            const playerList = data.player.list; // Объект, где ключи - номера серий

            // Проходим по всем доступным сериям
            for (const key in playerList) {
                const epData = playerList[key];
                episodes.push({
                    id: `${id}:${epData.episode}`, // Создаем составной ID "titleID:episodeNum"
                    number: parseInt(epData.episode),
                    title: `Серия ${epData.episode}`,
                    // Anilibria предоставляет превью для эпизодов? Обычно нет, используем постер
                    image: `${CONTENT_URL}${data.posters.small.url}` 
                });
            }
            
            // Сортируем по номеру серии
            return episodes.sort((a, b) => a.number - b.number);
        } catch (error) {
            console.error("Anilibria getEpisodes error:", error);
            return [];
        }
    }

    // 3. ПОЛУЧЕНИЕ ССЫЛОК НА ВИДЕО
    async getSources(episodeId: string): Promise<VideoSource[]> {
        try {
            // Разбираем наш составной ID
            const [titleId, episodeNum] = episodeId.split(":");
            
            const response = await fetch(`${BASE_URL}/title?id=${titleId}`);
            const data = await response.json();
            
            const episodeData = data.player.list[episodeNum];
            if (!episodeData ||!episodeData.hls) {
                throw new Error("Episode not found or no HLS sources");
            }

            const host = data.player.host || CONTENT_URL;
            const hls = episodeData.hls; // Объект вида { fhd: "...", hd: "...", sd: "..." }

            const sources: VideoSource[] = [];

            // Формируем ссылки для разных качеств
            if (hls.fhd) {
                sources.push({
                    url: `https://${host}${hls.fhd}`,
                    quality: "1080p",
                    format: "m3u8"
                });
            }
            if (hls.hd) {
                sources.push({
                    url: `https://${host}${hls.hd}`,
                    quality: "720p",
                    format: "m3u8"
                });
            }
            if (hls.sd) {
                sources.push({
                    url: `https://${host}${hls.sd}`,
                    quality: "480p",
                    format: "m3u8"
                });
            }

            return sources;
        } catch (error) {
            console.error("Anilibria getSources error:", error);
            return [];
        }
    }
}
