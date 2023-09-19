let initTracker = document.getElementById("initiativeTracker");
let initSearch = document.getElementById("initSearch");
let mapUpdateInterval = 1000;
let mapData;
let oldData;
let isDM = false;
let selectedTracker = -1;
let selectedTokenData;

//Detail screen
let detailsScreen = document.getElementById("detailsScreen");
let tokenImage = document.getElementById("detailsIcon").children[0];
let currentHitpointsInput = document.getElementById("currentHitpoints");
let maxHitpointsInput = document.getElementById("maxHitpoints");
let armorClassInput = document.getElementById("armorClass");
let nameInput = document.getElementById("detailsNameInput");
let statusInput = document.getElementById("detailsStatusInput");
let initiativeInput = document.getElementById("detailsInitiative");
let groupInput = document.getElementById("detailsGroup");
let concentratingInput = document.getElementById("concentrating");

while (getCookie("playerName") == "")
{
    clientName = prompt("Please enter you name:");
    setCookie("playerName", clientName);
}

if (getCookie("isDM") == "")
{
    isDM = confirm("Are you the DM?");
    if (isDM)
        setCookie("isDM", "1");
    else
        setCookie("isDM", "0");
}
else
{
    isDM = getCookie("isDM")=="1";
}

updateMapData();
setInterval(function() {updateMapData();}, mapUpdateInterval);

async function updateMapData(force) {
    mapData = await requestServer({c: "currentMapData"});
    let stringData = JSON.stringify(mapData);
    if (oldData != stringData || force)
    {
        updateTracker();
        oldData = stringData;
        if (oldData) {
            oldParsedData = JSON.parse(oldData);
        }
    }
    else
    {
        console.log("Data is identical, not updating!");
    }
}

function updateTracker() {
    initTracker.innerHTML = "";
    for (let token of mapData['tokens'])
    {
        if (CheckTokenPermission(token))
        {
            if (initSearch.value!="") {
                if (token.name) {
                    if (token.name.toLowerCase().includes(initSearch.value.toLowerCase()) || !token.dm) {
                        if (!token.hideTracker)
                            drawInitItem(token);
                    }
                }
            } else {
                if (token.name)
                    if (!token.hideTracker)
                        drawInitItem(token);
            }
            
        }
    }
    updateTrackerHighlight();
    updateDetailScreen();
}

function updateDetailScreen()
{
    updateSelectedTokenData();
    if (selectedTokenData)
    {
        if (selectedTokenData.image)
        {
            if (mapData.tokenList.includes(selectedTokenData.image))
            { tokenImage.src = "public/tokens/" + selectedTokenData.image; }
            else
            { tokenImage.src  = "public/dmTokens/" + selectedTokenData.image; }
        }
        else
        {
            tokenImage.src = "public/blankToken.png";
        }
        currentHitpointsInput.value = selectedTokenData.hp?selectedTokenData.hp.split("/")[0]:"";
        maxHitpointsInput.value = selectedTokenData.hp?selectedTokenData.hp.split("/")[1]:"";
        armorClassInput.value = selectedTokenData.ac?selectedTokenData.ac:"";
        nameInput.value = selectedTokenData.name?selectedTokenData.name:"";
        statusInput.value = selectedTokenData.status?selectedTokenData.status:"";
        initiativeInput.value = selectedTokenData.initiative?selectedTokenData.initiative:"";
        groupInput.value = selectedTokenData.group?selectedTokenData.group:"";
        concentratingInput.style.backgroundColor = selectedTokenData.concentrating?getComputedStyle(document.body).getPropertyValue("--toggle-highlighted-color"):"";
    }
}

function CheckTokenPermission(token) {
    if (token==null)
        return false;
    if (token.dm!=null)
    {
        if (token.dm)
        {
            if (isDM)
                return true;
            else
                return false;
        }
        else 
            return true;
    }
    else
    {
        if (token.image!=null)
        {
            if (mapData.tokenList.includes(token.image))
                return true;
            else
            {
                if (isDM)
                    return true;
                else
                    return false
            }
        }
    }
}

