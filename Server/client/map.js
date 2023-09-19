let GridActive = true;
let GridSnap = false;
let autoUpdate = true;
let mapUpdateInterval = 1000;
let offsetX = 0;
let offsetY = 0;
let GridColor = "#222222FF";
let shapeColor = "#FF0000";
let blockerOutlineColor = "violet";
let shapeWidth = 2;
let hitboxMultiplier = 3;
let GridLineWidth = 1;
let map = document.getElementById("map");
let board = document.getElementById("board");
let loadedMap = document.getElementById("hiddenMapLoader");
let shapeMap = document.getElementById("shapeMap");
let hitboxMap = document.getElementById("hitboxMap");
let tokensDiv = document.getElementById("tokens");
let blockersDiv = document.getElementById("blockers");
let mapSourceSelect = document.getElementById("mapSource");
let mapXInput = document.getElementById("mapX");
let mapYInput = document.getElementById("mapY");
let offsetXInput = document.getElementById("offsetX");
let offsetYInput = document.getElementById("offsetY");
let initiativeTrackerDiv = document.getElementById("initiativeTracker");
let initiativeInput = document.getElementById("detailsInitiative");
let nameInput = document.getElementById("detailsNameInput");
let acInput = document.getElementById("armorClass");
let currentHpInput = document.getElementById("currentHitpoints");
let maxHpInput = document.getElementById("maxHitpoints");
let groupIdInput = document.getElementById("detailsGroup");
let statusInput = document.getElementById("detailsStatusInput");
let detailsIcon = document.getElementById("detailsIcon").children[0];
let sideMenu = document.getElementById("sideMenu");
let noteEditor = document.getElementById("notesEditor");
let detailsScreen = document.getElementById("detailsScreen");
let gridColorPicker = document.getElementById("gridColorPicker");
let mapSelect = document.getElementById("mapSelect");
let bulkTokenSelect = document.getElementById("bulkTokenSelect");
let bulkTokenNameInput = document.getElementById("bulkTokenNameInput");
let bulkTokenAmountInput = document.getElementById("bulkTokenAmountInput");
let bulkTokenConfirm = document.getElementById("bulkTokenConfirm");
let bulkInitGeneratorScreen = document.getElementById("bulkInitGeneratorScreen");
let antiBlocker = document.getElementById("antiBlocker");
let noteArea = noteEditor.children[0];
let mapCanvas;
let shapeCanvas;
let hitboxCanvas;
let mapData;
let gridSize;
let tokenDragOffset = {x: 0, y: 0};
let blockerDragOffset = {x: 0, y: 0};
let shapeDragOffset = {x: 0, y: 0};
let blockerMarkers = {x: 0, y: 0, width: 0, height: 0};
let circleMarkers = {x: 0, y: 0, radius: 0};
let squareMarkers = {x: 0, y: 0, width: 0, height: 0};
let lineMarkers = {x: 0, y: 0, destX: 0, destY: 0, range: 100};
let coneMarkers = {x: 0, y: 0, range: 100, tokenSize: 1};
let bulkInitSettings = {};
let isDM = false;
let clientName = getCookie("playerName");
if (clientName == "")
    window.location.href = "/";
let feetPerSquare = 5.0;
let isPlacingBlocker = false;
let isPlacingSquare = false;
let isPlacingLine = false;
let isPlacingCone = false;
let isDraggingBlocker = false;
let blockerEditMode = false;
let draggedBlocker = {x: 0, y: 0};
let hiddenMapImportButton = document.getElementById("fileImport");
let isMovingShape = false;
let isMovingCone = false;
let isPanning = false;
let oldMousePos = {x: 0, y: 0};
let oldScrollPos = {x: 0, y: 0};
let movingShapeId = 0;
let selectedToken;
let selectedTokenData;
let selectedBlocker;
let oldData;
let dataIsIdentical = false;
let resizingSideMenu = false;
let controlPressed = false;
let placingBulkOrigin = false;
let baseTokenIndex = 4;
let previousSelectedBlocker;
let draggingToken = -1;

window.onload = function() {
    if (getCookie("isDM") == 1)
    {
        isDM = true;
        document.getElementById("hiddenDMCheckbox").checked = isDM;
        console.log("DM is TRUE!");
    }
    else
    {
        let elementsToRemove = document.getElementsByClassName("dmOnly");
        for (let i = elementsToRemove.length - 1; i >= 0; i--)
            elementsToRemove[i].parentElement.removeChild(elementsToRemove[i]);
    }
        
    while (clientName == "")
    {
        clientName = prompt("Please enter you name:");
        setCookie("playerName", clientName);
    }
    Setup();    
}

async function Setup() {
    mapCanvas = map.getContext("2d");
    hitboxCanvas = hitboxMap.getContext("2d");
    shapeCanvas = shapeMap.getContext("2d");
    await updateMapData(true);
    if (autoUpdate)
    {
        setInterval(function() {updateMapData();}, mapUpdateInterval);
    }
    if (isDM)
    {
        baseTokenIndex = 54;
    }
    else
    {
        baseTokenIndex = 4;
    }
    drawCanvas();
}

async function updateMapData(force) 
{
    mapData = await requestServer({c: "currentMapData", x: loadedMap.naturalWidth, y: loadedMap.naturalHeight});
    let stringData = JSON.stringify(mapData);
    if (oldData != stringData || force)
    {
        dataIsIdentical = false;
        console.log("Data is not identical or update has been forced, updating map!");
        oldData = stringData;
    }
    else
    {
        dataIsIdentical = true;
        console.log("Data is identical!");
    }
    
    if (!dataIsIdentical)
    {
        GridColor = mapData.gridColor;
        if (mapData.antiBlockerOn)
        {
            document.body.style.setProperty("--blocker-color", "#00000000");
            if (isDM)
            {
                document.body.style.setProperty("--antiBlocker-color", "#00000080");
            }
            else
            {
                document.body.style.setProperty("--antiBlocker-color", "#000000FF");
            }
            antiBlocker.style.display="";
        }
        else
        {
            if (isDM)
            {
                document.body.style.setProperty("--blocker-color", "#00000080");    
            }
            else
            {
                document.body.style.setProperty("--blocker-color", "#000000FF");
            }
            antiBlocker.style.display="none";
        }
        if (isDM) { document.getElementById("exportMap").title = mapData.mapName + " : " + mapData.map; }
        loadedMap.src = "/public/maps/" + mapData.map;
        mapSelect.innerHTML = "";
        for (let i = 0; i < mapData.maps.length; i++)
        {
            let tmpOption = document.createElement("option");
            tmpOption.value = mapData.maps[i];
            tmpOption.innerText = mapData.maps[i];
            mapSelect.append(tmpOption);
        }
        mapSelect.value = mapData.mapName;

        if (document.activeElement != bulkTokenSelect)
        {
            bulkTokenSelect.innerHTML = "";
            let tmpOption = document.createElement("option");
            tmpOption.value = "number";
            tmpOption.innerText = "Auto number";
            bulkTokenSelect.append(tmpOption);
            for (let i = 0; i < mapData.tokenList.length; i++)
            {
                let tmpOption = document.createElement("option");
                tmpOption.value = mapData.tokenList[i];
                tmpOption.innerText = mapData.tokenList[i];
                bulkTokenSelect.append(tmpOption);
            }
            for (let i = 0; i < mapData.dmTokenList.length; i++)
            {
                let tmpOption = document.createElement("option");
                tmpOption.value = mapData.dmTokenList[i];
                tmpOption.innerText = mapData.dmTokenList[i];
                bulkTokenSelect.append(tmpOption);
            }
        }
        if (document.activeElement != mapSourceSelect)
        {
            mapSourceSelect.innerHTML = "";
            for (let i = 0; i < mapData.mapSourceList.length; i++)
            {
                let tmpOption = document.createElement("option");
                tmpOption.value = mapData.mapSourceList[i];
                tmpOption.innerText = mapData.mapSourceList[i];
                mapSourceSelect.append(tmpOption);
            }
            mapSourceSelect.value = mapData.map;
        }
        if (document.activeElement!=mapYInput) {mapYInput.value = mapData.y;}
        if (document.activeElement!=mapXInput) {mapXInput.value = mapData.x;}
        if (document.activeElement!=offsetXInput) {offsetXInput.value = mapData.offsetX;}
        if (document.activeElement!=offsetYInput) {offsetYInput.value = mapData.offsetY;}
        if (document.activeElement!=gridColorPicker) {gridColorPicker.value = mapData.gridColor;}
        offsetX = mapData.offsetX;
        offsetY = mapData.offsetY;
        loadedMap.onload = function() 
        {
            drawCanvas(dataIsIdentical);
        }
    }
}

