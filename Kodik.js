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
/// <reference path="./online-streaming-provider.d.ts" />
var Provider = /** @class */ (function () {
    function Provider() {
        this.ANIMEGO_BASE = "https://animego.me";
        this.PLAYER_API = "https://plapi.cdnvideohub.com/api/v1/player/sv";
        this.USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";
    }
    Provider.prototype.getSettings = function () {
        return {
            episodeServers: ["AnimeGo"],
            supportsDub: true,
        };
    };
    Provider.prototype.search = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = "".concat(this.ANIMEGO_BASE, "/api/v2/quick_search?q=").concat(encodeURIComponent(opts.query));
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    "X-Requested-With": "XMLHttpRequest",
                                    "Referer": this.ANIMEGO_BASE + "/",
                                    "User-Agent": this.USER_AGENT
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (!data || !data.data)
                            return [2 /*return*/, []];
                        return [2 /*return*/, data.data.map(function (item) {
                                var _a;
                                return {
                                    id: String(item.id),
                                    title: "".concat(item.title, " / ").concat(item.original_title, " (").concat(item.year, ")"),
                                    url: item.link,
                                    subOrDub: ((_a = item.translation) === null || _a === void 0 ? void 0 : _a.type) === "voice" ? "dub" : "sub",
                                };
                            })];
                    case 3:
                        e_1 = _a.sent();
                        console.error("AnimeGo Search Error:", e_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Provider.prototype.findEpisodes = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, episodes_1, parsePlaylist_1, e_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = "".concat(this.PLAYER_API, "/playlist?pub=747&aggr=mali&id=").concat(id);
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    "Accept": "application/json, text/plain, */*",
                                    "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
                                    "Origin": this.ANIMEGO_BASE,
                                    "Referer": this.ANIMEGO_BASE + "/",
                                    "User-Agent": this.USER_AGENT
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        episodes_1 = [];
                        parsePlaylist_1 = function (obj, seasonPrefix) {
                            if (seasonPrefix === void 0) { seasonPrefix = ""; }
                            if (Array.isArray(obj)) {
                                obj.forEach(function (item, index) {
                                    if (typeof item === 'object' && item.id) {
                                        episodes_1.push({
                                            id: String(item.id), // This is the unitedVideoId
                                            number: item.episode ? parseInt(item.episode) : index + 1,
                                            title: item.title || "".concat(seasonPrefix, "Episode ").concat(index + 1),
                                            url: "".concat(_this.PLAYER_API, "/video/").concat(item.id)
                                        });
                                    }
                                });
                            }
                            else if (typeof obj === 'object') {
                                for (var key in obj) {
                                    var val = obj[key];
                                    // Check if key is a season number (digits)
                                    if (/^\d+$/.test(key)) {
                                        // If value is string/number, it's likely an episode ID in a flat list or season list
                                        if (typeof val === 'string' || typeof val === 'number') {
                                            episodes_1.push({
                                                id: String(val),
                                                number: parseInt(key),
                                                title: "".concat(seasonPrefix, "Episode ").concat(key),
                                                url: "".concat(_this.PLAYER_API, "/video/").concat(val)
                                            });
                                        }
                                        else {
                                            // Recursive for seasons
                                            parsePlaylist_1(val, "Season ".concat(key, " "));
                                        }
                                    }
                                }
                            }
                        };
                        parsePlaylist_1(data);
                        return [2 /*return*/, episodes_1];
                    case 3:
                        e_2 = _a.sent();
                        console.error("AnimeGo Episodes Error:", e_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Provider.prototype.findEpisodeServer = function (episode, _server) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, videoSources, s, qualityMap, _i, _a, _b, key, quality, e_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        url = "".concat(this.PLAYER_API, "/video/").concat(episode.id);
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    "Accept": "application/json, text/plain, */*",
                                    "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
                                    "Origin": this.ANIMEGO_BASE,
                                    "Referer": this.ANIMEGO_BASE + "/",
                                    "User-Agent": this.USER_AGENT
                                }
                            })];
                    case 1:
                        response = _c.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _c.sent();
                        videoSources = [];
                        if (data && data.sources) {
                            s = data.sources;
                            // HLS
                            if (s.hlsUrl) {
                                videoSources.push({
                                    url: s.hlsUrl,
                                    quality: "auto",
                                    type: "m3u8"
                                });
                            }
                            qualityMap = {
                                "mpegFullHdUrl": "1080p",
                                "mpegHighUrl": "720p",
                                "mpegMediumUrl": "480p",
                                "mpegLowUrl": "360p",
                                "mpegLowestUrl": "240p"
                            };
                            for (_i = 0, _a = Object.entries(qualityMap); _i < _a.length; _i++) {
                                _b = _a[_i], key = _b[0], quality = _b[1];
                                if (s[key]) {
                                    videoSources.push({
                                        url: s[key],
                                        quality: quality,
                                        type: "mp4"
                                    });
                                }
                            }
                        }
                        return [2 /*return*/, {
                                server: _server,
                                headers: {
                                    "Referer": this.ANIMEGO_BASE + "/",
                                    "User-Agent": this.USER_AGENT
                                },
                                videoSources: videoSources
                            }];
                    case 3:
                        e_3 = _c.sent();
                        console.error("AnimeGo GetSources Error:", e_3);
                        throw new Error(e_3 instanceof Error ? e_3.message : "Unknown error");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Provider;
}());
