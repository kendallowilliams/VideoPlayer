/* GLOBAL */

var AUTOPLAY =              true;   // true, if user wants media to keep playing; false, otherwise
var FULLSCREEN =            false;  // not implemented
var DEFAULT_SCREEN =        true;   // true, if browse display is visible; false, otherwise
var SKIP_SECONDS =          20;     // number of seconds to skip when seeking
var SCREEN_WIDTH =          480;    // the width of the browse/media window
var SCREEN_HEIGHT =         380;    // the height of the browse/media window
var PLAYER_WIDTH =          600;    // the width of the media player
var PLAYER_HEIGHT =         800;    // the height of the media player
var SCREEN_OFFSET_TOP =     50;     // browse/media offset from the top
var CONTROLS_OFFSET_TOP =   500;    // player controls offset from the top
var CONTROLS_WIDTH =        250;    // the width of the player controls
var CONTROLS_HEIGHT =       250;    // the height of the player controls
var TIME_OFFSET_TOP =       450;    // time textbox offset from the top
var NUMBER_OF_ROWS =        7;
var SKIP_ROWS =             NUMBER_OF_ROWS;
var SERIES_TOP_INDEX =      0;
var SEASON_TOP_INDEX =      0;
var EPISODE_TOP_INDEX =     0;
var CURRENT_SERIES =        0;
var CURRENT_SEASON =        0;
var VIDEO_DISABLED =		true;

var Player = function()
{
    this.video_box = document.getElementById("video_box");
    this.browse_box = document.getElementById("browse_box");
    this.controls_box = document.getElementById("controls_box");
    this.player_box = document.getElementById("player_box");
    this.time_box = document.getElementById("time_box");
    this.video = document.getElementById("video");
    this.browse = document.getElementById("browse");
    this.series_table = document.getElementById("series_table");
    this.season_table = document.getElementById("season_table");
    this.episode_table = document.getElementById("episode_table");
    this.series_tBody = this.series_table.tBodies.namedItem("series_tbody");
    this.season_tBody = this.season_table.tBodies.namedItem("season_tbody");
    this.episode_tBody = this.episode_table.tBodies.namedItem("episode_tbody");
    this.ctrl_img = document.getElementById("controls_img");
}

/*  NORMAL-USE PATHS    */
//var VIDEO_DIR = "/video/";      // video directory of the server
var CGI_DIR = "/cgi-bin/";      // script directory on the sever
var SERIES_SCRIPT = CGI_DIR + "video_player.sh?type=series";
var SEASON_SCRIPT = CGI_DIR + "video_player.sh?type=season";
var EPISODE_SCRIPT = CGI_DIR + "video_player.sh?type=episode";
var FILE_SCRIPT = CGI_DIR + "get_file.cgi?id="

/*  CROSS-SITE SCRIPTING PATHS (USED FOR TESTING)   */
//var VIDEO_DIR = "http://192.168.1.100/video/";      // video directory of the server
//var CGI_DIR = "http://192.168.1.100/cgi-bin/";      // script directory on the sever
//var SERIES_SCRIPT = CGI_DIR + "video_player_cs.sh?type=series";
//var SEASON_SCRIPT = CGI_DIR + "video_player_cs.sh?type=season";
//var EPISODE_SCRIPT = CGI_DIR + "video_player_cs.sh?type=episode";
//var FILE_SCRIPT = CGI_DIR + "get_file.cgi?id=";

// Episode object of database record
function Episode(id, title, series_index, season_index, src)
{
    this.id = id;                   // id of episode in database
    this.title = title;             // title of episode in database
    this.series_index = series_index;     // series id of episode in database
    this.season_index = season_index;     // season id of episode in database
    this.src = src;                 // path to file on the server
    this.playing = false;           // true, if episode is playing; false, otherwise
}

// Series object of database record
function Series (id, title, root, seasons)
{
    this.id = id;               // id of series in database
    this.title = title;         // title of series in database
    this.root = root;           // root directory of series in database
    this.seasons = seasons;     // number of seasons of series in database
}

// Season object of database record
function Season (id, title, root)
{
    this.id = id;           // id of season in database
    this.title = title;     // title of season in database
    this.root = root;       // root of season in database
}

var SERIES = new Array();       // array of series object
var SEASONS = new Array();      // array of seasons objects
var EPISODES = new Array();     // array of episode objects