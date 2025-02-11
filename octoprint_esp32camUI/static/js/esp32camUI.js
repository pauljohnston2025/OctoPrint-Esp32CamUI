/*
 * View model for OctoPrint-Esp32CamUI
 *
 * Author: CyberSensei
 * License: AGPLv3
 */
$(function() {
    function Esp32camuiViewModel(parameters) {
        var self = this;

        console.log(`parameters: ${parameters}`);
        console.log(`self: ${self}`);
        self.settings = parameters[0];

        self.html_to_display = ko.observable(''); 
        self.use_src_iframe = ko.observable(true); 

        self.onBeforeBinding = function() {
            var url = self.settings.settings.plugins.esp32camUI.url();

            if (url.startsWith('http'))
            {
                // just load from the url, eg. http://192.168.1.10
                // we can use an iframe and everything just works
                return;
            }

            self.use_src_iframe(false);

    
            // otherwise, we need to get fancy (since we are using a relative route), 
            // and manually load the. we must change the page contents to prefix everything with that relative route
            // eg. a route of '/esp32_cam' needs the page to load through that route, and then 
            // all the /control?var=led_intensity&val=0 routes need to be changed to 
            // /esp32_cam/control?var=led_intensity&val=0
            // there is a bunch of `${baseHost}/thing` so we will just replace ${baseHost}/
            // note we also handle trailing stlases in the host eg. /esp32_cam/

            var url_without_trailing_slash = url.replace(/\/$/, '');
            
            fetch(url)
            .then(response => response.text()) // send response body to next then chain
            .then((body) => {
                self.html_to_display(
                    body.replaceAll('${baseHost}', `${url_without_trailing_slash}`)
                        // We should also set up a /stream route setup that proxies through to port 81, so remove that too
                        .replaceAll("streamUrl = baseHost + ':81'", `streamUrl = '${url_without_trailing_slash}'`)
                );
            });
        }
    }

    /* view model class, parameters for constructor, container to bind to
     * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
     * and a full list of the available options.
     */
    OCTOPRINT_VIEWMODELS.push({
        construct: Esp32camuiViewModel,
        // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
        dependencies: [ "settingsViewModel" ],
        // Elements to bind to, e.g. #settings_plugin_esp32camUI, #tab_plugin_esp32camUI, ...
        elements: [ "#tab_plugin_esp32camUI" ]
    });
});