function returnToken(id) {
    for (let h = 0; h<mapData.tokens.length; h++)
    {
        if (mapData.tokens[h].id == id)
            return mapData.tokens[h];
    }
}

//#region Side buttons
let exportButton = document.getElementById("exportMap");
exportButton.onclick = function() {
    requestServer({c: "exportMap"});
    window.open("/public/export/export.json");
}

document.getElementById("toggleGridButton").onclick = function() {
    GridActive = !GridActive;
    updateMapData(true);
    updateButtonColors();
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
    displayMapSettings =! displayMapSettings;
    updateButtonColors();
}

document.getElementById("toggleBlockerEditing").onclick = function() {
    blockerEditMode = !blockerEditMode;
    updateMapData(true);
    updateButtonColors();
}

let displayNoteEditor = false;
detailsIcon.onclick = function() {
    if (displayNoteEditor)
        noteEditor.style.display = "none";
    else
        noteEditor.style.display = "flex";
    displayNoteEditor =! displayNoteEditor;
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
    updateMapData(true);
}
//#endregion

//#region Map options
document.getElementById("hideInits").onclick = function() {
    if (mapData.hideInit)
        requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: false});
    else
        requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: true});
    updateMapData();
}

gridColorPicker.onchange = function() {
    requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: false, gridColor: gridColorPicker.value});
    updateMapData();
}

mapSelect.onchange = async function() {
    requestServer({c: "changeSelectedMap", selectedMap: mapSelect.value})
    await updateMapData();
    mapSourceSelect.value = mapData.map;
    mapYInput.value = mapData.y;
    mapXInput.value = mapData.x;
    offsetXInput.value = mapData.offsetX;
    offsetYInput.value = mapData.offsetY;
}

mapSourceSelect.onchange = function() {
    requestServer({c: "setMapData", map: mapSourceSelect.value, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: mapData.hideInit});
    updateMapData();
}

mapYInput.onchange = function() {
    requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: parseFloat(mapYInput.value), offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: mapData.hideInit});
    updateMapData();
}

mapXInput.onchange = function() {
    requestServer({c: "setMapData", map: mapData.map, x: parseFloat(mapXInput.value), y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: mapData.hideInit});
    updateMapData();
}

offsetXInput.onchange = function() {
    requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: parseFloat(offsetXInput.value), offsetY: mapData.offsetY, hideInit: mapData.hideInit});
    updateMapData();
}

offsetYInput.onchange = function() {
    requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: parseFloat(offsetYInput.value), hideInit: mapData.hideInit});
    updateMapData();
}
//#endregion

//#region Drawing functions
function drawCanvas(force)
{
    if (!dataIsIdentical||force)
    {
        clearCanvas();
        map.width = loadedMap.naturalWidth;
        map.height = loadedMap.naturalHeight;
        antiBlocker.style.width = loadedMap.naturalWidth;
        antiBlocker.style.height = loadedMap.naturalHeight;
        mapCanvas.strokeStyle = GridColor;
        mapCanvas.lineWidth = GridLineWidth;
        shapeMap.width = loadedMap.naturalWidth;
        shapeMap.height = loadedMap.naturalHeight;
        hitboxMap.width = loadedMap.naturalWidth;
        hitboxMap.height = loadedMap.naturalHeight;
        mapCanvas.translate(0.5, 0.5);
        shapeCanvas.translate(0.5, 0.5);
        hitboxCanvas.translate(0.5, 0.5);
        gridSize = (map.width / mapData.x + map.height / mapData.y) / 2;
        drawBlockers();
        drawMap();
        if (GridActive)
        {
            drawGrid();
        }
        drawTokens();
        drawShapes();
        updateTracker();
    }
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

            case "cone":
                drawCone(k, currentShape);
                break;
        }
    }
}

function drawCircle(index, shape) 
{
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(index) + 1) * 16).toString(16);
    for (let f = 0; f < (6 - hex.length); f++)
    {
        colorString += "0";
    }
        
    colorString += hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth * hitboxMultiplier;
    hitboxCanvas.beginPath();
    hitboxCanvas.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
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
    let hex = ((parseInt(index) + 1) * 16).toString(16);
    for (let f = 0; f < (6 - hex.length); f++)
    {
        colorString += "0";
    }
        
    colorString += hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth * hitboxMultiplier;
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
    let hex = ((parseInt(index) + 1) * 16).toString(16);
    for (let f = 0; f < (6 - hex.length); f++)
    {
        colorString += "0";
    }

    colorString += hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth * hitboxMultiplier;
    hitboxCanvas.beginPath();
    hitboxCanvas.moveTo(shape.x, shape.y);
    hitboxCanvas.lineTo(shape.destX, shape.destY);
    hitboxCanvas.stroke();
}

