let gridDiv = document.getElementById("gridDiv");
let portalSelect = document.getElementById("portals");
let removeAll = document.getElementById("removeAll");
let detachAll = document.getElementById("detachAll");
let AttachAll = document.getElementById("attachAll");
let clearLifted = document.getElementById("clearLifted");
let updateInterval = 500;
let mapData;
let gridXSize = 50;
let gridYSize = 50;
let portalData = [];
let selectedPortal = -1;
let origin = {x: 0, y: 0};
let tokenMap = [];
let clientName = getCookie("playerName");
window.onload = function() {
    while (clientName == "")
    {
        clientName = prompt("Please enter you name:");
        setCookie("playerName", clientName);
    }
    Setup();
}

async function Setup()
{
    await updateLinks();
    setInterval(function() {updateLinks();}, updateInterval);
}

portalSelect.onchange = function()
{
    selectedPortal = portalSelect.value;
    updateLinks(true);
}

removeAll.onclick = async function() {
    portalData.links = [];
    await requestServer({c: 'setPortalData', x: portalData.portalX, y: portalData.portalY, name: portalData.name, links: JSON.stringify(portalData.links), id: parseInt(portalSelect.value)});
    updateLinks();
}

AttachAll.onclick = async function() {
    for (let link of portalData.links) { link.id = tokenMap[link.y][link.x]; }
    await requestServer({c: 'setPortalData', x: portalData.portalX, y: portalData.portalY, name: portalData.name, links: JSON.stringify(portalData.links), id: parseInt(portalSelect.value)});
    updateLinks();
}

detachAll.onclick = async function() {
    for (let link of portalData.links) { link.id = -1; }
    await requestServer({c: 'setPortalData', x: portalData.portalX, y: portalData.portalY, name: portalData.name, links: JSON.stringify(portalData.links), id: parseInt(portalSelect.value)});
    updateLinks();
}

clearLifted.onclick = async function() {
    await requestServer({c: 'setLiftedMinis', id: parseInt(portalSelect.value), lifted: JSON.stringify([])})
    updateLinks();
}

let previousMapData;
async function updateLinks(force)
{
    mapData = await requestServer({c: "currentMapData"});
    if (JSON.stringify(mapData)!=previousMapData || force)
    {
        if (mapData.portalData.length>0)
        {
            updatePortalSelect();
            if (portalSelect.value!="")
            {
                if (!mapData.portalData[portalSelect.value].crash)
                {
                    gridXSize = (mapData.mapX - mapData.offsetX)/mapData.x
                    gridYSize = (mapData.mapY - mapData.offsetY)/mapData.y
                    portalData = mapData.portalData[portalSelect.value]
                    setOrigin();
                    generateTokenMap();
                    drawLinks();
                }
                else
                {
                    if (!JSON.parse(previousMapData).portalData[portalSelect.value].crash)
                        alert("The portal has collapsed! Error: "+mapData.portalData[portalSelect.value].crash)
                    else
                    {
                        await requestServer({c: "clearPortals"});
                        updateLinks();
                    }
                }
            }
        }
    }
    previousMapData = JSON.stringify(mapData);   
}

function updatePortalSelect()
{
    if (document.activeElement!=portalSelect)
    {
        portalSelect.innerHTML = "";
        for (let portal of mapData.portalData)
        {
            let portalOption = document.createElement("option");
            portalOption.value = mapData.portalData.indexOf(portal);
            portalOption.innerText = mapData.portalData.indexOf(portal);
            portalSelect.appendChild(portalOption);
        }
        if (selectedPortal!=-1)
            portalSelect.value = selectedPortal;
    }
}

