let GridActive = true;
let GridColor = "#222222FF";
let blockColorPlayer = "#000000FF";
let blockColorDM = "#00000099";
let shapeColor = "#FF0000";
let shapeWidth = 2;
let GridLineWidth = 1;
var map = document.getElementById("map");
var loadedMap = document.getElementById("hiddenMapLoader");
var shapeMap = document.getElementById("shapeMap");
var hitboxMap = document.getElementById("hitboxMap");
var tokensDiv = document.getElementById("tokens");
var blockersDiv = document.getElementById("blockers");
var mapCanvas;
var shapeCanvas;
var hitboxCanvas;
var mapData;
var gridSize;
let mapUpdateInterval = 2000;
let tokenDragOffset = {x: 0, y: 0};
let blockerDragOffset = {x: 0, y: 0};
let blockerMarkers = {x: 0, y: 0, width: 0, height: 0};
let circleMarkers = {x: 0, y: 0, radius: 0};
let squareMarkers = {x: 0, y: 0, width: 0, height: 0};
let lineMarkers = {x: 0, y: 0, destX: 0, destY: 0, range: 100};
var isDM = false;
var clientName = getCookie("playerName");
let feetPerSquare = 5;
let isPlacingBlocker = false;
let isPlacingSquare = false;
let isPlacingLine = false;
let pauseBlockerUpdate = false;

window.onload = function() {
    if (getCookie("isDM")==1)
    {
        isDM = true;
    }

    while (clientName=="")
    {
        clientName = prompt("Please enter you name:");
        setCookie("playerName", clientName);
    }
}



MainScript();
async function MainScript() {
    mapCanvas = map.getContext("2d");
    hitboxCanvas = hitboxMap.getContext("2d");
    shapeCanvas = shapeMap.getContext("2d");
    await UpdateMapData();
    setInterval(function() {UpdateMapData();}, mapUpdateInterval);
    drawCanvas();
}

async function UpdateMapData() 
{
    console.log("Updating map");
    mapData = await RequestServer({c: "currentMapData", x: loadedMap.naturalWidth, y: loadedMap.naturalHeight});
    loadedMap.src = "/public/maps/"+mapData.map;
    loadedMap.onload = function() 
    {
        drawCanvas();
    }
}

//#region Drawing functions
function drawCanvas()
{
    clearCanvas();
    map.width = loadedMap.naturalWidth;
    map.height = loadedMap.naturalHeight;
    mapCanvas.strokeStyle = GridColor;
    mapCanvas.lineWidth = GridLineWidth;
    shapeMap.width = loadedMap.naturalWidth;
    shapeMap.height = loadedMap.naturalHeight;
    hitboxMap.width = loadedMap.naturalWidth;
    hitboxMap.height = loadedMap.naturalHeight;
    mapCanvas.translate(0.5, 0.5);
    shapeCanvas.translate(0.5, 0.5);
    hitboxCanvas.translate(0.5, 0.5);
    if (isDM)
    {
        document.body.style.setProperty("--blocker-color", "#00000080");
        document.body.style.setProperty("--token-index", 4);
    }
    else
    {
        document.body.style.setProperty("--blocker-color", "#000000");
        document.body.style.setProperty("--token-index", 2);
    }
    gridSize = (map.width/mapData.x + map.height/mapData.y)/2;
    drawBlockers();
    drawMap();
    if (GridActive)
        drawGrid();
    drawTokens();
    drawShapes();
}

function drawShapes()
{
    for (let k in mapData.drawings)
    {
        let currentShape = mapData.drawings[k];
        switch (currentShape.shape)
        {
            case "circle":
                drawCircle(k, currentShape);
                break;
            
            case "square":
                drawSquare(k, currentShape);
                break;

            case "line":
                drawLine(k, currentShape);
                break;
        }
    }
}

function drawCircle(index, shape) 
{
    shapeCanvas.strokeStyle = shapeColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.arc(shape.x, shape.y, shape.radius, 0, 2*Math.PI);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = (index*16).toString(16);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }
        
    colorString+=hex;
    //console.log(colorString);
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth*3;
    hitboxCanvas.beginPath();
    hitboxCanvas.arc(shape.x, shape.y, shape.radius, 0, 2*Math.PI);
    hitboxCanvas.stroke();
}

