let GridActive = true;
let GridSnap = false;
let offsetX = 0;
let offsetY = 0;
let mapUpdateInterval = 1000;
let GridColor = "#222222FF";
let shapeColor = "#FF0000";
let shapeWidth = 2;
let hitboxMultiplier = 3;
let GridLineWidth = 1;
var map = document.getElementById("map");
var board = document.getElementById("board");
var loadedMap = document.getElementById("hiddenMapLoader");
var shapeMap = document.getElementById("shapeMap");
var hitboxMap = document.getElementById("hitboxMap");
var tokensDiv = document.getElementById("tokens");
var blockersDiv = document.getElementById("blockers");
var mapSourceSelect = document.getElementById("mapSource");
var mapXInput = document.getElementById("mapX");
var mapYInput = document.getElementById("mapY");
var offsetXInput = document.getElementById("offsetX");
var offsetYInput = document.getElementById("offsetY");
var initiativeTrackerDiv = document.getElementById("initiativeTracker");
let initiativeInput = document.getElementById("detailsInitiative");
let nameInput = document.getElementById("detailsNameInput");
let acInput = document.getElementById("armorClass");
let currentHpInput = document.getElementById("currentHitpoints");
let maxHpInput = document.getElementById("maxHitpoints");
let groupIdInput = document.getElementById("detailsGroup");
let statusInput = document.getElementById("detailsStatusInput");
let detailsIcon = document.getElementById("detailsIcon").children[0];
var mapCanvas;
var shapeCanvas;
var hitboxCanvas;
var mapData;
var gridSize;
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
let isPanning = false;
let oldMousePos = {x: 0, y: 0};
let oldScrollPos = {x: 0, y: 0};
let movingShapeId = 0;
let selectedToken;
let selectedTokenData;

window.onload = function() {
    if (getCookie("isDM")==1)
    {
        isDM = true;
        document.getElementById("hiddenDMCheckbox").checked = isDM;
    }
    else
    {
        let elementsToRemove = document.getElementsByClassName("dmOnly");
        for (let i = elementsToRemove.length-1; i>=0; i--)
            elementsToRemove[i].parentElement.removeChild(elementsToRemove[i]);
    }
        
    while (clientName=="")
    {
        clientName = prompt("Please enter you name:");
        setCookie("playerName", clientName);
    }
}

Setup();
async function Setup() {
    mapCanvas = map.getContext("2d");
    hitboxCanvas = hitboxMap.getContext("2d");
    shapeCanvas = shapeMap.getContext("2d");
    await UpdateMapData();
    for (let i = 0; i<mapData.mapSourceList.length; i++)
    {
        let tmpOption = document.createElement("option");
        tmpOption.value = mapData.mapSourceList[i];
        tmpOption.innerText = mapData.mapSourceList[i];
        mapSourceSelect.append(tmpOption);
    }
    mapSourceSelect.value=mapData.map;
    mapYInput.value = mapData.y;
    mapXInput.value = mapData.x;
    offsetXInput.value = mapData.offsetX;
    offsetYInput.value = mapData.offsetY;
    setInterval(function() {UpdateMapData();}, mapUpdateInterval);
    drawCanvas();
}

async function UpdateMapData() 
{
    console.log("Updating map");
    mapData = await RequestServer({c: "currentMapData", x: loadedMap.naturalWidth, y: loadedMap.naturalHeight});
    if (isDM)
        document.getElementById("exportMap").title = mapData.mapName+" : "+mapData.map;
    loadedMap.src = "/public/maps/"+mapData.map;
    offsetX = mapData.offsetX;
    offsetY = mapData.offsetY;
    loadedMap.onload = function() 
    {
        drawCanvas();
    }
}

//#region Side buttons
let exportButton = document.getElementById("exportMap");
exportButton.onclick = function() {
    RequestServer({c: "exportMap"});
    window.open("/public/export/currentSettings.json");
}

document.getElementById("toggleGridButton").onclick = function() {
    GridActive = !GridActive;
    updateButtonColors();
    drawCanvas();
}

document.getElementById("toggleSnapButton").onclick = function() {
    GridSnap = !GridSnap;
    updateButtonColors();
}

let displayMapSettings = false;
let mapOptionsMenu = document.getElementById("mapOptionsMenu");
document.getElementById("toggleSettingsButton").onclick = function() {
    if (displayMapSettings)
        mapOptionsMenu.style.display = "none";
    else
        mapOptionsMenu.style.display = "flex";
    displayMapSettings=!displayMapSettings;
    updateButtonColors();
}

