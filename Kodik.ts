// Определяем интерфейсы Seanime (они не импортируются, а декларируются в среде)
interface SearchResult {
    id: string;
    title: string;
    url: string;
    cover?: string;
    year?: number;
    subbed?: boolean;
    dubbed?: boolean;
    metadata?: any;
}

interface Episode {
    id: string;
    number: number;
    title: string;
    url: string;
    image?: string;
}

interface VideoSource {
    url: string;
    quality: string; // "1080p", "720p", "auto"
    format: "mp4" | "m3u8";
    headers?: Record<string, string>;
}

// ----------------------------------------------------------------------
// КОНФИГУРАЦИЯ
// ----------------------------------------------------------------------
const KODIK_TOKEN = "8e329159687fc1a2f5af99a50bf57070"; // Публичный токен (Kodik/AnimeGo)
const BASE_URL = "https://kodikapi.com";

export default class KodikProvider {

    // 1. ПОИСК АНИМЕ
    // Seanime вызывает этот метод, когда пользователь ищет тайтл
    async search(query: string): Promise<SearchResult[]> {
        try {
            // Kodik ищет лучше, если искать по "title" или "original_title"
            // Используем эндпоинт /search
            const url = `${BASE_URL}/search?token=${KODIK_TOKEN}&title=${encodeURIComponent(query)}&types=anime,anime-serial&with_material_data=true&limit=20`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (!data.results || data.results.length === 0) return [];

            const results: SearchResult[] = [];
            
            // Kodik возвращает каждую озвучку как отдельный результат. 
            // Это хорошо для Seanime, пользователь выберет нужную озвучку сразу.
            for (const item of data.results) {
                // Формируем красивое название: "Наруто [Anilibria]"
                let displayTitle = item.title;
                if (item.translation && item.translation.title) {
                    displayTitle += ` [${item.translation.title}]`;
                }

                results.push({
                    id: item.id, // ID релиза в базе Kodik (например "serial-12345")
                    title: displayTitle,
                    url: item.link, // Ссылка на плеер
                    cover: item.material_data?.poster_url || "",
                    year: item.year,
                    dubbed: item.translation?.type === "voice",
                    subbed: item.translation?.type === "subtitles",
                    // Сохраняем важные данные для следующего шага
                    metadata: {
                        shikimori_id: item.shikimori_id,
                        link: item.link
                    }
                });
            }

            return results;

        } catch (e) {
            console.error("Kodik Search Error:", e);
            return [];
        }
    }