function drawSquare(index, shape) 
{
    shapeCanvas.strokeStyle = shapeColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.rect(shape.x, shape.y, shape.width, shape.height);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = (index*16).toString(16);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }
        
    colorString+=hex;
    //console.log(colorString);
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth*3;
    hitboxCanvas.beginPath();
    hitboxCanvas.rect(shape.x, shape.y, shape.width, shape.height);
    hitboxCanvas.stroke();
}

function drawLine(index, shape) 
{
    shapeCanvas.strokeStyle = shapeColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(shape.x, shape.y);
    shapeCanvas.lineTo(shape.destX, shape.destY);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = (index*16).toString(16);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }

    colorString+=hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth*3;
    hitboxCanvas.beginPath();
    hitboxCanvas.moveTo(shape.x, shape.y);
    hitboxCanvas.lineTo(shape.destX, shape.destY);
    hitboxCanvas.stroke();
}

function clearCanvas() 
{
    mapCanvas.clearRect(0, 0, map.width, map.height);
    shapeCanvas.clearRect(0, 0, shapeMap.width, shapeMap.height);
    hitboxCanvas.clearRect(0, 0, hitboxMap.width, hitboxMap.height);
}

function drawMap()
{
    mapCanvas.drawImage(loadedMap, 0, 0);
}

