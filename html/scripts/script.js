/*
 * tasks to run when body is loaded
 */
function init()
{
    getSeriesFromDatabase();
    getSeasonsFromDatabase();
    initContainers();
    initScreens();
    initTables();
}

/*
 * Initialize containers positions, displays, and sizes.
 */
function initContainers()
{
    var player = new Player();
    
    // set left offset positions of containers
    player.video_box.style.left = ((PLAYER_WIDTH / 2) - (SCREEN_WIDTH / 2)) + "px";
    player.browse_box.style.left = ((PLAYER_WIDTH / 2) - (SCREEN_WIDTH / 2)) + "px";
    player.controls_box.style.left = ((PLAYER_WIDTH / 2) - (CONTROLS_WIDTH / 2)) + "px";
    player.time_box.style.left = player.video_box.style.left;

    // set top offset position of containers
    player.video_box.style.top = SCREEN_OFFSET_TOP + "px";
    player.browse_box.style.top = SCREEN_OFFSET_TOP + "px";
    player.controls_box.style.top = CONTROLS_OFFSET_TOP + "px";
    player.time_box.style.top = TIME_OFFSET_TOP + "px";
    
    // set height and width of containers
    player.controls_box.style.width = CONTROLS_WIDTH + "px";
    player.controls_box.style.height = CONTROLS_HEIGHT + "px";
    player.video_box.style.width = SCREEN_WIDTH + "px";
    player.video_box.style.height = SCREEN_HEIGHT + "px";
    player.player_box.style.width = PLAYER_WIDTH + "px";
    player.player_box.style.height = PLAYER_HEIGHT + "px";
    player.browse_box.style.width = SCREEN_WIDTH + "px";
    player.browse_box.style.height = SCREEN_HEIGHT + "px";
    
    // set display of containers
    player.browse_box.style.display = "block";
    player.video_box.style.display = "none";
    player.time_box.style.display = "none";
}

/*
 * Initialize width and height of video and browse screens
 */
function initScreens()
{
    var player = new Player();
    
    // set width and height of video and browse screens
    player.video.style.height = SCREEN_HEIGHT + "px";
    player.video.style.width = SCREEN_WIDTH + "px"; 
    player.browse.style.height = SCREEN_HEIGHT + "px";
    player.browse.style.width = SCREEN_WIDTH + "px";
}

/*
 * display default table
 */
function initTables()
{
    var player = new Player();
    
    player.season_table.style.display = "none";
    player.episode_table.style.display = "none";
    player.series_table.style.display = "table";
}

 /*
  * returns all series from database, stores them in array, and loads {NUMBER_OF_ROWS} in table
  */
function getSeriesFromDatabase()
{
    var xmlDoc = null;
    var request = new XMLHttpRequest();
    request.open("GET", SERIES_SCRIPT);
    SERIES = SERIES.splice(SERIES.length); // empty series array
    
    request.onreadystatechange = function() {
        if (request.readyState === 4)
        {
            if (request.status === 200)
            {   // request successful
                xmlDoc = request.responseXML; // set to xml document
                var rows = xmlDoc.getElementsByTagName('row'); // get all series rows

                for (var i = 0; i < rows.length; i++)
		{
		    var fields = rows[i].getElementsByTagName('field'); // get all series column/properties
                    var id = fields[0].textContent;
                    var title = fields[1].textContent;
                    var root = fields[2].textContent;
                    var seasons = fields[3].textContent;
                    var series = new Series(id, title, root, seasons); // declare and initilize new series object
                    SERIES.push(series); // add series object to array
                }
                loadSeriesTable(0); // load table with {NUMBER_OF_ROWS} series
            }
            else
            {
                console.log("Error: getSeriesFromDatabase() - Status: " + request.status);
            }
        }
    };
    
    request.onerror = function () {
        console.log("Error: getSeriesFromDatabase() - Request Error");
    };
    request.send(null);
}

/*
 * returns all season from database and stores them in array
 */
