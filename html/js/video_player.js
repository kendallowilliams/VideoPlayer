function VideoPlayer () {
    var self = this,
        domain = "http://192.168.1.100",
        fileUtility = "/cgi-bin/get_file.cgi",
        dataUtility = "/cgi-bin/video_player_cs.sh", /* _cs for debugging */
        getSeriesHttpJSON = { type: "series" },
        getSeasonsHttpJSON = { type: "seasons" },
        getEpisodesHttpJSON = (_series, _season) => ({ type: "series", series: _series, season: _season }),
        currentScreen = null;

    this.SCREENS = { browser: 0, video: 1, invalid: 99 };
    
    this.VIEWS = {
        seriesHeader: () => document.querySelector(".series_header"),
        seriesBrowser: () => document.querySelector(".series_browser"),
        seriesFooter: () => document.querySelector(".series_footer"),
        seasonsHeader: () => document.querySelector(".seasons_header"),
        seasonsBrowser: () => document.querySelector(".seasons_browser"),
        seasonsFooter: () => document.querySelector(".seasons_footer"),
        episodesHeader: () => document.querySelector(".episodes_header"),
        episodesBrowser: () => document.querySelector(".episodes_browser"),
        episodesFooter: () => document.querySelector(".episodes_footer"),
        
        videoBox: () => document.querySelector(".video_box"),
        browserBox: () => document.querySelector(".browser_box")
    };
    
    Object.defineProperties(this, {
        "initialized": {
            get: () => this._initialized,
            set: _value => this._initialized = _value
        },
        "seriesData": {
            get: () => this._seriesData,
            set: _value => {
                if (_value) {
                    var rows = XML.getXMLDocFromString(_value).getElementsByTagName("row"),
                        series = [];
                    
                    for (var i = 0; i < rows.length; i++) {
                        var oSeries = {},
                            fields = rows[i].getElementsByTagName("field");
                        for (var j = 0; j < fields.length; j++) {
                            oSeries[fields[j].getAttribute("name")] = fields[j].textContent;
                        }
                        series.push(oSeries)
                    }
                    
                    this._seriesData = series;
                    self.loadSeries(series);
                }
            }
        },
        "seasonData": {
            get: () => this._seasonData,
            set: _value => {
                if (_value) {
                    var seasons = XML.getXMLDocFromString(_value).getElementsByTagName("row");
                    this._seasonData = seasons;
                    self.loadSeasons(seasons);
                }
            }
        },
        "episodeData": {
            get: () => this._episodeData,
            set: _value => {
                if (_value) {
                    var episodes = XML.getXMLDocFromString(_value).getElementsByTagName("row");
                    this._episodeData = episodes;
                    self.loadEpisodes(episodes);
                }
            }
        }
    });
    
    this.initializeVideoPlayer = function () {
        this.initialized = false;
        this.resetBrowserViews();
        currentScreen = this.SCREENS.browser;
        this.loadData();
        this.showCurrentScreen();
        this.initialized = true;
    };
    
    this.loadData = function () {
        this.getSeries();
    };
    
    this.showCurrentScreen = function () {
        switch(currentScreen) {
            case this.SCREENS.browser:
                this.VIEWS.browserBox().setAttribute("vp-visible", "1");
                break;
            case this.SCREENS.video:
                this.VIEWS.videoBox().setAttribute("vp-visible", "1");
                break;
            case this.SCREENS.invalid:
            default:
                break;
        }
    };
    
    this.getSeries = function () {
        var path = domain + dataUtility;
        HTTP.get(path, getSeriesHttpJSON)
            .then(_value => self.seriesData = _value)
            .then(this.showSeries);
    };
    
    this.loadSeries = function (_data) {
        while(this.VIEWS.seriesBrowser().firstChild)
        {
            this.VIEWS.seriesBrowser().removeChild(this.VIEWS.seriesBrowser().firstChild);
        }
        
        _data.forEach(_item => {
            var series = document.createElement("div");
            series.textContent = _item.title;
            this.VIEWS.seriesBrowser().appendChild(series);
        });
    };
    
    this.showSeries = function () {
        self.VIEWS.seriesBrowser().setAttribute("vp-visible", "1");
        self.VIEWS.seriesHeader().setAttribute("vp-visible", "1");
        self.VIEWS.seriesFooter().setAttribute("vp-visible", "1");
    };
    
    this.getEpisodes = function (_series, _season) {
        var path = domain + dataUtility;
        HTTP.get(path, getSeriesHttpJSON)
            .then(_value => self.seriesData = _value);
    };
    
    this.loadEpisodes = function (_data) {
        
    };
    
    this.showEpisodes = function () {
        this.VIEWS.episodesBrowser().setAttribute("vp-visible", "1");
        this.VIEWS.episodesHeader().setAttribute("vp-visible", "1");
        this.VIEWS.episodesFooter().setAttribute("vp-visible", "1");
    };
    
    this.getSeasons = function (_series) {
        var path = domain + dataUtility;
        HTTP.get(path, getSeriesHttpJSON)
            .then(_value => self.seriesData = _value);
    };
    
    this.loadSeasons = function (_data) {
        
    };
    
    this.showSeasons = function () {
        this.VIEWS.seasonsBrowser().setAttribute("vp-visible", "1");
        this.VIEWS.seasonsHeader().setAttribute("vp-visible", "1");
        this.VIEWS.seasonsFooter().setAttribute("vp-visible", "1");
    };
    
    this.resetBrowserViews = function () {
        this.VIEWS.seriesBrowser().setAttribute("vp-visible", "0");
        this.VIEWS.seriesHeader().setAttribute("vp-visible", "0");
        this.VIEWS.seriesFooter().setAttribute("vp-visible", "0");
        this.VIEWS.episodesBrowser().setAttribute("vp-visible", "0");
        this.VIEWS.episodesHeader().setAttribute("vp-visible", "0");
        this.VIEWS.episodesFooter().setAttribute("vp-visible", "0");
        this.VIEWS.seasonsBrowser().setAttribute("vp-visible", "0");
        this.VIEWS.seasonsHeader().setAttribute("vp-visible", "0");
        this.VIEWS.seasonsFooter().setAttribute("vp-visible", "0");
    };
    
    this.initializeVideoPlayer();
}

