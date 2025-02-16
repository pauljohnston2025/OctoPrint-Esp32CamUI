Credit to https://github.com/CyberSensei1/OctoPrint-Esp32CamUI.git for the basic idea
This repo has been forked from his code

# OctoPrint-Esp32CamUI

This plugin allows users to control and monitor their ESP32-CAM directly from the OctoPrint interface. With this plugin, you can easily take photos and videos, adjust camera settings, and view a live stream of the camera feed right from within OctoPrint. 

## Setup

Install manually using this URL:

     https://github.com/pauljohnston2025/OctoPrint-Esp32CamUI.git


## Configuration

You can either set the ESP32-CAM Interface url in settings tab to a full route eg. `http://192.168.1.10`  
Or a relative path also works eg. `/esp32_cam/`  
note: the trailing slash is required for the below haproxy config

The benifit of using a relative path is that it will work with remote clients such as octoeverywhere.  
Relative paths do require extra configuration to the haproxy that comes with octoprint.  

Please ensure the following ips are routed to the correct hosts.  

```
192.168.1.10 esp32_cam.local.com
127.0.0.1 esp32-proxy.local.com
```

You may replace them with raw ips in the configs below.

# haproxy config additions

You need to add a route that forwards to the local ip of your esp32cam.  
`/esp32_cam/stream` is used for setting up a relative stream path.

There are 2 other routes:
*  `esp32_cam_proxy` routes any traffic requesting the esp32cam ui page to a nginx backend (more on this below)
* `esp32_cam_raw` routes any other commands directly to the esp32 cams ip

```
frontend ...
        use_backend esp32_cam_stream if { path_beg /esp32_cam/stream }
        use_backend esp32_cam_proxy if { path /esp32_cam/ }
        use_backend esp32_cam_raw if { path_beg /esp32_cam/ }
backend esp32_cam_stream
        # the coookie header is too large for the esp32cam to handle, so remove it
        http-request del-header Cookie
        http-request replace-path /esp32_cam/(.*)   /\1
        server esp32_cam_stream esp32_cam.local.com:81
backend esp32_cam_proxy
        # the coookie header is too large for the esp32cam to handle, so remove it
        http-request del-header Cookie
        # we have to proxy our connection through a local nginx esp32-proxy.local.com is just localhost
        # we have to proxy it because the esp returns a gzip encoded file, even thgouh octoeverywhere requests identity encoding
        # nginx will be able to decode the gzip for us, I could not figure out how to do it with haproxy
        server esp32_cam_proxy esp32-proxy.local.com:82
backend esp32_cam_raw
        # the coookie header is too large for the esp32cam to handle, so remove it
        http-request del-header Cookie
        http-request replace-path /esp32_cam/(.*)   /\1
        server esp32_cam_raw esp32_cam.local.com:80
```

# nginx config

The only reason im running nginx is so that it can decompress the hard coded gzip response from the esp32cam.
This is because octoeverywhere can only handle `Content-Encoding: Identity` responses.
I could not figure out a way to achieve this with haproxy, there might be a way.

```
server {
    listen 82;

    server_name esp32-proxy.local.com;

    location / {
        proxy_pass http://esp32_cam.local.com:80;
        gunzip on;
    }
}
```





