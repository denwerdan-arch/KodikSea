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
var Provider = /** @class */ (function () {
    function Provider() {
        this.KODIK_TOKEN = "8e329159687fc1a2f5af99a50bf57070";
        this.BASE_URL = "https://kodikapi.com";
    }
    Provider.prototype.getSettings = function () {
        return {
            episodeServers: ["Kodik"],
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
                        url = "".concat(this.BASE_URL, "/search?token=").concat(this.KODIK_TOKEN, "&title=").concat(encodeURIComponent(opts.query), "&types=anime,anime-serial&with_material_data=true&limit=20");
                        return [4 /*yield*/, fetch(url)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (!data.results || data.results.length === 0)
                            return [2 /*return*/, []];
                        return [2 /*return*/, data.results.map(function (item) {
                                var _a;
                                var displayTitle = item.title;
                                if (item.translation && item.translation.title) {
                                    displayTitle += " [".concat(item.translation.title, "]");
                                }
                                return {
                                    id: item.id,
                                    title: displayTitle,
                                    url: item.link,
                                    subOrDub: ((_a = item.translation) === null || _a === void 0 ? void 0 : _a.type) === "voice" ? "dub" : "sub",
                                };
                            })];
                    case 3:
                        e_1 = _a.sent();
                        console.error("Kodik Search Error:", e_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Provider.prototype.findEpisodes = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, item, episodes, seasonNum, season, episodeNum, epLink, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = "".concat(this.BASE_URL, "/search?token=").concat(this.KODIK_TOKEN, "&id=").concat(id, "&with_episodes=true");
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
                        if (item.seasons) {
                            for (seasonNum in item.seasons) {
                                season = item.seasons[seasonNum];
                                for (episodeNum in season.episodes) {
                                    epLink = season.episodes[episodeNum];
                                    episodes.push({
                                        id: epLink,
                                        number: parseInt(episodeNum),
                                        title: "\u0421\u0435\u0440\u0438\u044F ".concat(episodeNum),
                                        url: epLink
                                    });
                                }
                            }
                        }
                        else {
                            episodes.push({
                                id: item.link,
                                number: 1,
                                title: "Фильм",
                                url: item.link
                            });
                        }
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
    Provider.prototype.findEpisodeServer = function (episode, _server) {
        return __awaiter(this, void 0, void 0, function () {
            var fetchUrl, html, params, subtitles, links, videoSources, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        fetchUrl = episode.id.startsWith("//") ? "https:" + episode.id : episode.id;
                        return [4 /*yield*/, this.fetchPlayerPage(fetchUrl)];
                    case 1:
                        html = _a.sent();
                        params = this.parseParameters(html);
                        subtitles = this.extractSubtitles(html);
                        return [4 /*yield*/, this.getStreamLinks(params, fetchUrl)];
                    case 2:
                        links = _a.sent();
                        return [4 /*yield*/, this.processLinks(links, subtitles)];
                    case 3:
                        videoSources = _a.sent();
                        return [2 /*return*/, {
                                server: _server,
                                headers: {
                                    "Referer": "https://kodik.info/",
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                },
                                videoSources: videoSources
                            }];
                    case 4:
                        e_3 = _a.sent();
                        console.error("Kodik GetSources Error:", e_3);
                        throw new Error(e_3 instanceof Error ? e_3.message : "Unknown error");
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Provider.prototype.fetchPlayerPage = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(url, {
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            }
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error("Failed to fetch player: ".concat(response.status));
                        return [2 /*return*/, response.text()];
                }
            });
        });
    };
    Provider.prototype.parseParameters = function (html) {
        var extract = function (key) { var _a; return (_a = html.match(new RegExp("var\\s+".concat(key, "\\s*=\\s*[\"']([^\"']*)[\"']")))) === null || _a === void 0 ? void 0 : _a[1]; };
        var extractInfo = function (key) { var _a; return (_a = html.match(new RegExp("videoInfo\\.".concat(key, "\\s*=\\s*[\"']([^\"']*)[\"']")))) === null || _a === void 0 ? void 0 : _a[1]; };
        var params = {
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
        return params;
    };
    Provider.prototype.extractSubtitles = function (html) {
        var subtitles = [];
        var trackRegex = /<track[^>]+src=([^ >]+)[^>]*label="([^"]+)"[^>]*srclang="([^"]+)"[^>]*(default)?/gi;
        var trackMatch;
        while ((trackMatch = trackRegex.exec(html)) !== null) {
            var src = trackMatch[1], label = trackMatch[2], lang = trackMatch[3], isDefault = trackMatch[4];
            subtitles.push({
                id: lang,
                url: src,
                language: label.replace(/_/g, " ").replace(/\[(.*?)]/g, "($1)").replace(/\s+/g, " ").trim(),
                isDefault: Boolean(isDefault),
            });
        }
        return subtitles;
    };
    Provider.prototype.getStreamLinks = function (params, referer) {
        return __awaiter(this, void 0, void 0, function () {
            var ftorUrl, postParams, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ftorUrl = "https://".concat(params.pd, "/ftor");
                        postParams = new URLSearchParams();
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
                        return [4 /*yield*/, fetch(ftorUrl, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    "Referer": referer,
                                    "X-Requested-With": "XMLHttpRequest",
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                },
                                body: postParams
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (!data.links)
                            throw new Error("Kodik decoder returned no links");
                        return [2 /*return*/, data.links];
                }
            });
        });
    };
    Provider.prototype.decodeUrl = function (src) {
        var rot13 = function (str) { return str.replace(/[a-zA-Z]/g, function (char) {
            var c = char.charCodeAt(0);
            var base = c <= 90 ? 90 : 122;
            return String.fromCharCode(c + 13 <= base ? c + 13 : c - 13);
        }); };
        var isUrl = function (s) { return s.startsWith("//") || s.startsWith("http"); };
        var normalize = function (s) { return s.startsWith("//") ? "https:" + s : s; };
        if (isUrl(src))
            return normalize(src);
        var r = rot13(src);
        if (isUrl(r))
            return normalize(r);
        try {
            var b64 = atob(src);
            if (isUrl(b64))
                return normalize(b64);
        }
        catch (_a) { }
        try {
            var rb64 = atob(r);
            if (isUrl(rb64))
                return normalize(rb64);
        }
        catch (_b) { }
        try {
            var b64r = rot13(atob(src));
            if (isUrl(b64r))
                return normalize(b64r);
        }
        catch (_c) { }
        return src;
    };
    Provider.prototype.processLinks = function (links, subtitles) {
        return __awaiter(this, void 0, void 0, function () {
            var sources, m3u8Link, key, arr, decoded, m3u8Content, resolutionRegex, match, _a, key, arr;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        sources = [];
                        m3u8Link = null;
                        for (key in links) {
                            arr = links[key];
                            if ((_b = arr === null || arr === void 0 ? void 0 : arr[0]) === null || _b === void 0 ? void 0 : _b.src) {
                                decoded = this.decodeUrl(arr[0].src);
                                if (decoded.includes(".m3u8")) {
                                    m3u8Link = decoded;
                                    break;
                                }
                            }
                        }
                        if (!m3u8Link) return [3 /*break*/, 5];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(m3u8Link, { headers: { "Referer": "https://kodik.info/" } }).then(function (r) { return r.text(); })];
                    case 2:
                        m3u8Content = _d.sent();
                        resolutionRegex = /#EXT-X-STREAM-INF:[^\n]*RESOLUTION=\d+x(\d+)/g;
                        match = void 0;
                        while ((match = resolutionRegex.exec(m3u8Content)) !== null) {
                            sources.push({
                                url: m3u8Link,
                                quality: "".concat(match[1], "p"),
                                type: "m3u8",
                                subtitles: subtitles.length ? subtitles : undefined
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _d.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        if (sources.length === 0) {
                            sources.push({ url: m3u8Link, quality: "auto", type: "m3u8", subtitles: subtitles.length ? subtitles : undefined });
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        // Fallback to MP4
                        for (key in links) {
                            arr = links[key];
                            if ((_c = arr === null || arr === void 0 ? void 0 : arr[0]) === null || _c === void 0 ? void 0 : _c.src) {
                                sources.push({
                                    url: this.decodeUrl(arr[0].src),
                                    quality: key + "p",
                                    type: "mp4",
                                    subtitles: subtitles.length ? subtitles : undefined
                                });
                            }
                        }
                        _d.label = 6;
                    case 6: return [2 /*return*/, sources];
                }
            });
        });
    };
    return Provider;
}());