let colorPicker = document.getElementById("shapeColorPicker");
colorPicker.onchange = function() {
    shapeColor = colorPicker.value;
}

document.getElementById("importMap").onclick = function() {
    hiddenMapImportButton.click();
}

hiddenMapImportButton.onchange = function() {
    console.log("Changed")
    document.getElementById("submitMap").click();
    UpdateMapData();
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
    updateTracker();
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
            let extraBlocker = document.createElement("div");
            tmpBlocker.className = "blocker";
            tmpBlocker.style.left = currentBlocker.x;
            tmpBlocker.style.top = currentBlocker.y;
            tmpBlocker.style.width = currentBlocker.width;
            tmpBlocker.style.height = currentBlocker.height;
            if (isDM)
            {
                tmpBlocker.style.resize = "both";
                extraBlocker.style.width = currentBlocker.width;
                extraBlocker.style.height = currentBlocker.height;
                extraBlocker.draggable = true;
            }
            else
            {
                extraBlocker.style.msUserSelect = "none";
                extraBlocker.style.webkitUserSelect = "none";
            }   
            tmpBlocker.appendChild(extraBlocker);

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
                    extraBlocker.style.width = currentBlocker.width;
                    extraBlocker.style.height = currentBlocker.height;
                    RequestServer({c: "editBlocker", id: currentBlocker.id, x: currentBlocker.x, y: currentBlocker.y, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                    UpdateMapData();
                })
                extraBlocker.addEventListener("dragstart", function(e) {
                    if (isDM)
                    {
                        isDraggingBlocker = true;
                        extraBlocker.style.backgroundColor = "#000000";
                        blockerDragOffset.x = currentBlocker.x - (e.pageX+board.scrollLeft);
                        blockerDragOffset.y = currentBlocker.y - (e.pageY+board.scrollTop);
                    }
                    else
                    {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                })
                extraBlocker.addEventListener("dragend", function(e) {
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
                extraBlocker.addEventListener("dragover", function(e) {
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
        mapCanvas.moveTo(x*gridX+offsetX+0.5, 0.5);
        mapCanvas.lineTo(x*gridX+offsetX+0.5, map.clientHeight+0.5);
    }    
    for (let y = 1; y <= mapData.y; y++)
    {
        mapCanvas.moveTo(0.5, y*gridY+offsetY+0.5);
        mapCanvas.lineTo(map.clientWidth+0.5, y*gridY+offsetY+0.5);
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
    imageElement.style.zIndex = token.layer+4;
    imageElement.title = token.status;
    imageElement.draggable = true;
    if (token.hidden!=null)
    {
        if (token.hidden == true)
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
    }
    if (token.id == selectedToken)
        imageElement.style.outline = "0.15vw dashed aqua";


    imageElement.addEventListener("click", function() {
        selectedToken = token.id;
        UpdateMapData();
        if (mapData.tokenList.includes(token.image))
        {
            detailsIcon.src = "public/tokens/"+token.image;
            if (token.ac==null)
                initiativeInput.value = ""
            else
                initiativeInput.value = token.initiative;
            nameInput.value = token.name;
            if (token.ac==null)
                acInput.value = "";
            else
                acInput.value = token.ac;
            if (token.hp==null)
            {
                currentHpInput.value = "";
                maxHpInput.value = "";
            }
            else
            {
                currentHpInput.value = token.hp.split("/")[0];
                maxHpInput.value = token.hp.split("/")[1];
            }
            if (token.status==null)
                statusInput.value = "No status";
            else
                statusInput.value = token.status;
            if (token.group==null)
                groupIdInput.value = "";
            else
                groupIdInput.value = token.group;
        }
        else
        {
            if (isDM)
            {
                detailsIcon.src  = "public/dmTokens/"+token.image;
                if (token.ac==null)
                    initiativeInput.value = ""
                else
                    initiativeInput.value = token.initiative;
                nameInput.value = token.name;
                if (token.ac==null)
                    acInput.value = "";
                else
                    acInput.value = token.ac;
                if (token.hp==null)
                {
                    currentHpInput.value = "";
                    maxHpInput.value = "";
                }
                else
                {
                    currentHpInput.value = token.hp.split("/")[0];
                    maxHpInput.value = token.hp.split("/")[1];
                }
                if (token.status==null)
                    statusInput.value = "No status";
                else
                    statusInput.value = token.status;
                if (token.group==null)
                    groupIdInput.value = "";
                else
                    groupIdInput.value = token.group;
            }
            else
            {
                nameInput.value = "DM only!";
                maxHpInput.value = "";
                currentHpInput.value = "";
                statusInput.value = "";
                initiativeInput.value = "";
                groupIdInput.value = "";
                acInput.value = "";
                detailsIcon.src = "";
            }
        }
            
        
    })

    imageElement.addEventListener("dragstart", function(e) {
        tokenDragOffset.x = token.x - (e.pageX+board.scrollLeft);
        tokenDragOffset.y = token.y - (e.pageY+board.scrollTop);
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
                if (selectedToken>token.id)
                    selectedToken-=1;
                if (token.id==selectedToken)
                {
                    initiativeInput.value = "";
                    nameInput.value = "";
                    acInput.value = "";
                    currentHpInput.value = "";
                    maxHpInput.value = "";
                    statusInput.value = "";
                    groupIdInput.value = "";
                    selectedToken = -1;
                }
                let result = await RequestServer({c: "removeToken", id: token.id, tokensRemoved: mapData.removedTokens});
                if(result[0]==true)
                    UpdateMapData();
                else
                    alert("That token has already been removed by someone else");
            }},
            {text: "Edit token", hasSubMenu: true, callback: function() {
                let subMenuOptions = [
                    {text: "Change size", callback: function() {
                        let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                        if (tokenSize!=null)
                        {
                            if (isDM)
                            {
                                if (tokenSize < 20 && tokenSize>0)
                                    RequestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: token.layer, group: token.group});
                                else
                                    alert("The desired size is too large or invalid");
                            }
                            else
                            {
                                if (tokenSize < 6 && tokenSize>0)
                                    RequestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: token.layer, group: token.group});
                                else
                                    alert("That token size isn't allowed for players");
                            }   
                        }
                    }},
                    {text: "Change layer", callback: function() {
                        let newLayer = parseInt(prompt("Please enter the desired height level"));
                        if (newLayer!=null)
                            RequestServer({c:"editToken", id: token.id, size: token.size, status: token.status, layer: newLayer, group: token.group});
                    }}
                ];
                DisplaySubMenu(e, subMenuOptions);
            }},
            {text: "Draw Shape", description: "Pick a shape to draw", hasSubMenu: true, callback: function() {
                let subMenuOptions = [
                    {text: "Draw Circle", callback: function() {
                        let radiusInput = parseFloat(prompt("Please enter the desired radius in feet for your circle(s)"));
                        if (radiusInput!=null)
                        {
                            circleMarkers.radius = (radiusInput+2.5*token.size)/feetPerSquare*gridSize;
                            RequestServer({c: "addDrawing", shape: "circle", link: token.id,  x: token.x, y: token.y, radius: circleMarkers.radius, trueColor: shapeColor});
                            UpdateMapData();
                            CloseMenu();
                            CloseSubMenu();
                        }
                    }}
                ];
                DisplaySubMenu(e, subMenuOptions);
            }}
        ];
        if (token.group!=null)
        {
            let groupOptions = {text: "Group options", hasSubMenu: true, callback: async function() {
                let subMenuOptions = [
                    {text: "Rotate group left", callback: function() {
                        RequestServer({c:"rotateLeft", id: token.id});
                    }},
                    {text: "Rotate group right", callback: function() {
                        RequestServer({c:"rotateRight", id: token.id});
                    }},
                    {text: "Unlink token", callback: function() {
                        RequestServer({c:"editToken", id: token.id, size: token.size, status: token.status, layer: token.layer, group: null})
                    }}
                ];
                DisplaySubMenu(e, subMenuOptions);
            }}
            menuOptions.push(groupOptions);
        }
        if (isDM)
        {
            if (token.hidden!=null && token.hidden == true)
            {
                menuOptions.push({text: "Reveal token", hasSubMenu: false, callback: async function() {
                    await RequestServer({c: "setTokenHidden", id: token.id, hidden: false});
                    UpdateMapData();
                }})
            }
            else
            {
                menuOptions.push({text: "Hide token", hasSubMenu: false, callback: async function() {
                    await RequestServer({c: "setTokenHidden", id: token.id, hidden: true});
                    UpdateMapData();
                }})
            }
            
        }
        
        DisplayMenu(e, menuOptions);
    })
    
    tokensDiv.appendChild(imageElement);
}