function getSeasonsFromDatabase()
{
    var xmlDoc = null;
    var request = new XMLHttpRequest();
    request.open("GET", SEASON_SCRIPT);
    SEASONS = SEASONS.splice(SEASONS.length);   // empty seasons array

    request.onreadystatechange = function() {
        if (request.readyState === 4)
        {
            if (request.status === 200)
            {   // request successful
                xmlDoc = request.responseXML;
		var rows = xmlDoc.getElementsByTagName('row');  // get all season records        

                for (var i = 0; i < rows.length; i++)
                {
		    var fields = rows[i].getElementsByTagName('field'); // get all season columns/properties
                    var id = fields[0].textContent;
                    var title = fields[1].textContent;
                    var root = fields[2].textContent;
                    var season = new Season(id, title, root);   // declare and initialize season object
                    SEASONS.push(season);   // add season object to array
                }
            }
            else
            {
                console.log("Error: getSeasonsFromDatabase() - Status: " + request.status);
            }
        }
    };

    request.onerror = function () {
        console.log("Error: getSeasonsFromDatabase() - Request Error");
    };
    request.send(null);
}

/*
 * loads {NUMBER_OF_ROWS} series elements into series table starting with series[index]
 */
function loadSeriesTable(index)
{
    var player = new Player();
    var last;
    
    if (SERIES.length <= NUMBER_OF_ROWS)
    {   // number of series is less than number of rows to be displayed
        index = 0;  // set index of first object
        last = SERIES.length - 1; // set index of last object
    }
    else
        last = index + NUMBER_OF_ROWS - 1; // set index of last object
    
    if (last > SERIES[CURRENT_SERIES].seasons && SERIES_TOP_INDEX < (SERIES.length - NUMBER_OF_ROWS)) /*then*/ last = SERIES.length - 1;
    
    if (SERIES[index] != null && SERIES[last] != null)
    {   // first and last objects are valid
        var row = null;
        SERIES_TOP_INDEX = index;   //store index of first object in the list
        clearTBody(player.series_tBody);   // clear all table rows

        for (var i = 0; i < NUMBER_OF_ROWS; i++, index++)
        {
            if (index < SERIES.length)
            {   // row displays series button
                row = document.createElement("tr");
                var col = document.createElement("td");
                var button = document.createElement("button");
                button.textContent = SERIES[index].title;
                button.type = "button";
                button.value = index;   // value is index of series object in array
                button.onclick = function() { seriesClick(this.value); };
                col.appendChild(button);
                row.appendChild(col);
                player.series_tBody.appendChild(row);
            }
            else
            {   // row does not display series button
                row = document.createElement("tr");
                var col = document.createElement("td");
                var span  = document.createElement("span");
                span.textContent = "Empty Row";
                span.style.visibility = "hidden";
                col.appendChild(span);
                row.appendChild(col);
                player.series_tBody.appendChild(row);
            }
        }
    }
}

/*
 * sets the index of the currently active series and loads season table with seasons
 */
function seriesClick(index)
{
    CURRENT_SERIES = index; // set current series index
    loadSeasonTable(0); // load season table starting with first season in season array
}

/*
 * loads {NUMBER_OF_ROWS} season elements into season table starting with seasons[index]
 */
function loadSeasonTable(index)
{
    var player = new Player();
    var condition = false;
    
    if (SERIES[CURRENT_SERIES].seasons <= NUMBER_OF_ROWS)
        index = 0;
    else if (index > SERIES[CURRENT_SERIES].seasons)
        condition = ((SEASON_TOP_INDEX % NUMBER_OF_ROWS === 0) && ((SEASON_TOP_INDEX + NUMBER_OF_ROWS) > SERIES[CURRENT_SERIES].seasons));
    
    if (SEASONS[index] != null && SEASONS[SERIES[CURRENT_SERIES].seasons - 1] != null && !condition)
    {   // first and last objects are valid; last index is valid
        SEASON_TOP_INDEX = index; // store index of first object in season table
        var row = null;
        clearTBody(player.season_tBody); // clear rows from season table

        for (var i = 0; i < NUMBER_OF_ROWS; i++,index++)
        {
            if (index < SERIES[CURRENT_SERIES].seasons)
            {   // row contains season button
                row = document.createElement("tr");
                var col = document.createElement("td");
                var button = document.createElement("button");
                button.textContent = SEASONS[index].title;
                button.type = "button";
                button.value = index;   // value is index of season
                button.onclick = function() { getEpisodesFromDatabase(this.value) };
                col.appendChild(button);
                row.appendChild(col);
                player.season_tBody.appendChild(row);
            }
            else
            {   // row is empty
                row = document.createElement("tr");
                var col = document.createElement("td");
                var span  = document.createElement("span");
                span.textContent = "Empty Row";
                span.style.visibility = "hidden";
                col.appendChild(span);
                row.appendChild(col);
                player.season_tBody.appendChild(row);
            }
        }
        player.series_table.style.display = "none"; // hide series table
        player.season_table.style.display = "table";    // show season table
    }
}

