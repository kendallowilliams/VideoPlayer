function VideoPlayer () {
    var self = this,
        domain = "http://192.168.1.100",
        fileUtility = "/cgi-bin/get_file.cgi",
        dataUtility = "/cgi-bin/video_player_cs.sh", /* _cs for debugging */
        getSeriesHttpJSON = { type: "series" },
        getSeasonsHttpJSON = { type: "season" },
        getEpisodesHttpJSON = (_series, _season) => ({ type: "episode", series: _series, season: _season }),
        currentScreen = null,
        VIEWABLE_COUNT = 7;

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
    
    this.CONTROL_BUTTONS = {
        leftButton: () => document.querySelector(".controls_left_button"),
        upButton: () => document.querySelector(".controls_up_button"),
        centerButton: () => document.querySelector(".controls_center_button"),
        rightButton: () => document.querySelector(".controls_right_button"),
        downButton: () => document.querySelector(".controls_down_button")
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
                        series.push(oSeries);
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
                    var rows = XML.getXMLDocFromString(_value).getElementsByTagName("row"),
                        seasons = [];
                    
                    for (var i = 0; i < rows.length; i++) {
                        var oSeason = {},
                            fields = rows[i].getElementsByTagName("field");
                        for (var j = 0; j < fields.length; j++) {
                            oSeason[fields[j].getAttribute("name")] = fields[j].textContent;
                        }
                        seasons.push(oSeason);
                    }
                    
                    this._seasonData = seasons;
                    self.loadSeasons(seasons);
                }
            }
        },
        "episodeData": {
            get: () => this._episodeData,
            set: _value => {
                if (_value) {
                    var rows = XML.getXMLDocFromString(_value).getElementsByTagName("row"),
                        episodes = [];
                    
                    for (var i = 0; i < rows.length; i++) {
                        var oEpisode = {},
                            fields = rows[i].getElementsByTagName("field");
                        for (var j = 0; j < fields.length; j++) {
                            oEpisode[fields[j].getAttribute("name")] = fields[j].textContent;
                        }
                        episodes.push(oEpisode);
                    }
                    
                    this._episodeData = episodes;
                    self.loadEpisodes(episodes);
                }
            }
        }
    });
    
    this.initializeVideoPlayer = function () {
        this.initialized = false;
        currentScreen = this.SCREENS.browser;
        this.loadData();
        this.initializeControls();
        this.showCurrentScreen();
        this.initialized = true;
    };
    
    this.loadData = function () {
        this.getSeries();
        this.getSeasons();
    };
    
    this.initializeControls = function () {
        this.CONTROL_BUTTONS.downButton().setAttribute("vp-button","down");
        this.CONTROL_BUTTONS.leftButton().setAttribute("vp-button","left");
        this.CONTROL_BUTTONS.rightButton().setAttribute("vp-button","right");
        this.CONTROL_BUTTONS.upButton().setAttribute("vp-button","up");
        this.CONTROL_BUTTONS.centerButton().setAttribute("vp-button","center");
        
        Object.values(this.CONTROL_BUTTONS).forEach(_item => {
            _item().onmouseover = _evt => _evt.currentTarget.parentElement.setAttribute("vp-hover", _evt.currentTarget.getAttribute("vp-button"));
            _item().onmouseout = _evt => _evt.currentTarget.parentElement.setAttribute("vp-hover", "");
        });
        
        this.CONTROL_BUTTONS.centerButton().onclick = () => {
            var screen = (currentScreen === self.SCREENS.browser) ? self.SCREENS.video : self.SCREENS.browser;
            currentScreen = screen;
            self.showCurrentScreen();
        };

    };
    
    this.showCurrentScreen = function () {
        switch(currentScreen) {
            case this.SCREENS.browser:
                this.VIEWS.browserBox().setAttribute("vp-visible", "1");
                this.VIEWS.videoBox().setAttribute("vp-visible", "0");
                break;
            case this.SCREENS.video:
                this.VIEWS.videoBox().setAttribute("vp-visible", "1");
                this.VIEWS.browserBox().setAttribute("vp-visible", "0");
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
        
        _data.forEach((_item, _index) => {
            var series = document.getElementById("series_template_div").cloneNode(true);
            series.id = "";
            series.textContent = _item.title;
            series.setAttribute("seriesID", _item.id);
            series.setAttribute("seasonsCount", _item.seasons);
            series.onclick = _evt => self.showSeasons(_evt.currentTarget.getAttribute("seriesID"),
                                                     _evt.currentTarget.getAttribute("seasonsCount"));
            if (_index < VIEWABLE_COUNT) /*then*/ series.setAttribute("vp-visible", "1");
            this.VIEWS.seasonsBrowser().setAttribute("seriesID", _item.id);
            this.VIEWS.seriesBrowser().appendChild(series);
        });
    };
    
    this.showSeries = function () {
        self.resetBrowserViews();
        self.VIEWS.seriesBrowser().setAttribute("vp-visible", "1");
        self.VIEWS.seriesHeader().setAttribute("vp-visible", "1");
        self.VIEWS.seriesFooter().setAttribute("vp-visible", "1");
    };
    
    this.getEpisodes = function (_series, _season) {
        var path = domain + dataUtility;
        HTTP.get(path, getEpisodesHttpJSON(_series, _season))
            .then(_value => self.episodeData = _value)
            .then(this.showEpisodes);
    };
    
    this.loadEpisodes = function (_data) {
        while(this.VIEWS.episodesBrowser().firstChild)
        {
            this.VIEWS.episodesBrowser().removeChild(this.VIEWS.episodesBrowser().firstChild);
        }
        
        _data.forEach((_item, _index) => {
            var episode = document.getElementById("episode_template_div").cloneNode(true);
            episode.id = "";
            episode.textContent = _item.title;
            //episode.setAttribute("seriesID", _item.id);
            //episode.setAttribute("seasonsCount", _item.seasons);
            episode.onclick = _evt => null;
            if (_index < VIEWABLE_COUNT) /*then*/ episode.setAttribute("vp-visible", "1");
            this.VIEWS.episodesBrowser().appendChild(episode);
        });
    };
    
    this.showEpisodes = function () {
        self.resetBrowserViews();
        self.VIEWS.episodesBrowser().setAttribute("vp-visible", "1");
        self.VIEWS.episodesHeader().setAttribute("vp-visible", "1");
        self.VIEWS.episodesFooter().setAttribute("vp-visible", "1");
    };
    
    this.getSeasons = function () {
        var path = domain + dataUtility;
        HTTP.get(path, getSeasonsHttpJSON)
            .then(_value => self.seasonData = _value);
    };
    
    this.loadSeasons = function (_data) {
        while(this.VIEWS.seasonsBrowser().firstChild)
        {
            this.VIEWS.seasonsBrowser().removeChild(this.VIEWS.seasonsBrowser().firstChild);
        }
        
        _data.forEach((_item, _index) => {
            var season = document.getElementById("season_template_div").cloneNode(true);
            season.id = "";
            season.textContent = _item.title;
            season.setAttribute("seasonID", _item.id);
            //season.setAttribute("seasonsCount", _item.seasons);
            season.onclick = _evt => {
                var seriesID = _evt.currentTarget.parentElement.getAttribute("seriesID"),
                    seasonID = _evt.currentTarget.getAttribute("seasonID");
                self.getEpisodes(seriesID, seasonID);
                self.VIEWS.episodesBrowser().setAttribute("seriesID", seriesID);
                self.VIEWS.episodesBrowser().setAttribute("seasonID", seasonID);
            };
            this.VIEWS.seasonsBrowser().appendChild(season);
        });
    };
    
    this.showSeasons = function (_series, _count) {
        var seasons = this.VIEWS.seasonsBrowser().querySelectorAll(".season_template");
        
        this.resetBrowserViews();
        this.VIEWS.seasonsBrowser().setAttribute("vp-visible", "1");
        this.VIEWS.seasonsHeader().setAttribute("vp-visible", "1");
        this.VIEWS.seasonsFooter().setAttribute("vp-visible", "1");
        
        if (_series && _count) {
            seasons.forEach((_item, _index) => {
                if (_index < VIEWABLE_COUNT && _index < _count) {
                   _item.setAttribute("vp-visible", "1") 
                }
            });
        }
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