function drawBlockers() 
{
    if (!pauseBlockerUpdate)
    {
        blockersDiv.innerHTML = "";
        for (let i in mapData.blockers)
        {
            let currentBlocker = mapData.blockers[i];
            let tmpBlocker = document.createElement("div");
            let randomExtraBlocker = document.createElement("div");
            tmpBlocker.appendChild(randomExtraBlocker);
            tmpBlocker.className = "blocker";
            tmpBlocker.style.left = currentBlocker.x;
            tmpBlocker.style.top = currentBlocker.y;
            tmpBlocker.style.width = currentBlocker.width;
            tmpBlocker.style.height = currentBlocker.height;
            randomExtraBlocker.style.width = currentBlocker.width;
            randomExtraBlocker.style.height = currentBlocker.height;
            randomExtraBlocker.draggable = true;
            tmpBlocker.addEventListener("contextmenu", function(e) {
                e.preventDefault();
                let menuOptions = [];
                let DMoptions = [
                    {text: "Remove blocker", hasSubMenu: false, callback: function() {
                        RequestServer({c: "removeBlocker", id: currentBlocker.id});
                        UpdateMapData();
                    }}
                ];
                if (isDM)
                {
                    menuOptions.push(DMoptions[0]);
                }
                DisplayMenu(e, menuOptions);
            });
            if (isDM)
            {
                tmpBlocker.addEventListener("mousedown", function(e) {
                    pauseBlockerUpdate = true;
                })
                tmpBlocker.addEventListener("mouseup", function(e) {
                    pauseBlockerUpdate = false;
                    randomExtraBlocker.style.width = currentBlocker.width;
                    randomExtraBlocker.style.height = currentBlocker.height;
                    RequestServer({c: "editBlocker", id: currentBlocker.id, x: currentBlocker.x, y: currentBlocker.y, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                    UpdateMapData();
                })
                randomExtraBlocker.addEventListener("dragstart", function(e) {
                    pauseBlockerUpdate = true;
                    randomExtraBlocker.style.backgroundColor = "#000000";
                    blockerDragOffset.x = currentBlocker.x - e.pageX;
                    blockerDragOffset.y = currentBlocker.y - e.pageY;
                })
                randomExtraBlocker.addEventListener("dragend", function(e) {
                    pauseBlockerUpdate = false;
                    if (isDM)
                        randomExtraBlocker.style.backgroundColor = "#00000000";
                    let newX = e.pageX + blockerDragOffset.x;
                    let newY = e.pageY + blockerDragOffset.y;
                    RequestServer({c: "editBlocker", id: currentBlocker.id, x: newX, y: newY, width: currentBlocker.width, height: currentBlocker.height});
                    UpdateMapData();
                })
            }
            blockersDiv.appendChild(tmpBlocker);
        }
    }
}

function drawGrid()
{
    let gridX = map.width/mapData.x;
    let gridY = map.height/mapData.y;
    for (let x = 1; x <= mapData.x; x++)
    {
        mapCanvas.moveTo(x*gridX+0.5, 0.5);
        mapCanvas.lineTo(x*gridX+0.5, map.clientHeight+0.5);
    }    
    for (let y = 1; y <= mapData.y; y++)
    {
        mapCanvas.moveTo(0.5, y*gridY+0.5);
        mapCanvas.lineTo(map.clientWidth+0.5, y*gridY+0.5);
    }
    mapCanvas.stroke();
}

function drawTokens() 
{
    tokensDiv.innerHTML="";
    for (let i in mapData.tokens)
    {
        createToken(mapData.tokens[i]);
    }
}

function createToken(token) 
{
    let imageElement = document.createElement("img");
    if (mapData.tokenList.includes(token.image))
        imageElement.src = "public/tokens/"+token.image;
    else
        imageElement.src = "public/dmTokens/"+token.image;
    imageElement.className = "token";
    imageElement.style.width = (token.size * gridSize).toString()+"px";
    imageElement.style.height = (token.size * gridSize).toString()+"px";
    imageElement.style.top = token.y - (gridSize*token.size)/2;
    imageElement.style.left = token.x - (gridSize*token.size)/2;
    imageElement.title = token.status;
    imageElement.draggable = true;

    imageElement.addEventListener("dragstart", function(e) {
        tokenDragOffset.x = token.x - e.pageX;
        tokenDragOffset.y = token.y - e.pageY;
        startDrag(token.id);
    })

    imageElement.addEventListener("dragover", function(e) {
        e.preventDefault();
    })

    imageElement.addEventListener("dragend", async function(e) {
        if (isDraggingToken)
        {
            await RequestServer({c: "moveToken", id: draggingToken, x: e.pageX+tokenDragOffset.x, y: e.pageY+tokenDragOffset.y});
            UpdateMapData();
            isDraggingToken = false;
            draggingToken = -1;
        }
    })

    imageElement.addEventListener("contextmenu", function(e) {
        CloseMenu();
        CloseSubMenu();
        e.preventDefault();
        let menuOptions = [
            {text: "Remove token", hasSubMenu: false, callback: function() {
                RequestServer({c: "removeToken", id: token.id});
                UpdateMapData();
            }},
            {text: "Edit token", hasSubMenu: true, callback: function() {
                let subMenuOptions = [
                    {text: "Change size", callback: function() {
                        let tokenSize = parseInt(prompt("Please enter the size of the token"));
                        if (tokenSize!=null)
                        {
                            RequestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status});
                        }
                    }},
                    {text: "Change status", callback: function() {
                        let newStatus = prompt("Please enter the status of the token");
                        if (newStatus!=null)
                        {
                            RequestServer({c:"editToken", id: token.id, size: token.size, status: newStatus});
                        }
                    }}
                ];
                DisplaySubMenu(e, subMenuOptions);
            }}
        ]
        DisplayMenu(e, menuOptions);
    })
    tokensDiv.appendChild(imageElement);
}
//#endregion

//#region Drag/Drop
let isDraggingToken = false;
let draggingToken = -1;

shapeMap.addEventListener("dragover", function(e) {
    e.preventDefault();
})

function startDrag(id)
{
    console.log("dragging");
    draggingToken = id;
    isDraggingToken = true;
}
//#endregion

