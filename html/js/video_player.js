function VideoPlayer () {
    var self = this,
        domain = "http://192.168.1.100/",
        fileUtility = domain + "cgi-bin/get_file.cgi?id=",
        dataUtility = "cgi-bin/video_player_cs.sh", /* _cs for debugging */
        getSeriesHttpJSON = { type: "series" },
        getSeasonsHttpJSON = { type: "season" },
        getEpisodesHttpJSON = (_series, _season) => ({ type: "episode", series: _series, season: _season }),
        VIEWABLE_COUNT = 7,
        SKIP_SECONDS = 20;

    this.SCREENS = { browser: 0, video: 1, invalid: 99 };
    this.BROWSER_SCREENS = { series: 0, seasons: 1, episodes: 2, invalid: 99, edges: { min: 0, max: 2 } };
    this.VIDEO = () => document.getElementById("video");
    
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
        },
        "currentScreen" : {
            get: () => this._currentScreen || self.SCREENS.browser,
            set: _value => {
                this._currentScreen = _value;
                self.showCurrentScreen();
            }
        },
        "currentBrowserScreen": {
            get: () => this._currentBrowserScreen || self.BROWSER_SCREENS.series,
            set: _value => {
                if (_value < self.BROWSER_SCREENS.edges.min) /*then*/ _value = self.BROWSER_SCREENS.edges.max;
                else if (_value > self.BROWSER_SCREENS.edges.max) /*then*/ _value = self.BROWSER_SCREENS.edges.min;
                this._currentBrowserScreen = _value;
                self.switchBrowserScreen();
            }
        },
        "volume" : {
            get: () => this._volume || 10.0,
            set: _value => {
                var volume = _value;
                
                if (_value < 0) /*then*/ volume = 0;
                else if (_value > 10.0) /*then*/ volume = 10.0;
                
                this._volume = volume;
                self.VIDEO().volume = this._volume / 10.0;
            }
        },
        "currentTime": {
            get: () => self.VIDEO().currentTime,
            set: _value => {
                var duration = self.VIDEO().duration;
                
                if (_value > duration) /*then*/ self.VIDEO().currentTime = duration;
                else if (_value < 0) /*then*/ self.VIDEO().currentTime = 0;
                else /*then*/ self.VIDEO().currentTime = _value;
            }
        },
        "autoplay": {
            get: () => this._autoplay,
            set: _value => this._autoplay = _value
        },
        "playing": {
            get: () => this._playing,
            set: _value => this._playing = _value
        }
    });
    
    this.initializeVideoPlayer = function () {
        this.initialized = false;
        this.loadData();
        this.initializeControls();
        this.initializePlayer();
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
        
        this.CONTROL_BUTTONS.centerButton().onclick = () => self.currentScreen = self.currentScreen === self.SCREENS.video ? self.SCREENS.browser : self.SCREENS.video;
        
        this.CONTROL_BUTTONS.leftButton().onclick = () => {
            if (self.currentScreen === self.SCREENS.browser) /*then*/ self.currentBrowserScreen--;
            else if (self.currentScreen === self.SCREENS.video) /*then*/ self.currentTime -= SKIP_SECONDS;
        };
        
        this.CONTROL_BUTTONS.rightButton().onclick = () => {
            if (self.currentScreen === self.SCREENS.browser) /*then*/ self.currentBrowserScreen++;
            else if (self.currentScreen === self.SCREENS.video) /*then*/ self.currentTime += SKIP_SECONDS;
        };

        this.CONTROL_BUTTONS.upButton().onclick = () => {
            if (self.currentScreen === self.SCREENS.browser) /*then*/ self.scrollBrowserScreen(-1);
            else if (self.currentScreen === self.SCREENS.video) /*then*/ self.volume++;
        };
        
        this.CONTROL_BUTTONS.downButton().onclick = () => {
            if (self.currentScreen === self.SCREENS.browser) /*then*/ self.scrollBrowserScreen(1);
            else if (self.currentScreen === self.SCREENS.video) /*then*/ self.volume--;
        };
    };
    
    this.initializePlayer = function () {
        var player = this.VIDEO();
        
        player.onended = function () {
            self.playNextEpisode();
        };
        
        player.onerror = function () {
            self.playNextEpisode();
        };
    };
    
    this.showCurrentScreen = function () {
        switch(self.currentScreen) {
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
    
    this.switchBrowserScreen = function () {
        var browser = null,
            header = null,
            footer = null;
        
        this.resetBrowserViews();
        switch(self.currentBrowserScreen) {
            case this.BROWSER_SCREENS.series:
                browser = this.VIEWS.seriesBrowser();
                header = this.VIEWS.seriesHeader();
                footer = this.VIEWS.seriesFooter();
                break;
            case this.BROWSER_SCREENS.seasons:
                browser = this.VIEWS.seasonsBrowser();
                header = this.VIEWS.seasonsHeader();
                footer = this.VIEWS.seasonsFooter();
                break;
            case this.BROWSER_SCREENS.episodes:
                browser = this.VIEWS.episodesBrowser();
                header = this.VIEWS.episodesHeader();
                footer = this.VIEWS.episodesFooter();
                break;
            case this.SCREENS.invalid:
            default:
                break;
        }
        
        if (browser && header && footer) {
            browser.setAttribute("vp-visible", "1");
            header.setAttribute("vp-visible", "1");
            footer.setAttribute("vp-visible", "1");
        }
    };
    
    this.scrollBrowserScreen = function (_direction) {
        var startIndex = 0,
            count = 0,
            direction = VIEWABLE_COUNT * _direction;
        
        switch(self.currentBrowserScreen) {
            case this.BROWSER_SCREENS.series:
                this.showSeries();
                break;
            case this.BROWSER_SCREENS.seasons:
                startIndex = parseInt(this.VIEWS.seasonsBrowser().getAttribute("startIndex"));
                count = parseInt(this.VIEWS.seasonsBrowser().getAttribute("seasonCount"));
                
                if (startIndex + direction < 0) /*then*/ startIndex = 0;
                else if (startIndex + direction >= count) /*then*/ startIndex = startIndex;
                else startIndex = startIndex + direction;
                    
                this.showSeasons(this.VIEWS.seasonsBrowser().getAttribute("seriesID"), count, startIndex);
                break;
            case this.BROWSER_SCREENS.episodes:
                startIndex = parseInt(this.VIEWS.episodesBrowser().getAttribute("startIndex"));
                count = parseInt(this.VIEWS.episodesBrowser().getAttribute("episodeCount"));
                
                if (startIndex + direction < 0) /*then*/ startIndex = 0;
                else if (startIndex + direction >= count) /*then*/ startIndex = startIndex;
                else startIndex = startIndex + direction;
                    
                this.loadEpisodes(this.episodeData, startIndex);
                this.VIEWS.episodesBrowser().setAttribute("startIndex", startIndex);
                break;
            case this.SCREENS.invalid:
            default:
                break;
        };
    };
    
    this.getSeries = function () {
        var path = domain + dataUtility;
        HTTP.get(path, getSeriesHttpJSON)
            .then(_value => self.seriesData = _value)
            .then(this.showSeries);
    };
    
    this.loadSeries = function (_data, _start = 0) {
        var seriesBrowser = this.VIEWS.seriesBrowser();
        
        seriesBrowser.setAttribute("seriesCount", _data.length);
        while(seriesBrowser.firstChild) /*loop*/ seriesBrowser.removeChild(seriesBrowser.firstChild);
        
        _data.forEach((_item, _index) => {
            var series = document.getElementById("series_template_div").cloneNode(true),
                count = seriesBrowser.querySelectorAll(".series_template[vp-visible='1']").length;
            series.id = "";
            series.textContent = _item.title;
            series.setAttribute("seriesID", _item.id);
            series.setAttribute("seasonsCount", _item.seasons);
            series.onclick = _evt => self.showSeasons(_evt.currentTarget.getAttribute("seriesID"),
                                                     _evt.currentTarget.getAttribute("seasonsCount"));
            if (count < VIEWABLE_COUNT && _index >= _start) /*then*/ series.setAttribute("vp-visible", "1");
            seriesBrowser.appendChild(series);
        });
    };
    
    this.showSeries = function () {
        self.currentBrowserScreen = self.BROWSER_SCREENS.series;
    };
    
    this.getEpisodes = function (_series, _season) {
        var path = domain + dataUtility;
        HTTP.get(path, getEpisodesHttpJSON(_series, _season))
            .then(_value => self.episodeData = _value)
            .then(this.showEpisodes)
            .then(() => { 
                if (self.playing) /*then*/ self.VIEWS.episodesBrowser().firstElementChild.click()
            });
    };
    
    this.loadEpisodes = function (_data, _start = 0) {
        var episodesBrowser = this.VIEWS.episodesBrowser();
        
        episodesBrowser.setAttribute("episodeCount", _data.length);
        episodesBrowser.setAttribute("startIndex", _start);
        while(episodesBrowser.firstChild) /*loop*/ episodesBrowser.removeChild(episodesBrowser.firstChild);
        
        _data.forEach((_item, _index) => {
            var episode = document.getElementById("episode_template_div").cloneNode(true),
                count = episodesBrowser.querySelectorAll(".episode_template[vp-visible='1']").length;
            episode.id = "";
            episode.textContent = _item.title;
            episode.setAttribute("episodeID", _item.id);
            episode.setAttribute("seriesID", _item.series_id);
            episode.setAttribute("seasonID", _item.season_id);
            episode.onclick = _evt => {
                var template = _evt.currentTarget.parentElement.querySelector(".episode_template[vp-playing='1']");
                if (template) /*then*/ template.setAttribute("vp-playing", "0");
                _evt.currentTarget.setAttribute("vp-playing", "1");
                self.VIDEO().src = fileUtility + _evt.currentTarget.getAttribute("episodeID");
                self.currentScreen = self.SCREENS.video;
                self.playing = true;
            };
            if (count < VIEWABLE_COUNT && _index >= _start) /*then*/ episode.setAttribute("vp-visible", "1");
            episodesBrowser.appendChild(episode);
        });
    };
    
    this.showEpisodes = function () {
        self.currentBrowserScreen = self.BROWSER_SCREENS.episodes;
    };
    
    this.getSeasons = function () {
        var path = domain + dataUtility;
        HTTP.get(path, getSeasonsHttpJSON)
            .then(_value => self.seasonData = _value);
    };
    
    this.loadSeasons = function (_data) {
        var seasonsBrowser = this.VIEWS.seasonsBrowser();
        
        seasonsBrowser.setAttribute("startIndex", "0");
        
        _data.forEach((_item, _index) => {
            var season = document.getElementById("season_template_div").cloneNode(true);
            season.id = "";
            season.textContent = _item.title;
            season.setAttribute("seasonID", _item.id);
            season.onclick = _evt => {
                var seriesID = _evt.currentTarget.parentElement.getAttribute("seriesID"),
                    seasonID = _evt.currentTarget.getAttribute("seasonID");
                self.getEpisodes(seriesID, seasonID);
                self.VIEWS.episodesBrowser().setAttribute("seriesID", seriesID);
                self.VIEWS.episodesBrowser().setAttribute("seasonID", seasonID);
            };
            
            seasonsBrowser.appendChild(season);
        });
    };
    
    this.showSeasons = function (_series, _count, _start = 0) {
        var browser = this.VIEWS.seasonsBrowser(),
            seasons = browser.querySelectorAll(".season_template"),
            visibleSeasons = browser.querySelectorAll(".season_template[vp-visible='1']");
    
        visibleSeasons.forEach(_item => _item.setAttribute("vp-visible", "0"));
        self.currentBrowserScreen = self.BROWSER_SCREENS.seasons;
        browser.setAttribute("seriesID", _series);
        browser.setAttribute("startIndex", _start);
        
        if (_series && _count) {
            browser.firstElementChild.setAttribute("vp-hidden", "1");
            browser.setAttribute("seasonCount", _count);
            
            seasons.forEach((_item, _index) => {
                var count = browser.querySelectorAll(".season_template[vp-visible='1']").length;
                
                if (count < VIEWABLE_COUNT && _index < _count && _index >= _start) {
                   _item.setAttribute("vp-visible", "1");
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
    
    this.playNextEpisode = function () {
        var episodesBrowser = this.VIEWS.episodesBrowser(),
            currentEpisode = episodesBrowser.querySelector(".episode_template[vp-playing='1']"),
            nextEpisode = currentEpisode ? currentEpisode.nextElementSibling : null;
        
        self.playing = true;
        if (nextEpisode && !nextEpisode.isSameNode(episodesBrowser.lastElementChild)) /*then*/ nextEpisode.click();
        else {
            var seasonsBrowser = this.VIEWS.seasonsBrowser(),
                currentSeason = seasonsBrowser.querySelector(".season_template[seasonID='" + currentEpisode.getAttribute("seasonID") + "']"),
                nextSeason = currentSeason ? currentSeason.nextElementSibling : null;
            
            if (nextSeason) /*then*/ nextSeason.click();
            else /*then*/ self.playing = false;
        }
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