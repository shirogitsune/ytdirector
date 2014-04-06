youtubeDirector
==========

This plugin provides methods to generate a Youtube gallery from a playlist identifier
and attach callback functions to almost every primary aspect of the Youtube video.

**Callback Hooks:**

- *onReady*: Called when the video is ready to play
- *onThumbClick*: Called when the thumbnail list items are clicked
- *onCue*: Called when a video is cued
- *onBuffer*: Called when the video is buffering
- *onPlay*: Called when the video starts playing
- *onPause*: Called when the player is paused
- *onTimeUpdate*: Called when the time on the video updates
- *onEnd*: Called when the video ends

**Options:**

- *id*: DOM ID to be applied to the container element
- *class*: DOM Class to be applied to the container element
- *height*: Height of the Youtube video
- *width*: Width of the Youtube video
- *playlist*: The Youtube playlist id (starts with PL, used for gallery mode)
- *startvideo*: The id of the video in the playlist to start on
- *videoId*: Youtube video ID (used for single mode) 
- *autoplay*: Boolean true/false on whether to autoplay videos on load and on thumbnail click

**Version History:**

1.0 - Initial Release

1.1 - There is no 1.1

1.2 - Added single video capability

1.3 - Updated plugin to fetch the API only one time for all instances

1.4 - Added highlight-on-click function for playlist entries. Added ability to specify video to start on a specified video in a playlist.
