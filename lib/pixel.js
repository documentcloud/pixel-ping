(function(){
  var img, loc, url;
  if (!window.propublica_tracked) {
    loc = window.location;
    url = encodeURIComponent(loc.protocol + '//' + loc.host + loc.pathname);
    img = document.createElement('img');
    img.setAttribute('src', ("<%= root %>/pixel.gif?key=" + (url)));
    img.setAttribute('width', '1');
    img.setAttribute('height', '1');
    document.body.appendChild(img);
    window.propublica_tracked = true;
  }
})();