/*
 * get all episodes from database with matching season (and CURRENT_SERIES) and loads episode table
 */
function getEpisodesFromDatabase(season)
{
    var xmlDoc = null;
    var request = new XMLHttpRequest();
    var script = EPISODE_SCRIPT + "&series=" + SERIES[CURRENT_SERIES].id + "&season=" + SEASONS[season].id;
    request.open("GET", script);
    EPISODES = EPISODES.splice(EPISODES.length);    // clear episode array
    
    request.onreadystatechange = function() {
        if (request.readyState === 4)
        {
            if (request.status === 200)
            {   // request successful
                xmlDoc = request.responseXML;
		var rows = xmlDoc.getElementsByTagName('row');  //get all episode records
                
                for (var i = 0; i < rows.length; i++)
                {
		    var fields = rows[i].getElementsByTagName('field'); // get all episode columns/properties
                    var id = fields[0].textContent;
                    var title = fields[1].textContent;
                    var series_index = CURRENT_SERIES;
                    var season_index = season;
                    var src = FILE_SCRIPT + id;
                    var episode = new Episode(id, title, series_index, season_index, src);  // declare and initialize new episode object
                    EPISODES.push(episode); // add episode object to array
                }
                loadEpisodeTable(0);    // load episode table with the episode at index 0 at the top
            }
            else
            {
                console.log("Error: getEpisodesFromDatabase() - Status: " + request.status);
            }
        }
    };

    request.onerror = function () {
        console.log("Error: getEpisodesFromDatabase() - Request Error");
    };
    request.send(null);
}

/*
 * loads {NUMBER_OF_ROWS} episode elements into episode table starting with episodes[index]
 */
function loadEpisodeTable(index)
{
    var player = new Player();
    var last;
    
    if (EPISODES.length <= NUMBER_OF_ROWS)
    {   // number of episodes is less than number of rows
        index = 0;  // set index of first object
        last = EPISODES.length - 1; // set index of last object
    }
    else
        last = index + NUMBER_OF_ROWS - 1;  // set index of last object
    
    if (EPISODES[last] == null && EPISODE_TOP_INDEX < (EPISODES.length - NUMBER_OF_ROWS)) /*then*/ last = EPISODES.length - 1;
    
    if (EPISODES[index] != null && EPISODES[last] != null)
    {   // first and last objects are valid
        EPISODE_TOP_INDEX = index;  // store index of first episode object
        var row = null;
        clearTBody(player.episode_tBody); // clear all episode table body rows
        
        for (var i = 0; i < NUMBER_OF_ROWS; i++,index++)
        {
            if (index < EPISODES.length)
            {   // row contains episode button
                row = document.createElement("tr");
                var col = document.createElement("td");
                var button = document.createElement("button");
                button.textContent = EPISODES[index].title;
                button.value = index;   // value is index of episode object to be played
                button.onclick = function() { play(this.value); };
                col.appendChild(button);
                row.appendChild(col);
                player.episode_tBody.appendChild(row);
            }
            else
            {   // row is empty
                row = document.createElement("tr");
                var col = document.createElement("td");
                var span  = document.createElement("span");
                span.textContent = "Empty Row";
                span.style.visibility = "hidden";
                col.appendChild(span);
                row.appendChild(col);
                player.episode_tBody.appendChild(row);
            }
        }
        player.season_table.style.display = "none";
        player.episode_table.style.display = "table";
    }
}

/*
 * alternate between series, season, and episode tables
 */