function drawCone(index, shape)
{
    let angle = shape.angle;
    let linkedToken = returnToken(shape.link);
    let originX = shape.x + Math.cos(angle)*0.5*linkedToken.size*gridSize;
    let originY = shape.y +  Math.sin(angle)*0.5*linkedToken.size*gridSize;

    let centerY = originY + Math.sin(angle) * shape.range * gridSize;
    let centerX = originX + Math.cos(angle) * shape.range * gridSize;

    let destX1 = 0.5*(-centerY + originY) + centerX;
    let destY1 = 0.5*(centerX - originX) + centerY;

    let destX2 = 0.5*(centerY - originY) + centerX;
    let destY2 = 0.5*(-centerX + originX) + centerY;

    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(originX, originY);
    shapeCanvas.lineTo(destX1, destY1);
    shapeCanvas.lineTo(destX2, destY2);
    shapeCanvas.lineTo(originX, originY);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(index) + 1) * 16).toString(16);
    for (let f = 0; f < (6 - hex.length); f++)
    {
        colorString += "0";
    }

    colorString += hex;
    hitboxCanvas.strokeStyle = colorString;
    hitboxCanvas.lineWidth = shapeWidth * hitboxMultiplier;
    hitboxCanvas.beginPath();
    hitboxCanvas.moveTo(originX, originY);
    hitboxCanvas.lineTo(destX1, destY1);
    hitboxCanvas.lineTo(destX2, destY2);
    hitboxCanvas.lineTo(originX, originY);
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
        if (mapData.antiBlockerOn)
        {
            drawAntiBlocker();
        }
        blockersDiv.innerHTML = "";
        for (let i = 0; i<mapData.blockers.length; i++)
        {
            let currentBlocker = mapData.blockers[i];
            let tmpBlocker = document.createElement("div");
            let extraBlocker = document.createElement("div");
            if (currentBlocker.id==selectedBlocker)
            {
                tmpBlocker.style.outline = "0.3vh dashed "+blockerOutlineColor;
                previousSelectedBlocker=tmpBlocker;
            }
            tmpBlocker.className = "blocker";
            tmpBlocker.style.left = currentBlocker.x + "px";
            tmpBlocker.style.top = currentBlocker.y + "px";
            tmpBlocker.style.width = currentBlocker.width + "px";
            tmpBlocker.style.height = currentBlocker.height + "px";
            if (isDM)
            {
                tmpBlocker.style.resize = "both";
                extraBlocker.style.width = currentBlocker.width + "px";
                extraBlocker.style.height = currentBlocker.height + "px";
                if (blockerEditMode)
                {
                    extraBlocker.draggable = true;
                }
                else
                {
                    extraBlocker.style.pointerEvents="none";
                    tmpBlocker.style.pointerEvents="none";
                }
                
                if (blockerEditMode)
                {
                    tmpBlocker.addEventListener("dragover", function(e) {
                        e.preventDefault();
                    })
                    
                    tmpBlocker.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                        let menuOptions = [
                            {text: "Remove blocker", hasSubMenu: false, callback: function() {
                                previousSelectedBlocker=null;
                                selectedBlocker=-1;
                                requestServer({c: "removeBlocker", id: currentBlocker.id});
                                updateMapData();
                            }}
                        ];
                        displayMenu(e, menuOptions);
                    });
    
                    tmpBlocker.addEventListener("mousedown", function(e) {
                        updateMapData(true);
                        if (previousSelectedBlocker)
                            previousSelectedBlocker.style.outline = "";
                        tmpBlocker.style.outline = "0.3vh dashed "+blockerOutlineColor;
                        selectedToken=-1;
                        selectedBlocker=currentBlocker.id;
                        previousSelectedBlocker=tmpBlocker;
                        isDraggingBlocker = true;
                    });
                    tmpBlocker.addEventListener("mouseup", function(e) {
                        
                        isDraggingBlocker = false;
                        extraBlocker.style.width = currentBlocker.width + "px";
                        extraBlocker.style.height = currentBlocker.height + "px";
                        if (currentBlocker.width!=tmpBlocker.offsetWidth && currentBlocker.height != tmpBlocker.offsetHeight)
                        {
                            requestServer({c: "editBlocker", id: currentBlocker.id, x: currentBlocker.x, y: currentBlocker.y, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                            updateMapData();
                        }
                    })

                    extraBlocker.addEventListener("dragstart", function(e) {
                        isDraggingBlocker = true;
                        extraBlocker.style.backgroundColor = "#000000AA";
                        blockerDragOffset.x = currentBlocker.x - (e.pageX + board.scrollLeft);
                        blockerDragOffset.y = currentBlocker.y - (e.pageY + board.scrollTop);
                    })
                    extraBlocker.addEventListener("dragend", function(e) {
                        e.preventDefault();
                        if (isDraggingBlocker)
                        {
                            isDraggingBlocker = false;
                            let newX = draggedBlocker.x + blockerDragOffset.x;
                            let newY = draggedBlocker.y + blockerDragOffset.y;
                            if (newX!=currentBlocker.x && newY!=currentBlocker.y)
                            {
                                requestServer({c: "editBlocker", id: currentBlocker.id, x: newX, y: newY, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                                updateMapData();
                            }
                        }
                        e.stopPropagation();
                    })
                }
            }
            else
            {
                extraBlocker.addEventListener("dragstart", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                if (mapData.antiBlockerOn)
                {
                    extraBlocker.style.pointerEvents="none";
                    tmpBlocker.style.pointerEvents="none";
                }
                else
                {
                    extraBlocker.style.msUserSelect = "none";
                    extraBlocker.style.webkitUserSelect = "none";
                }
            }
            tmpBlocker.appendChild(extraBlocker);
            
            blockersDiv.appendChild(tmpBlocker);
        }
    }
}

function drawAntiBlocker() {
    let baseSVG = document.createElement("svg");
    baseSVG.setAttribute('xmlns', "http://www.w3.org/2000/svg");
    baseSVG.setAttribute('viewBox', "0 0 " + map.width + " " + map.height);
    baseSVG.setAttribute('preserverAspectRatio', "none");
    for (let i = 0; i < mapData.blockers.length; i++)
    {
        let tmpPoly = document.createElement("polygon");
        let tb = mapData.blockers[i];
        tmpPoly.setAttribute('points', tb.x + "," + tb.y + " " + tb.x + "," + (tb.y + tb.height).toString() + " " + (tb.x + tb.width).toString() + "," + (tb.y + tb.height).toString() + " " + (tb.x + tb.width).toString() + "," + tb.y);
        tmpPoly.setAttribute('fill', "black");
        tmpPoly.style.pointerEvents="none";
        baseSVG.appendChild(tmpPoly);
    }
    let svgData = "url('data:image/svg+xml;utf8,"+baseSVG.outerHTML+"')";
    document.body.style.setProperty("--anti-blocker-data", svgData);
}

function drawGrid()
{
    let gridX = map.width / mapData.x;
    let gridY = map.height / mapData.y;
    for (let x = 1; x <= mapData.x; x++)
    {
        mapCanvas.moveTo(x * gridX + offsetX + 0.5, 0.5);
        mapCanvas.lineTo(x * gridX + offsetX + 0.5, map.clientHeight + 0.5);
    }    
    for (let y = 1; y <= mapData.y; y++)
    {
        mapCanvas.moveTo(0.5, y * gridY + offsetY + 0.5);
        mapCanvas.lineTo(map.clientWidth + 0.5, y * gridY + offsetY + 0.5);
    }
    mapCanvas.stroke();
}

function drawTokens() 
{
    tokensDiv.innerHTML = "";
    for (let i in mapData.tokens)
    {
        createToken(mapData.tokens[i]);
    }
}

function createToken(token) 
{
    if (token.id == selectedToken)
    {
        if (CheckTokenPermission(token))
        {
            LoadTokenData();
        }
        else
        {
            nameInput.value = "DM only!";
            maxHpInput.value = "";
            currentHpInput.value = "";
            statusInput.value = token.status;
            initiativeInput.value = "";
            groupIdInput.value = "";
            acInput.value = "";
            noteArea.value = "";
        }
    }
    
    let imageElement = document.createElement("img");
    let isTextToken = false;
    if (token.image!=null)
    {
        if (mapData.tokenList.includes(token.image))
        {
            imageElement.src = "public/tokens/" + token.image;
        }
        else
        {
            imageElement.src = "public/dmTokens/" + token.image;
        }
    }
    else
    {
        if (token.text!=null)
        {
            imageElement.src = "public/blankToken.png";
            isTextToken = true;
        }
    }
    
    imageElement.className = "token";
    imageElement.style.top = token.y - (gridSize * token.size) / 2 + "px";
    imageElement.style.left = token.x - (gridSize * token.size) / 2 + "px";
    imageElement.style.width = (token.size * gridSize).toString() + "px";
    imageElement.style.height = (token.size * gridSize).toString() + "px";

    imageElement.style.zIndex = (token.layer + baseTokenIndex).toString();
    imageElement.title = token.status;
    imageElement.draggable = true;
    if (token.hidden != null)
    {
        if (token.hidden == true)
        {
            if (!isDM)
            {
                return;
            }
            let hiddenImage = document.createElement("img");
            hiddenImage.src = "public/hidden.png";
            hiddenImage.className = "hiddenToken";
            hiddenImage.style.width = (token.size * gridSize / 3).toString() + "px";
            hiddenImage.style.height = (token.size * gridSize / 3).toString() + "px";
            hiddenImage.style.top = token.y - (gridSize * token.size) / 2 + "px";
            hiddenImage.style.left = token.x - (gridSize * token.size) / 2 + "px";
            hiddenImage.style.zIndex = (token.layer + baseTokenIndex + 1).toString();
            tokensDiv.appendChild(hiddenImage);
        }
    }
    if (token.id == selectedToken)
    {
        imageElement.style.outline = "0.20vw dashed aqua";
    }

    function LoadTokenData() {
        if (document.activeElement!=nameInput)
        {
            nameInput.value = token.name;
        }
        
        if (document.activeElement!=noteArea)
        {
            if (token.notes == null)
            { noteArea.value = ""; }
            else
            { noteArea.value = token.notes; }
        }
        
        if (document.activeElement!=initiativeInput)
        {
            if (token.initiative == null)
            { initiativeInput.value = ""; }
            else
            { initiativeInput.value = token.initiative; }   
        }
        
        if (document.activeElement!=acInput)
        {
            if (token.ac == null)
            { acInput.value = ""; }
            else
            { acInput.value = token.ac; }
        }
        
        if (document.activeElement!=currentHpInput && document.activeElement!=maxHpInput)
        {
            if (token.hp == null)
            {
                currentHpInput.value = "";
                maxHpInput.value = "";
            }
            else
            {
                currentHpInput.value = token.hp.split("/")[0];
                maxHpInput.value = token.hp.split("/")[1];
            }
        }
        
        if (document.activeElement!=statusInput)
        {
            if (token.status == null)
            { statusInput.value = "No status"; }
            else
            { statusInput.value = token.status; }
        }
        
        if (document.activeElement!=groupIdInput)
        {
            if (token.group == null)
            { groupIdInput.value = ""; }
            else
            { groupIdInput.value = token.group; }
        }

    }

    imageElement.addEventListener("click", function() {
        showDetailsScreen();
        selectedToken = token.id;
        selectedBlocker = -1;
        if (mapData.tokenList.includes(token.image))
            detailsIcon.src = "public/tokens/" + token.image;
        if (mapData.dmTokenList.includes(token.image))
            detailsIcon.src = "public/dmTokens/" + token.image;
        if (token.image==null)
            detailsIcon.src = "public/blankToken.png";
        if (CheckTokenPermission(token))
        {
            LoadTokenData();
        }
        else
        {
            nameInput.value = "DM only!";
            maxHpInput.value = "";
            currentHpInput.value = "";
            statusInput.value = token.status;
            initiativeInput.value = "";
            groupIdInput.value = "";
            acInput.value = "";
            noteArea.value = "";
        }
        updateMapData(true);
    })

    imageElement.addEventListener("dragstart", function(e) {
        tokenDragOffset.x = token.x - (e.pageX + board.scrollLeft);
        tokenDragOffset.y = token.y - (e.pageY + board.scrollTop);
        draggingToken = token.id;
        isDraggingToken = true;
        if (e.ctrlKey)
        {
            controlPressed = true;
        }
    })

    imageElement.addEventListener("dragover", function(e) {
        e.preventDefault();
    })

    imageElement.addEventListener("contextmenu", function(e) {
        closeMenu();
        closeSubMenu();
        e.preventDefault();
        let menuOptions = [
            {text: "Remove token", hasSubMenu: false, callback: async function() {
                if (selectedToken > token.id)
                {
                    selectedToken -= 1;
                }
                if (token.id == selectedToken)
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
                let result = await requestServer({c: "removeToken", id: token.id, tokensRemoved: mapData.removedTokens});
                if(result[0] == true)
                {
                    updateMapData();
                }
                else
                {
                    alert("That token has already been removed by someone else");
                }
            }},
            {text: "Edit token", hasSubMenu: true, callback: function() {
                let subMenuOptions = [
                    {text: "Change size", callback: function() {
                        let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                        if (!isNaN(tokenSize))
                        {
                            if (isDM)
                            {
                                if (tokenSize < 20 && tokenSize > 0)
                                {
                                    requestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: token.layer, group: token.group});
                                }
                                else
                                {
                                    alert("The desired size is too large or invalid");
                                }
                            }
                            else
                            {
                                if (tokenSize < 6 && tokenSize > 0)
                                {
                                    requestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: token.layer, group: token.group});
                                }
                                else
                                {
                                    alert("That token size isn't allowed for players");
                                }
                            }   
                            updateMapData();
                        }
                    }},
                    {text: "Change layer", callback: function() {
                        let newLayer = parseInt(prompt("Please enter the desired height level"));
                        if (!isNaN(newLayer) && newLayer>=0 && newLayer<50)
                        {
                            requestServer({c:"editToken", id: token.id, size: token.size, status: token.status, layer: newLayer, group: token.group});
                            updateMapData();
                        }
                        else
                        {
                            alert("Layer must be > -1 and < 51 ");
                        }
                    }}
                ];
                displaySubMenu(e, subMenuOptions);
            }},
            {text: "Change image", hasSubMenu: true, callback: function() {
                let subMenu = [];
                let tokenList = mapData.tokenList;
                let dmTokenList = mapData.dmTokenList;
                for (let i in tokenList)
                {
                    let tmpElement = {};
                    tmpElement.text = tokenList[i].substring(0, tokenList[i].length - 4);
                    tmpElement.callback = function() 
                    {
                        requestServer({c: "editToken", id: token.id, image: tokenList[i]});
                        updateMapData();
                    }
                    subMenu.push(tmpElement);
                }
                if (isDM)
                {
                    for (let i in dmTokenList)
                    {
                        let tmpElement = {};
                        tmpElement.text = dmTokenList[i].substring(0, dmTokenList[i].length - 4);
                        tmpElement.callback = function() 
                        {
                            requestServer({c: "editToken", id: token.id, image: dmTokenList[i]})
                            updateMapData();
                        }
                        subMenu.push(tmpElement);
                    }
                }
                displaySubMenu(e, subMenu);
            }},
            {text: "Draw Shape", description: "Pick a shape to draw", hasSubMenu: true, callback: function() {
                let subMenuOptions = [
                    {text: "Draw Circle", callback: function() {
                        let radiusInput = parseFloat(prompt("Please enter the desired radius in feet for your circle(s)"));
                        if (!isNaN(radiusInput))
                        {
                            circleMarkers.radius = ((radiusInput + (feetPerSquare / 2) * token.size) / feetPerSquare) * gridSize;
                            requestServer({c: "addDrawing", shape: "circle", link: token.id, x: token.x, y: token.y, radius: circleMarkers.radius, trueColor: shapeColor});
                            updateMapData();
                            closeMenu();
                            closeSubMenu();
                        }
                    }},
                    {text: "Draw Cone", callback: function() {
                        let rangeInput = parseFloat(prompt("Please enter the desired range in feet for your cone"));
                        if (!isNaN(rangeInput))
                        {
                            coneMarkers.x = token.x;
                            coneMarkers.y = token.y;
                            coneMarkers.range = rangeInput / feetPerSquare;
                            coneMarkers.linkId = token.id;
                            isPlacingCone = true;
                        }
                    }}
                ];
                displaySubMenu(e, subMenuOptions);
            }}
        ];
        if (token.group != null)
        {
            let groupOptions = {text: "Group options", hasSubMenu: true, callback: async function() {
                let subMenuOptions = [
                    {text: "Rotate group left", callback: function() {
                        requestServer({c:"rotateLeft", id: token.id});
                        updateMapData();
                    }},
                    {text: "Rotate group right", callback: function() {
                        requestServer({c:"rotateRight", id: token.id});
                        updateMapData();
                    }},
                    {text: "Unlink token", callback: function() {
                        requestServer({c:"editToken", id: token.id, size: token.size, status: token.status, layer: token.layer, group: ""})
                        updateMapData();
                    }}
                ];
                displaySubMenu(e, subMenuOptions);
            }}
            menuOptions.push(groupOptions);
        }
        if (isDM)
        {
            if (token.hidden)
            {
                menuOptions.push({text: "Reveal token", hasSubMenu: false, callback: async function() {
                    await requestServer({c: "setTokenHidden", id: token.id, hidden: false});
                    updateMapData();
                }})
            }
            else
            {
                menuOptions.push({text: "Hide token", hasSubMenu: false, callback: async function() {
                    await requestServer({c: "setTokenHidden", id: token.id, hidden: true});
                    updateMapData();
                }})
            }
            
        }
        
        displayMenu(e, menuOptions);
    })
    
    tokensDiv.appendChild(imageElement);

    if (isTextToken)
    {
        let textHolder = document.createElement("div");
        textHolder.style.zIndex = parseInt(imageElement.style.zIndex)+1;
        textHolder.style.left = (token.x - 0.4*token.size*gridSize).toString() + "px";
        textHolder.style.top = (token.y - 0.25*token.size*gridSize).toString() + "px";
        textHolder.style.width = (token.size*gridSize*0.8).toString() + "px";
        textHolder.style.height = (token.size*gridSize*0.5).toString() + "px";
        textHolder.style.lineHeight = (token.size*gridSize*0.5).toString() + "px";
        let textElement = document.createElement("a");
        textElement.innerText = token.text;
        textElement.style.height = "100%";
        textElement.style.whiteSpace = "nowrap";
        textElement.style.fontSize = "10px";
        textElement.style.transform = "translate(-50%, -50%);";
        textElement.style.userSelect = "none";
        textHolder.appendChild(textElement);
        tokensDiv.appendChild(textHolder);
        let autoCalcSize = parseInt(textElement.style.fontSize.substr(0, textElement.style.fontSize.length-2)) * (textHolder.getBoundingClientRect().width/textElement.getBoundingClientRect().width);
        if (autoCalcSize<0.8*imageElement.getBoundingClientRect().width)
            textElement.style.fontSize = autoCalcSize;
        else
            textElement.style.fontSize = 0.8*imageElement.getBoundingClientRect().width;
        textElement.style.width = (token.size*gridSize*0.8).toString() + "px";
    }
}

