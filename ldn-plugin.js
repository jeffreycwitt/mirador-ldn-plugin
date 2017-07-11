var Ldn = {
  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    "de": {
      "notificationModalTitle": "Mitteilung",
      "notificationTooltip": "??",
      "notificationModalMsg": "????",
      "supplementBtn": "??"
    },
    "en": {
      "notificationModalTitle": "Notifications",
      "notificationTooltip": "Open notification inbox",
      "notificationModalMsg": "There are supplemental contents available for this document:",
      "supplementBtn": "Retrieve"
    },
    "fr": {
      "notificationModalTitle": "Notifications",
      "notificationTooltip": "Ouvrir la boîte de notifications",
      "notificationModalMsg": "Des contenus additionnels existent pour ce document :",
      "supplementBtn": "Récupérer"
    }
  },

  notificationButtonTemplate: Mirador.Handlebars.compile([
    '<a href="javascript:;" role="button" title="{{t "notificationTooltip"}}" aria-label="{{t "notificationTooltip"}}" class="mirador-btn mirador-btn-inbox mirador-tooltip">',
      '<i class="fa fa-bell fa-lg fa-fw"></i>',
      '<span class="badge-container">',
        '<span class="badge-count">{{count}}</span>',
      '</span>',
    '</a>',
  ].join('')),

  // notificationListTemplate: Mirador.Handlebars.compile([
  //   '<div class="notifications-wrapper">',
  //     '<h1>{{t "notifications"}}</h1>',
  //     '<ul class="notifications-wrapper-list"></ul>',
  //   '</div>'
  // ].join('')),

  // notificationListItemTemplate: Mirador.Handlebars.compile([
  //   "<li><a href='javascript:;' class='supplement' data-url='{{notification}}' data-id='{{id}}'>{{notification}}</a></li>"
  // ].join('')),

  notificationTemplate: Mirador.Handlebars.compile([
    '<div class="notifications-wrapper">',
      '<p>{{t "notificationModalMsg"}}</p>',
      '<ul class="notifications-wrapper-list">',
        '<li>',
          '<div class="supplement-button">',
            '<a href="javascript:;" class="supplement mirador-btn-supplement btn btn-success" data-url="{{notification}}" data-id="{{id}}">{{t "supplementBtn"}}</a>',
          '</div>',
          '<div class="supplement-info">',
            '<p><a href="{{notification}}" rel="noopener" target="_blank">{{notification}}</a></p>',
          '</div>',
        '</li>',
      '</ul>',
    '</div>'
  ].join('')),

  // notificationTemplate: Mirador.Handlebars.compile([
  //   '<table class="notifications-wrapper">',
  //     '<tr>',
  //       "<li><a href='javascript:;' class='supplement' data-url='{{notification}}' data-id='{{id}}'>{{notification}}</a></li>",
  //     '</tr>',
  //   '</table>'
  // ].join('')),

  /* initializes the plugin */
  init: function(miradorInstance){
    var _this = this;

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
  // injectNotificationListToDom: function(slot){
  //   //console.log($(slot))
  //   //$(slot).append(this.notificationListTemplate());
  //   //$(slot).append(this.notificationsDialogTemplate());
  // },

  // injectNotificationListItemToDom: function(notification, slot, id){
  //   //$(slot).find("#notifications-wrapper-list").append(this.notificationListItemTemplate({
  //   //$(slot).find("#notifications-wrapper-list").append(this.notificationTemplate({
  //   //$(slot).find("#notifications-wrapper-list").append(this.notificationTemplate({
  //   this.notificationTemplate({
  //     "notification": notification,
  //     "id": id
  //   });
  //   //}));
  // },

  /* adds event handlers mirador */
  addEventHandlers: function(){
    var _this = this

    $(document).on("click", ".mirador-btn-inbox", function(e){
      // if ($(e.target).hasClass("selected")){
      //   $(e.target).removeClass("selected")
      //   _this.removeNotifications(e);
      // }
      // else{
      //   $(e.target).addClass("selected")
      //   _this.showNotifications(e);
      // }
      // if{
      //   $(e.target).addClass("selected")
      _this.showNotifications(e);
      // }
    }.bind(this));

    // $(document).on("click", "#notifications", function(e){
    //   if ($(e.target).hasClass("selected")){
    //     $(e.target).removeClass("selected")
    //     _this.removeNotifications(e);
    //   }
    //   else{
    //     $(e.target).addClass("selected")
    //     _this.showNotifications(e);
    //   }
    // }.bind(this));

    $(document).on("click", ".supplement", function(e){
      var url = $(e.target).attr("data-url");
      var id = $(e.target).attr("data-id");
      _this.retrieveData(url, id);
      bootbox.hideAll();
    }.bind(this));

    // $(document).on("click", "#notifications-close", function(e){
    //   _this.removeNotifications(e);
    // }.bind(this));
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

  // removeNotifications: function(e){
  //   $(e.target).closest(".slot").find("#notifications-wrapper").css({"display": "none"});
  // },

  showNotifications: function(e){
    var _this = this;
    new Mirador.DialogBuilder().dialog({
      title: i18next.t("notificationModalTitle"),
      message: jQuery(_this.notificationTemplate(_this.tplData)),
      closeButton: true,
      className: 'mirador-dialog',
      backdrop: true,
      onEscape: true,
      size: 'large'
    });
    //$(e.target).closest(".slot").find("#notifications-wrapper").css({"display": "block"});
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
            _this.injectButtonToMenu(data.contains.length, _this.data.appendTo);
            //$(".window-manifest-navigation").append("<a href='#' id='notifications'><i class='material-icons'>add_alert</i>" + data.contains.length + "</a>");
            _this.insertNotifications();
          });

        }
  },

  insertNotifications: function(){
    var _this = this;
    //var response = confirm("There is an available table of contents for this codex published by the Scholastic Commentaries and Text Archive (http://scta.info). Would you like to retrieve this table of contents?");
    //if (response === true){
    //jQuery(document.body).append("<div id='notifications-wrapper'><h1>Notifications of Related Content</h1><ul></ul></div>");
    var slot = _this.data.appendTo
    console.log("slot", slot)
    //this.injectNotificationListToDom(slot);
    for (i = 0; i < _this.notification_urls.length; i++){
      note_url = _this.notification_urls[i];
      var notificationRequest = jQuery.ajax({
        url: note_url,
        dataType: 'json',
        async: true
      });
      notificationRequest.done(function(data){
        var range_url = data.object;
        //_this.injectNotificationListItemToDom(range_url, slot, _this.data.id);
        // _this.notificationTemplate({
        //   "notification": range_url,
        //   "id": _this.data.id
        // });
        _this.tplData = {
          "notification": range_url,
          "id": _this.data.id
        };
        //jQuery(_this.notificationTemplate(_this.tplData)).appendTo(slot);
        //jQuery("#notifications-wrapper").append("<li><a href='#' class='supplement' data-url='" + range_url + "'>" + range_url + "</a></li>")
      });
    }
  },

  retrieveData: function(url, id){
    var _this = this;
    var rangeRequest = jQuery.ajax({
      url: url,
      dataType: 'json',
      async: true
    });
    rangeRequest.done(function(data){
      // could get the slot id from the dom, use this id to find the manifest
      // in thie _this.data.state object for this slot
      _this.data.manifest.jsonLd.structures = data.ranges;

      _this.data.eventEmitter.publish('structuresUpdated.' + id);
    });
  },
};

$(document).ready(function(){
  Ldn.init(myMiradorInstance);
});
