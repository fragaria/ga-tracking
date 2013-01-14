window.tracking = {};
var _gas = _gas || [];

(function() {

var tracking = {
    options: {
        account: '',
        domainName: '',
        modules: ['trackPageview', 'trackForms', 'trackOutboundLinks', 'trackMaxScroll', 'trackDownloads', 'trackYoutube', 'trackVimeo', 'trackMailto', 'trackBrowse', 'trackTwitter', 'trackFacebook'],
        currentPage: 'undefined',
        debug: false
    },

    setCustomVariable: function(index, name, value, scope) {
        scope = typeof scope !== 'undefined' ? scope : 2;

        _gas.push(['_setCustomVar', index, name, value, scope]);

        if (this.options.debug)
            console.log(['_setCustomVar', index, name, value, scope]);
    },

    trackEvent: function(category, action, label, value, nonInteraction) {
        action = typeof action !== 'undefined' ? action : this.options.currentPage;
        label =  typeof label !==  'undefined' ? label  : this.options.currentPage;

        _gas.push(['_trackEvent', category, action, label, value, nonInteraction]);

        if (this.options.debug)
            console.log(['_trackEvent', category, action, label, value, nonInteraction]);
    },

    trackSocialEvent: function(network, socialAction, target, pagePath) {
        pagePath = typeof pagePath !== 'undefined' ? pagePath : this.options.currentPage;

        _gas.push(['_trackSocial', network, socialAction, target, pagePath]);

        if (this.options.debug)
            console.log(['_trackSocial', network, socialAction, target, pagePath]);
    },

    trackTimeEvent: function(category, variable, time, label, sample) {
        variable = typeof variable !== 'undefined' ? variable : this.options.currentPage;
        label = typeof label !== 'undefined' ? label : this.options.currentPage;

        _gas.push(['_trackTiming', category, variable, time, opt_label, opt_sample]);

        if (this.options.debug)
            console.log(['_trackTiming', category, variable, time, opt_label, opt_sample]);
    },

    trackBrowseOutgoing: function() {
        var that = this;

        $('a').click(function() {
            var label = $(this).closest('*[data-tracking]').attr('data-tracking');
            var url = this +'#utmx='+ label;

            that.trackEvent('browse-outgoing', that.options.currentPage, label, undefined, true);

            _gas.push(function() { document.location = url; }); //make sure request on GA was done

            return false;
        });
    },

    trackBrowseIncoming: function() {
        var that = this;

        if (document.referrer) {
            var hostReferrer = document.referrer.match(/:\/\/(.[^/]+)/)[1];
        }
        if (hostReferrer != window.location.host) { //access from different domain
            that.trackEvent('browse-incoming', that.options.currentPage, 'outbound', undefined, true);
            return;
        }
        if (window.location.hash == '') { //internal link without label
            that.trackEvent('browse-incoming', that.options.currentPage, 'other-internal', undefined, true);
            return;
        }

        var hash = window.location.hash.slice(1);
        var arrHash = hash.split('&');
        var hashParametr = Array();
        var hashValue = Array();

        for (var i = 0;i < arrHash.length;i++) {
            var x = arrHash[i].split('=');
            hashParametr[i] = x[0];
            hashValue[i] = x[1];
        }

        var utmx = $.inArray('utmx', hashParametr);
        var utmo = $.inArray('utmo', hashParametr);

        if(utmx != -1) {
            if(utmo != -1) {
                var gaValue = hashValue[utmo] * 1;
            }
            var newUrl = window.location.href.replace(/#.*$/, '#');
            if (typeof history.replaceState === 'undefined') { // if not HTML5.history
                window.location.hash = '';
            }
            else {
                window.history.replaceState(null , null, newUrl.slice(0, -1));
            }
            that.trackEvent('browse-incoming', that.options.currentPage, hashValue[utmx], gaValue, true);
        }
        else { //internal link without label
            that.trackEvent('browse-incoming', that.options.currentPage, 'other-internal', undefined, true);
        }
    },

    trackFacebook: function() {
        var that = this;

        if (typeof FB !== 'undefined') {
            FB.Event.subscribe('edge.create', function(targetUrl) {
                that.trackSocialEvent('facebook', 'like', targetUrl);
            });
            FB.Event.subscribe('edge.remove', function(targetUrl) {
                that.trackSocialEvent('facebook', 'unlike', targetUrl);
            });
            FB.Event.subscribe('message.send', function(targetUrl) {
                that.trackSocialEvent('facebook', 'send', targetUrl);
            });
            FB.Event.subscribe('comment.create', function(targetUrl) {
                that.trackSocialEvent('facebook', 'create-comment', targetUrl);
            });
            FB.Event.subscribe('comment.remove', function(targetUrl) {
                that.trackSocialEvent('facebook', 'remove-comment', targetUrl);
            });
        }
        else {
            window.setTimeout(this.trackFacebook(), 100); // wait for loading Facebook JS
        }
    },

    trackTwitter: function() {
        var that = this;

        if (typeof twttr !== 'undefined') {
            twttr.ready(function (twttr) {
                twttr.events.bind('click', function(intent) {
                    if (intent)
                        that.trackSocialEvent('twitter', intent.type, intent.region);
                });

                twttr.events.bind('tweet', function(intent) {
                    if (intent)
                        that.trackSocialEvent('twitter', intent.type, 'tweet');
                });


                twttr.events.bind('retweet',  function(intent) {
                    if (intent)
                        that.trackSocialEvent('twitter', intent.type, intent.data.source_tweet_id);
                });

                twttr.events.bind('favorite', function(intent) {
                    if (intent)
                        that.trackSocialEvent('twitter', intent.type, 'tweet');
                });

                twttr.events.bind('follow', function(intent) {
                    if (intent) {
                        var label = intent.data.user_id + " (" + intent.data.screen_name + ")";
                        that.trackSocialEvent('twitter', intent.type, label);
                    }
                });
            });
        }
    },

    initTracking: function(options) {
        var that = this;

        that.options = $.extend(that.options, options);

        _gas.push(['_setAccount', that.options.account]);
        _gas.push(['_setDomainName', that.options.domainName]);

        if ($.inArray('trackPageview', that.options.modules) != -1)
            _gas.push(['_trackPageview']);

        if ($.inArray('trackForms', that.options.modules) != -1)
            _gas.push(['_gasTrackForms']);

        if ($.inArray('trackOutboundLinks', that.options.modules) != -1)
            _gas.push(['_gasTrackOutboundLinks']);

        if ($.inArray('trackMaxScroll', that.options.modules) != -1)
            _gas.push(['_gasTrackMaxScroll']);

        if ($.inArray('trackDownloads', that.options.modules) != -1)
            _gas.push(['_gasTrackDownloads']);

        if ($.inArray('trackYoutube', that.options.modules) != -1)
            _gas.push(['_gasTrackYoutube', {force: true}]);

        if ($.inArray('trackVimeo', that.options.modules) != -1)
            _gas.push(['_gasTrackVimeo', {force: true}]);

        if ($.inArray('trackMailto', that.options.modules) != -1)
            _gas.push(['_gasTrackMailto']);

        if ($.inArray('trackBrowse', that.options.modules) != -1) {
            that.trackBrowseOutgoing();
            that.trackBrowseIncoming();
        }

        if ($.inArray('trackTwitter', that.options.modules) != -1)
            that.trackTwitter();

        if ($.inArray('trackFacebook', that.options.modules) != -1)
            that.trackFacebook();

        if (options.debug)
            that.trackingObject.push(['_setDebug']);

        (function() {
            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = '//cdnjs.cloudflare.com/ajax/libs/gas/1.10.1/gas.min.js';
            var s = document.getElementsByTagName('body')[0];
            s.parentNode.insertBefore(ga, s);
        })();
    }
}

window.tracking = tracking;

}).call(this);