function updateTracker()
{
    initiativeTrackerDiv.innerHTML = "";
    for (let i in mapData.tokens)
    {
        if (CheckTokenPermission(mapData.tokens[i]))
        {
            createTracker(mapData.tokens[i]);
        }
    }
    if (initiativeTrackerDiv.children.length>0)
    {
        initiativeTrackerDiv.removeChild(initiativeTrackerDiv.children[initiativeTrackerDiv.children.length - 1]);
    }
        
}

function createTracker(trackerData)
{
    if (trackerData.initiative != null || trackerData.name != null || trackerData.ac != null || trackerData.hp != null)
    {
        let tmpTrackerDiv = document.createElement("div");
        tmpTrackerDiv.className = "initiativeItem";
        tmpTrackerDiv.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            showDetailsScreen();
            selectedToken = trackerData.id;
            nameInput.value = trackerData.name;
            if (trackerData.image!=null)
            {
                if (mapData.tokenList.includes(trackerData.image))
                { detailsIcon.src = "public/tokens/" + trackerData.image; }
                else
                { detailsIcon.src  = "public/dmTokens/" + trackerData.image; }
            }
            else
            {
                detailsIcon.src = "public/blankToken.png";
                if (trackerData.dm)
                {
                    if (!isDM)
                        return;
                }
            }
            
            if (trackerData.notes == null)
            { noteArea.value = ""; }
            else
            { noteArea.value = trackerData.notes; }

            if (trackerData.initiative == null)
            { initiativeInput.value = "" }
            else
            { initiativeInput.value = trackerData.initiative; }
                
            if (trackerData.ac == null)
            { acInput.value = ""; }
            else
            { acInput.value = trackerData.ac; }
                
            if (trackerData.hp == null)
            {
                currentHpInput.value = "";
                maxHpInput.value = "";
            }
            else
            {
                currentHpInput.value = trackerData.hp.split("/")[0];
                maxHpInput.value = trackerData.hp.split("/")[1];
            }

            if (trackerData.status == null)
            { statusInput.value = ""; }
            else
            { statusInput.value = trackerData.status; }
                
            if (trackerData.group == null)
            { groupIdInput.value = ""; }
            else
            { groupIdInput.value = trackerData.group; }
            updateMapData(true);
        }
        if (!mapData.hideInit)
        {
            let tmpInitDiv = document.createElement("div");
            tmpInitDiv.style.pointerEvents = "none";
            tmpInitDiv.className = "initiative";
            if (trackerData.initiative == null)
            {
                tmpInitDiv.innerText = "";
            }
            else
            {
                tmpInitDiv.innerText = trackerData.initiative;
            }
            tmpTrackerDiv.append(tmpInitDiv);
        }
        let tmpNameDiv = document.createElement("div");
        tmpNameDiv.style.pointerEvents = "none";
        tmpNameDiv.className = "trackerName";
        tmpNameDiv.innerText = trackerData.name;
        tmpTrackerDiv.append(tmpNameDiv);
        let bottomRow = document.createElement("div");
        bottomRow.className = "trackerBottomRow";
            let trackerArmorSection = document.createElement("div");
            trackerArmorSection.style.pointerEvents = "none";
            trackerArmorSection.className = "trackerArmorSection";
                let trackerArmorClass = document.createElement("div");
                trackerArmorClass.className = "trackerArmorClass";
                trackerArmorClass.style.pointerEvents = "none";
                if (trackerData.ac == null)
                {
                    trackerArmorClass.innerText = "-";
                }
                else
                {
                    trackerArmorClass.innerText = trackerData.ac;
                }
                trackerArmorSection.append(trackerArmorClass);
                let trackerArmorP = document.createElement("p");
                trackerArmorP.style.pointerEvents = "none";
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
                trackerDamageButton.onclick = function(e)
                {
                    e.preventDefault();
                    e.stopPropagation();
                    let damage = parseInt(prompt("Enter the damage to reduct from this token: "));
                    if (!isNaN(damage))
                    {
                        if (trackerData.hp != null)
                        {
                            requestServer({c: "editToken", id: trackerData.id, hp: (trackerData.hp.split("/")[0] - damage).toString() + "/" + trackerData.hp.split("/")[1]});
                        }
                    }
                }
                trackerDamageButton.append(trackerDamageImage);
                trackerHitpointsSection.append(trackerDamageButton);
                let trackerHitpoints = document.createElement("div");
                trackerHitpoints.style.pointerEvents = "none";
                trackerHitpoints.className = "trackerHitpoints";
                if (trackerData.hp != null)
                {
                    trackerHitpoints.innerText = trackerData.hp.split("/")[0]
                }
                else
                {
                    trackerHitpoints.innerText = "-";
                }
                trackerHitpointsSection.append(trackerHitpoints);
                let slashP = document.createElement("p");
                slashP.style.pointerEvents = "none";
                slashP.innerText = "/";
                trackerHitpointsSection.append(slashP);
                let trackerHitpointsMax = document.createElement("div");
                trackerHitpointsMax.style.pointerEvents = "none";
                trackerHitpointsMax.className = "trackerHitpointsMax";
                if (trackerData.hp != null)
                {
                    trackerHitpointsMax.innerText = trackerData.hp.split("/")[1]
                }
                else
                {
                    trackerHitpointsMax.innerText = "-";
                }
                trackerHitpointsSection.append(trackerHitpointsMax);
                let hpP = document.createElement("p");
                hpP.style.pointerEvents = "none";
                hpP.innerText = "HP";
                trackerHitpointsSection.append(hpP);
            bottomRow.append(trackerHitpointsSection);
        tmpTrackerDiv.append(bottomRow);
        if (trackerData.id==selectedToken)
        {
            if (trackerData.dm || mapData.dmTokenList.includes(trackerData.image))
                tmpTrackerDiv.style.backgroundColor = "#E0A0A0";
            else
                tmpTrackerDiv.style.backgroundColor = "#A0A0A0";
        }
        else
        {
            if (trackerData.dm || mapData.dmTokenList.includes(trackerData.image))
                tmpTrackerDiv.style.backgroundColor = "#E0C0C0";
            else
                tmpTrackerDiv.style.backgroundColor = "#C0C0C0";
        }    
        let trackerHR = document.createElement("hr");
        trackerHR.className = "initiativeHR";
        initiativeTrackerDiv.appendChild(tmpTrackerDiv);
        initiativeTrackerDiv.appendChild(trackerHR);    
    }
}