//#region Main event handlers
shapeMap.addEventListener("click", function(e) {
    if (isPlacingBlocker)
    {
        blockerMarkers.width = e.pageX-blockerMarkers.x;
        blockerMarkers.height = e.pageY-blockerMarkers.y;
        RequestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
        UpdateMapData();
        isPlacingBlocker = false;
    }
    if (isPlacingSquare)
    {
        squareMarkers.width = e.pageX - squareMarkers.x;
        squareMarkers.height = e.pageY - squareMarkers.y;
        RequestServer({c: "addDrawing", shape: "square", x: squareMarkers.x, y: squareMarkers.y, width: squareMarkers.width, height: squareMarkers.height, trueColor: shapeColor});
        UpdateMapData();
        isPlacingSquare = false;
    }
    if (isPlacingLine)
    {
        lineMarkers.destX = e.pageX;
        lineMarkers.destY = e.pageY;
        let dy = lineMarkers.destY-lineMarkers.y;
        let dx = lineMarkers.destX-lineMarkers.x;
        let distance = Math.sqrt(Math.pow((dx), 2) + Math.pow((dy), 2));
        if (distance>lineMarkers.range)
        {    
            lineMarkers.destX = lineMarkers.x + dx/distance*lineRange;
            lineMarkers.destY = lineMarkers.y + dy/distance*lineRange;
        }
        RequestServer({c: "addDrawing", shape: "line", x: lineMarkers.x, y: lineMarkers.y, destX: lineMarkers.destX, destY: lineMarkers.destY, trueColor: shapeColor});
        UpdateMapData();
        isPlacingLine = false;
    }
})

map.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    DisplayContextMenu(e);
})

shapeMap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    let pixel = hitboxCanvas.getImageData(e.pageX, e.pageY, 1, 1).data;
    if (pixel[0]==0 && pixel[1]==0 && pixel[2]==0 && pixel[3]==0)
    {
        DisplayContextMenu(e);
    }
    else
    {
        ShapeContextMenu(e, pixel);
    }
})

function ShapeContextMenu(e, pixel)
{
    
    let colorString = "#";
    let hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    console.log(hex);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }
    colorString+=hex;
    console.log(colorString);
    
    let shapeId = colorToSigned24Bit(colorString)/16;
    if (shapeId%1 == 0)
    {
        let menuOptions = [
            {text: "Erase shape", hasSubMenu: false, callback: function() {
                RequestServer({c: "removeDrawing", id: shapeId});
                UpdateMapData();
            }}
        ];
        DisplayMenu(e, menuOptions);
    }
}

function DisplayContextMenu(e)
{
    let listOptions = [
        {text: "Place Token", hasSubMenu: true, callback: async function() {
            let subMenu = [];
            let tokenList = mapData.tokenList;
            for (let i in tokenList)
            {
                let tmpElement = {};
                tmpElement.text = tokenList[i].substring(0, tokenList[i].length-4);
                tmpElement.callback = function() 
                {
                    let tokenSize = parseInt(prompt("Please enter the size of the token"));
                    if (tokenSize==null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: tokenList[i], size: tokenSize, status: ""})
                        console.log("Placing "+tokenList[i]+" with size"+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                    }
                }
                subMenu.push(tmpElement);
            }
            DisplaySubMenu(e, subMenu);
        }},
        {text: "Draw Circle", description: "Draws a circle at the position where the context menu was opened", hasSubMenu: false, callback: function() {
            let radiusInput = parseInt(prompt("Please enter the desired radius in feet for your circle(s)"));
            if (radiusInput!=null)
            {
                circleMarkers.radius = (radiusInput)/feetPerSquare*gridSize;
                circleMarkers.x = e.pageX;
                circleMarkers.y = e.pageY;
                RequestServer({c: "addDrawing", shape: "circle", x: circleMarkers.x, y: circleMarkers.y, radius: circleMarkers.radius, trueColor: shapeColor});
                UpdateMapData();
                CloseMenu();
                CloseSubMenu();
            }    
        }},
        {text: "Draw Square", hasSubMenu: false, description: "Upon clicking this button click somewhere else to define the bottom right corner", callback: function() {
            squareMarkers.x = e.pageX;
            squareMarkers.y = e.pageY;
            isPlacingSquare = true;
        }},
        {text: "Draw Line", hasSubMenu: false, callback: function() {
            let rangeInput = parseInt(prompt("Please enter the desired range of the line in feet, leave blank for none"));
            if (rangeInput!=null)
                lineMarkers.range = rangeInput/feetPerSquare*gridSize;
            else
                lineMarkers.range = 999;
            lineMarkers.x = e.pageX;
            lineMarkers.y = e.pageY;
            isPlacingLine = true;
        }}
    ]
    let DMoptions = [
        {text: "Place DM Token", hasSubMenu: true, callback: async function() {
            let subMenu = [];
            let tokenList = mapData.dmTokenList;
            for (let i in tokenList)
            {
                let tmpElement = {};
                tmpElement.text = tokenList[i].substring(0, tokenList[i].length-4);
                tmpElement.callback = function() 
                {
                    let tokenSize = parseInt(prompt("Please enter the size of the token"));
                    if (tokenSize==null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: tokenList[i], size: tokenSize, status: ""})
                        console.log("Placing "+tokenList[i]+" with size"+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                    }
                }
                subMenu.push(tmpElement);
            }
            DisplaySubMenu(e, subMenu);
        }},
        {text: "Place Blocker", description: "Upon clicking this button click somewhere else to define the bottom right corner", hasSubMenu: false, callback: async function() {
            blockerMarkers.x = e.pageX;
            blockerMarkers.y = e.pageY;
            isPlacingBlocker = true;
        }}
    ]
    if (isDM)
    {
        listOptions.push(DMoptions[0]);
        listOptions.push(DMoptions[1]);
    }
    DisplayMenu(e, listOptions);
}

