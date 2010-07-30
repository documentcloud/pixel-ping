if not window.pixel_ping_tracked
  loc:       window.location
  titleEl:   document.getElementsByTagName("title").item(0)
  seperator: "|"
  titleText: titleEl.text.replace(/${"\" + seperator}/g, "") or ""
  url:       encodeURIComponent "${titleText}${seperator}${loc.protocol}//${loc.host}${loc.pathname}"
  img:       document.createElement 'img'
  img.setAttribute 'src', "<%= root %>/pixel.gif?key=${url}"
  img.setAttribute 'width', '1'
  img.setAttribute 'height', '1'
  document.body.appendChild img
  window.pixel_ping_tracked = yes