function updateTracker()
{
    initiativeTrackerDiv.innerHTML="";
    let initHeader = document.createElement("h3");
    initHeader.style = "margin-bottom: 0.3vw;";
    initHeader.innerText = "Initiative Tracker";
    initiativeTrackerDiv.append(initHeader);
    let tmpData = [];
    for (let i in mapData.tokens)
        tmpData.push(mapData.tokens[i]);
    tmpData.sort(function(a, b){
        return a.initiative == b.initiative ? 0 : +(a.initiative < b.initiative) || -1;
    });
    for (let i in tmpData)
    {
        if (tmpData[i].hidden==null)
            if (mapData.tokenList.includes(tmpData[i].image)||isDM)
                createTracker(tmpData[i]);
        else
        {
            if (tmpData[i].hidden)
            {
                if (isDM)
                    createTracker(tmpData[i]);
            }
            else
                if (mapData.tokenList.includes(tmpData[i].image)||isDM)
                    createTracker(tmpData[i]);
        }
    }
    initiativeTrackerDiv.removeChild(initiativeTrackerDiv.children[initiativeTrackerDiv.children.length-1]);
}

function createTracker(trackerData)
{
    if (trackerData.initiative!=null || trackerData.name!=null || trackerData.ac!=null || trackerData.hp!=null)
    {
        let tmpTrackerDiv = document.createElement("div");
        tmpTrackerDiv.className = "initiativeItem";
        tmpTrackerDiv.onclick = function() {
            selectedToken = trackerData.id;
            if (mapData.tokenList.includes(trackerData.image))
                detailsIcon.src = "public/tokens/"+trackerData.image;
            else
                detailsIcon.src  = "public/dmTokens/"+trackerData.image;
            UpdateMapData();
            if (trackerData.ac==null)
                initiativeInput.value = ""
            else
                initiativeInput.value = trackerData.initiative;
            nameInput.value = trackerData.name;
            if (trackerData.ac==null)
                acInput.value = "";
            else
                acInput.value = trackerData.ac;
            if (trackerData.hp==null)
            {
                currentHpInput.value = "";
                maxHpInput.value = "";
            }
            else
            {
                currentHpInput.value = trackerData.hp.split("/")[0];
                maxHpInput.value = trackerData.hp.split("/")[1];
            }
            if (trackerData.status==null)
                statusInput.value = "No status";
            else
                statusInput.value = trackerData.status;
            if (trackerData.group==null)
                groupIdInput.value = "";
            else
                groupIdInput.value = trackerData.group;
        }
        let tmpInitDiv = document.createElement("div");
        tmpInitDiv.className = "initiative";
        if (trackerData.initiative==null)
            tmpInitDiv.innerText = "";
        else
            tmpInitDiv.innerText = trackerData.initiative;
        tmpTrackerDiv.append(tmpInitDiv);
        let tmpNameDiv = document.createElement("div");
        tmpNameDiv.className = "trackerName";
        tmpNameDiv.innerText = trackerData.name;
        tmpTrackerDiv.append(tmpNameDiv);
        let bottomRow = document.createElement("div");
        bottomRow.className = "trackerBottomRow";
            let trackerArmorSection = document.createElement("div");
            trackerArmorSection.className = "trackerArmorSection";
                let trackerArmorClass = document.createElement("div");
                trackerArmorClass.className = "trackerArmorClass";
                if (trackerData.ac==null)
                    trackerArmorClass.innerText = "-";
                else
                    trackerArmorClass.innerText = trackerData.ac;
                trackerArmorSection.append(trackerArmorClass);
                let trackerArmorP = document.createElement("p");
                trackerArmorP.innerText = "AC";
                trackerArmorSection.append(trackerArmorP);
            bottomRow.append(trackerArmorSection);
        
            let trackerHitpointsSection = document.createElement("div");
            trackerHitpointsSection.className = "trackerHitpointsSection";
                let trackerDamageButton = document.createElement("button");
                trackerDamageButton.className = "trackerDamageButton";
                let trackerDamageImage = document.createElement("img");
                trackerDamageImage.style = "height: 1.1vw;";
                trackerDamageImage.src = "images/swap_vert-24px.png";
                trackerDamageImage.onclick = function(e)
                {
                    e.preventDefault();
                    e.stopPropagation();
                    let damage = parseInt(prompt("Enter the damage to reduct from this token: "));
                    if (damage!=null)
                    {
                        if (trackerData.hp!=null)
                        {
                            RequestServer({c: "editToken", id: trackerData.id, hp: (trackerData.hp.split("/")[0]-damage).toString()+"/"+trackerData.hp.split("/")[1]});
                        }
                    }
                }
                trackerDamageButton.append(trackerDamageImage);
                trackerHitpointsSection.append(trackerDamageButton);
                let trackerHitpoints = document.createElement("input");
                trackerHitpoints.type = "text";
                trackerHitpoints.className = "trackerHitpoints";
                if (trackerData.hp!=null)
                    trackerHitpoints.value = trackerData.hp.split("/")[0]
                else
                    trackerHitpoints.value = "-";
                trackerHitpointsSection.append(trackerHitpoints);
                let slashP = document.createElement("p");
                slashP.innerText = "/";
                trackerHitpointsSection.append(slashP);
                let trackerHitpointsMax = document.createElement("div");
                trackerHitpointsMax.className = "trackerHitpointsMax";
                if (trackerData.hp!=null)
                    trackerHitpointsMax.innerText = trackerData.hp.split("/")[1]
                else
                    trackerHitpointsMax.innerText = "-";
                trackerHitpointsSection.append(trackerHitpointsMax);
                let hpP = document.createElement("p");
                hpP.innerText = "HP";
                trackerHitpointsSection.append(hpP);
            bottomRow.append(trackerHitpointsSection);
        tmpTrackerDiv.append(bottomRow);
        initiativeTrackerDiv.append(tmpTrackerDiv);
        let trackerHR = document.createElement("hr");
        trackerHR.className = "initiativeHR";
        initiativeTrackerDiv.append(trackerHR);
    }
}
//#endregion