    // 2. ПОЛУЧЕНИЕ СПИСКА ЭПИЗОДОВ
    // Вызывается при клике на результат поиска
    async getEpisodes(id: string): Promise<Episode[]> {
        try {
            // Для Kodik нам не нужно делать новый запрос к API, если мы сохранили ссылку в search.
            // Но Seanime передает только ID. Поэтому делаем запрос к /search по ID.
            
            // Если ID начинается с "serial-" или "movie-", ищем конкретный релиз
            const url = `${BASE_URL}/search?token=${KODIK_TOKEN}&id=${id}&with_episodes=true`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) return [];
            
            const item = data.results[0]; // Kodik возвращает массив, берем первый элемент
            const episodes: Episode[] = [];

            // Если это сериал
            if (item.seasons) {
                // Kodik возвращает структуру { "1": { "1": "link", "2": "link" } } (сезон -> серия -> ссылка)
                for (const seasonNum in item.seasons) {
                    const season = item.seasons[seasonNum];
                    for (const episodeNum in season.episodes) {
                        const epLink = season.episodes[episodeNum]; // Это ссылка на плеер для конкретной серии!
                        
                        episodes.push({
                            id: epLink, // Используем ссылку как ID эпизода, это упростит extract
                            number: parseInt(episodeNum),
                            title: `Серия ${episodeNum}`,
                            url: epLink
                        });
                    }
                }
            } 
            // Если это фильм
            else {
                episodes.push({
                    id: item.link,
                    number: 1,
                    title: "Фильм",
                    url: item.link
                });
            }

            // Сортируем серии по возрастанию
            return episodes.sort((a, b) => a.number - b.number);

        } catch (e) {
            console.error("Kodik Episodes Error:", e);
            return [];
        }
    }

    // 3. ИЗВЛЕЧЕНИЕ ПРЯМОЙ ССЫЛКИ НА ВИДЕО
    // Самая сложная часть. Вызывается при нажатии "Play"
    async getSources(episodeId: string): Promise<VideoSource[]> {
        try {
            const playerUrl = episodeId; // В getEpisodes мы сохранили ссылку как ID
            
            // ШАГ 1: Загружаем HTML страницы плеера
            // Важно: если ссылка начинается с //, добавляем https:
            const fetchUrl = playerUrl.startsWith("//")? "https:" + playerUrl : playerUrl;
            
            const response = await fetch(fetchUrl);
            const html = await response.text();

            // ШАГ 2: Парсим параметры для декодера (d_sign, pd, ref и т.д.)
            // Kodik прячет их в глобальных переменных JS
            const domain = html.match(/var domain = "(.*?)";/)?.[1];
            const d_sign = html.match(/var d_sign = "(.*?)";/)?.[1];
            const pd = html.match(/var pd = "(.*?)";/)?.[1];
            const ref = html.match(/var ref = "(.*?)";/)?.[1];
            const type = html.match(/videoInfo\.type = '(.*?)';/)?.[1]; 
            const hash = html.match(/videoInfo\.hash = '(.*?)';/)?.[1];
            const id = html.match(/videoInfo\.id = '(.*?)';/)?.[1];

            if (!domain ||!d_sign ||!pd ||!ref ||!type ||!hash ||!id) {
                throw new Error("Не удалось найти параметры защиты Kodik (d_sign и др.)");
            }

            // ШАГ 3: Запрашиваем прямую ссылку у декодера (/gvi)
            // Это "рукопожатие", которое превращает параметры в ссылку на m3u8
            const gviUrl = `https://${domain}/gvi`;
            
            const postParams = new URLSearchParams();
            postParams.append("d", domain);
            postParams.append("d_sign", d_sign);
            postParams.append("pd", pd);
            postParams.append("ref", ref);
            postParams.append("type", type);
            postParams.append("hash", hash);
            postParams.append("id", id);
            // bad_user=true часто помогает избежать некоторых проверок
            postParams.append("bad_user", "true"); 

            const gviResponse = await fetch(gviUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": fetchUrl, // Обязательный заголовок!
                    "X-Requested-With": "XMLHttpRequest",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                body: postParams
            });

            const gviData = await gviResponse.json();
            
            if (!gviData.links) throw new Error("Декодер Kodik не вернул ссылки");

            // ШАГ 4: Формируем ответ для Seanime
            // Kodik обычно отдает ссылки в формате: links["360" | "480" | "720"].0.src
            const sources: VideoSource[] = [];

            // Функция-хелпер для декодирования ссылки (иногда Kodik использует rot13 или base64)
            // В 2024/2025 они часто отдают просто ссылку, но если она выглядит странно, нужно декодировать.
            // Сейчас gvi обычно возвращает прямую ссылку, если передан правильный d_sign.
            const processLink = (src: string) => {
                if (src.startsWith("//")) return "https:" + src;
                // Добавьте логику декодирования здесь, если Kodik включит шифрование (rot13)
                // Пример: return src.replace(/[a-zA-Z]/g, (c) => String.fromCharCode((c <= 'Z'? 90 : 122) >= (c = c.charCodeAt(0) + 13)? c : c - 26));
                return src;
            };

            // Перебираем качества
            for (const qualityKey in gviData.links) {
                const linksArray = gviData.links[qualityKey];
                if (linksArray && linksArray.length > 0) {
                    const src = processLink(linksArray[0].src);
                    
                    // Пропускаем mp4, ищем m3u8 так как он адаптивный
                    if (src.includes(".m3u8")) {
                         sources.push({
                            url: src,
                            quality: "auto", // M3U8 сам переключает качество
                            format: "m3u8",
                            headers: {
                                "Referer": "https://kodik.info/", // Критически важно для проигрывания!
                                "Origin": "https://kodik.info"
                            }
                        });
                        // Нашли m3u8 - выходим, этого достаточно для плеера
                        break; 
                    }
                }
            }
            
            // Если нашли m3u8, возвращаем его
            if (sources.length > 0) return sources;

            // Если m3u8 нет, собираем MP4 (резервный вариант)
             for (const qualityKey in gviData.links) {
                const linksArray = gviData.links[qualityKey];
                if (linksArray && linksArray.length > 0) {
                    sources.push({
                        url: processLink(linksArray[0].src),
                        quality: qualityKey + "p",
                        format: "mp4",
                        headers: { "Referer": "https://kodik.info/" }
                    });
                }
             }

            return sources;

        } catch (e) {
            console.error("Kodik GetSources Error:", e);
            return [];
        }
    }
}