function drawInitItem(token) {
    let initItem = document.createElement("div");
    initItem.className = "initiativeItem oneLineInitiative";
    initItem.setAttribute("id", token.id);
    initItem.setAttribute("dm", token.dm);
        let initiative = document.createElement("div");
        initiative.className = "initiative";
        initiative.innerText = token.initiative?Math.floor(token.initiative):"";
        initItem.appendChild(initiative);
        let trackerName = document.createElement("div");
        trackerName.className = "trackerName";
        trackerName.innerText = token.name?token.name:"";
        initItem.appendChild(trackerName);
        let trackerArmorClass = document.createElement("div");
        trackerArmorClass.className = "trackerArmorClass";
        trackerArmorClass.innerText = token.ac?token.ac:"";
        initItem.appendChild(trackerArmorClass);
        let trackerArmorClassText = document.createElement("div");
        trackerArmorClassText.className = "trackerArmorClassText";
        trackerArmorClassText.innerText = "AC";
        initItem.appendChild(trackerArmorClassText);
        let trackerHitpointsSection = document.createElement("div");
        trackerHitpointsSection.className = "trackerHitpointsSection";
            let trackerHitpointsMax = document.createElement("div");
            trackerHitpointsMax.className = "trackerHitpointsMax";
            trackerHitpointsMax.innerText = token.hp?token.hp.split("/")[1]:"";
            trackerHitpointsSection.appendChild(trackerHitpointsMax);
            trackerHitpointsSection.innerHTML += "\n/\n";
            let trackerHitpoints = document.createElement("div");
            trackerHitpoints.className = "trackerHitpoints";
            trackerHitpoints.innerText = token.hp?token.hp.split("/")[0]:"";
            trackerHitpointsSection.appendChild(trackerHitpoints);
            let trackerDamageButton = document.createElement("button");
            trackerDamageButton.className = "trackerDamageButton";
                let trackerDamageButtonImage = document.createElement("img");
                trackerDamageButtonImage.src = "images/swap_vert-24px.svg";
                trackerDamageButtonImage.style.pointerEvents = "none";
                trackerDamageButton.appendChild(trackerDamageButtonImage);
            trackerDamageButton.onclick = async function(e) {
                e.preventDefault();
                e.stopPropagation();
                let damage = parseInt(prompt("Enter the damage to deal to this token: "));
                if (!isNaN(damage))
                {
                    if (token.hp != null)
                    {
                        await requestServer({c: "editToken", id: token.id, hp: (token.hp.split("/")[0] - damage).toString() + "/" + token.hp.split("/")[1]});
                        updateMapData();
                    }
                }
            }
            trackerHitpointsSection.appendChild(trackerDamageButton);
        initItem.appendChild(trackerHitpointsSection);
        let trackerHealthText = document.createElement("div");
        trackerHealthText.className = "trackerHealthText";
        trackerHealthText.innerText = "HP";
        initItem.appendChild(trackerHealthText);
    initItem.onclick = function(e) {
        selectedTracker = token.id;
        updateTrackerHighlight();
        updateDetailScreen();
        e.stopImmediatePropagation();
    }
    initTracker.appendChild(initItem);
}

function updateTrackerHighlight() {
    for (let currentInitTracker of initTracker.children)
    {
        if (currentInitTracker.tagName=="DIV")
        {
            if (currentInitTracker.id == selectedTracker) {
                if (currentInitTracker.getAttribute("dm") == "true")
                    currentInitTracker.style.backgroundColor = "#a14b28";
                else
                    currentInitTracker.style.backgroundColor = "#3b3b96";
            }
            else if (currentInitTracker.id != "")
            {
                if (currentInitTracker.getAttribute("dm") == "true")
                    currentInitTracker.style.backgroundColor = "#614d45";
                else
                    currentInitTracker.style.backgroundColor = "#424254";    
            }
        }
    }
}

initTracker.onclick = function() {
    selectedTracker = -1;
    updateTrackerHighlight();
    updateSelectedTokenData();
}

initSearch.oninput = function() {
    updateTracker();
}

initiativeInput.oninput = async function() {
    updateSelectedTokenData();
    let newInit = parseFloat(initiativeInput.value);
    if (CheckTokenPermission(selectedTokenData))
    {
        if (isNaN(newInit))
            await requestServer({c: "editToken", id: selectedTracker, initiative: "reset"});
        else
            await requestServer({c: "editToken", id: selectedTracker, initiative: newInit});
    }   
    updateMapData();
}

nameInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        await requestServer({c: "editToken", id: selectedTracker, name: nameInput.value});
    updateMapData();
}

armorClassInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        await requestServer({c: "editToken", id: selectedTracker, ac: armorClassInput.value});
    updateMapData();
}

currentHitpointsInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        await requestServer({c: "editToken", id: selectedTracker, hp: currentHitpointsInput.value + "/" + maxHitpointsInput.value});
    }
    updateMapData();
}

maxHitpointsInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        await requestServer({c: "editToken", id: selectedTracker, hp: currentHitpointsInput.value + "/" + maxHitpointsInput.value});
    updateMapData();
}

statusInput.oninput = async function() {
    updateSelectedTokenData();
    await requestServer({c:"editToken", id: selectedTracker, status: statusInput.value});
    updateMapData();
}

groupInput.oninput = async function() {
    let newGroupId = parseInt(groupInput.value);
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        if (newGroupId)
            await requestServer({c:"editToken", id: selectedTracker, group: newGroupId});
        else
            await requestServer({c:"editToken", id: selectedTracker, group: "reset"});
    }
    updateMapData();
}

concentratingInput.onclick = async function() {
    updateSelectedTokenData();
    if (selectedTracker!=-1)
        await requestServer({c:"editToken", id: selectedTracker, concentrating: !selectedTokenData.concentrating});
    updateMapData();
}

function updateSelectedTokenData()
{
    checkDetailsScreen();
    for (let token of mapData.tokens)
        if (token.id == selectedTracker)
            selectedTokenData = token;
}

function checkDetailsScreen()
{
    if (selectedTracker!=-1)
        detailsScreen.style.display = "grid";
    else
        detailsScreen.style.display = "none";    
}

async function requestServer(data)
{
    const rawResponse = await fetch('/api', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const content = await rawResponse.text();
    return JSON.parse(content);
}

//#region Cookies
function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for( let i = 0; i < ca.length; i++) {
        let c = ca[i];
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