function showDetailsScreen()
{
    detailsScreen.style.display = "grid";
}

function hideDetailsScreen()
{
    detailsScreen.style.display = "none";
}
//#endregion

//#region misc Drag/Drop handlers
let isDraggingToken = false;

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
        let gridX = map.width / mapData.x;
        let gridY = map.height / mapData.y;
        let draggingTokenData;
        for (let b = 0; b < mapData.tokens.length; b++)
        {
            if (mapData.tokens[b].id == draggingToken)
            {
                draggingTokenData = mapData.tokens[b];
            }
        }
        if (GridSnap)
        {
            let tX;
            let tY;
            console.log(draggingTokenData);
            if (draggingTokenData.size >= 1)
            {
                tX = Math.round(((e.pageX + board.scrollLeft) + tokenDragOffset.x - 0.5 * gridX * draggingTokenData.size) / gridX) * gridX + 0.5 * gridX * draggingTokenData.size + offsetX + 1;
                tY = Math.round(((e.pageY + board.scrollTop) + tokenDragOffset.y - 0.5 * gridY * draggingTokenData.size) / gridY) * gridY + 0.5 * gridY * draggingTokenData.size + offsetY + 1;
            }
            else
            {
                tX = Math.round(((e.pageX + board.scrollLeft) - offsetX + tokenDragOffset.x - 0.5 * gridX * draggingTokenData.size) / (gridX * draggingTokenData.size)) * (gridX * draggingTokenData.size) + 0.5 * gridX * draggingTokenData.size + offsetX + 1;
                tY = Math.round(((e.pageY + board.scrollTop) - offsetY + tokenDragOffset.y - 0.5 * gridY * draggingTokenData.size) / (gridY * draggingTokenData.size)) * (gridY * draggingTokenData.size) + 0.5 * gridY * draggingTokenData.size + offsetY + 1;
            }
            console.log("Did this");
            if (tX != draggingTokenData.x || tY != draggingTokenData.y)
            {
                await requestServer({c: "moveToken", id: draggingToken, x: tX, y: tY, bypassLink: !controlPressed});
            }
                
        }
        else
        {
            if ((e.pageX + board.scrollLeft + tokenDragOffset.x) != draggingTokenData.x || (e.pageY + board.scrollTop + tokenDragOffset.y) != draggingTokenData.y)
            {
                await requestServer({c: "moveToken", id: draggingToken, x: (e.pageX + board.scrollLeft) + tokenDragOffset.x, y: (e.pageY + board.scrollTop) + tokenDragOffset.y, bypassLink: !controlPressed});
            }
        }
        updateMapData();
        isDraggingToken = false;
        controlPressed = false;
        draggingToken = -1;
    }
    if (isDraggingBlocker)
    {
        draggedBlocker.x = (e.pageX + board.scrollLeft);
        draggedBlocker.y = (e.pageY + board.scrollTop);
    }
}
//#endregion