//#region misc Drag/Drop handlers
let isDraggingToken = false;
let draggingToken = -1;

shapeMap.addEventListener("dragover", function(e) {
    e.preventDefault();
})

shapeMap.addEventListener("dragend", function(e) {
    e.preventDefault();
})

document.body.ondrop = async function(e) 
{
    e.preventDefault();
    if (isDraggingToken)
    {
        let gridX = map.width/mapData.x;
        let gridY = map.height/mapData.y;
        if (GridSnap)
        {
            let tX;
            let tY;
            if (mapData.tokens[draggingToken].size>=1)
            {
                tX = Math.round(((e.pageX+board.scrollLeft) + tokenDragOffset.x - 0.5*gridX*mapData.tokens[draggingToken].size)/gridX)*gridX + 0.5*gridSize*mapData.tokens[draggingToken].size+ offsetX + 1;
                tY = Math.round(((e.pageY+board.scrollTop) + tokenDragOffset.y - 0.5*gridY*mapData.tokens[draggingToken].size)/gridY)*gridY + 0.5*gridY*mapData.tokens[draggingToken].size + offsetY + 1;
            }
            else
            {
                tX = Math.round(((e.pageX+board.scrollLeft) - offsetX + tokenDragOffset.x - 0.5*gridX*mapData.tokens[draggingToken].size)/(gridX*mapData.tokens[draggingToken].size))*(gridX*mapData.tokens[draggingToken].size) + 0.5*gridX*mapData.tokens[draggingToken].size + offsetX + 1;
                tY = Math.round(((e.pageY+board.scrollTop) - offsetY + tokenDragOffset.y - 0.5*gridY*mapData.tokens[draggingToken].size)/(gridY*mapData.tokens[draggingToken].size))*(gridY*mapData.tokens[draggingToken].size) + 0.5*gridY*mapData.tokens[draggingToken].size + offsetY + 1;
            }
            await RequestServer({c: "moveToken", id: draggingToken, x: tX, y: tY});
        }
        else
        {
            await RequestServer({c: "moveToken", id: draggingToken, x: (e.pageX+board.scrollLeft)+tokenDragOffset.x, y: (e.pageY+board.scrollTop)+tokenDragOffset.y});
        }
        UpdateMapData();
        isDraggingToken = false;
        draggingToken = -1;
    }
    if (isDraggingBlocker)
    {
        draggedBlocker.x = (e.pageX+board.scrollLeft);
        draggedBlocker.y = (e.pageY+board.scrollTop);
    }
}
//#endregion

