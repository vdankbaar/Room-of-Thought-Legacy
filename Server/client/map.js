let GridActive = true;
let GridColor = "#222222FF";
let shapeColor = "#FF0000";
let shapeWidth = 2;
let hitboxMultiplier = 3;
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
let mapUpdateInterval = 1000;
let tokenDragOffset = {x: 0, y: 0};
let blockerDragOffset = {x: 0, y: 0};
let shapeDragOffset = {x: 0, y: 0};
let blockerMarkers = {x: 0, y: 0, width: 0, height: 0};
let circleMarkers = {x: 0, y: 0, radius: 0};
let squareMarkers = {x: 0, y: 0, width: 0, height: 0};
let lineMarkers = {x: 0, y: 0, destX: 0, destY: 0, range: 100};
var isDM = false;
var clientName = getCookie("playerName");
if (clientName=="")
    window.location.href = "/";
let feetPerSquare = 5;
let isPlacingBlocker = false;
let isPlacingSquare = false;
let isPlacingLine = false;
let isDraggingBlocker = false;
let draggedBlocker = {x: 0, y: 0};
let hiddenMapImportButton = document.getElementById("fileImport");
let isMovingShape = false;
let movingShapeId = 0;

window.onload = function() {
    if (getCookie("isDM")==1)
    {
        isDM = true;
        document.getElementById("hiddenDMCheckbox").checked = isDM;
    }
    else
    {
        document.getElementById("buttonDiv").removeChild(document.getElementById("importMap"));
        document.getElementById("buttonDiv").removeChild(document.getElementById("exportMap"));
        document.getElementById("buttonDiv").removeChild(document.getElementById("fileForm"));
        document.getElementById("buttonDiv").style.height = "13.5vh";
    }
        
    while (clientName=="")
    {
        clientName = prompt("Please enter you name:");
        setCookie("playerName", clientName);
    }
}

let exportButton = document.getElementById("exportMap");
exportButton.onclick = function() {
    RequestServer({c: "exportMap"});
    window.open("/public/export/currentSettings.json");
}

document.getElementById("toggleGridButton").onclick = function() {
    GridActive = !GridActive;
    drawCanvas();
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

document.getElementById("importMap").onclick = function() {
    hiddenMapImportButton.click();
}

hiddenMapImportButton.onchange = function() {
    console.log("Changed")
    document.getElementById("submitMap").click();
    UpdateMapData();
}

//#region Side buttons
let colorPicker = document.getElementById("shapeColorPicker");
colorPicker.onchange = function() {
    shapeColor = colorPicker.value;
}
//#endregion


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
        document.body.style.setProperty("--blocker-opacity", "0.5");
        document.body.style.setProperty("--token-index", 4);
    }
    else
    {
        document.body.style.setProperty("--blocker-opacity", "1");
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
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.arc(shape.x, shape.y, shape.radius, 0, 2*Math.PI);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(index)+1)*16).toString(16);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }
        
    colorString+=hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth*hitboxMultiplier;
    hitboxCanvas.beginPath();
    hitboxCanvas.arc(shape.x, shape.y, shape.radius, 0, 2*Math.PI);
    hitboxCanvas.stroke();
}

function drawSquare(index, shape) 
{
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.rect(shape.x, shape.y, shape.width, shape.height);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(index)+1)*16).toString(16);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }
        
    colorString+=hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth*hitboxMultiplier;
    hitboxCanvas.beginPath();
    hitboxCanvas.rect(shape.x, shape.y, shape.width, shape.height);
    hitboxCanvas.stroke();
}

