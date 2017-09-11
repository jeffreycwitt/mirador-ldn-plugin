var Ldn = {
  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    "de": {
      "notificationModalTitle": "Mitteilungen",
      "notificationTooltip": "Den Posteingang öffnen",
      "notificationModalMsg": "Es gibt ergänzende Inhalte verfügbar für dieses Dokument",
      "supplementBtn": "Hervorholen"
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

  notificationTemplate: Mirador.Handlebars.compile([
    '<div class="notifications-wrapper">',
      '<p>{{t "notificationModalMsg"}}</p>',
      '<ul class="notifications-wrapper-list">',
      '{{#each .}}',
        '<li>',
          '<div class="supplement-button">',
            '<a href="javascript:;" class="supplement mirador-btn-supplement btn btn-success" data-url="{{url}}" data-id="{{id}}">{{t "supplementBtn"}}</a>',
          '</div>',
          '<div class="supplement-info">',
            '<p><a href="{{url}}" rel="noopener" target="_blank">{{url}}</a></p>',
            '<div class="attribution-info" style="padding-left:10px; font-size:10px">',
              '<p>Description: {{description}}</p>',
              '<p>Attribution: {{attribution}}</p>',
              '<p>License: https://creativecommons.org/publicdomain/zero/4.0/</p>',
              '<img class="supplement-logo" src="{{logo}}"/>',
            '</div>',
          '</div>',
        '</li>',
        '{{/each}}',
      '</ul>',
    '</div>'
  ].join('')),

  /* initializes the plugin */
  init: function(miradorInstance){
    var _this = this;

    i18next.on('initialized', function(){
      this.addLocalesToViewer();
    }.bind(this));

    miradorInstance.eventEmitter.subscribe("ADD_WINDOW", function(event, data){
      _this.checkForNotifications(data);
    });
    this.addEventHandlers();
  },

  /* injects the notification button to the window menu */
  injectButtonToMenu: function(count, slot){
    console.log("buttonslot", slot);
    $(slot).find(".window-manifest-navigation").prepend(this.notificationButtonTemplate(
      {"count": count}
    ));
  },



  /* adds event handlers mirador */
  addEventHandlers: function(){
    var _this = this

    $(document).on("click", ".mirador-btn-inbox", function(e){
      _this.showNotifications(e);
    }.bind(this));

    $(document).on("click", ".supplement", function(e){
      var url = $(e.target).attr("data-url");
      var id = $(e.target).attr("data-id");
      _this.retrieveData(url, id);
      bootbox.hideAll();
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
  },

  checkForNotifications: function(data){
    this.notification_urls = [];
    this.data = data;
    var _this = this;
      var serviceProperty = _this.data.manifest.jsonLd.service;
      var service = [];
      //if (serviceProperty === undefined){
      if (true){ //forcing use of regional st. louis inbox for the moment
        //hard coded st. louis regional inbox
        service.push({"@id": "http://jpcloudusa015.nshostserver.net:33106/inbox/messages?target=" + _this.data.manifest.uri});
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
      else {
        //no service object with the right context is found
        //hard coded st. louis regional inbox
          service.push({"@id": "https://rerum-inbox.firebaseio.com/messages.json?orderBy=%22target%22&equalTo=%22" + _this.data.manifest.uri + "%22"});

      }
      console.log(service);
      if (service.length > 0){
        var service_url = service[0]["@id"];

          var inboxRequest = jQuery.ajax({
            url: service_url,
            dataType: 'json',
            async: true
          });

          inboxRequest.done(function(data){
            console.log(data)
            // 0 index means its only going to get the first notification
            for (i = 0; i < data.contains.length; i++){
              //var note_url = data.contains[0].url;
              _this.notification_urls.push(data.contains[i].object);
            }
            _this.injectButtonToMenu(data.contains.length, _this.data.appendTo);
            //$(".window-manifest-navigation").append("<a href='#' id='notifications'><i class='material-icons'>add_alert</i>" + data.contains.length + "</a>");
            _this.insertNotifications();
          });

        }
  },

  insertNotifications: function(){
    var _this = this;
    var slot = _this.data.appendTo
    _this.tplData = _this.notification_urls.map(function(notification){
      return {
        url: notification["@id"],
        attribution: notification.attribution,
        description: notification.description,
        logo: notification.logo,
        id: _this.data.id
      }

    });
    console.log("tplData", _this.tplData);
  },

  retrieveData: function(url, id){
    var _this = this;
    var rangeRequest = jQuery.ajax({
      url: url,
      dataType: 'json',
      async: true
    });
    rangeRequest.done(function(data){
      _this.data.manifest.jsonLd.structures = data.ranges;
      jQuery(_this.data.appendTo).find(".toc").remove();
      new Mirador.TableOfContents({
        structures: _this.data.manifest.getStructures(),
        appendTo: _this.data.appendTo.find('.tabContentArea'),
        windowId: _this.data.id,
        canvasID: _this.data.canvasID,
        manifestVersion: _this.data.manifest.getVersion(),
        eventEmitter: _this.data.eventEmitter
      });

      // seems like the below should give me full access to window but it doesn't
        //var windowObject = myMiradorInstance.saveController.getWindowObjectById(_this.data.id)
      //this is an odd way to get the window object, but the above doesn't seem to work
      slotAddress = _this.data.slotAddress;
      var windowObject = {}
      for (var i = 0; i < _this.data.state.slots.length; i++){
        if (_this.data.state.slots[i].layoutAddress === slotAddress){
          windowObject = _this.data.state.slots[i].window
        }
      }
      if (windowObject.sidePanelVisible === false){
         windowObject.sidePanelVisibility(true, '0.4s');
      }
    });
  },
};

$(document).ready(function(){
  Ldn.init(myMiradorInstance);
});
