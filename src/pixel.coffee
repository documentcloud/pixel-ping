if not window.pixel_ping_tracked
  loc:       window.location
  titleEl:   document.getElementsByTagName("title").item(0)
  titleText: titleEl.text or ""
  url:       encodeURIComponent "${titleText}|${loc.protocol}//${loc.host}${loc.pathname}"
  img:       document.createElement 'img'
  img.setAttribute 'src', "<%= root %>/pixel.gif?key=${url}"
  img.setAttribute 'width', '1'
  img.setAttribute 'height', '1'
  document.body.appendChild img
  window.pixel_ping_tracked = yes