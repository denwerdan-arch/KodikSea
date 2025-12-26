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
var BASE_URL = "https://api.anilibria.tv/v3";
var CONTENT_URL = "https://cache.libria.fun"; // Хост для статики (обложки)
var AnilibriaProvider = /** @class */ (function () {
    function AnilibriaProvider() {
    }
    // 1. ПОИСК
    AnilibriaProvider.prototype.search = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var encodedQuery, response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        encodedQuery = encodeURIComponent(query);
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/title/search?search=").concat(encodedQuery, "&limit=20"))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error("Network response was not ok");
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        // Маппинг ответа API в формат Seanime
                        // data.list содержит массив найденных тайтлов
                        return [2 /*return*/, data.list.map(function (item) { return ({
                                id: item.id.toString(),
                                title: item.names.ru, // Предпочитаем русское название
                                cover: "".concat(CONTENT_URL).concat(item.posters.medium.url),
                                year: item.season.year,
                                url: "https://anilibria.tv/release/".concat(item.code, ".html")
                            }); })];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Anilibria search error:", error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 2. ПОЛУЧЕНИЕ ЭПИЗОДОВ
    AnilibriaProvider.prototype.getEpisodes = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, episodes, playerList, key, epData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/title?id=").concat(id))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        episodes = [];
                        playerList = data.player.list;
                        // Проходим по всем доступным сериям
                        for (key in playerList) {
                            epData = playerList[key];
                            episodes.push({
                                id: "".concat(id, ":").concat(epData.episode), // Создаем составной ID "titleID:episodeNum"
                                number: parseInt(epData.episode),
                                title: "\u0421\u0435\u0440\u0438\u044F ".concat(epData.episode),
                                // Anilibria предоставляет превью для эпизодов? Обычно нет, используем постер
                                image: "".concat(CONTENT_URL).concat(data.posters.small.url)
                            });
                        }
                        // Сортируем по номеру серии
                        return [2 /*return*/, episodes.sort(function (a, b) { return a.number - b.number; })];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Anilibria getEpisodes error:", error_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 3. ПОЛУЧЕНИЕ ССЫЛОК НА ВИДЕО
    AnilibriaProvider.prototype.getSources = function (episodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, titleId, episodeNum, response, data, episodeData, host, hls, sources, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        _a = episodeId.split(":"), titleId = _a[0], episodeNum = _a[1];
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/title?id=").concat(titleId))];
                    case 1:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        episodeData = data.player.list[episodeNum];
                        if (!episodeData || !episodeData.hls) {
                            throw new Error("Episode not found or no HLS sources");
                        }
                        host = data.player.host || CONTENT_URL;
                        hls = episodeData.hls;
                        sources = [];
                        // Формируем ссылки для разных качеств
                        if (hls.fhd) {
                            sources.push({
                                url: "https://".concat(host).concat(hls.fhd),
                                quality: "1080p",
                                format: "m3u8"
                            });
                        }
                        if (hls.hd) {
                            sources.push({
                                url: "https://".concat(host).concat(hls.hd),
                                quality: "720p",
                                format: "m3u8"
                            });
                        }
                        if (hls.sd) {
                            sources.push({
                                url: "https://".concat(host).concat(hls.sd),
                                quality: "480p",
                                format: "m3u8"
                            });
                        }
                        return [2 /*return*/, sources];
                    case 3:
                        error_3 = _b.sent();
                        console.error("Anilibria getSources error:", error_3);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AnilibriaProvider;
}());
exports.default = AnilibriaProvider;
