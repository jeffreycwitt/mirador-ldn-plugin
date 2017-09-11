# Mirador IIIF LDN Plugin

Use this plugin to enable Mirador to access an LDN inbox referenced by a IIIF manifest,
allowing end users to bring in end content as desired.

## Installation

Simply add the plugin files below your mirador initialization like so:

```js
myMiradorInstance = Mirador({
         "id": "viewer",
         "layout": "1x1",
         "data": [...]
       });
```

add the plugin below

```html
<link rel="stylesheet" type="text/css" href="ldn-plugin.css">
<script src="ldn-plugin.js"/>
```

The default name for instantiated instance is `myMiradorInstance`.
If you want to use another name go to `ldn-plugin.js` and pass the name of your Mirador instance to Ldn.init(yourInstanceNameHere) function. See below:

```js
$(document).ready(function(){
  Ldn.init(myMiradorInstance);
});
```

## Example

![example-gif](example.gif)

## References

* [LDN Specification](https://www.w3.org/TR/ldn/)

* [Draft Specification for LDN and IIIF Resources and Description of Regional Inbox at St. Louis University](https://centerfordigitalhumanities.github.io/inbox-docs/#!/specifications)

* [Slide deck of proposed (and speculative) IIIF Manifest and Notification Requirements](http://lombardpress.org/slides/2017-06-09-vatican-ldn)

## Contributors

Jeffrey C. Witt (Loyola University Maryland)
Régis Robineau (Biblissima)
