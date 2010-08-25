(function() {
  var img, loc, seperator, titleEl, titleText, url;
  if (!window.pixel_ping_tracked) {
    loc = window.location;
    titleEl = document.getElementsByTagName("title").item(0);
    seperator = "|";
    titleText = titleEl.text.replace(new RegExp("" + ("\\" + seperator), "g"), "") || "";
    url = encodeURIComponent("" + (titleText) + (seperator) + (loc.protocol) + "//" + (loc.host) + (loc.pathname));
    img = document.createElement('img');
    img.setAttribute('src', "<%= root %>/pixel.gif?key=" + (url));
    img.setAttribute('width', '1');
    img.setAttribute('height', '1');
    document.body.appendChild(img);
    window.pixel_ping_tracked = true;
  }
})();
