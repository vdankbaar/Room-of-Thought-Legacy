let playerNameInput = document.getElementById("playerNameInput");
let isDMInput = document.getElementById("isDMInput");
window.onload = function() {
    playerNameInput.value = getCookie("playerName");
    if (getCookie("isDM")==1)
        isDMInput.checked = true;
    else if (getCookie("isDM")==0)
        isDMInput.checked = false;
    else
    {
        setCookie("isDM", 0);
    }
}

playerNameInput.onchange = function() 
{
    setCookie("playerName", playerNameInput.value);
    console.log(playerNameInput.value);
}

isDMInput.onchange = function() {
    if (isDMInput.checked)
        setCookie("isDM", 1);
    else
        setCookie("isDM", 0);
}

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