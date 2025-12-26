"use strict";
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
// ----------------------------------------------------------------------
// КОНФИГУРАЦИЯ
// ----------------------------------------------------------------------
var KODIK_TOKEN = "8e329159687fc1a2f5af99a50bf57070"; // Публичный токен (Kodik/AnimeGo)
var BASE_URL = "https://kodikapi.com";
var KodikProvider = /** @class */ (function () {
    function KodikProvider() {
    }
    // 1. ПОИСК АНИМЕ
    // Seanime вызывает этот метод, когда пользователь ищет тайтл
    KodikProvider.prototype.search = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, results, _i, _a, item, displayTitle, e_1;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 3, , 4]);
                        url = "".concat(BASE_URL, "/search?token=").concat(KODIK_TOKEN, "&title=").concat(encodeURIComponent(query), "&types=anime,anime-serial&with_material_data=true&limit=20");
                        return [4 /*yield*/, fetch(url)];
                    case 1:
                        response = _e.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _e.sent();
                        if (!data.results || data.results.length === 0)
                            return [2 /*return*/, []];
                        results = [];
                        // Kodik возвращает каждую озвучку как отдельный результат. 
                        // Это хорошо для Seanime, пользователь выберет нужную озвучку сразу.
                        for (_i = 0, _a = data.results; _i < _a.length; _i++) {
                            item = _a[_i];
                            displayTitle = item.title;
                            if (item.translation && item.translation.title) {
                                displayTitle += " [".concat(item.translation.title, "]");
                            }
                            results.push({
                                id: item.id, // ID релиза в базе Kodik (например "serial-12345")
                                title: displayTitle,
                                url: item.link, // Ссылка на плеер
                                cover: ((_b = item.material_data) === null || _b === void 0 ? void 0 : _b.poster_url) || "",
                                year: item.year,
                                dubbed: ((_c = item.translation) === null || _c === void 0 ? void 0 : _c.type) === "voice",
                                subbed: ((_d = item.translation) === null || _d === void 0 ? void 0 : _d.type) === "subtitles",
                                // Сохраняем важные данные для следующего шага
                                metadata: {
                                    shikimori_id: item.shikimori_id,
                                    link: item.link
                                }
                            });
                        }
                        return [2 /*return*/, results];
                    case 3:
                        e_1 = _e.sent();
                        console.error("Kodik Search Error:", e_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 2. ПОЛУЧЕНИЕ СПИСКА ЭПИЗОДОВ
    // Вызывается при клике на результат поиска
    KodikProvider.prototype.getEpisodes = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, item, episodes, seasonNum, season, episodeNum, epLink, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = "".concat(BASE_URL, "/search?token=").concat(KODIK_TOKEN, "&id=").concat(id, "&with_episodes=true");
                        return [4 /*yield*/, fetch(url)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (!data.results || data.results.length === 0)
                            return [2 /*return*/, []];
                        item = data.results[0];
                        episodes = [];
                        // Если это сериал
                        if (item.seasons) {
                            // Kodik возвращает структуру { "1": { "1": "link", "2": "link" } } (сезон -> серия -> ссылка)
                            for (seasonNum in item.seasons) {
                                season = item.seasons[seasonNum];
                                for (episodeNum in season.episodes) {
                                    epLink = season.episodes[episodeNum];
                                    episodes.push({
                                        id: epLink, // Используем ссылку как ID эпизода, это упростит extract
                                        number: parseInt(episodeNum),
                                        title: "\u0421\u0435\u0440\u0438\u044F ".concat(episodeNum),
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
                        return [2 /*return*/, episodes.sort(function (a, b) { return a.number - b.number; })];
                    case 3:
                        e_2 = _a.sent();
                        console.error("Kodik Episodes Error:", e_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 3. ИЗВЛЕЧЕНИЕ ПРЯМОЙ ССЫЛКИ НА ВИДЕО
    // Самая сложная часть. Вызывается при нажатии "Play"
    KodikProvider.prototype.getSources = function (episodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var playerUrl, fetchUrl, response, html, domain, d_sign, pd, ref, type, hash, id, gviUrl, postParams, gviResponse, gviData, sources, processLink, qualityKey, linksArray, src, qualityKey, linksArray, e_3;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        _h.trys.push([0, 5, , 6]);
                        playerUrl = episodeId;
                        fetchUrl = playerUrl.startsWith("//") ? "https:" + playerUrl : playerUrl;
                        return [4 /*yield*/, fetch(fetchUrl)];
                    case 1:
                        response = _h.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        html = _h.sent();
                        domain = (_a = html.match(/var domain = "(.*?)";/)) === null || _a === void 0 ? void 0 : _a[1];
                        d_sign = (_b = html.match(/var d_sign = "(.*?)";/)) === null || _b === void 0 ? void 0 : _b[1];
                        pd = (_c = html.match(/var pd = "(.*?)";/)) === null || _c === void 0 ? void 0 : _c[1];
                        ref = (_d = html.match(/var ref = "(.*?)";/)) === null || _d === void 0 ? void 0 : _d[1];
                        type = (_e = html.match(/videoInfo\.type = '(.*?)';/)) === null || _e === void 0 ? void 0 : _e[1];
                        hash = (_f = html.match(/videoInfo\.hash = '(.*?)';/)) === null || _f === void 0 ? void 0 : _f[1];
                        id = (_g = html.match(/videoInfo\.id = '(.*?)';/)) === null || _g === void 0 ? void 0 : _g[1];
                        if (!domain || !d_sign || !pd || !ref || !type || !hash || !id) {
                            throw new Error("Не удалось найти параметры защиты Kodik (d_sign и др.)");
                        }
                        gviUrl = "https://".concat(domain, "/gvi");
                        postParams = new URLSearchParams();
                        postParams.append("d", domain);
                        postParams.append("d_sign", d_sign);
                        postParams.append("pd", pd);
                        postParams.append("ref", ref);
                        postParams.append("type", type);
                        postParams.append("hash", hash);
                        postParams.append("id", id);
                        // bad_user=true часто помогает избежать некоторых проверок
                        postParams.append("bad_user", "true");
                        return [4 /*yield*/, fetch(gviUrl, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    "Referer": fetchUrl, // Обязательный заголовок!
                                    "X-Requested-With": "XMLHttpRequest",
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                },
                                body: postParams
                            })];
                    case 3:
                        gviResponse = _h.sent();
                        return [4 /*yield*/, gviResponse.json()];
                    case 4:
                        gviData = _h.sent();
                        if (!gviData.links)
                            throw new Error("Декодер Kodik не вернул ссылки");
                        sources = [];
                        processLink = function (src) {
                            if (src.startsWith("//"))
                                return "https:" + src;
                            // Добавьте логику декодирования здесь, если Kodik включит шифрование (rot13)
                            // Пример: return src.replace(/[a-zA-Z]/g, (c) => String.fromCharCode((c <= 'Z'? 90 : 122) >= (c = c.charCodeAt(0) + 13)? c : c - 26));
                            return src;
                        };
                        // Перебираем качества
                        for (qualityKey in gviData.links) {
                            linksArray = gviData.links[qualityKey];
                            if (linksArray && linksArray.length > 0) {
                                src = processLink(linksArray[0].src);
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
                        if (sources.length > 0)
                            return [2 /*return*/, sources];
                        // Если m3u8 нет, собираем MP4 (резервный вариант)
                        for (qualityKey in gviData.links) {
                            linksArray = gviData.links[qualityKey];
                            if (linksArray && linksArray.length > 0) {
                                sources.push({
                                    url: processLink(linksArray[0].src),
                                    quality: qualityKey + "p",
                                    format: "mp4",
                                    headers: { "Referer": "https://kodik.info/" }
                                });
                            }
                        }
                        return [2 /*return*/, sources];
                    case 5:
                        e_3 = _h.sent();
                        console.error("Kodik GetSources Error:", e_3);
                        return [2 /*return*/, []];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return KodikProvider;
}());
exports.default = KodikProvider;
