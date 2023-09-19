let playerNameInput = document.getElementById("playerNameInput");
let isDMInput = document.getElementById("isDMInput");
document.getElementById("enterButton").onclick = function() {
    if (isDMInput.checked)
    {
        if (confirm("Are you sure that you are the DM?"))
            window.location = 'map.html';
        else
            isDMInput.checked = false;
    }
    else
        window.location = 'map.html';
}

window.onload = function() {
    playerNameInput.value = getCookie("playerName");
    if (getCookie("isDM") == 1) {
        document.body.style.setProperty("background-image", "url(images/Dungeonmaster.jpg)");
        isDMInput.checked = true;
    }
    else if (getCookie("isDM") == 0) {
        document.body.style.setProperty("background-image", "url(images/Player.jpg)");
        isDMInput.checked = false;
    }
    else {
        document.body.style.setProperty("background-image", "url(images/Player.jpg)");
        setCookie("isDM", 0);
    }
}

playerNameInput.onchange = function() {
    setCookie("playerName", playerNameInput.value);
}

isDMInput.onchange = function() {
    if (isDMInput.checked) {
        document.body.style.backgroundImage = "url(images/Dungeonmaster.jpg)";
        setCookie("isDM", 1);
    }
    else {
        document.body.style.backgroundImage = "url(images/Player.jpg)";
        setCookie("isDM", 0);
    }
        
}

//#region custom zoom
browser = "";
if(navigator.userAgent.indexOf("Chrome") != -1 )
{
    browser = "c";
}
else if (navigator.userAgent.indexOf("Firefox") != -1 )
{
    browser = "f";
}
else
{
    alert("Room of thought is only supported for firefox and chrome. Some features may be unavailable!");
}

if (browser=="c")
    document.body.style.zoom = (100/window.devicePixelRatio).toString()+"%";
if (browser=="f")
    document.body.style.transform = "scale("+(1/window.devicePixelRatio).toString()+")";
window.onzoom = function(e) {
    if (browser=="f")
        document.body.style.transform = "scale("+(1/window.devicePixelRatio).toString()+")";
    if (browser=="c")
        document.body.style.zoom = (100/window.devicePixelRatio).toString()+"%";
};

(function() {
	var oldresize = window.onresize;
	window.onresize = function(e) {
      var event = window.event || e;
      if(typeof(oldresize) === 'function' && !oldresize.call(window, event)) {
        return false;
      }
      if(typeof(window.onzoom) === 'function') {
        return window.onzoom.call(window, event);
      }
  }
})();
//#endregion

//#region cookies
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for( let i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}  

//#endregion