//#region Main event handlers
function updateSelectedTokenData()
{
    for (let i in mapData.tokens)
    {
        if (mapData.tokens[i].id == selectedToken)
        {
            selectedTokenData = mapData.tokens[i];
        }
    }
        
}

function CheckTokenPermission(token) {
    if (token==null)
        return false;
    else
    {
        if (token.image!=null) {
            if (mapData.tokenList.includes(token.image)) {
                return true;
            } else {
                if (isDM) {
                    return true;
                } else {
                    return false
                }
            }
        } else {
            if (token.dm)
            {
                if (isDM) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }
    }
    
}

document.getElementById("invertBlockerButton").onclick = function() {
    requestServer({c: "invertBlockers"});
    updateMapData(true);
}

document.getElementById("openBulkGenerator").onclick = function() {
    if (bulkInitGeneratorScreen.style.display=="none" || bulkInitGeneratorScreen.style.display=="")
        bulkInitGeneratorScreen.style.display = "block";
    else
        bulkInitGeneratorScreen.style.display = "none";
}

bulkTokenConfirm.onclick = function() {
    let tokensToPlace = parseInt(bulkTokenAmountInput.value);
    if (isNaN(tokensToPlace) || tokensToPlace<1)
    {
        alert("The settings of the bulk initiative generator aren't valid");
        return;
    }
    let tokenSizes = parseFloat(prompt("Enter the size of the new tokens"));
    if (isNaN(tokenSizes))
    {
        return;
    }
    bulkInitSettings.tokenSizes = tokenSizes;
    bulkInitSettings.image = bulkTokenSelect.value;
    bulkInitSettings.tokenAmount = tokensToPlace;
    bulkInitSettings.commonName = bulkTokenNameInput.value;
    placingBulkOrigin = true;
}

noteArea.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
    {
        requestServer({c: "editToken", id: selectedToken, notes: noteArea.value});
    }
}

initiativeInput.oninput = function() {
    updateSelectedTokenData();
    let newInit = parseFloat(initiativeInput.value);
    if (CheckTokenPermission(selectedTokenData))
    {
        if (newInit==null || isNaN(newInit))
        {
            requestServer({c: "editToken", id: selectedToken, initiative: "reset"});
        }
        else
        {
            requestServer({c: "editToken", id: selectedToken, initiative: newInit});
        }
    }   
    updateMapData();
}

nameInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        requestServer({c: "editToken", id: selectedToken, name: nameInput.value});
    }
    updateMapData();
}

acInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        requestServer({c: "editToken", id: selectedToken, ac: acInput.value});  
    }
    updateMapData();
}

currentHpInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        requestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value + "/" + maxHpInput.value});
    }
    updateMapData();
}

maxHpInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        requestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value + "/" + maxHpInput.value});
    }
    updateMapData();
}

statusInput.oninput = function() {
    updateSelectedTokenData();
    requestServer({c:"editToken", id: selectedToken, status: statusInput.value});
    updateMapData();
}

groupIdInput.oninput = function() {
    let newGroupId = parseInt(groupIdInput.value);
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        if (newGroupId)
        {
            requestServer({c:"editToken", id: selectedToken, group: newGroupId});
        }
        else
        {
            requestServer({c:"editToken", id: selectedToken, group: "reset"});
        }
    }
    updateMapData();
}

document.body.addEventListener("mouseup", function(e) {
    if (e.button == 0)
    {
        if (isPanning)
        {
            isPanning = false;
            document.body.style.cursor = "";
        }
        if (resizingSideMenu && !menuIsHidden && e.target != resizer)
        {
            let calcWidth = (window.innerWidth - 3 * resizer.offsetWidth - e.pageX) / window.innerWidth * 100;
            if (calcWidth < 12)
                calcWidth = 12;
            let newWidth = calcWidth.toString() + "vw";
            document.body.style.setProperty("--sidemenu-width", newWidth);
            resizer.style.right = (calcWidth + 0.5).toString() + "vw";
            resizingSideMenu = false;
            board.style.width = (100 - (calcWidth + 0.8)).toString() + "vw";
        }
    }
})

shapeMap.addEventListener("mousedown", function(e) {
    if (e.button == 0)
    {
        selectedToken=-1;
        selectedBlocker=-1;
        hideDetailsScreen();
        drawCanvas(true);
        if (placingBulkOrigin)
        {
            let autoGenInit = confirm("Automatically generate initiatives for the new tokens?");
            let dexBonus;
            if (autoGenInit)
            {
                dexBonus = parseInt(prompt("Enter the dex mod of the new tokens"));
                if (isNaN(dexBonus))
                    return;
            }

            if (bulkInitSettings.image=="number")
            {
                
                let commonNameInText = confirm("Display common name in token text?");
                for (let f = 1; f <= bulkInitSettings.tokenAmount; f++)
                {
                    let tokenText;
                    if (commonNameInText)
                    {
                        tokenText = bulkInitSettings.commonName+" "+f.toString();
                    }
                    else
                    {
                        tokenText = f.toString();
                    }
                    if (autoGenInit)
                        requestServer({c: "createToken", text: tokenText, x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: Math.ceil(Math.random()*20)+dexBonus})
                    else
                        requestServer({c: "createToken", text: tokenText, x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString()})
                }
            }
            else
            {
                for (let f = 1; f <= bulkInitSettings.tokenAmount; f++)
                {
                    if (autoGenInit)
                        requestServer({c: "createToken", x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: Math.ceil(Math.random()*20)+dexBonus})
                    else
                        requestServer({c: "createToken", x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString()})
                }
            }
            placingBulkOrigin = false;
            updateMapData();
            return;
        }

        if (isPlacingBlocker)
        {
            if (isDM)
            {
                blockerMarkers.width = (e.pageX + board.scrollLeft) - blockerMarkers.x;
                blockerMarkers.height = (e.pageY + board.scrollTop) - blockerMarkers.y;
                requestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
                updateMapData();
            }
            isPlacingBlocker = false;
            return;
        }
        if (isPlacingSquare)
        {
            squareMarkers.width = (e.pageX + board.scrollLeft) - squareMarkers.x;
            squareMarkers.height = (e.pageY + board.scrollTop) - squareMarkers.y;
            if (squareMarkers.width >= -map.width && squareMarkers.width <= map.width && squareMarkers.height >= -map.height && squareMarkers.height <= map.height)
            {
                requestServer({c: "addDrawing", shape: "square", x: squareMarkers.x, y: squareMarkers.y, width: squareMarkers.width, height: squareMarkers.height, trueColor: shapeColor});
                updateMapData();
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
            lineMarkers.destX = (e.pageX + board.scrollLeft);
            lineMarkers.destY = (e.pageY + board.scrollTop);
            let dy = lineMarkers.destY - lineMarkers.y;
            let dx = lineMarkers.destX - lineMarkers.x;
            let distance = Math.sqrt(Math.pow((dx), 2) + Math.pow((dy), 2));
            if (distance > lineMarkers.range)
            {    
                lineMarkers.destX = lineMarkers.x + dx / distance * lineMarkers.range;
                lineMarkers.destY = lineMarkers.y + dy / distance * lineMarkers.range;
            }
            requestServer({c: "addDrawing", shape: "line", x: lineMarkers.x, y: lineMarkers.y, destX: lineMarkers.destX, destY: lineMarkers.destY, trueColor: shapeColor});
            updateMapData();
            isPlacingLine = false;
            return;
        }
        if (isPlacingCone)
        {
            let destX = e.pageX + board.scrollLeft;
            let destY = e.pageY + board.scrollTop;
            let angle = Math.atan2((destY - coneMarkers.y), (destX - coneMarkers.x));
            if (angle<0)
                angle+=2*Math.PI;
            requestServer({c: "addDrawing", shape: "cone", link: coneMarkers.linkId, x: coneMarkers.x, y: coneMarkers.y, angle: angle, range: coneMarkers.range, trueColor: shapeColor});
            updateMapData();
            isPlacingCone = false;
            return;
        }

        let pixel = hitboxCanvas.getImageData((e.pageX + board.scrollLeft), (e.pageY + board.scrollTop), 1, 1).data;
        if (!(pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0))
        {
            let testString = "#" + decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
            let shapeId = colorToSigned24Bit(testString) / 16;
            if (shapeId%1 == 0)
            {
                shapeId--;
                if (mapData.drawings[shapeId].link==null)
                {
                    console.log("Picked up: " + shapeId);
                    document.body.style.cursor = "pointer";
                    shapeDragOffset.x = mapData.drawings[shapeId].x - (e.pageX + board.scrollLeft);
                    shapeDragOffset.y = mapData.drawings[shapeId].y - (e.pageY + board.scrollTop);
                    movingShapeId = shapeId;
                    isMovingShape = true;
                }
                else
                {
                    if (mapData.drawings[shapeId].shape=="cone")
                    {
                        document.body.style.cursor = "pointer";
                        shapeDragOffset.x = mapData.drawings[shapeId].x;
                        shapeDragOffset.y = mapData.drawings[shapeId].y;
                        movingShapeId = shapeId;
                        isMovingCone = true;
                    }
                }
            }
            return;
        }

        isPanning = true;
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
    if (e.button == 0)
    {
        if (isMovingShape)
        {
            isMovingShape = false;
            console.log("Dropped shape!");
            document.body.style.cursor = "default";
            requestServer({c: "editDrawing", id: movingShapeId, x: (e.pageX + board.scrollLeft) + shapeDragOffset.x, y: (e.pageY + board.scrollTop) + shapeDragOffset.y});
            updateMapData();
        }
        if (isMovingCone)
        {
            isMovingCone = false;
            console.log("Changing cone angle!");
            document.body.style.cursor = "default";
            let angle = Math.atan2(((e.pageY + board.scrollTop) - shapeDragOffset.y), ((e.pageX + board.scrollLeft) - shapeDragOffset.x));
            if (angle<0)
                angle+=2*Math.PI;
            requestServer({c: "editDrawing", id: movingShapeId, angle: angle});
            updateMapData();
        }
    }
})

shapeMap.addEventListener("dragstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
})

map.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    displayContextMenu(e);
})