window.onclick = function(event) 
{
    let ancestry = getAncestry(event.target);
    let shouldCloseMenus = true;
    for (let i in ancestry)
    {
        if (ancestry[i].className.includes("custom-menu")) { shouldCloseMenus = false; }
    }
    if (shouldCloseMenus) { 
        CloseMenu();
        CloseSubMenu();
    }
}
//#endregion

//#region Menu and Submenu
    let customMenu = document.getElementById("contextMenu");
    function DisplayMenu(event, listData) 
    {
        CloseMenu();
        CloseSubMenu();
        customMenu.innerHTML="";
        if (listData.length>0)
        {
            customMenu.style.display = "block";
            customMenu.style.top = event.pageY.toString()+"px";
            customMenu.style.left = event.pageX.toString()+"px";
            for (let p in listData)
            {
                let listItem = document.createElement('li');
                listItem.innerText = listData[p].text;
                listItem.className = "custom-menu-element";
                if (listData[p].description!=null)
                    listItem.title = listData[p].description;
                listItem.onclick = function() 
                {
                    listData[p].callback();
                    if (listData[p].hasSubMenu!=true)
                    {
                        CloseMenu();
                        CloseSubMenu();
                    }
                }
                customMenu.appendChild(listItem);
            }
        }
    }
    
    function CloseMenu() { customMenu.style.display = "none"; }

    let customSubMenu = document.getElementById("subContextMenu");
    function DisplaySubMenu(event, listData) 
    {
        customSubMenu.innerHTML="";
        if (listData.length>0)
        {
            customSubMenu.style.display = "block";
            customSubMenu.style.top = event.pageY.toString()+"px";
            customSubMenu.style.left = (event.pageX+customMenu.offsetWidth).toString()+"px";
            for (let p in listData) 
            {
                let listItem = document.createElement('li');
                if (listData[p].description!=null)
                    listItem.title = listData[p].description;
                listItem.innerText = listData[p].text;
                listItem.className = "custom-menu-element";
                listItem.onclick = function() 
                {
                    listData[p].callback();
                    CloseMenu();
                    CloseSubMenu();
                }
                customSubMenu.appendChild(listItem);
            }
        }
    }

    function CloseSubMenu() { customSubMenu.style.display = "none"; }
//#endregion

//#region Low level functions
function colorToSigned24Bit(s) {
    return (parseInt(s.substr(1), 16) << 8) / 256;
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function getAncestry(el) {
    let elements = [el];
    let p = el.parentElement;
    while (p !== document.children[0]) {
        elements.push(p);
        p = p.parentElement;
    }
    return elements;
}


async function RequestServer(data)
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

//#endregion

//#region cookies
export function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname) {
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