function drawLinks()
{
    gridDiv.innerHTML = "";
    for (let link of portalData.links)
    {
        let tokenData = {};
        for (let token of mapData.tokens)
            if (token.id == link.id)
                tokenData=token;
        let linkElement = document.createElement("div");
        linkElement.className = "link";
        if (link.id!=-1)
            linkElement.style.backgroundColor="#88BB88";
        let tokenImage = document.createElement("img");
        if (tokenData.image==null)
            tokenImage.src = "public/blankToken.png";
        else
        {
            if (mapData.tokenList.includes(tokenData.image))
                tokenImage.src = "public/tokens/"+tokenData.image;
            else
                tokenImage.src = "public/dmTokens/"+tokenData.image;
        }
        linkElement.appendChild(tokenImage);
        let namediv = document.createElement("div");
        if (tokenData.text!=null)
            namediv.innerText = tokenData.text;
        else
        {
            if (tokenData.name!=null)
            {
                if (!tokenData.dm)
                    namediv.innerText = tokenData.name;
                else
                    namediv.innerText = "DM Only!";
            }
                
            else
                namediv.innerText = "None";
        }
        linkElement.appendChild(namediv);
        let xDiv = document.createElement("div");
        xDiv.innerText = link.x;
        linkElement.appendChild(xDiv);
        let yDiv = document.createElement("div");
        yDiv.innerText = link.y;
        linkElement.appendChild(yDiv);
        let removeButton = document.createElement("input");
        removeButton.type = "button";
        removeButton.value = "Remove";
        removeButton.onclick = async function() {
            portalData.links.splice(portalData.links.indexOf(link), 1);
            await requestServer({c: 'setPortalData', x: portalData.portalX, y: portalData.portalY, name: portalData.name, links: JSON.stringify(portalData.links), id: parseInt(portalSelect.value)});
            updateLinks();
        }
        linkElement.appendChild(removeButton);
        let detachButton = document.createElement("input");
        detachButton.type = "button";
        detachButton.value = "Detach";
        detachButton.onclick = async function() {
            link.id = -1;
            await requestServer({c: 'setPortalData', x: portalData.portalX, y: portalData.portalY, name: portalData.name, links: JSON.stringify(portalData.links), id: parseInt(portalSelect.value)});
            updateLinks();
        }
        linkElement.appendChild(detachButton);
        let attachButton = document.createElement("input");
        attachButton.type = "button";
        attachButton.value = "Attach";
        attachButton.onclick = async function() {
            link.id = tokenMap[link.y][link.x];
            await requestServer({c: 'setPortalData', x: portalData.portalX, y: portalData.portalY, name: portalData.name, links: JSON.stringify(portalData.links), id: parseInt(portalSelect.value)});
            updateLinks();
        }
        linkElement.appendChild(attachButton);
        gridDiv.appendChild(linkElement);
    }
}

function setOrigin()
{
    for (let token of mapData.tokens)
    {
        if (token.text==portalData.name)
        {
            origin.x = Math.round((token.x-mapData.offsetX)/gridXSize-0.5*token.size);
            origin.y = Math.round((token.y-mapData.offsetY)/gridYSize-0.5*token.size);
        }
    }
}

function generateTokenMap()
{
    for (let i = 0; i < portalData.portalY; i++)
    {
        tokenMap.push([]);
        for (let j = 0; j < portalData.portalX; j++)
        {
            tokenMap[i].push(-1);
        }
    }

    for (let token of mapData.tokens)
    {
        let x = Math.round((token.x-mapData.offsetX)/gridXSize-0.5*token.size)-origin.x;
        let y = Math.round((token.y-mapData.offsetY)/gridYSize-0.5*token.size)-origin.y;
        
        for (let b = y; b < y+Math.ceil(token.size); b++)
        {
            for (let a = x; a < x+Math.ceil(token.size); a++)
            {
                if (b>=0 && b<portalData.portalY && a>=0 && b<portalData.portalX && token.text!=portalData.name)
                {
                    tokenMap[b][a]=token.id;
                }
            }
        }
    }
}


//#region Low level
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

function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    for(let c of document.cookie.split(';')) {
        while (c.charAt(0)==' ')
            c = c.substring(1);
        if (c.indexOf(cname)==0)
            return c.substring(cname.length+1, c.length);
    }
    return "";
}
//#endregion