function switchTable(value)
{
    var player = new Player();
    
    if (player.series_table.style.display === "table")
    {   // series table is visible
        player.series_table.style.display = "none"; // hide series table
        
        if (value === "next")
            player.season_table.style.display = "table"; // show season table
        else if (value === "previous")
            player.episode_table.style.display = "table"; // show episode table
    }
    else if (player.season_table.style.display === "table")
    {   // season table is visible
        player.season_table.style.display = "none"; // hide season table
        
        if (value === "next")
            player.episode_table.style.display = "table"; // show episode table
        else if (value === "previous")
            player.series_table.style.display = "table"; // show series table
    }
    else if (player.episode_table.style.display === "table")
    {   // episode table is visible
        player.episode_table.style.display = "none"; // hide episode table
        
        if (value === "next")
            player.series_table.style.display = "table"; // show series table
        else if (value === "previous")
            player.season_table.style.display = "table"; // show season table
    }
}

/*
 * removes all rows from table body
 */
function clearTBody(tbody)
{
    while (tbody.hasChildNodes())
        tbody.removeChild(tbody.firstChild);  
}

/*
 * alternate between browse and video screens
 */
function switchScreens()
{
    var player = new Player();
    
    if (DEFAULT_SCREEN)
    {   // browse screen is visible
        player.browse_box.style.display = "none";   // hide browse screen
        player.video_box.style.display = "block";   // show video screen
        player.time_box.style.display = "block";    // show time screen (may be excluded)
        DEFAULT_SCREEN = false;     // false - browse screen is not visible
        
    }
    else
    {   // video screen is visible
        player.browse_box.style.display = "block";  // show browse screen
        player.video_box.style.display = "none";    // hide video screen
        player.time_box.style.display = "none";     // hide time screen (may be excluded)
        DEFAULT_SCREEN = true;      // true - browse screen is visible
    }
}

/*
 * not implemented
 */
function fullscreen() {}

/*
 * updates the player controls images
 */
function updateControlsImage(image)
{
    var player = new Player();
    player.ctrl_img.src = "images/controls_" + image + ".png";
}

/*
 * actions to take when up bracket is clicked
 */
function up()
{
    if (DEFAULT_SCREEN) // browse screen is visible
        goUpList(); // move up list of series, seasons, or episodes
    else // video screen is visible
        changeVolume("+"); // increase volume
}

/*
 * reload table with objects[index - 1] to objects[index + NUMBER_OF_ROWS - 1], if valid
 */
function goUpList()
{    
    var player = new Player();
    
    if (player.series_table.style.display === "table")
        loadSeriesTable(SERIES_TOP_INDEX - SKIP_ROWS);  // load series table starting with series[index]
    else if (player.season_table.style.display === "table")
        loadSeasonTable(SEASON_TOP_INDEX - SKIP_ROWS);  // load season table starting with season[index]
    else if (player.episode_table.style.display === "table")
        loadEpisodeTable(EPISODE_TOP_INDEX - SKIP_ROWS);    // load episode table starting with episode[index]
}

/*
 * reload table with objects[index + 1] to objects[index + NUMBER_OF_ROWS + 1], if valid
 */
function goDownList()
{
    var player = new Player();
    
    if (player.series_table.style.display === "table")
        loadSeriesTable(SERIES_TOP_INDEX + SKIP_ROWS);  // load series table starting with series[index]
    else if (player.season_table.style.display === "table")
        loadSeasonTable(SEASON_TOP_INDEX + SKIP_ROWS);  // load season table starting with season[index]
    else if (player.episode_table.style.display === "table")
        loadEpisodeTable(EPISODE_TOP_INDEX + SKIP_ROWS);    // load episode table starting with episode[index]
}

/*
 * actions to take when down bracket is clicked
 */
function down()
{
    if (DEFAULT_SCREEN) // browse screen is visible
        goDownList(); // move up list of series, seasons, or episodes
    else // video screen is visible
        changeVolume("-"); // decrease volume
}

/*
 * actions to take when left bracket is clicked
 */
function left()
{
    if (DEFAULT_SCREEN) // browse screen is visible
        switchTable("previous");    // switch to previous table; series_table <= season_table <= episode_table
    else // video screen is visible
        backward(); // skip backward SKIP_SECONDS in video progress
}

/*
 * actions to take when right bracket is clicked
 */
function right()
{
    if (DEFAULT_SCREEN) // browse screen is visible
        switchTable("next"); // switch to next table; series_table => season_table => episode_table
    else // video screen is visible
        forward(); // skip forward SKIP_SECONDS in video progress
}

/*
 * actions to take when center button is clicked
 */
function center()
{
    switchScreens(); // alternate between browse and video screen
}