var HTTP = {
    get: (_url, _dataJSON) => {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest(),
                modifiedURL = _url + (_dataJSON ? "?" + Object.keys(_dataJSON).map(key => key ? key + "=" + _dataJSON[key] : "").join("&") : "");
            
            request.open("GET", modifiedURL);
            
            request.onreadystatechange = function () {
                if (request.status === 200 && request.readyState === 4) {
                    resolve(request.response);
                }
                else if (request.status !== 0 && request.readyState === 4) {
                    var errorMsg = "url: " + _url + "\n" +
                                   "status: " + request.status + "\n" + 
                                   "message: " + request.statusText,
                        response = { error: errorMsg, status: "4" };
                    reject(response);
                }
            };
            
            request.onerror = function () {
                var response = { error: "An error occurred while communicating with the server.", status: "4" };
                reject(response);
            };
            
            request.send();
        });
    },
    post: (_url, _dataJSON) => {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest(),
                data = Object.keys(_dataJSON).map(key => key ? key + "=" + _dataJSON[key] : "").join("&");
            
            request.open("POST", _url);
            
            request.onreadystatechange = function () {
                if (request.status === 200 && request.readyState === 4) {
                    resolve(request.response);
                }
                else if (request.status !== 0 && request.readyState === 4) {
                    var errorMsg = "url: " + _url + "\n" +
                                   "status: " + request.status + "\n" + 
                                   "message: " + request.statusText,
                        response = { error: errorMsg, status: "4" };
                    reject(response);
                }
            };
            
            request.onerror = function () {
                var response = { error: "An error occurred while communicating with the server.", status: "4" };
                reject(response);
            };
            
            request.send(data);
        });
    }
};

var XML = {
    getXMLDocFromString: function (_xml) {
        var parser = null;
        var outDoc = null;
        if (_xml === "") /*then*/ _xml = "<root/>";
        _xml = decodeURIComponent(_xml);

        if (window.DOMParser) {
            parser = new DOMParser();
            outDoc = parser.parseFromString(_xml,"text/xml");
        }
        
        return outDoc || {};
    }
};