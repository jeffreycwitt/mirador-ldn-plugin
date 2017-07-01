var Ldn = {
  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    'de': {
      'notifications': 'Mitteilung',
      "close": "schließen"
    },
    'en': {
      'notifications': 'Notifications',
      'close': "Close"
    }
  },

  notificationButtonTemplate: Mirador.Handlebars.compile([
    '<a href="#" id="notifications">{{count}}',
    '<i class="fa fa-inbox fa-lg fa-fw" id="inbox-icon"></i>',
    '</a>',
  ].join('')),

  notificationListTemplate: Mirador.Handlebars.compile([
    '<div id="notifications-wrapper">',
    '<h1>{{t "notifications"}}</h1>',
    '<a href="#" id="notifications-close">{{t "close"}}</a>',
    '<ul id="notifications-wrapper-list"></ul>',
    '</div>'
  ].join('')),

  notificationListItemTemplate: Mirador.Handlebars.compile([
    "<li><a href='#' class='supplement' data-url='{{notification}}'>{{notification}}</a></li>"
  ].join('')),



  /* initializes the plugin */
  init: function(miradorInstance){
    var _this = this
    i18next.on('initialized', function(){
      this.addLocalesToViewer();
    }.bind(this));

    miradorInstance.eventEmitter.subscribe("ADD_WINDOW", function(event, data){
      _this.checkForNotifications(data);
    });
    // miradorInstance.eventEmitter.subscribe("focusUpdated", function(event, data){
    //   console.log("focus", data);
    //   _this.checkForNotifications(data);
    // });

    this.addEventHandlers();
  },

  /* injects the notification button to the window menu */
  injectButtonToMenu: function(count, slot){
    console.log("buttonslot", slot);
    $(slot).find(".window-manifest-navigation").prepend(this.notificationButtonTemplate(
      {"count": count}
    ));
  },

  /* injects notification list to the dom */
  injectNotificationListToDom: function(){
    $(document.body).append(this.notificationListTemplate());
  },
  injectNotificationListItemToDom: function(notification){
    $("#notifications-wrapper-list").append(this.notificationListItemTemplate({
      "notification": notification
    }));
  },



  /* adds event handlers mirador */
  addEventHandlers: function(){
    var _this = this
    $(document).on("click", "#notifications", function(){
      //TODO
      //if the user is switch from one slot to another,
      //the data stored in the ldn object will be for the manifest for the previous slot
      // we need a trigger that recognized the button has clicked from on slot to the next
      // and then reloads the new data for that manifest.
      _this.showNotifications();
    }.bind(this));
    $(document).on("click", ".supplement", function(e){
      var url = $(e.target).attr("data-url");
      _this.retrieveData(url);
    }.bind(this));
    $(document).on("click", "#notifications-close", function(){
      _this.removeNotifications();
    }.bind(this));
  },

  /* adds the locales to the internationalization module of the viewer */
  addLocalesToViewer: function(){
    for(var language in this.locales){
      i18next.addResources(
        language, 'translation',
        this.locales[language]
      );
    }
  },
  removeNotifications: function(){
    $("#notifications-wrapper").remove();
  },


  checkForNotifications: function(data){
    this.notification_urls = [];
    this.data = data;
    var _this = this;

      var serviceProperty = _this.data.manifest.jsonLd.service;
      var service = [];
      if (serviceProperty === undefined){
        service = [];
      }
      else if (serviceProperty.constructor === Array){
        for (var i = 0; i < serviceProperty.length; i++){
          if (serviceProperty[i].profile === "http://www.w3.org/ns/ldp#inbox") {
            //returns the first service object with the correct context
            service.push(serviceProperty[i]);
          }
        }
      }
      else if (_this.data.manifest.jsonLd.service.profile === "http://www.w3.org/ns/ldp#inbox"){
        service.push(_this.data.manifest.jsonLd.service);
      }
      //else {
        //no service object with the right context is found
        //service = [];
      //}
      if (service.length > 0){
        var service_url = service[0]["@id"];

          var inboxRequest = jQuery.ajax({
            url: service_url,
            dataType: 'json',
            async: true
          });

          inboxRequest.done(function(data){
              // 0 index means its only going to get the first notification
            for (i = 0; i < data.contains.length; i++){
            //var note_url = data.contains[0].url;
            _this.notification_urls.push(data.contains[i].url);
            }
            console.log(_this);
            _this.injectButtonToMenu(data.contains.length, _this.data.appendTo);
            //$(".window-manifest-navigation").append("<a href='#' id='notifications'><i class='material-icons'>add_alert</i>" + data.contains.length + "</a>");
          });
        }
  },
  showNotifications: function(){
    var _this = this;
    //var response = confirm("There is an available table of contents for this codex published by the Scholastic Commentaries and Text Archive (http://scta.info). Would you like to retrieve this table of contents?");
    //if (response === true){
    //jQuery(document.body).append("<div id='notifications-wrapper'><h1>Notifications of Related Content</h1><ul></ul></div>");
    this.injectNotificationListToDom();
    for (i = 0; i < _this.notification_urls.length; i++){
      note_url = _this.notification_urls[i];
      var notificationRequest = jQuery.ajax({
        url: note_url,
        dataType: 'json',
        async: true
      });
      notificationRequest.done(function(data){
        var range_url = data.object;
        _this.injectNotificationListItemToDom(range_url);
        //jQuery("#notifications-wrapper").append("<li><a href='#' class='supplement' data-url='" + range_url + "'>" + range_url + "</a></li>")
      });
    }
  },
  retrieveData: function(url){
    var _this = this;
    var rangeRequest = jQuery.ajax({
      url: url,
      dataType: 'json',
      async: true
    });
    rangeRequest.done(function(data){
      _this.data.manifest.jsonLd.structures = data.ranges;

      _this.data.eventEmitter.publish('structuresUpdated', _this.data.id);
    });
  }
};

$(document).ready(function(){
  Ldn.init(myMiradorInstance);
});