/*
 * play episode with a given index
 */
function play(episode)
{
    var player = new Player();
    try
    {
      clearPlayingFlags();
      if (EPISODES[episode] != null)
      {   // valid episode to play
          player.video.src = EPISODES[episode].src;   // update video source to next episode
          if (DEFAULT_SCREEN) /*then*/ switchScreens(); // switch to video screen, if necessary
          player.video.play();    // play episode
          EPISODES[episode].playing = true; // true - episode is playing
      }
    }
  	catch (ex)
    {
      playNext();
    }
}

function clearPlayingFlags()
{
    for (var i = 0; i < EPISODES.length; i++)
    {
        EPISODES[i].playing = false;
    }
}

/*
 * play next episode in episodes array
 */
function playNext()
{
    var index = 0; // declare and initialize index
    while(EPISODES[index].playing == false)
    {   
        index++; // index of episode with playing true
    }
    EPISODES[index].playing = false; // false - episode not playing
    play(index + 1);    // play next episode   
}

/*
 * automatically plays next episode if 
 */
function autoPlay()
{
    if (AUTOPLAY) /*then*/ playNext(); // autoplay is active and episodes will play automatically
}

/*
 * not implemented
 */
function pause()
{
    var player = new Player();
    
    if (!player.video.paused)
        player.video.pause();
}

/*
 * not implemented
 */
function next() {}

/*
 * not implemented
 */
function previous() {}

/*
 * not implemented
 */
function mute() {}

/*
 * skips video duration forward by SKIP_SECONDS
 */
function forward()
{
    var player = new Player();
    
    if (player.video.currentTime < (player.video.duration - SKIP_SECONDS))
        player.video.currentTime += SKIP_SECONDS;
    else
        player.video.currentTime = player.video.duration;
}

/*
 * skips video duration backward by SKIP_SECONDS
 */
function backward()
{
    var player = new Player();
    
    if (player.video.currentTime >= SKIP_SECONDS)
        player.video.currentTime -= SKIP_SECONDS;
    else
        player.video.currentTime = 0;
}

/*
 * may not be necessary - updates value of time in textfield
 */
function updateTime()
{
    var player = new Player();
    player.time_box.textContent = getTime(player.video.currentTime) + " / " + getTime(player.video.duration);
}

/*
 * converts seconds into hours:minutes:seconds
 */
function getTime(value)
{
    var time = null;
    var hours = Math.floor(+(value) / 3600);
    var minutes = Math.floor((+(value) % 3600) / 60);
    var seconds = Math.floor(value % 60);
    
    if (isNaN(hours)) /*then*/ hours = 0;
    if (isNaN(minutes)) /*then*/ minutes = 0;
    if (isNaN(seconds)) /*then*/ seconds = 0;
    
    if (hours < 10) /*then*/ hours = "0" + hours;
    
    if (minutes < 10) /*then*/ minutes = "0" + minutes;
    
    if (seconds < 10) /*then*/ seconds = "0" + seconds;
    
    time = hours + ":" + minutes + ":" + seconds;
    
    return time;
}

/*
 * increases or decreases playback volume of episode
 */
function changeVolume(value)
{
    var player = new Player();
    var volume = Math.floor(player.video.volume * 100);
    
    if (value === "+")
    {   // volume increase
        if (player.video.muted) /*then*/ player.video.muted = false;
        
        while ((volume % 10) !== 0)
            volume++;
        
        if (volume < 100) /*then*/ volume += 10;
    }
    else if (value === "-")
    {   // volume decrease
        if (volume > 0)
        {
            player.video.muted = false;
            
            while ((volume % 10) !== 0)
                volume--;
       
            if (volume >= 10) /*then*/ volume -= 10;
        }
        else
            player.video.muted = true;
    }
    
    player.video.volume = volume / 100.0;
}

/**/
/*function convertNextVideo(id)
{
	var response = "";
    	var request = new XMLHttpRequest();
    	var script = CONVERT_SCRIPT + id;
    	request.open("GET", script);
	request.onreadystatechange = function() {
       if (request.readyState === 4)
       {
		if (request.status === 200)
            	{   // request successful
              	response = request.responseText;
		}
	}

	request.onerror = function () {
        	console.log("Error: convertNextVideo() - Request Error");
    	};
	request.send();
}*/