//#region Main event handlers
function updateSelectedTokenData()
{
    for (let i in mapData.tokens)
        if (mapData.tokens[i].id == selectedToken)
            selectedTokenData = mapData.tokens[i];
}

initiativeInput.onchange = function() {
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
        RequestServer({c: "editToken", id: selectedToken, initiative: parseFloat(initiativeInput.value)});
    else
        if (isDM)
            RequestServer({c: "editToken", id: selectedToken, initiative: parseFloat(initiativeInput.value)});
}

nameInput.onchange = function() {
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
        RequestServer({c: "editToken", id: selectedToken, name: nameInput.value});
    else
        if (isDM)
            RequestServer({c: "editToken", id: selectedToken, name: nameInput.value});
}

acInput.onchange = function() {
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
        RequestServer({c: "editToken", id: selectedToken, ac: acInput.value});  
    else
        if (isDM)
            RequestServer({c: "editToken", id: selectedToken, ac: acInput.value});  
}

currentHpInput.onchange = function() {
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
        RequestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value+"/"+maxHpInput.value});
    else
        if (isDM)
            RequestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value+"/"+maxHpInput.value});
}

maxHpInput.onchange = function() {
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
        RequestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value+"/"+maxHpInput.value});
    else
        if (isDM)
            RequestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value+"/"+maxHpInput.value});
}