shapeMap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    let pixel = hitboxCanvas.getImageData((e.pageX + board.scrollLeft), (e.pageY + board.scrollTop), 1, 1).data;
    if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0)
    {
        displayContextMenu(e);
    }
    else
    {
        shapeContextMenu(e, pixel);
    }
})

function shapeContextMenu(e, pixel)
{
    let testString = "#" + decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
    let shapeId = colorToSigned24Bit(testString) / 16;
    if (shapeId%1 == 0)
    {
        shapeId--;
        let menuOptions = [
            {text: "Erase shape", hasSubMenu: false, callback: async function() {
                let result = await requestServer({c: "removeDrawing", id: shapeId, removedDrawings: mapData.removedDrawings});
                if (result[0] == true)
                {
                    updateMapData();
                }
                else
                {
                    alert("That drawing has already been removed by someone else!");
                }
            }}
        ];
        displayMenu(e, menuOptions);
    }
}

function displayContextMenu(e)
{
    let listOptions = [
        {text: "Place Token", hasSubMenu: true, callback: async function() {
            let subMenu = [];
            let tokenList = mapData.tokenList;
            let dmTokenList = mapData.dmTokenList;
            let textToken = {text: "Text token", callback: function() {
                let textToDisplay = prompt("Enter the text to display on the text token:");
                if (textToDisplay!="")
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (tokenSize == null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (isDM)
                        {
                            if (tokenSize < 20 && tokenSize > 0)
                            {
                                if (confirm("Make this a DM token?"))
                                    requestServer({c: "createToken", text: textToDisplay, x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), size: tokenSize, status: "", layer: 0, dm: true})
                                else
                                    requestServer({c: "createToken", text: textToDisplay, x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), size: tokenSize, status: "", layer: 0, dm: false})
                                
                                console.log("Placing text token with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                                updateMapData();
                            }
                            else
                            {
                                alert("The desired size is too large or invalid");
                            }
                        }
                        else
                        {
                            if (tokenSize < 6 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", text: textToDisplay, x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), size: tokenSize, status: "", layer: 0, dm: false})
                                console.log("Placing text token with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                                updateMapData();
                            }
                            else
                            {
                                alert("That token size isn't allowed for players");
                            }
                        }
                    }
                }
            }};
            subMenu.push(textToken);
            for (let i in tokenList)
            {
                let tmpElement = {};
                tmpElement.text = tokenList[i].substring(0, tokenList[i].length - 4);
                tmpElement.callback = function() 
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (tokenSize == null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (isDM)
                        {
                            if (tokenSize < 20 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), image: tokenList[i], size: tokenSize, status: "", layer: 0, dm: false})
                                console.log("Placing " + tokenList[i] + " with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                                updateMapData();
                            }
                            else
                            {
                                alert("The desired size is too large or invalid");
                            }
                        }
                        else
                        {
                            if (tokenSize < 6 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), image: tokenList[i], size: tokenSize, status: "", layer: 0, dm: false})
                                console.log("Placing " + tokenList[i] + " with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                                updateMapData();
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
                    tmpElement.text = dmTokenList[i].substring(0, dmTokenList[i].length - 4);
                    tmpElement.callback = function() 
                    {
                        let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                        if (tokenSize == null)
                        {
                            alert("That wasn't a valid size! Please try again!");
                        }
                        else
                        {
                            requestServer({c: "createToken", x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), image: dmTokenList[i], size: tokenSize, status: "", layer: 0, dm: true})
                            console.log("Placing " + dmTokenList[i] + " with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                            updateMapData();
                        }
                    }
                    subMenu.push(tmpElement);
                }
            }
            displaySubMenu(e, subMenu);
        }},
        {text: "Draw Shape", description: "Pick a shape to draw", hasSubMenu: true, callback: function() {
            let subMenuOptions = [
                {text: "Draw Circle", callback: function() {
                    let radiusInput = parseFloat(prompt("Please enter the desired radius in feet for your circle(s)"));
                    if (radiusInput != null)
                    {
                        circleMarkers.radius = radiusInput / feetPerSquare * gridSize;
                        circleMarkers.x = e.pageX + board.scrollLeft;
                        circleMarkers.y = e.pageY + board.scrollTop;
                        requestServer({c: "addDrawing", shape: "circle", x: circleMarkers.x, y: circleMarkers.y, radius: circleMarkers.radius, trueColor: shapeColor});
                        updateMapData();
                        closeMenu();
                        closeSubMenu();
                    }    
                }},
                {text: "Draw Square", callback: function() {
                    squareMarkers.x = e.pageX + board.scrollLeft;
                    squareMarkers.y = e.pageY + board.scrollTop;
                    isPlacingSquare = true;
                }},
                {text: "Draw Line", callback: function() {
                    let rangeInput = parseFloat(prompt("Please enter the desired range of the line in feet, leave blank for no range limit"));
                    if (rangeInput != null)
                    {
                        lineMarkers.range = rangeInput / feetPerSquare * gridSize;
                    }
                    else
                    {
                        lineMarkers.range = 999999;
                    }
                    lineMarkers.x = e.pageX + board.scrollLeft;
                    lineMarkers.y = e.pageY + board.scrollTop;
                    isPlacingLine = true;
                }}
            ];
            displaySubMenu(e, subMenuOptions);
        }}
    ]
    let DMoptions = [
        {text: "Place hidden Token", hasSubMenu: true, callback: async function() {
            let subMenu = [];
            let textToken = {text: "Text token", callback: function() {
                let textToDisplay = prompt("Enter the text to display on the text token:");
                if (textToDisplay!="")
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (tokenSize == null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (tokenSize < 20 && tokenSize > 0)
                        {
                            if (confirm("Make this a DM token?"))
                                requestServer({c: "createToken", text: textToDisplay, x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), size: tokenSize, status: "", layer: 0, dm: true, hidden: true})
                            else
                                requestServer({c: "createToken", text: textToDisplay, x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), size: tokenSize, status: "", layer: 0, dm: false, hidden: true})
                            
                            console.log("Placing text token with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                            updateMapData();
                        }
                        else
                        {
                            alert("The desired size is too large or invalid");
                        }
                    }
                }
            }};
            subMenu.push(textToken);
            let tokenList = mapData.tokenList;
            let dmTokenList = mapData.dmTokenList;
            for (let i in tokenList)
            {
                let tmpElement = {};
                tmpElement.text = tokenList[i].substring(0, tokenList[i].length - 4);
                tmpElement.callback = function() 
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (tokenSize == null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (tokenSize < 20 && tokenSize > 0)
                        {
                            requestServer({c: "createToken", x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), image: tokenList[i], size: tokenSize, status: "", hidden: true, layer: 0, dm: true})
                            console.log("Placing hidden " + tokenList[i] + " with size " + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                            updateMapData();
                        }
                        else
                        {
                            alert("The desired size is too large or invalid");
                        }
                    }
                }
                subMenu.push(tmpElement);
            }
            for (let i in dmTokenList)
            {
                let tmpElement = {};
                tmpElement.text = dmTokenList[i].substring(0, dmTokenList[i].length - 4);
                tmpElement.callback = function() 
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (tokenSize == null)
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        requestServer({c: "createToken", x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), image: dmTokenList[i], size: tokenSize, status: "", hidden: true, layer: 0, dm: true})
                        console.log("Placing " + dmTokenList[i] + " with size" + tokenSize + " at " + (e.pageX + board.scrollLeft).toString() + ":" + (e.pageY + board.scrollTop).toString());
                        updateMapData();
                    }
                }
                subMenu.push(tmpElement);
            }
            displaySubMenu(e, subMenu);
        }},
        {text: "Place Blocker", description: "Upon clicking this button click somewhere else to define the bottom right corner", hasSubMenu: false, callback: async function() {
            blockerMarkers.x = (e.pageX + board.scrollLeft);
            blockerMarkers.y = (e.pageY + board.scrollTop);
            isPlacingBlocker = true;
        }}
    ]
    if (isDM)
    {
        for (let f = 0; f < DMoptions.length; f++)
            listOptions.push(DMoptions[f]);
    }
    displayMenu(e, listOptions);
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
        closeMenu();
        closeSubMenu();
    }
}
//#endregion

