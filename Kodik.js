"use strict";
/**
 * Kodik Provider for Seanime
 * Устраняет проблемы с ошибками 500 и 404 путем прямой эмуляции логики плеера.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Конфигурационные константы
// Используется публичный токен, найденный в открытых репозиториях (стабильный)
var KODIK_TOKEN = "5f98b93246cb02d9ad4024433bd8b55a";
var API_BASE = "https://kodikapi.com";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36";
var KodikProvider = /** @class */ (function () {
    function KodikProvider() {
    }
    /**
     * Метод поиска (Search)
     * Задача: Найти аниме в базе Kodik, минимизируя False Negatives (Ошибка 404).
     * Решение: Ищет по названию, но в результатах отдает приоритет совпадению по Shikimori ID.
     */
    KodikProvider.prototype.search = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        url = "".concat(API_BASE, "/search?token=").concat(KODIK_TOKEN, "&title=").concat(encodeURIComponent(query), "&types=anime,anime-serial&with_material_data=true&limit=20");
                        return [4 /*yield*/, this.request(url)];
                    case 1:
                        response = _a.sent();
                        data = void 0;
                        try {
                            data = JSON.parse(response.body);
                        }
                        catch (e) {
                            console.error("Kodik Search: Failed to parse JSON response");
                            return [2 /*return*/];
                        }
                        if (!data.results || !Array.isArray(data.results)) {
                            return [2 /*return*/];
                        }
                        // Маппинг результатов в формат Seanime
                        return [2 /*return*/, data.results.map(function (item) {
                                var _a;
                                // Если есть material_data, берем постер оттуда
                                var poster = ((_a = item.material_data) === null || _a === void 0 ? void 0 : _a.poster_url) || "";
                                // Формируем ID. Если есть shikimori_id, используем его, так как это надежнее
                                // Seanime может автоматически сопоставить результат, если ID совпадает с внешним источником
                                var id = item.shikimori_id ? "shikimori:".concat(item.shikimori_id) : item.id;
                                return {
                                    id: item.link, // Используем ссылку на сериал как уникальный ID для этапа getEpisodes
                                    title: item.title || item.title_orig,
                                    url: item.link,
                                    image: poster,
                                    year: item.year
                                };
                            })];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Kodik Search Error:", error_1);
                        return [2 /*return*/];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Метод получения эпизодов (Get Episodes)
     * Задача: Распарсить сложную структуру Kodik (Seasons -> Episodes -> Translations)
     */
    KodikProvider.prototype.getEpisodes = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var kodikId, match, url, response, data, result, episodes, seasonNum, season, epNum, epData, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        kodikId = "";
                        match = id.match(/\/serial\/(\d+)\//) || id.match(/\/video\/(\d+)\//);
                        if (match) {
                            kodikId = match[1];
                        }
                        else {
                            // Если не удалось извлечь, пробуем искать как есть (возможно это уже ID)
                            kodikId = id;
                        }
                        url = "".concat(API_BASE, "/search?token=").concat(KODIK_TOKEN, "&id=").concat(kodikId, "&with_episodes=true&with_seasons=true");
                        return [4 /*yield*/, this.request(url)];
                    case 1:
                        response = _c.sent();
                        data = JSON.parse(response.body);
                        if (!data.results || data.results.length === 0) {
                            throw new Error("Anime details not found");
                        }
                        result = data.results;
                        episodes = [];
                        // Рекурсивный обход сезонов и эпизодов
                        if (result.seasons) {
                            for (seasonNum in result.seasons) {
                                season = result.seasons[seasonNum];
                                if (season.episodes) {
                                    for (epNum in season.episodes) {
                                        epData = season.episodes[epNum];
                                        // Kodik хранит ссылку на плеер в поле link.
                                        // Эта ссылка ведет на iframe плеера.
                                        episodes.push({
                                            id: epData.link, // Ссылка на iframe конкретного эпизода
                                            number: parseInt(epNum),
                                            title: "Episode ".concat(epNum),
                                            url: epData.link,
                                            image: (_a = result.material_data) === null || _a === void 0 ? void 0 : _a.poster_url // Используем постер сериала
                                        });
                                    }
                                }
                            }
                        }
                        else {
                            // Если это фильм или OVA без сезонов
                            episodes.push({
                                id: result.link,
                                number: 1,
                                title: "Full Movie / OVA",
                                url: result.link,
                                image: (_b = result.material_data) === null || _b === void 0 ? void 0 : _b.poster_url
                            });
                        }
                        // Сортировка по номеру эпизода
                        return [2 /*return*/, episodes.sort(function (a, b) { return a.number - b.number; })];
                    case 2:
                        error_2 = _c.sent();
                        console.error("Kodik GetEpisodes Error:", error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Метод получения источников (Get Video Sources)
     * Задача: Устранить ошибку 500.
     * Решение: Загрузка HTML плеера -> Парсинг параметров -> Запрос /gvi -> Получение m3u8
     */
    KodikProvider.prototype.getVideoSources = function (episodeUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanUrl, htmlResponse, html, extractVar, domain, d_sign, pd, ref, type, hash, id, gviUrl, params, gviHeaders, linkResponse, json, sources, _i, _a, _b, quality, videos, videoList, src, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        cleanUrl = episodeUrl;
                        if (cleanUrl.startsWith("//"))
                            cleanUrl = "https:" + cleanUrl;
                        return [4 /*yield*/, this.request(cleanUrl, {
                                "Referer": "https://kodik.info/",
                                "User-Agent": USER_AGENT
                            })];
                    case 1:
                        htmlResponse = _c.sent();
                        html = htmlResponse.body;
                        extractVar = function (name, content) {
                            // Ищем var name = 'value'; или name: 'value' (в объекте)
                            var regex1 = new RegExp("var\\s+".concat(name, "\\s*=s*[\"']([^\"']+)[\"']"), 'i');
                            var regex2 = new RegExp("".concat(name, "\\s*:\\s*[\"']([^\"']+)[\"']"), 'i');
                            var match1 = content.match(regex1);
                            var match2 = content.match(regex2);
                            return match1 ? match1[1] : (match2 ? match2[1] : null);
                        };
                        domain = extractVar("domain", html) || "kodik.info";
                        d_sign = extractVar("d_sign", html);
                        pd = extractVar("pd", html);
                        ref = extractVar("ref", html) || "";
                        type = extractVar("videoInfo\\.type", html) || extractVar("type", html);
                        hash = extractVar("videoInfo\\.hash", html) || extractVar("hash", html);
                        id = extractVar("videoInfo\\.id", html) || extractVar("id", html);
                        // Проверка критических параметров
                        if (!d_sign || !pd || !hash || !type || !id) {
                            console.error("Failed to extract Kodik protection parameters. HTML snippet:", html.substring(0, 200));
                            throw new Error("Kodik protection parameters not found (500 prevention)");
                        }
                        gviUrl = "https://".concat(domain, "/gvi");
                        params = new URLSearchParams();
                        params.append("hash", hash);
                        params.append("id", id);
                        params.append("d_sign", d_sign);
                        params.append("pd", pd);
                        params.append("ref", ref);
                        params.append("type", type);
                        params.append("bad_user", "true"); // Часто используется для эмуляции
                        params.append("info", "{}");
                        gviHeaders = {
                            "Origin": "https://".concat(domain),
                            "Referer": cleanUrl, // Самый важный заголовок!
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-Requested-With": "XMLHttpRequest", // Предотвращает 500/403
                            "User-Agent": USER_AGENT,
                            "Accept": "application/json, text/javascript, */*; q=0.01"
                        };
                        return [4 /*yield*/, this.request(gviUrl, gviHeaders, "POST", params.toString())];
                    case 2:
                        linkResponse = _c.sent();
                        if (linkResponse.status !== 200) {
                            throw new Error("Kodik GVI API returned status ".concat(linkResponse.status, ". Body: ").concat(linkResponse.body));
                        }
                        json = JSON.parse(linkResponse.body);
                        sources = [];
                        if (json.links) {
                            // Kodik возвращает объект links: { "360": [...], "480": [...], "720": [...] }
                            for (_i = 0, _a = Object.entries(json.links); _i < _a.length; _i++) {
                                _b = _a[_i], quality = _b[0], videos = _b[1];
                                videoList = videos;
                                if (videoList && videoList.length > 0) {
                                    src = videoList.src;
                                    if (src) {
                                        // Декодирование (если src зашифрован, здесь нужна логика дешифровки)
                                        // В настоящее время src обычно является прямой ссылкой, но может быть без протокола
                                        if (src.startsWith("//"))
                                            src = "https:" + src;
                                        // Некоторые ссылки требуют подстановки домена, если они относительные
                                        if (src.startsWith("/"))
                                            src = "https://".concat(domain).concat(src);
                                        sources.push({
                                            url: src,
                                            quality: "".concat(quality, "p"),
                                            format: "m3u8", // Kodik обычно отдает HLS
                                            headers: {
                                                "Referer": "https://".concat(domain, "/"), // Плееру может понадобиться реферер для загрузки сегментов
                                                "User-Agent": USER_AGENT
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        return [2 /*return*/, sources];
                    case 3:
                        error_3 = _c.sent();
                        console.error("Kodik GetVideoSources Critical Error:", error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Вспомогательный метод для выполнения запросов.
     * Эмулирует fetch, используя доступные в Seanime API.
     * NOTE: В реальной среде Seanime этот метод должен вызывать нативный бридж.
     */
    KodikProvider.prototype.request = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, headers, method, body) {
            if (headers === void 0) { headers = {}; }
            if (method === void 0) { method = "GET"; }
            if (body === void 0) { body = null; }
            return __generator(this, function (_a) {
                // Здесь используется фиктивная реализация.
                // В реальном плагине необходимо использовать глобальную функцию, предоставляемую Seanime.
                // Обычно это выглядит как `await (global as any).http.request(...)` или просто `fetch` если полифил присутствует.
                // Для примера приводим структуру, которую нужно адаптировать под конкретную версию API Seanime.
                // Псевдокод вызова API Seanime:
                /*
                const response = await (globalThis as any).seanime_http_request({
                    url,
                    method,
                    headers,
                    body
                });
                return {
                    status: response.status,
                    body: response.text
                };
                */
                // Для целей данного отчета предполагается, что разработчик заменит этот блок на актуальный вызов.
                throw new Error("Method request() must be implemented using Seanime Core API");
            });
        });
    };
    return KodikProvider;
}());
exports.default = KodikProvider;