statusInput.onchange = function() {
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
        RequestServer({c:"editToken", id: selectedToken, status: statusInput.value});
    else
        if (isDM)
            RequestServer({c:"editToken", id: selectedToken, status: statusInput.value});
}

groupIdInput.onchange = function() {
    let newGroupId = parseInt(groupIdInput.value);
    updateSelectedTokenData();
    if (mapData.tokenList.includes(selectedTokenData.image))
    {
        if (newGroupId)
            RequestServer({c:"editToken", id: selectedToken, group: newGroupId});
        else
            RequestServer({c:"editToken", id: selectedToken, group: "reset"});
    }
    else
        if (isDM)
        {
            if (newGroupId)
                RequestServer({c:"editToken", id: selectedToken, group: newGroupId});
            else
                RequestServer({c:"editToken", id: selectedToken, group: "reset"});
        }
}

document.body.addEventListener("mouseup", function(e) {
    if (e.button==0)
    {
        if (isPanning)
        {
            isPanning=false;
            document.body.style.cursor = "";
        }
    }
})

mapSourceSelect.onchange = function() {
    RequestServer({c: "setMapData", map: mapSourceSelect.value, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY});
}

mapYInput.onchange = function() {
    RequestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: parseFloat(mapYInput.value), offsetX: mapData.offsetX, offsetY: mapData.offsetY});
}

mapXInput.onchange = function() {
    RequestServer({c: "setMapData", map: mapData.map, x: parseFloat(mapXInput.value), y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY});
}

offsetXInput.onchange = function() {
    RequestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: parseFloat(offsetXInput.value), offsetY: mapData.offsetY});
}

offsetYInput.onchange = function() {
    RequestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: parseFloat(offsetYInput.value)});
}

shapeMap.addEventListener("mousedown", function(e) {
    selectedToken = -1;
    if (e.button==0)
    {
        if (isPlacingBlocker)
        {
            console.log("2");
            if (isDM)
            {
                blockerMarkers.width = (e.pageX+board.scrollLeft)-blockerMarkers.x;
                blockerMarkers.height = (e.pageY+board.scrollTop)-blockerMarkers.y;
                RequestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
                UpdateMapData();
            }
            isPlacingBlocker = false;
            return;
        }
        if (isPlacingSquare)
        {
            console.log("3");
            squareMarkers.width = (e.pageX+board.scrollLeft) - squareMarkers.x;
            squareMarkers.height = (e.pageY+board.scrollTop) - squareMarkers.y;
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
            console.log("4");
            lineMarkers.destX = (e.pageX+board.scrollLeft);
            lineMarkers.destY = (e.pageY+board.scrollTop);
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
        let pixel = hitboxCanvas.getImageData((e.pageX+board.scrollLeft), (e.pageY+board.scrollTop), 1, 1).data;
        if (!(pixel[0]==0 && pixel[1]==0 && pixel[2]==0))
        {
            console.log("5");
            let testString = "#"+decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
            let shapeId = colorToSigned24Bit(testString)/16;
            if (shapeId%1 == 0)
            {
                shapeId--;
                console.log("Picked up: "+shapeId);
                document.body.style.cursor = "pointer";
                shapeDragOffset.x = mapData.drawings[shapeId].x - (e.pageX+board.scrollLeft);
                shapeDragOffset.y = mapData.drawings[shapeId].y - (e.pageY+board.scrollTop);
                movingShapeId = shapeId;
                isMovingShape = true;
            }
            return;
        }

        console.log("Default");
        isPanning=true;
        oldMousePos.x = e.pageX;
        oldMousePos.y = e.pageY;
        oldScrollPos.x = board.scrollLeft;
        oldScrollPos.y = board.scrollTop;
        document.body.style.cursor = "grabbing";
    }
})

shapeMap.addEventListener("mousemove", function(e) {
    if (isPanning)
    {
        board.scrollLeft = oldScrollPos.x - (e.pageX - oldMousePos.x);
        board.scrollTop = oldScrollPos.y - (e.pageY - oldMousePos.y);
    }
})

shapeMap.addEventListener("mouseup", function(e) {
    if (e.button==0)
    {
        if (isMovingShape)
        {
            isMovingShape = false;
            console.log("Dropped shape!");
            document.body.style.cursor = "default";
            RequestServer({c: "editDrawing", id: movingShapeId, x: (e.pageX+board.scrollLeft) + shapeDragOffset.x, y: (e.pageY+board.scrollTop) + shapeDragOffset.y});
            UpdateMapData();
        }    
    }
})

shapeMap.addEventListener("dragstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
})