//#region Menu and Submenu
    let customMenu = document.getElementById("contextMenu");
    function displayMenu(event, listData) 
    {
        closeMenu();
        closeSubMenu();
        customMenu.innerHTML = "";
        if (listData.length > 0)
        {
            let tmpHeight = listData.length * 5;
            if (tmpHeight > 25)
            {
                tmpHeight = 25;
                customMenu.style.overflowY = "scroll";
            }
            else
            {
                customMenu.style.overflowY = "auto";
            }
            customMenu.style.display = "block";
            let testx = (event.pageX + board.scrollLeft);
            let testy = (event.pageY + board.scrollTop);
            customMenu.style.top = testy + "px";
            customMenu.style.left = testx + "px";
            customMenu.style.height = tmpHeight + "vh";
            for (let p in listData)
            {
                let listItem = document.createElement('li');
                listItem.innerText = listData[p].text;
                listItem.className = "custom-menu-element";
                if (listData[p].description != null)
                {
                    listItem.title = listData[p].description;
                }
                listItem.onclick = function() 
                {
                    listData[p].callback();
                    if (listData[p].hasSubMenu != true)
                    {
                        closeMenu();
                        closeSubMenu();
                    }
                }
                customMenu.appendChild(listItem);
            }
            if ((event.pageX + board.scrollLeft) + customMenu.offsetWidth > (window.innerWidth + window.pageXOffset))
            {
                scrollBy((((event.pageX + board.scrollLeft) + customMenu.offsetWidth + 10) - (window.innerWidth + window.pageXOffset)), 0);
            }
            if ((event.pageY + board.scrollTop) + customMenu.offsetHeight > (window.innerHeight + window.pageYOffset))
            {
                scrollBy(0, (((event.pageY + board.scrollTop) + customMenu.offsetHeight + 10) - (window.innerHeight + window.pageYOffset)));
            }
        }
    }
    
    function closeMenu() { customMenu.style.display = "none"; }

    let customSubMenu = document.getElementById("subContextMenu");
    function displaySubMenu(event, listData) 
    {
        customSubMenu.innerHTML = "";
        if (listData.length > 0)
        {
            let tmpHeight = listData.length * 5;
            if (tmpHeight > 25)
            {
                tmpHeight = 25;
                customSubMenu.style.overflowY = "scroll";
            }
            else
            {
                customSubMenu.style.overflowY = "auto";
            }
            customSubMenu.style.display = "block";
            customSubMenu.style.height = tmpHeight + "vh";
            customSubMenu.style.top = (event.pageY + board.scrollTop).toString() + "px";
            customSubMenu.style.left = ((event.pageX + board.scrollLeft) + customMenu.offsetWidth).toString() + "px";
            for (let p in listData) 
            {
                let listItem = document.createElement('li');
                if (listData[p].description != null)
                {
                    listItem.title = listData[p].description;
                }
                listItem.innerText = listData[p].text;
                listItem.className = "custom-menu-element";
                listItem.onclick = function() 
                {
                    listData[p].callback();
                    closeMenu();
                    closeSubMenu();
                }
                customSubMenu.appendChild(listItem);
            }
            if ((event.pageX + board.scrollLeft) + customMenu.offsetWidth * 2 > (window.innerWidth + window.pageXOffset))
            {
                scrollBy((((event.pageX + board.scrollLeft) + customMenu.offsetWidth * 2 + 10) - (window.innerWidth + window.pageXOffset)), 0);
            }
        }
    }

    function closeSubMenu() { customSubMenu.style.display = "none"; }
//#endregion

//#region Low level functions
function colorToSigned24Bit(s) {
    return (parseInt(s.substr(1), 16) << 8) / 256;
}

function decToHex(num)
{
    let tmpHex = num.toString(16);
    while (tmpHex.length < 2)
    {
        tmpHex = "0" + tmpHex;
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

//#endregion

//#region Cookies
export function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname) {
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

//#region Side menu stuff
let resizer = document.getElementById("Resizer");
let menuIsHidden = false;
resizer.addEventListener("dblclick", function(e) {
    if (menuIsHidden)
    {
        sideMenu.style.display = "";
        let calcWidth = 12;
        let newWidth = calcWidth.toString() + "vw";
        document.body.style.setProperty("--sidemenu-width", newWidth);
        resizer.style.right = (calcWidth + 0.5).toString() + "vw";
        board.style.width = (100 - (calcWidth + 0.8)).toString() + "vw";
        resizer.style.width = "0.3vw";
    }
    else
    {
        resizer.style.width = "0.5vw";
        sideMenu.style.display = "none";
        resizer.style.right = "0vw";
        board.style.width = "99.7vw";
    }
    e.stopPropagation();
    resizingSideMenu = false;
    menuIsHidden = !menuIsHidden;
})

resizer.addEventListener("mousedown", function(e) {
    e.preventDefault();
    e.stopPropagation();
    resizingSideMenu = true;
})


function updateButtonColors()
{
    if (GridActive)
    {
        document.getElementById("toggleGridButton").style.backgroundColor = "aquamarine";
    }
    else
    {
        document.getElementById("toggleGridButton").style.backgroundColor = "rgb(240, 240, 240)";
    }
        
    if (GridSnap)
    {
        document.getElementById("toggleSnapButton").style.backgroundColor = "aquamarine";
    }
    else
    {
        document.getElementById("toggleSnapButton").style.backgroundColor = "rgb(240, 240, 240)";
    }
        

    if (isDM)
    {
        if (displayMapSettings)
        {
            document.getElementById("toggleSettingsButton").style.backgroundColor = "aquamarine";
        }
        else
        {
            document.getElementById("toggleSettingsButton").style.backgroundColor = "rgb(240, 240, 240)";
        }

        if (blockerEditMode)
        {
            document.getElementById("toggleBlockerEditing").style.backgroundColor = "aquamarine";
        }
        else
        {
            document.getElementById("toggleBlockerEditing").style.backgroundColor = "rgb(240, 240, 240)";
        }
    }
}
//#endregion Side menu stuff