function drawLine(index, shape) 
{
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(shape.x, shape.y);
    shapeCanvas.lineTo(shape.destX, shape.destY);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(index)+1)*16).toString(16);
    for (let f = 0; f<(6-hex.length); f++)
    {
        colorString += "0";
    }

    colorString+=hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth*hitboxMultiplier;
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
    if (!isDraggingBlocker)
    {
        blockersDiv.innerHTML = "";
        for (let i in mapData.blockers)
        {
            let currentBlocker = mapData.blockers[i];
            let tmpBlocker = document.createElement("div");
            let randomExtraBlocker = document.createElement("div");
            tmpBlocker.className = "blocker";
            tmpBlocker.style.left = currentBlocker.x;
            tmpBlocker.style.top = currentBlocker.y;
            tmpBlocker.style.width = currentBlocker.width;
            tmpBlocker.style.height = currentBlocker.height;
            if (isDM)
                tmpBlocker.style.resize = "both";
            randomExtraBlocker.style.width = currentBlocker.width;
            randomExtraBlocker.style.height = currentBlocker.height;
            if (isDM)
                randomExtraBlocker.draggable = true;
            tmpBlocker.appendChild(randomExtraBlocker);

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
                    isDraggingBlocker = true;
                })
                tmpBlocker.addEventListener("mouseup", function(e) {
                    isDraggingBlocker = false;
                    randomExtraBlocker.style.width = currentBlocker.width;
                    randomExtraBlocker.style.height = currentBlocker.height;
                    RequestServer({c: "editBlocker", id: currentBlocker.id, x: currentBlocker.x, y: currentBlocker.y, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                    UpdateMapData();
                })
                randomExtraBlocker.addEventListener("dragstart", function(e) {
                    isDraggingBlocker = true;
                    randomExtraBlocker.style.backgroundColor = "#000000";
                    blockerDragOffset.x = currentBlocker.x - e.pageX;
                    blockerDragOffset.y = currentBlocker.y - e.pageY;
                })
                randomExtraBlocker.addEventListener("dragend", function(e) {
                    e.preventDefault();
                    if (isDraggingBlocker)
                    {
                        isDraggingBlocker = false;
                        let newX = draggedBlocker.x + blockerDragOffset.x;
                        let newY = draggedBlocker.y + blockerDragOffset.y;
                        RequestServer({c: "editBlocker", id: currentBlocker.id, x: newX, y: newY, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                        UpdateMapData();
                    }
                    e.stopPropagation();
                })
                randomExtraBlocker.addEventListener("dragover", function(e) {
                    e.preventDefault();
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
    if (token.hidden!=null)
    {
        if (!isDM)
            return;
        let hiddenImage = document.createElement("img");
        hiddenImage.src = "public/hidden.png";
        hiddenImage.className = "hiddenToken";
        hiddenImage.style.width = (token.size * gridSize/3).toString()+"px";
        hiddenImage.style.height = (token.size * gridSize/3).toString()+"px";
        hiddenImage.style.top = token.y - (gridSize*token.size)/2;
        hiddenImage.style.left = token.x - (gridSize*token.size)/2;
        tokensDiv.appendChild(hiddenImage);
    }
    

    imageElement.addEventListener("dragstart", function(e) {
        tokenDragOffset.x = token.x - e.pageX;
        tokenDragOffset.y = token.y - e.pageY;
        draggingToken = token.id;
        isDraggingToken = true;
    })

    imageElement.addEventListener("dragover", function(e) {
        e.preventDefault();
    })

    imageElement.addEventListener("contextmenu", function(e) {
        CloseMenu();
        CloseSubMenu();
        e.preventDefault();
        let menuOptions = [
            {text: "Remove token", hasSubMenu: false, callback: async function() {
                let result = await RequestServer({c: "removeToken", id: token.id, tokensRemoved: mapData.removedTokens});
                if(result[0]==true)
                    UpdateMapData();
                else
                    alert("That token has already been removed by someone else");
            }},
            {text: "Edit token", hasSubMenu: true, callback: function() {
                let subMenuOptions = [
                    {text: "Change size", callback: function() {
                        let tokenSize = parseInt(prompt("Please enter the size of the token"));
                        if (tokenSize!=null)
                        {
                            if (isDM)
                            {
                                if (tokenSize < 20 && tokenSize>0)
                                    RequestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status});
                                else
                                    alert("The desired size is too large or invalid");
                            }
                            else
                            {
                                if (tokenSize < 6 && tokenSize>0)
                                    RequestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status});
                                else
                                    alert("That token size isn't allowed for players");
                            }   
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

shapeMap.addEventListener("dragend", function() {
    e.preventDefault();
    e.stopPropagation();
})

document.body.ondrop = async function(e) 
{
    e.preventDefault();
    e.stopPropagation();
    if (isDraggingToken)
    {
        await RequestServer({c: "moveToken", id: draggingToken, x: e.pageX+tokenDragOffset.x, y: e.pageY+tokenDragOffset.y});
        UpdateMapData();
        isDraggingToken = false;
        draggingToken = -1;
    }
    if (isDraggingBlocker)
    {
        draggedBlocker.x = e.pageX;
        draggedBlocker.y = e.pageY;
    }
}
//#endregion

//#region Main event handlers
shapeMap.addEventListener("mousedown", function(e) {
    if (e.button==0)
    {
        if (isPlacingBlocker)
        {
            if (isDM)
            {
                blockerMarkers.width = e.pageX-blockerMarkers.x;
                blockerMarkers.height = e.pageY-blockerMarkers.y;
                RequestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
                UpdateMapData();
            }
            isPlacingBlocker = false;
            return;
        }
        if (isPlacingSquare)
        {
            squareMarkers.width = e.pageX - squareMarkers.x;
            squareMarkers.height = e.pageY - squareMarkers.y;
            if (squareMarkers.width>=-map.width && squareMarkers.width<=map.width && squareMarkers.height>=-map.height && squareMarkers.height<=map.height)
            {
                RequestServer({c: "addDrawing", shape: "square", x: squareMarkers.x, y: squareMarkers.y, width: squareMarkers.width, height: squareMarkers.height, trueColor: shapeColor});
                UpdateMapData();
            }
            else
            {
                alert("That square was too large or too small");
            }
            isPlacingSquare = false;
            return;
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
                lineMarkers.destX = lineMarkers.x + dx/distance*lineMarkers.range;
                lineMarkers.destY = lineMarkers.y + dy/distance*lineMarkers.range;
            }
            RequestServer({c: "addDrawing", shape: "line", x: lineMarkers.x, y: lineMarkers.y, destX: lineMarkers.destX, destY: lineMarkers.destY, trueColor: shapeColor});
            UpdateMapData();
            isPlacingLine = false;
            return;
        }
        let pixel = hitboxCanvas.getImageData(e.pageX, e.pageY, 1, 1).data;
        if (!(pixel[0]==0 && pixel[1]==0 && pixel[2]==0))
        {
            let testString = "#"+decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
            let shapeId = colorToSigned24Bit(testString)/16;
            if (shapeId%1 == 0)
            {
                shapeId--;
                console.log("Picked up: "+shapeId);
                shapeMap.style.cursor = "pointer";
                shapeDragOffset.x = mapData.drawings[shapeId].x - e.pageX;
                shapeDragOffset.y = mapData.drawings[shapeId].y - e.pageY;
                movingShapeId = shapeId;
                isMovingShape = true;
            }
        }
    }
})

shapeMap.addEventListener("mouseup", function(e) {
    if (e.button==0 && isMovingShape)
    {
        isMovingShape = false;
        console.log("Dropped shape!");
        shapeMap.style.cursor = "auto";
        RequestServer({c: "editDrawing", id: movingShapeId, x: e.pageX + shapeDragOffset.x, y: e.pageY + shapeDragOffset.y});
        UpdateMapData();
    }
})

map.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    DisplayContextMenu(e);
})

shapeMap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    let pixel = hitboxCanvas.getImageData(e.pageX, e.pageY, 1, 1).data;
    if (pixel[0]==0 && pixel[1]==0 && pixel[2]==0)
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
    let testString = "#"+decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
    let shapeId = colorToSigned24Bit(testString)/16;
    if (shapeId%1 == 0)
    {
        shapeId--;
        let menuOptions = [
            {text: "Erase shape", hasSubMenu: false, callback: async function() {
                let result = await RequestServer({c: "removeDrawing", id: shapeId, removedDrawings: mapData.removedDrawings});
                if (result[0]==true)
                    UpdateMapData();
                else
                    alert("That drawing has already been removed by someone else!");
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
            let dmTokenList = mapData.dmTokenList;
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
                        if (isDM)
                        {
                            if (tokenSize < 20 && tokenSize>0)
                            {
                                RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: tokenList[i], size: tokenSize, status: ""})
                                console.log("Placing "+tokenList[i]+" with size"+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                            }
                            else
                            {
                                alert("The desired size is too large or invalid");
                            }
                        }
                        else
                        {
                            if (tokenSize < 6 && tokenSize>0)
                            {
                                RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: tokenList[i], size: tokenSize, status: ""})
                                console.log("Placing "+tokenList[i]+" with size"+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                            }
                            else
                            {
                                alert("That token size isn't allowed for players");
                            }
                        }
                    }
                }
                subMenu.push(tmpElement);
            }
            if (isDM)
            {
                for (let i in dmTokenList)
                {
                    let tmpElement = {};
                    tmpElement.text = dmTokenList[i].substring(0, dmTokenList[i].length-4);
                    tmpElement.callback = function() 
                    {
                        let tokenSize = parseInt(prompt("Please enter the size of the token"));
                        if (tokenSize==null)
                        {
                            alert("That wasn't a valid size! Please try again!");
                        }
                        else
                        {
                            RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: dmTokenList[i], size: tokenSize, status: ""})
                            console.log("Placing "+dmTokenList[i]+" with size"+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                        }
                    }
                    subMenu.push(tmpElement);
                }
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
            let rangeInput = parseInt(prompt("Please enter the desired range of the line in feet, leave blank for no range limit"));
            if (rangeInput!=null)
                lineMarkers.range = rangeInput/feetPerSquare*gridSize;
            else
                lineMarkers.range = 999999;
            lineMarkers.x = e.pageX;
            lineMarkers.y = e.pageY;
            isPlacingLine = true;
        }}
    ]
    let DMoptions = [
        {text: "Place hidden Token", hasSubMenu: true, callback: async function() {
            let subMenu = [];
            let tokenList = mapData.tokenList;
            let dmTokenList = mapData.dmTokenList;
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
                        if (tokenSize < 20 && tokenSize>0)
                        {
                            RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: tokenList[i], size: tokenSize, status: "", hidden: true})
                            console.log("Placing hidden "+tokenList[i]+" with size "+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                        }
                        else
                        {
                            alert("The desired size is too large or invalid");
                        }
                    }
                }
                subMenu.push(tmpElement);
            }
            if (isDM)
            {
                for (let i in dmTokenList)
                {
                    let tmpElement = {};
                    tmpElement.text = dmTokenList[i].substring(0, dmTokenList[i].length-4);
                    tmpElement.callback = function() 
                    {
                        let tokenSize = parseInt(prompt("Please enter the size of the token"));
                        if (tokenSize==null)
                        {
                            alert("That wasn't a valid size! Please try again!");
                        }
                        else
                        {
                            RequestServer({c: "createToken", x: e.pageX, y: e.pageY, image: dmTokenList[i], size: tokenSize, status: "", hidden: true})
                            console.log("Placing "+dmTokenList[i]+" with size"+tokenSize+" at "+e.pageX.toString()+":"+e.pageY.toString());
                        }
                    }
                    subMenu.push(tmpElement);
                }
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
            let tmpHeight = listData.length * 5;
            if (tmpHeight>25)
            {
                tmpHeight = 25;
                customMenu.style.overflowY = "scroll";
            }
            else
            {
                customMenu.style.overflowY = "auto";
            }
            customMenu.style.display = "block";
            let testx = event.pageX;
            let testy = event.pageY;
            customMenu.style.top = testy+"px";
            customMenu.style.left = testx+"px";
            customMenu.style.height = tmpHeight+"vh";
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
            if (event.pageX+customMenu.offsetWidth > (window.innerWidth+window.pageXOffset))
            {
                scrollBy(((event.pageX+customMenu.offsetWidth+10)-(window.innerWidth+window.pageXOffset)),0);
            }
            if (event.pageY+customMenu.offsetHeight > (window.innerHeight+window.pageYOffset))
            {
                scrollBy(0, ((event.pageY+customMenu.offsetHeight+10)-(window.innerHeight+window.pageYOffset)));
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
            let tmpHeight = listData.length * 5;
            if (tmpHeight>25)
            {
                tmpHeight = 25;
                customSubMenu.style.overflowY = "scroll";
            }
            else
            {
                customSubMenu.style.overflowY = "auto";
            }
            customSubMenu.style.display = "block";
            customSubMenu.style.height = tmpHeight+"vh";
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
            if (event.pageX+customMenu.offsetWidth*2 > (window.innerWidth+window.pageXOffset))
            {
                scrollBy(((event.pageX+customMenu.offsetWidth*2+10)-(window.innerWidth+window.pageXOffset)),0);
            }
        }
    }

    function CloseSubMenu() { customSubMenu.style.display = "none"; }
//#endregion

//#region Low level functions
function colorToSigned24Bit(s) {
    return (parseInt(s.substr(1), 16) << 8) / 256;
}

function decToHex(num)
{
    let tmpHex = num.toString(16);
    while (tmpHex.length<2)
    {
        tmpHex="0"+tmpHex;
    }
    return tmpHex;
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