map.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    DisplayContextMenu(e);
})

shapeMap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    let pixel = hitboxCanvas.getImageData((e.pageX+board.scrollLeft), (e.pageY+board.scrollTop), 1, 1).data;
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
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
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
                                RequestServer({c: "createToken", x: (e.pageX+board.scrollLeft), y: (e.pageY+board.scrollTop), image: tokenList[i], size: tokenSize, status: "", layer: 0})
                                console.log("Placing "+tokenList[i]+" with size"+tokenSize+" at "+(e.pageX+board.scrollLeft).toString()+":"+(e.pageY+board.scrollTop).toString());
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
                                RequestServer({c: "createToken", x: (e.pageX+board.scrollLeft), y: (e.pageY+board.scrollTop), image: tokenList[i], size: tokenSize, status: "", layer: 0})
                                console.log("Placing "+tokenList[i]+" with size"+tokenSize+" at "+(e.pageX+board.scrollLeft).toString()+":"+(e.pageY+board.scrollTop).toString());
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
                            RequestServer({c: "createToken", x: (e.pageX+board.scrollLeft), y: (e.pageY+board.scrollTop), image: dmTokenList[i], size: tokenSize, status: ""})
                            console.log("Placing "+dmTokenList[i]+" with size"+tokenSize+" at "+(e.pageX+board.scrollLeft).toString()+":"+(e.pageY+board.scrollTop).toString());
                        }
                    }
                    subMenu.push(tmpElement);
                }
            }
            DisplaySubMenu(e, subMenu);
        }},
        {text: "Draw Shape", description: "Pick a shape to draw", hasSubMenu: true, callback: function() {
            let subMenuOptions = [
                {text: "Draw Circle", callback: function() {
                    let radiusInput = parseFloat(prompt("Please enter the desired radius in feet for your circle(s)"));
                    if (radiusInput!=null)
                    {
                        circleMarkers.radius = (radiusInput)/feetPerSquare*gridSize;
                        circleMarkers.x = (e.pageX+board.scrollLeft);
                        circleMarkers.y = (e.pageY+board.scrollTop);
                        RequestServer({c: "addDrawing", shape: "circle", x: circleMarkers.x, y: circleMarkers.y, radius: circleMarkers.radius, trueColor: shapeColor});
                        UpdateMapData();
                        CloseMenu();
                        CloseSubMenu();
                    }    
                }},
                {text: "Draw Square", callback: function() {
                    squareMarkers.x = (e.pageX+board.scrollLeft);
                    squareMarkers.y = (e.pageY+board.scrollTop);
                    isPlacingSquare = true;
                }},
                {text: "Draw Line", callback: function() {
                    let rangeInput = parseFloat(prompt("Please enter the desired range of the line in feet, leave blank for no range limit"));
                    if (rangeInput!=null)
                        lineMarkers.range = rangeInput/feetPerSquare*gridSize;
                    else
                        lineMarkers.range = 999999;
                    lineMarkers.x = (e.pageX+board.scrollLeft);
                    lineMarkers.y = (e.pageY+board.scrollTop);
                    isPlacingLine = true;
                }}
            ];
            DisplaySubMenu(e, subMenuOptions);
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
                            RequestServer({c: "createToken", x: (e.pageX+board.scrollLeft), y: (e.pageY+board.scrollTop), image: tokenList[i], size: tokenSize, status: "", hidden: true})
                            console.log("Placing hidden "+tokenList[i]+" with size "+tokenSize+" at "+(e.pageX+board.scrollLeft).toString()+":"+(e.pageY+board.scrollTop).toString());
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
                            RequestServer({c: "createToken", x: (e.pageX+board.scrollLeft), y: (e.pageY+board.scrollTop), image: dmTokenList[i], size: tokenSize, status: "", hidden: true})
                            console.log("Placing "+dmTokenList[i]+" with size"+tokenSize+" at "+(e.pageX+board.scrollLeft).toString()+":"+(e.pageY+board.scrollTop).toString());
                        }
                    }
                    subMenu.push(tmpElement);
                }
            }
            DisplaySubMenu(e, subMenu);
        }},
        {text: "Place Blocker", description: "Upon clicking this button click somewhere else to define the bottom right corner", hasSubMenu: false, callback: async function() {
            blockerMarkers.x = (e.pageX+board.scrollLeft);
            blockerMarkers.y = (e.pageY+board.scrollTop);
            isPlacingBlocker = true;
        }},
        {text: "Change Map", description: "Changes the map to the desired JSON file", hasSubMenu: true, callback: function() {
            let subOptions = [];
            for (let i = 0; i < mapData.maps.length; i++)
            {
                let tmpSubOption = {text: mapData.maps[i], hasSubMenu: false, callback: function() {
                    RequestServer({c: "changeSelectedMap", selectedMap: mapData.maps[i]})
                }};
                subOptions.push(tmpSubOption);
            }
            DisplaySubMenu(e, subOptions);
        }}
    ]
    if (isDM)
    {
        for (let f = 0; f<DMoptions.length; f++)
        {
            listOptions.push(DMoptions[f]);
        }
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
            let testx = (event.pageX+board.scrollLeft);
            let testy = (event.pageY+board.scrollTop);
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
            if ((event.pageX+board.scrollLeft)+customMenu.offsetWidth > (window.innerWidth+window.pageXOffset))
            {
                scrollBy((((event.pageX+board.scrollLeft)+customMenu.offsetWidth+10)-(window.innerWidth+window.pageXOffset)),0);
            }
            if ((event.pageY+board.scrollTop)+customMenu.offsetHeight > (window.innerHeight+window.pageYOffset))
            {
                scrollBy(0, (((event.pageY+board.scrollTop)+customMenu.offsetHeight+10)-(window.innerHeight+window.pageYOffset)));
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
            customSubMenu.style.top = (event.pageY+board.scrollTop).toString()+"px";
            customSubMenu.style.left = ((event.pageX+board.scrollLeft)+customMenu.offsetWidth).toString()+"px";
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
            if ((event.pageX+board.scrollLeft)+customMenu.offsetWidth*2 > (window.innerWidth+window.pageXOffset))
            {
                scrollBy((((event.pageX+board.scrollLeft)+customMenu.offsetWidth*2+10)-(window.innerWidth+window.pageXOffset)),0);
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

function dynamicSort(property) {
    let sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        let aI = parseInt(a[property]);
        let bI = parseInt(b[property]);
        let result = (aI < bI) ? -1 : (aI > bI) ? 1 : 0;
        return result * sortOrder;
    }
}
//#endregion

//#region Cookies
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

//#region Mees Janky Shit
function updateButtonColors()
{
    if (GridActive)
        document.getElementById("toggleGridButton").style.backgroundColor = "aquamarine";
    else
        document.getElementById("toggleGridButton").style.backgroundColor = "rgb(240, 240, 240)";

    if (GridSnap)
        document.getElementById("toggleSnapButton").style.backgroundColor = "aquamarine";
    else
        document.getElementById("toggleSnapButton").style.backgroundColor = "rgb(240, 240, 240)";

    if (displayMapSettings)
        document.getElementById("toggleSettingsButton").style.backgroundColor = "aquamarine";
    else
        document.getElementById("toggleSettingsButton").style.backgroundColor = "rgb(240, 240, 240)";
}
//#endregion Mees Janky Shit