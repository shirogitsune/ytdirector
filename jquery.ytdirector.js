/*
	Plugin: youtubeDirector (v1.4)
	By: Justin Pearce (whitefox@guardianfox.net)
	This plugin provides methods to generate a Youtube gallery from a playlist identifier
	and attach callback functions to almost every primary aspect of the Youtube video.
	Callback Hooks:
	- onReady: Called when the video is ready to play
	- onThumbClick: Called when the thumbnail list items are clicked
	- onCue: Called when a video is cued
	- onBuffer: Called when the video is buffering
	- onPlay: Called when the video starts playing
	- onPause: Called when the player is paused
	- onTimeUpdate: Called when the time on the video updates
	- onEnd: Called when the video ends

	Options:
		id: DOM ID to be applied to the container element
		class: DOM Class to be applied to the container element
		height: Height of the Youtube video
		width: Width of the Youtube video
		playlist: The Youtube playlist id (starts with PL, used for gallery mode)
		startvideo: The id of the video in the playlist to start on
		videoId: Youtube video ID (used for single mode) 
		autoplay: Boolean true/false on whether to autoplay videos on load and on thumbnail click

	Version History:
	1.0 - Initial Release
	1.1 - There is no 1.1
	1.2 - Added single video capability
	1.3 - Updated plugin to fetch the API only one time for all instances
	1.4 - Added highlight-on-click function for playlist entries. 
		  Added ability to specify video to start on a specified video in a playlist.
*/
;if(jQuery)(function($){
	/* Create object */
	var ytDirector = function(elem, options){
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
	};
	/* Attach functions via prototype */
	ytDirector.prototype = {
		/* Default configuration */
		defaults:{
			id:'youtube-director',
			class:'youtube-director',
			height:240,
			width:320,
			playlist:'',
			autoplay:false
		},
		timeCode:-1,
		videoIndex:0,
		videoList:[],
		init:function(){
			/* Get this for scope resolution */
		    var obj = this;
			/* Setup API path */
			if(window.location.protocol != 'file:'){
				proto = window.location.protocol;
			}else{
				proto = 'http:';
			}
			var api = proto+'//www.youtube.com/iframe_api';
			/* Populate configuration */
			this.config = $.extend({}, this.defaults, this.options);
			/* Build container elements */
			this.$elem.append(this.buildContainer());
			
			/* Set the API listener and begin loading the API */
			window.onYouTubeIframeAPIReady = function(){  obj.initYoutube(obj);  }
			if(!window['YT'] && !window['YTConfig']){
			    console.log('Begin Loading API...');
				$.getScript(api);
			}
			
			return this;
		},
		initYoutube:function(obj){
			var proto, tryCounter=0;
			if(typeof obj.config.videoId != 'undefined' && obj.config.videoId != ''){
				/* Initialize Youtube IFrame API */
				obj.player = new YT.Player('iframe', {
					height: obj.config.height,
					width: obj.config.width,
					autoplay:((obj.autoplay)?1:0),
					videoId:obj.config.videoId,
					events:{
						'onStateChange':function(evt){obj.onPlayerStateChange(evt, obj);}
					}
				});
				/* Attach onReady callback */
				if(typeof obj.config.onReady != 'undefined' && typeof obj.config.onReady == 'function'){
						obj.player.addEventListener('onReady', obj.config.onReady.call(obj));
				}
			}else{
				/* Setup Playlist data path */
				if(window.location.protocol != 'file:'){
					proto = window.location.protocol;
				}else{
					proto = 'http:';
				}
				/* Fetch playlist data */
				var jqXHR = $.getJSON(proto+'//gdata.youtube.com/feeds/api/playlists/'+obj.config.playlist.substring(2)+'?v=2&alt=json', function(data){
					/* Build thumbnail list */
					console.log('Playlist of id "'+data.feed.id.$t.split(':').pop()+'" loaded...');
					$.each(data.feed.entry, function(i, entry){
						var urlParts = entry.link[1].href.split("/");
						console.log('Processing video '+urlParts[urlParts.length-2]);
						$('#thumb-list').append($('<li></li>').append('<img src="'+proto+'//img.youtube.com/vi/'+urlParts[urlParts.length-2]+'/default.jpg" border="0" /><span class="caption">'+entry.title.$t+'</span>').attr('class', 'thumb').attr('id', i+'-'+urlParts[urlParts.length-2]));
					});
					/* Set up thumbnail list listeners and playlist */
					obj.processPlaylist();
				});
				/* Wait and listen to make sure that the playlist JSON came back and loaded */
				var wakeToken = setInterval(function(){
				  console.log('Attempting to load player with '+obj.videoList.length+' videos ...');
				  if(typeof(jqXHR) != 'undefined' && obj.videoList.length > 0){
					/* Initialize Youtube IFrame API */
					obj.player = new YT.Player('iframe', {
						height: obj.config.height,
						width: obj.config.width,
						autoplay:((obj.autoplay)?1:0),
						videoId:obj.videoList[obj.videoIndex][0],
						events:{
							'onStateChange':function(evt){obj.onPlayerStateChange(evt, obj);}
						}
					});
					/* Attach onReady callback */
					if(typeof obj.config.onReady != 'undefined' && typeof obj.config.onReady == 'function'){
							obj.player.addEventListener('onReady', obj.config.onReady.call(obj));
					}
					/* Stop listener */
					clearInterval(wakeToken);
				   }
				   /* Failsafe to kill the listener */
				   tryCounter++;
				   if(tryCounter>10){
					 clearInterval(wakeToken);
				     console.log('Error: Could not initialize player. Playlist could not be loaded.');
				   }
				}, 500);
			}
		},
		processPlaylist:function(){
		    var obj = this;
			/* Build the internal playlist array */
			var thumbList = document.querySelectorAll('#thumb-list li.thumb');
			for(var i=0; i<thumbList.length; i++){
				var key = thumbList[i].id.substr(thumbList[i].id.indexOf('-')+1, thumbList[i].id.length);
				this.videoList.push([key, thumbList[i].childNodes[1].innerHTML]);
				if(typeof obj.config.startvideo != undefined && obj.config.startvideo!=''){
					if(key == obj.config.startvideo){
						obj.videoIndex = i;
					}
				}
				console.log('Video '+key+' added to internal list...');
			}
			/* Setup default click handlers to load the video */
			$('#thumb-list .thumb').css('cursor', 'pointer');
			$('#thumb-list .thumb').on('click', function(){
				var domid = $(this).attr('id');
				var index = domid.split('-')[0];
				var key = $(this).attr('id').substr(domid.indexOf('-')+1, domid.length);
				$('#thumb-list').children('li').removeClass('active');
				$(this).addClass('active');
				obj.videoIndex = parseInt(index);
				if(obj.autoplay){
					obj.player.loadVideoById(key);
				}else{
					obj.player.cueVideoById(key);
				}
				
			});
			/* Attach onThumbClick callback */
			if(typeof obj.config.onThumbClick != 'undefined' && typeof obj.config.onThumbClick == 'function'){
					$('#thumb-list .thumb').on('click', function(evt){obj.config.onThumbClick.call(obj)});
			}
		},
		buildContainer:function(){
			/* Build DOM structure for player */
			var director = $('<div></div>').attr('id', this.config.id).attr('class', this.config.class).attr('data-uuid', this.config.id+'-'+Date.now().toString(36).toUpperCase());
			var playerHolder = $('<div></div>').attr('id', 'player-wrapper').append($('<div id="iframe"></div>'));
			director.append(playerHolder);
			if(typeof this.config.playlist != 'undefined' && this.config.playlist != ''){
				var thumbList = $('<div></div>').attr('id', 'video-list').append($('<ul></ul>').attr('id', 'thumb-list'));
				director.append(thumbList);
			}
			return director;
		},
		onPlayerStateChange:function(evt, obj){
			/* Clear buffering interval listener if it's running */
			var bufferListener;
			if(typeof bufferListener != 'undefined'){
				clearInterval(bufferListener);
				bufferListener = undefined;
			}
			/* Switch on state */
			switch(evt.data){
			case YT.PlayerState.PLAYING:
				/* Attach onPlay callback */
				if(typeof obj.config.onPlay != 'undefined' && typeof obj.config.onPlay == 'function'){
					obj.config.onPlay.call(obj);
				}
				/* Check video time code */
				videoListener = setInterval(function(){
					var youtubeTimeCode = Math.floor(obj.player.getCurrentTime());
					if(youtubeTimeCode != obj.timeCode){
						/* If the time code changes, update it */
						obj.timeCode = youtubeTimeCode;
						/* Attach onTimeUpdate callback */
						if(typeof obj.config.onTimeUpdate != 'undefined' && typeof obj.config.onTimeUpdate == 'function'){
							obj.config.onTimeUpdate.call(obj);
						}
					}
				}, 250);
			break;
			case YT.PlayerState.PAUSED:
				/* Attach onPause callback */
				if(typeof obj.config.onPause != 'undefined' && typeof obj.config.onPause == 'function'){
							obj.config.onPause.call(obj);
				}
				if(typeof videoListener != 'undefined'){
					clearInterval(videoListener);
				}
			case YT.PlayerState.ENDED:
				/* Attach onEnd callback */
				if(typeof obj.config.onEnd != 'undefined' && typeof obj.config.onEnd == 'function'){
							obj.config.onEnd.call(obj);
				}
				if(typeof videoListener != 'undefined'){
					clearInterval(videoListener);
				}
			break;
			case YT.PlayerState.CUED:
				/* Attach onCue callback */
				if(typeof obj.config.onCue != 'undefined' && typeof obj.config.onCue == 'function'){
							obj.config.onCue.call(obj);
				}
				if(typeof videoListener != 'undefined'){
					clearInterval(videoListener);
				}
			break;
			case YT.PlayerState.BUFFERING:
				/* Update percentLoaded while buffering */
			    bufferListener = setInterval(function(){
					obj.percentLoaded = obj.player.getVideoLoadedFraction();
					if(typeof obj.config.onBuffer != 'undefined' && typeof obj.config.onBuffer == 'function'){
							obj.config.onBuffer.call(obj);
					}
				}, 250);
				/* Attach onBuffer callback */
			break;
			default:
				/* Clear time code update interval */
				if(typeof videoListener != 'undefined'){
					clearInterval(videoListener);
				}
			break;
		 }
		},
		getPlayer:function(){
			/* Return the internal player reference object */
			return this.player;
		}
		
	};
	
	/* Initialize plugin  */
	ytDirector.defaults = ytDirector.prototype.defaults;
	$.fn.ytdirector = function(options) {
		return this.each(function() {
			new ytDirector(this, options).init();
		});
	};
	
})(jQuery);
/* ~fin~ */