let GridActive = true;
let GridSnap = false;
let autoUpdate = true;
let mapUpdateInterval = 1000;
let offsetX = 0;
let offsetY = 0;
let GridColor = "#222222FF";
let shapeColor = "#FF0000FF";
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
let polyBlockers = document.getElementById("polyBlockers");
let polyBlockerHandles = document.getElementById("polyBlockerHandles");
let newPolyBlockerHandles = document.getElementById("newPolyBlockerHandles");
let shapeHandles = document.getElementById("shapeHandles");
let antiBlockerMap = document.getElementById("antiBlockerMap");
let initSearch = document.getElementById("initSearch");
let buttonList = document.getElementById("toggleButtons");
let noteArea = noteEditor.children[0];
let mapCanvas;
let shapeCanvas;
let hitboxCanvas;
let antiBlockerCanvas;
let mapData;
let gridSize;
let tokenDragOffset = {x: 0, y: 0};
let blockerDragOffset = {x: 0, y: 0};
let shapeDragOffset = {x: 0, y: 0};
let blockerMarkers = {x: 0, y: 0, width: 0, height: 0};
let circleMarkers = {x: 0, y: 0, radius: 0};
let squareMarkers = {x: 0, y: 0, width: 0, height: 0};
let lineMarkers = {x: 0, y: 0, destX: 0, destY: 0, range: 100};
let thickLineMarkers = {x: 0, y: 0, range: 100, linkId: -1};
let coneMarkers = {x: 0, y: 0, range: 100, tokenSize: 1};
let bulkInitSettings = {};
let isDM = false;
let shapeColorCookie = getCookie("shapeColor");
if (shapeColorCookie == "") {
    setCookie("shapeColor", shapeColor);
} else {
    shapeColor = shapeColorCookie;
}
let clientName = getCookie("playerName");
if (clientName == "")
    window.location.href = "/";
let feetPerSquare = 5.0;
let isPlacingBlocker = false;
let isPlacingSquare = false;
let isPlacingLine = false;
let isPlacing5ftLine = false;
let isPlacingCone = false;
let isDraggingBlocker = false;
let blockerEditMode = false;
let draggedBlocker = {x: 0, y: 0};
let hiddenMapImportButton = document.getElementById("fileImport");
let isMovingShape = false;
let isMovingCone = false;
let isMoving5ftLine = false;
let isPanning = false;
let oldMousePos = {x: 0, y: 0};
let oldScrollPos = {x: 0, y: 0};
let movingShapeId = 0;
let selectedToken;
let selectedTokenData;
let selectedBlocker;
let selectedShapeId = -1;
let oldData = "";
let oldParsedData = null;
let resizingSideMenu = false;
let controlPressed = false;
let placingBulkOrigin = false;
let baseTokenIndex = 4;
let draggingToken = -1;
let shapeDragStartAngle = 0;
let polyDragOffset = {x: 0, y: 0};
let draggedPolygonId;
let selectedVertHandle = -1;
let alignToolStep = 0;
let gridToolData = {startX: 0, startY: 0, gridX: 0, gridY: 0, endX: 0, endY: 0, }
let quickPolyBlockerMode = false;
let newPolyBlockerVerts = [];
let selectedNewVertHandle = -1;

window.onload = function() {
    if (getCookie("isDM") == 1)
    {
        isDM = true;
        document.getElementById("hiddenDMCheckbox").checked = isDM;
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
    antiBlockerCanvas = antiBlockerMap.getContext("2d");
    colorPicker.value = shapeColor.substr(0, shapeColor.length-2);
    await updateMapData(true);
    if(mapData.usePolyBlockers && isDM)
    {
        addQuickPolyBlockerButton();
    }
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
        console.log("Data is not identical or update has been forced, updating map!");
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
        }

        if (isDM) { document.getElementById("exportMap").title = mapData.mapName + " : " + mapData.map; }

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

        if (oldParsedData) {
            if (oldParsedData.map!=mapData.map) {
                clearCanvas();
                loadedMap.src = "/public/maps/" + mapData.map;
                selectedToken = -1;
                selectedBlocker = -1;
                selectedShapeId = -1;
                selectedVertHandle = -1;
                hideDetailsScreen();
                loadedMap.onload = function() 
                {
                    drawCanvas();
                    oldData = stringData;
                    if (oldData) {
                        oldParsedData = JSON.parse(oldData);
                    }
                }
            } else {
                let skipMapRedraw = true;
                if (oldParsedData.x != mapData.x) { skipMapRedraw = false; }
                if (oldParsedData.y != mapData.y) { skipMapRedraw = false; }
                if (oldParsedData.offsetX != mapData.offsetX) { skipMapRedraw = false; }
                if (oldParsedData.offsetY != mapData.offsetY) { skipMapRedraw = false; }
                if (oldParsedData.gridColor != mapData.gridColor) { skipMapRedraw = false; }
                if (force) { skipMapRedraw = false; }
                drawCanvas(skipMapRedraw);
                oldData = stringData;
                if (oldData) {
                    oldParsedData = JSON.parse(oldData);
                }
            }
        } else {
            clearCanvas();
            loadedMap.src = "/public/maps/" + mapData.map;
            loadedMap.onload = function() 
            {
                drawCanvas();
                oldData = stringData;
                if (oldData) {
                    oldParsedData = JSON.parse(oldData);
                }
            }
        }
    }
    else
    {
        console.log("Data is identical, not updating!");
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
    if (!(bulkInitGeneratorScreen.style.display=="none" || bulkInitGeneratorScreen.style.display=="")) {
        document.getElementById("openBulkGenerator").click();
    }
    
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
    let transparacyText = prompt("Please enter the the desired transparancy level (0-255): ", "255");
    if (transparacyText!=null)
    {
        let transparancy = parseInt(transparacyText);
        if (!isNaN(transparancy))
        {
            shapeColor = colorPicker.value + transparancy.toString(16);
            setCookie("shapeColor", shapeColor);
        }
        else
        {
            colorPicker.value = shapeColor.substr(0, shapeColor.length-2);
        }
    }
}

document.getElementById("importMap").onclick = function() {
    hiddenMapImportButton.click();
}

hiddenMapImportButton.onchange = function() {
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
function drawCanvas(skipMap)
{
    if (!skipMap) {
        map.width = loadedMap.naturalWidth;
        map.height = loadedMap.naturalHeight;
        mapCanvas.strokeStyle = GridColor;
        mapCanvas.lineWidth = GridLineWidth;
        polyBlockers.setAttribute("width", loadedMap.naturalWidth.toString());
        polyBlockers.setAttribute("height", loadedMap.naturalHeight.toString());
        shapeMap.width = loadedMap.naturalWidth;
        shapeMap.height = loadedMap.naturalHeight;
        hitboxMap.width = loadedMap.naturalWidth;
        hitboxMap.height = loadedMap.naturalHeight;
        antiBlockerMap.width = loadedMap.naturalWidth;
        antiBlockerMap.height = loadedMap.naturalHeight;
        mapCanvas.translate(0.5, 0.5);
        shapeCanvas.translate(0.5, 0.5);
        hitboxCanvas.translate(0.5, 0.5);
        gridSize = (map.width / mapData.x + map.height / mapData.y) / 2;
    }
    
    if (mapData.usePolyBlockers)
    {
        drawPolyBlockers()
    }
    else
    {
        drawBlockers();
    }
    if (!skipMap) {
        drawMap();
        if (GridActive)
        {
            drawGrid();
        }
    }
    drawTokens();
    drawShapes();
    updateTracker();
}

function drawShapes()
{
    shapeCanvas.clearRect(0, 0, shapeMap.width, shapeMap.height);
    hitboxCanvas.clearRect(0, 0, hitboxMap.width, hitboxMap.height);
    shapeHandles.innerHTML = "";
    for (let k in mapData.drawings)
    {
        let currentShape = mapData.drawings[k];
        if (currentShape.visible || isDM) {
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
                    if (currentShape.is90Deg) {
                        draw90Cone(k, currentShape)
                    } else {
                        drawCone(k, currentShape);
                    }
                    break;
                
                case "5ftLine":
                    draw5Line(k, currentShape);
                    break;
            }
        }
    }
}

function drawCircle(index, shape) 
{
    let trueRadius = shape.radius*gridSize;
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.arc(shape.x, shape.y, trueRadius, 0, 2 * Math.PI);
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
    hitboxCanvas.arc(shape.x, shape.y, trueRadius, 0, 2 * Math.PI);
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
    if (selectedShapeId == shape.id)
    {
        let handleContainer1 = document.createElement("div");
        handleContainer1.style.position = "absolute";
        handleContainer1.style.left = shape.x;
        handleContainer1.style.top = shape.y;
        let handle1 = document.createElement("div");
        handle1.className = "shapeHandle";
        handle1.draggable = true;
        handle1.style.left = "-0.25vw";
        handle1.style.top = "-0.25vw";
        let pickedUpHandle1 = false;
        handle1.addEventListener("mousedown", function(e) {
            if (e.button == 0)
            {
                pickedUpHandle1 = true;
            }
        });

        handle1.addEventListener("mouseup", function(e) {
            if (e.button == 0)
            {
                pickedUpHandle1 = false;
            }
        })

        handle1.addEventListener("contextmenu", function(e) {
            e.preventDefault();
        });

        handle1.addEventListener("dragover", function(e) {
            e.preventDefault();
        });

        handle1.addEventListener("dragend", function(e) {
            pickedUpHandle1 = false;
        });

        handleContainer1.appendChild(handle1);
        shapeHandles.appendChild(handleContainer1);

        let handleContainer2 = document.createElement("div");
        handleContainer2.style.position = "absolute";
        handleContainer2.style.left = shape.destX;
        handleContainer2.style.top = shape.destY;
        let handle2 = document.createElement("div");
        handle2.className = "shapeHandle";
        handle2.draggable = true;
        handle2.style.left = "-0.25vw";
        handle2.style.top = "-0.25vw";
        let pickedUpHandle2 = false;
        handle2.addEventListener("mousedown", function(e) {
            if (e.button == 0)
            {
                pickedUpHandle2 = true;
            }
        });

        handle2.addEventListener("mouseup", function(e) {
            if (e.button == 0)
            {
                pickedUpHandle2 = false;
            }
        })

        handle2.addEventListener("contextmenu", function(e) {
            e.preventDefault();
        });

        handle2.addEventListener("dragover", function(e) {
            e.preventDefault();
        });

        handle2.addEventListener("dragend", function(e) {
            pickedUpHandle2 = false;
        });

        window.addEventListener("drop", function(e) {
            if (pickedUpHandle1)
            {
                if ((e.clientX + board.scrollLeft)!=shape.x && (e.clientY + board.scrollTop)!=shape.y)
                {
                    requestServer({c:"editDrawing", id: shape.id, x: (e.clientX + board.scrollLeft), y: (e.clientY + board.scrollTop)});
                    updateMapData();
                }
            }
            pickedUpHandle1 = false;

            if (pickedUpHandle2)
            {
                if ((e.clientX + board.scrollLeft)!=shape.destX && (e.clientY + board.scrollTop)!=shape.destY)
                {
                    requestServer({c:"editDrawing", id: shape.id, destX: (e.clientX + board.scrollLeft), destY: (e.clientY + board.scrollTop)});
                    updateMapData();
                }
            }
            pickedUpHandle2 = false;
        });
        handleContainer2.appendChild(handle2);
        shapeHandles.appendChild(handleContainer2);
    }
}

function draw5Line(index, shape) {
    let lineOrigin = {x: shape.x + Math.cos(shape.angle)*gridSize*0.5, y: shape.y + Math.sin(shape.angle)*gridSize*0.5};
    let topOriginCorner = {x: lineOrigin.x + Math.cos(shape.angle-0.5*Math.PI)*gridSize*0.5, y: lineOrigin.y + Math.sin(shape.angle-0.5*Math.PI)*gridSize*0.5};
    let topTargetCorner = {x: topOriginCorner.x + Math.cos(shape.angle) * shape.range * gridSize, y: topOriginCorner.y + Math.sin(shape.angle) * shape.range * gridSize};
    let bottomOriginCorner = {x: lineOrigin.x + Math.cos(shape.angle+0.5*Math.PI)*gridSize*0.5, y: lineOrigin.y + Math.sin(shape.angle+0.5*Math.PI)*gridSize*0.5};
    let bottomTargetCorner = {x: bottomOriginCorner.x + Math.cos(shape.angle) * shape.range * gridSize, y: bottomOriginCorner.y + Math.sin(shape.angle) * shape.range * gridSize};
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(topOriginCorner.x, topOriginCorner.y);
    shapeCanvas.lineTo(bottomOriginCorner.x, bottomOriginCorner.y);
    shapeCanvas.lineTo(bottomTargetCorner.x, bottomTargetCorner.y);
    shapeCanvas.lineTo(topTargetCorner.x, topTargetCorner.y);
    shapeCanvas.lineTo(topOriginCorner.x, topOriginCorner.y);
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
    hitboxCanvas.moveTo(topOriginCorner.x, topOriginCorner.y);
    hitboxCanvas.lineTo(bottomOriginCorner.x, bottomOriginCorner.y);
    hitboxCanvas.lineTo(bottomTargetCorner.x, bottomTargetCorner.y);
    hitboxCanvas.lineTo(topTargetCorner.x, topTargetCorner.y);
    hitboxCanvas.lineTo(topOriginCorner.x, topOriginCorner.y);
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

function draw90Cone(index, shape) {
    let angle = shape.angle;
    let linkedToken = returnToken(shape.link);
    let originX = shape.x + Math.cos(angle)*0.5*linkedToken.size*gridSize;
    let originY = shape.y +  Math.sin(angle)*0.5*linkedToken.size*gridSize;

    let destX1 = originX + Math.cos(angle+0.25*Math.PI) * shape.range * gridSize;
    let destY1 = originY + Math.sin(angle+0.25*Math.PI) * shape.range * gridSize;

    let destX2 = originX + Math.cos(angle-0.25*Math.PI) * shape.range * gridSize;
    let destY2 = originY + Math.sin(angle-0.25*Math.PI) * shape.range * gridSize;

    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(originX, originY);
    shapeCanvas.lineTo(destX1, destY1);
    let extendedRange = Math.sqrt(Math.pow(destX1 - originX, 2) + Math.pow(destY1 - originY, 2));
    shapeCanvas.arc(originX, originY, extendedRange, angle+0.25*Math.PI, angle-0.25*Math.PI, true);
    shapeCanvas.moveTo(destX2, destY2);
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
    hitboxCanvas.arc(originX, originY, extendedRange, angle+0.25*Math.PI, angle-0.25*Math.PI, true);
    hitboxCanvas.moveTo(destX2, destY2);
    hitboxCanvas.lineTo(originX, originY);
    hitboxCanvas.stroke();
}

function clearCanvas() 
{
    mapCanvas.clearRect(0, 0, map.width, map.height);
}

function drawMap()
{
    mapCanvas.drawImage(loadedMap, 0, 0);
}

function drawPolyBlockers() {
    if (!isDraggingBlocker)
    {
        if (mapData.antiBlockerOn)
        {
            drawAntiBlocker();
        }
        polyBlockers.innerHTML = '';
        polyBlockerHandles.innerHTML = '';
        blockersDiv.innerHTML = "";
        for (let i = 0; i<mapData.polyBlockers.length; i++)
        {
            let currentPolyBlocker = mapData.polyBlockers[i];
            let newPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            newPolygon.style.position = "absolute";
            let verts = currentPolyBlocker.verts;
            let polyString = "";
            for (let j = 0; j < verts.length; j++)
            {
                let vert = verts[j];
                polyString += vert.x + "," + vert.y + " ";
                if (blockerEditMode && i==selectedBlocker && !quickPolyBlockerMode)
                {
                    let editHandleContainer = document.createElement("div");
                    editHandleContainer.style.position = "absolute";
                    editHandleContainer.style.left = vert.x;
                    editHandleContainer.style.top = vert.y;
                    let editHandle = document.createElement("div");
                    editHandle.className = "polyBlockerHandle";
                    editHandle.draggable = true;
                    editHandle.style.left = "-0.35vw";
                    editHandle.style.top = "-0.35vw";
                    editHandle.title = j.toString();
                    
                    editHandle.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                        let menuOptions = [
                            {text: "Add new vert", hasSubMenu: false, callback: function() {
                                requestServer({c: "addVert", id: currentPolyBlocker.id, vertId: j});
                                updateMapData();
                            }},
                            {text: "Remove vert", hasSubMenu: false, callback: function() {
                                if (currentPolyBlocker.verts.length>3)
                                {
                                    requestServer({c: "removeVert", id: currentPolyBlocker.id, vertId: j});
                                    updateMapData();
                                }
                                else
                                {
                                    alert("There are too few verts in that poly blocker to remove one!");
                                }
                            }}
                        ];
                        displayMenu(e, menuOptions);
                    });

                    editHandle.addEventListener("mousedown", function(e) {
                        if (e.button == 0)
                        {
                            selectedVertHandle = j;
                        }
                    });

                    editHandle.addEventListener("dragover", function(e) {
                        e.preventDefault();
                    });

                    window.addEventListener("drop", function(e) {
                        if (selectedVertHandle!=-1)
                        {
                            if ((e.clientX + board.scrollLeft)!=vert.x && (e.clientY + board.scrollTop)!=vert.y)
                            {
                                requestServer({c:"editVert", id: selectedBlocker, vertIndex: selectedVertHandle, x: (e.clientX + board.scrollLeft), y: (e.clientY + board.scrollTop)});
                                updateMapData();
                            }
                            selectedVertHandle = -1;
                        }
                    });
                    editHandleContainer.appendChild(editHandle);
                    polyBlockerHandles.appendChild(editHandleContainer);
                }
            }
            polyString.trimRight();
            if (i==selectedBlocker && !quickPolyBlockerMode)
            {
                newPolygon.style.stroke = "violet";
                newPolygon.style.strokeDasharray = "4";
            }
            newPolygon.setAttribute("points", polyString);
            newPolygon.setAttribute("class", "polyBlocker");
            if (!quickPolyBlockerMode) {
                newPolygon.onclick = function() {
                    if (blockerEditMode) {
                        selectedBlocker = i;
                        selectedToken = -1;
                        drawCanvas();
                    }
                }
            }
            if (isDM)
            {
                if (isPanning || quickPolyBlockerMode)
                {
                    newPolygon.style.pointerEvents = "none";
                }
                if (blockerEditMode)
                {
                    if (!isPanning)
                    {
                        newPolygon.addEventListener("dragover", function(e) {
                            e.preventDefault();
                        });
    
                        newPolygon.addEventListener("contextmenu", function(e) {
                            e.preventDefault();
                            let menuOptions = [
                                {text: "Remove blocker", hasSubMenu: false, callback: function() {
                                    selectedBlocker=-1;
                                    requestServer({c: "removePolyBlocker", id: currentPolyBlocker.id});
                                    updateMapData();
                                }}
                            ];
                            displayMenu(e, menuOptions);
                        })
                        
                        newPolygon.addEventListener("mousedown", function(e) {
                            if (e.button == 0)
                            {
                                newPolygon.style.stroke = "violet";
                                newPolygon.style.strokeDasharray = "4";
                                isDraggingBlocker = true;
                                drawTokens();
                                draggedPolygonId = currentPolyBlocker.id;
                                polyDragOffset.x = e.pageX + board.scrollLeft;
                                polyDragOffset.y = e.pageY + board.scrollTop;
                                polyBlockerHandles.style.visibility = "hidden";
                            }
                        });
                        
                        window.addEventListener("mousemove", function(e) {
                            if (isDraggingBlocker)
                            {
                                if (currentPolyBlocker.id == draggedPolygonId)
                                {
                                    newPolygon.setAttribute("transform", "matrix(1,0,0,1,"+(-polyDragOffset.x + (e.pageX + board.scrollLeft)).toString()+", "+(-polyDragOffset.y + (e.pageY + board.scrollTop)).toString()+")");
                                }
                            }
                        })
                    }
                }
                else
                {
                    newPolygon.style.pointerEvents = "none";
                }
            }
            else
            {
                if (!mapData.antiBlockerOn)
                {
                    newPolygon.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                    });

                    newPolygon.addEventListener("mousedown", function(e) {
                        if (e.button==0)
                        {
                            isPanning = true;
                            oldMousePos.x = e.pageX;
                            oldMousePos.y = e.pageY;
                            oldScrollPos.x = board.scrollLeft;
                            oldScrollPos.y = board.scrollTop;
                            document.body.style.cursor = "grabbing";
                            drawCanvas();
                        }
                    });
                    newPolygon.addEventListener("mousemove", function(e) {
                        if (isPanning)
                        {
                            board.scrollLeft = oldScrollPos.x - (e.pageX - oldMousePos.x);
                            board.scrollTop = oldScrollPos.y - (e.pageY - oldMousePos.y);
                        }
                    });
                }
                else
                {
                    newPolygon.style.pointerEvents = "none";
                }
            }
            polyBlockers.appendChild(newPolygon);
        }
    }
}

function drawBlockers() 
{
    if (!isDraggingBlocker)
    {
        if (mapData.antiBlockerOn)
        {
            drawAntiBlocker();
        }
        polyBlockers.innerHTML = '';
        polyBlockerHandles.innerHTML = '';
        blockersDiv.innerHTML = "";
        for (let i = 0; i<mapData.blockers.length; i++)
        {
            let currentBlocker = mapData.blockers[i];
            let tmpBlocker = document.createElement("div");
            tmpBlocker.setAttribute("blockerid", currentBlocker.id);
            let extraBlocker = document.createElement("div");
            tmpBlocker.className = "blocker";
            tmpBlocker.style.left = currentBlocker.x + "px";
            tmpBlocker.style.top = currentBlocker.y + "px";
            tmpBlocker.style.width = currentBlocker.width + "px";
            tmpBlocker.style.height = currentBlocker.height + "px";
            if (isDM)
            {
                extraBlocker.style.width = currentBlocker.width + "px";
                extraBlocker.style.height = currentBlocker.height + "px";
                
                if (blockerEditMode && !isPlacingBlocker && !isPanning)
                {
                    extraBlocker.draggable = true;
                    tmpBlocker.style.resize = "both";
                    tmpBlocker.addEventListener("mousedown", function(e) {
                        if (e.button == 0)
                        {
                            selectedBlocker = currentBlocker.id;
                            selectedToken = -1;
                            selectedShapeId = -1;
                            updateHighlightedToken();
                            drawShapes();
                            updateHighlightedBlocker();
                        }
                    });

                    tmpBlocker.addEventListener("dragover", function(e) {
                        e.preventDefault();
                    })

                    tmpBlocker.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                        selectedBlocker = currentBlocker.id;
                        selectedToken = -1;
                        updateHighlightedBlocker()
                        let menuOptions = [
                            {text: "Remove blocker", hasSubMenu: false, callback: function() {
                                selectedBlocker=-1;
                                requestServer({c: "removeBlocker", id: currentBlocker.id});
                                updateMapData();
                            }}
                        ];
                        displayMenu(e, menuOptions);
                    });

                    tmpBlocker.addEventListener("mouseup", function(e) {
                        if (e.button == 0)
                        {
                            isDraggingBlocker = false;
                            extraBlocker.style.width = currentBlocker.width + "px";
                            extraBlocker.style.height = currentBlocker.height + "px";
                            if (currentBlocker.width!=tmpBlocker.offsetWidth && currentBlocker.height != tmpBlocker.offsetHeight)
                            {
                                requestServer({c: "editBlocker", id: currentBlocker.id, x: currentBlocker.x, y: currentBlocker.y, width: tmpBlocker.offsetWidth, height: tmpBlocker.offsetHeight});
                                updateMapData();
                            }
                        }
                    });

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
                    })
                }
                else
                {
                    extraBlocker.style.pointerEvents="none";
                    tmpBlocker.style.pointerEvents="none";
                }
            }
            else
            {
                tmpBlocker.addEventListener("contextmenu", function(e) {
                    e.preventDefault();
                })
                tmpBlocker.addEventListener("mousedown", function(e) {
                    if (e.button==0)
                    {
                        isPanning = true;
                        oldMousePos.x = e.pageX;
                        oldMousePos.y = e.pageY;
                        oldScrollPos.x = board.scrollLeft;
                        oldScrollPos.y = board.scrollTop;
                        document.body.style.cursor = "grabbing";
                        drawCanvas();
                    }
                });
                tmpBlocker.addEventListener("mousemove", function(e) {
                    if (isPanning)
                    {
                        board.scrollLeft = oldScrollPos.x - (e.pageX - oldMousePos.x);
                        board.scrollTop = oldScrollPos.y - (e.pageY - oldMousePos.y);
                    }
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
                    tmpBlocker.style.msUserSelect = "none";
                    tmpBlocker.style.webkitUserSelect = "none";
                    extraBlocker.draggable = false;
                    tmpBlocker.draggable = false;
                }
            }
            tmpBlocker.appendChild(extraBlocker);
            blockersDiv.appendChild(tmpBlocker);
        }
        updateHighlightedBlocker();
    }
}

function updateHighlightedBlocker(reverse) {
    for (let p = 0; p < blockersDiv.children.length; p++)
    {
        if (blockerEditMode) {
            if (blockersDiv.children[p].getAttribute("blockerid")==selectedBlocker)
            {
                blockersDiv.children[p].style.outline = "0.3vh dashed "+blockerOutlineColor;
                if (reverse) {
                    blockersDiv.children[p].style.zIndex = 101;
                } else {
                    blockersDiv.children[p].style.zIndex = 102;
                }
                
            }
            else
            {
                blockersDiv.children[p].style.outline = "";
                if (reverse) {
                    blockersDiv.children[p].style.zIndex = 102;
                } else {
                    blockersDiv.children[p].style.zIndex = 101;
                }
            }   
        }
        else
        {
            blockersDiv.children[p].style.zIndex = null;
            blockersDiv.children[p].style.outline = "";
        }
    }
}

function drawAntiBlocker() {
    antiBlockerCanvas.clearRect(0, 0, antiBlockerMap.width, antiBlockerMap.height);
    if (!mapData.usePolyBlockers)
    {
        antiBlockerCanvas.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
        antiBlockerCanvas.fillRect(0, 0, map.width, map.height);
        antiBlockerCanvas.globalCompositeOperation = "destination-out";
        for (let i = 0; i < mapData.blockers.length; i++)
        {
            let currBlocker = mapData.blockers[i];
            antiBlockerCanvas.fillStyle = "#FFFFFFFF";
            antiBlockerCanvas.fillRect(currBlocker.x, currBlocker.y, currBlocker.width, currBlocker.height);
        }
        antiBlockerCanvas.globalCompositeOperation = "source-over";
    }
    else
    {
        antiBlockerCanvas.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
        antiBlockerCanvas.fillRect(0, 0, map.width, map.height);
        antiBlockerCanvas.globalCompositeOperation = "destination-out";
        for (let i = 0; i < mapData.polyBlockers.length; i++)
        {
            let currPolyBlocker = mapData.polyBlockers[i];
            antiBlockerCanvas.beginPath();
            antiBlockerCanvas.fillStyle = "#FFFFFFFF";
            antiBlockerCanvas.moveTo(currPolyBlocker.verts[0].x, currPolyBlocker.verts[0].y);
            for (let j = 1; j < currPolyBlocker.verts.length; j++)
            {
                antiBlockerCanvas.lineTo(currPolyBlocker.verts[j].x, currPolyBlocker.verts[j].y);
            }
            antiBlockerCanvas.fill();
        }
        antiBlockerCanvas.globalCompositeOperation = "source-over";
    }
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
    updateHighlightedToken();
}

function createToken(token) 
{
    let imageElement = document.createElement("img");
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
    imageElement.setAttribute("tokenid", token.id);
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
    
    if (isPlacingCone || isPlacingLine || isPlacingSquare)
    {
        imageElement.style.pointerEvents = "none";
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

    function LoadTokenData(force) {
        if (document.activeElement!=nameInput || force)
        {
            nameInput.value = token.name;
        }
        
        if (document.activeElement!=noteArea || force)
        {
            if (token.notes == null)
            { noteArea.value = ""; }
            else
            { noteArea.value = token.notes; }
        }
        
        if (document.activeElement!=initiativeInput || force)
        {
            if (token.initiative == null)
            { initiativeInput.value = ""; }
            else
            { initiativeInput.value = token.initiative; }   
        }
        
        if (document.activeElement!=acInput || force)
        {
            if (token.ac == null)
            { acInput.value = ""; }
            else
            { acInput.value = token.ac; }
        }
        
        if ((document.activeElement!=currentHpInput && document.activeElement!=maxHpInput) || force)
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
        
        if (document.activeElement!=statusInput || force)
        {
            if (token.status == null)
            { statusInput.value = "No status"; }
            else
            { statusInput.value = token.status; }
        }
        
        if (document.activeElement!=groupIdInput || force)
        {
            if (token.group == null)
            { groupIdInput.value = ""; }
            else
            { groupIdInput.value = token.group; }
        }

    }

    imageElement.addEventListener("mousemove", function(e) {
        if (isPanning)
        {
            board.scrollLeft = oldScrollPos.x - (e.pageX - oldMousePos.x);
            board.scrollTop = oldScrollPos.y - (e.pageY - oldMousePos.y);
        }
    })
    
    imageElement.addEventListener("dragstart", function(e) {
        if (CheckAntiBlockerPixel(e) || isDM)
        {
            tokenDragOffset.x = token.x - (e.pageX + board.scrollLeft);
            tokenDragOffset.y = token.y - (e.pageY + board.scrollTop);
            draggingToken = token.id;
            isDraggingToken = true;
            if (e.ctrlKey || event.metaKey)
            {
                controlPressed = true;
            }
        }
        else
        {
            e.preventDefault();
            isPanning = true;
            oldMousePos.x = e.pageX;
            oldMousePos.y = e.pageY;
            oldScrollPos.x = board.scrollLeft;
            oldScrollPos.y = board.scrollTop;
            document.body.style.cursor = "grabbing";
            drawCanvas();
        }
    });

    imageElement.addEventListener("mousedown", function(e) {
        if (CheckAntiBlockerPixel(e) || isDM)
        {
            if (e.button==0)
            {
                showDetailsScreen();
                selectedToken = token.id;
                selectedBlocker = -1;
                selectedShapeId = -1;
                if (mapData.usePolyBlockers)
                {
                    drawPolyBlockers()
                }
                else
                {
                    drawBlockers();
                }
                if (mapData.dmTokenList.includes(token.image))
                { detailsIcon.src = "public/dmTokens/" + token.image; }
                if (mapData.tokenList.includes(token.image))
                { detailsIcon.src = "public/tokens/" + token.image; }
                if (token.image==null)
                { detailsIcon.src = "public/blankToken.png"; }
                if (CheckTokenPermission(token))
                {
                    LoadTokenData(true);
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
                updateTracker();
                updateHighlightedToken();
                updateHighlightedBlocker();
                drawShapes();
            }
        }
    });

    imageElement.addEventListener("dragover", function(e) {
        e.preventDefault();
    })

    imageElement.addEventListener("dragend", function(e) {
        e.preventDefault();
    });

    imageElement.addEventListener("contextmenu", function(e) {
        closeMenu();
        closeSubMenu();
        e.preventDefault();
        if (CheckAntiBlockerPixel(e) || isDM)
        {
            let menuOptions = [
                {text: "Delete token", hasSubMenu: false, callback: async function() {
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
                {text: "Draw Shape", description: "Pick a shape to draw", hasSubMenu: true, callback: function() {
                    let subMenuOptions = [
                        {text: "Draw Circle", callback: function() {
                            let radiusInput = parseFloat(prompt("Please enter the desired radius in feet for your circle(s)"));
                            if (!isNaN(radiusInput))
                            {
                                let shapeIsVisible = true;
                                if (isDM) {
                                    shapeIsVisible = confirm("Should the shape be visible?");
                                }
                                circleMarkers.radius = (radiusInput + (feetPerSquare / 2) * token.size) / feetPerSquare;
                                requestServer({c: "addDrawing", shape: "circle", link: token.id, x: token.x, y: token.y, radius: circleMarkers.radius, trueColor: shapeColor, visible: shapeIsVisible});
                                updateMapData();
                                closeMenu();
                                closeSubMenu();
                            }
                        }},
                        {text: "Draw Cone", callback: function() {
                            let rangeInput = parseFloat(prompt("Please enter the desired range in feet for your cone"));
                            if (!isNaN(rangeInput))
                            {
                                coneMarkers.is90Deg = false;
                                coneMarkers.x = token.x;
                                coneMarkers.y = token.y;
                                coneMarkers.range = rangeInput / feetPerSquare;
                                coneMarkers.linkId = token.id;
                                isPlacingCone = true;
                                drawCanvas();
                            }
                        }},
                        {text: "Draw 90° Cone", callback: function() {
                            let rangeInput = parseFloat(prompt("Please enter the desired range in feet for your cone"));
                            if (!isNaN(rangeInput))
                            {
                                coneMarkers.is90Deg = true;
                                coneMarkers.x = token.x;
                                coneMarkers.y = token.y;
                                coneMarkers.range = rangeInput / feetPerSquare;
                                coneMarkers.linkId = token.id;
                                isPlacingCone = true;
                                drawCanvas();
                            }
                        }},
                        {text: "Draw 5ft wide Line", callback: function() {
                            let rangeTextInput = prompt("Please enter the desired range of the line in feet.\nThen click where you want to aim.");
                            if (rangeTextInput!=null)
                            {
                                let rangeInput = parseFloat(rangeTextInput);
                                if (rangeInput != null)
                                {
                                    thickLineMarkers.range = rangeInput / feetPerSquare;
                                    thickLineMarkers.x = token.x;
                                    thickLineMarkers.y = token.y;
                                    thickLineMarkers.linkId = token.id;
                                    isPlacing5ftLine = true;
                                    drawCanvas();
                                }
                            }
                        }}
                    ];
                    displaySubMenu(e, subMenuOptions);
                }}
            ];
            if ((token.dm && isDM) || !token.dm)
            {
                
                menuOptions.push({text: "Edit token", hasSubMenu: true, callback: function() {
                    if ((token.dm && isDM) || !token.dm)
                    {
                        let subMenuOptions = [
                            {text: "Change size", callback: function() {
                                let tokenSize = parseFloat(prompt("Please enter the new size of the token"));
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
                                let newLayer = parseInt(prompt("Please enter the new layer"));
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
                        if (token.text != null)
                        {
                            subMenuOptions.push({text: "Edit text", callback: function() {
                                let newText = prompt("Please enter the new text for the token:", token.text);
                                if (newText!=null)
                                {
                                    requestServer({c:"editToken", id: token.id, text: newText});
                                    updateMapData();
                                }
                            }});
                        }
                        if (isDM)
                        {
                            subMenuOptions.push({text: "Toggle DM only", callback: function() {
                                requestServer({c:"editToken", id: token.id, dm: !token.dm});
                            }});
                        }
                        displaySubMenu(e, subMenuOptions);
                    }
                    else
                    {
                        alert("Players aren't allowed to edit DM tokens!");
                    }
                }});

                menuOptions.push({text: "Change image", hasSubMenu: true, callback: function() {
                    if ((token.dm && isDM) || !token.dm)
                    {
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
                    }
                    else
                    {
                        alert("Players aren't allowed to edit DM tokens!");
                    }
                }});
                
                if (token.group != null)
                {
                    menuOptions.push({text: "Group options", hasSubMenu: true, callback: async function() {
                        let subMenuOptions = [
                            {text: "Rotate left 90°", callback: function() {
                                requestServer({c:"rotateDeg", id: token.id, angle: 90});
                                updateMapData();
                            }},
                            {text: "Rotate right 90°", callback: function() {
                                requestServer({c:"rotateDeg", id: token.id, angle: -90});
                                updateMapData();
                            }},
                            {text: "Rotate 180°", callback: function() {
                                requestServer({c:"rotateDeg", id: token.id, angle: 180});
                                updateMapData();
                            }},
                            {text: "Rotate by °", callback: function() {
                                let Angle = parseFloat(prompt("Enter the amount of degrees to rotate the group by:"));
                                if (!isNaN(Angle))
                                {
                                    requestServer({c:"rotateDeg", id: token.id, angle: Angle});
                                    updateMapData();
                                }
                            }}
                        ];
                        if (isDM)
                        {
                            subMenuOptions.push({text: "Hide tokens", callback: function() {
                                for (let a = 0; a < mapData.tokens.length; a++)
                                {
                                    if (mapData.tokens[a].group == token.group) {
                                        requestServer({c:"setTokenHidden", id: mapData.tokens[a].id, hidden: true});
                                        updateMapData(true);
                                    }
                                }
                            }})
                            subMenuOptions.push({text: "Reveal tokens", callback: function() {
                                for (let a = 0; a < mapData.tokens.length; a++)
                                {
                                    if (mapData.tokens[a].group == token.group) {
                                        requestServer({c:"setTokenHidden", id: mapData.tokens[a].id, hidden: false});
                                    }
                                }
                                updateMapData(true);
                            }})
                            subMenuOptions.push({text: "Toggle DM only", callback: function() {
                                for (let a = 0; a < mapData.tokens.length; a++)
                                {
                                    if (mapData.tokens[a].group == token.group) {
                                        requestServer({c:"editToken", id: mapData.tokens[a].id, dm: !token.dm});
                                    }
                                }
                                updateMapData(true);
                            }})
                        }
                        displaySubMenu(e, subMenuOptions);
                    }});
                }
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
        }
    })
    
    if (isDraggingBlocker || quickPolyBlockerMode) {
        imageElement.style.pointerEvents = "none";
    }

    tokensDiv.appendChild(imageElement);

    if (isTextToken)
    {
        let textHolder = document.createElement("div");
        textHolder.style.zIndex = parseInt(imageElement.style.zIndex);
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

function updateHighlightedToken() {
    if (selectedToken!=null)
    {
        for (let p = 0; p<tokensDiv.children.length; p++)
        {
            if (tokensDiv.children[p].getAttribute("tokenid")==selectedToken)
            {
                tokensDiv.children[p].style.outline = "0.20vw dashed aqua";
            }
            else
            {
                tokensDiv.children[p].style.outline = "";
            }
        }
    }

}

function updateTracker(force)
{
    if (oldParsedData)
    {
        if (JSON.stringify(oldParsedData.tokens) == JSON.stringify(mapData.tokens) && oldParsedData.hideInit == mapData.hideInit && !force)
        {
            return;
        }
    }
    initiativeTrackerDiv.innerHTML = "";
    for (let i in mapData.tokens)
    {
        if (CheckTokenPermission(mapData.tokens[i]))
        {
            if (initSearch.value!="") {
                if (mapData.tokens[i].name) {
                    if (mapData.tokens[i].name.toLowerCase().includes(initSearch.value.toLowerCase()) || !mapData.tokens[i].dm) {
                        createTracker(mapData.tokens[i]);
                    }
                }
            } else {
                createTracker(mapData.tokens[i]);
            }
            
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
        tmpTrackerDiv.addEventListener("click", function(e) {
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
            updateTracker();
            drawTokens();
        });
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
                trackerDamageButton.onclick = async function(e)
                {
                    e.preventDefault();
                    e.stopPropagation();
                    let damage = parseInt(prompt("Enter the damage to deal to this token: "));
                    if (!isNaN(damage))
                    {
                        if (trackerData.hp != null)
                        {
                            await requestServer({c: "editToken", id: trackerData.id, hp: (trackerData.hp.split("/")[0] - damage).toString() + "/" + trackerData.hp.split("/")[1]});
                            updateMapData();
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
            if (trackerData.dm)
                tmpTrackerDiv.style.backgroundColor = "#E0A0A0";
            else
                tmpTrackerDiv.style.backgroundColor = "#A0A0A0";
        }
        else
        {
            if (trackerData.dm)
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
    if (isDraggingToken && (CheckAntiBlockerPixel(e) || isDM))
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
            if (draggingTokenData.size >= 1)
            {
                tX = Math.round((e.pageX + board.scrollLeft + tokenDragOffset.x - mapData.offsetX - 0.5 * gridX * draggingTokenData.size)/gridX) * gridX + 0.5 * gridX * draggingTokenData.size + 1 + offsetX;
                tY = Math.round((e.pageY + board.scrollTop + tokenDragOffset.y - mapData.offsetY - 0.5 * gridY * draggingTokenData.size)/gridY) * gridY + 0.5 * gridY * draggingTokenData.size + 1 + offsetY;
            }
            else
            {
                tX = Math.round(((e.pageX + board.scrollLeft) - offsetX + tokenDragOffset.x - 0.5 * gridX * draggingTokenData.size) / (gridX * draggingTokenData.size)) * (gridX * draggingTokenData.size) + 0.5 * gridX * draggingTokenData.size + offsetX + 1;
                tY = Math.round(((e.pageY + board.scrollTop) - offsetY + tokenDragOffset.y - 0.5 * gridY * draggingTokenData.size) / (gridY * draggingTokenData.size)) * (gridY * draggingTokenData.size) + 0.5 * gridY * draggingTokenData.size + offsetY + 1;
            }
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
        updateMapData(true);
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

//#region Menu events
document.getElementById("startAlignTool").onclick = function() {
    alignToolStep = 1;
    alert("Click on a intersection in the top left of the pre-existing grid.");
}

document.getElementById("invertBlockerButton").onclick = function() {
    requestServer({c: "invertBlockers"});
    updateMapData(true);
}

document.getElementById("openBulkGenerator").onclick = function() {
    if (displayMapSettings) {
        document.getElementById("toggleSettingsButton").click();
    }
    
    if (bulkInitGeneratorScreen.style.display=="none" || bulkInitGeneratorScreen.style.display=="")
        bulkInitGeneratorScreen.style.display = "block";
    else
        bulkInitGeneratorScreen.style.display = "none";
}

document.getElementById("clearTokensButton").onclick = function() {
    if (confirm("Do you really want to remove all the tokens?"))
    {
        requestServer({c:"clearTokens"});
        updateMapData(true);
    }
}

document.getElementById("clearDrawingsButton").onclick = function() {
    if (confirm("Do you really want to remove all the drawings?"))
    {
        requestServer({c:"clearDrawings"});
        updateMapData(true);
    }
}

document.getElementById("clearBlockersButton").onclick = function() {
    if (confirm("Do you really want to remove all the blockers?"))
    {
        requestServer({c:"clearBlockers"});
        updateMapData(true);
    }
}

document.getElementById("switchBlockerTypeButton").onclick = async function() {
    if (isDM) {
        if(mapData.usePolyBlockers)
        {
            quickPolyBlockerMode = false;
            buttonList.removeChild(document.getElementById("quickPolyButton"));
        }
        else
        {
            quickPolyBlockerMode = false;
            addQuickPolyBlockerButton();
        }
        requestServer({c:"switchBlockerType"});
    }
    await updateMapData(true);
}

document.getElementById("hitpointsIcon").onclick = async function() {
    updateSelectedTokenData();
    let damage = parseInt(prompt("Enter the damage to deal to this token: "));
    if (!isNaN(damage))
    {
        if (selectedTokenData.hp != null)
        {
            await requestServer({c: "editToken", id: selectedToken, hp: (selectedTokenData.hp.split("/")[0] - damage).toString() + "/" + selectedTokenData.hp.split("/")[1]});
            updateMapData();
        }
    }
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

initSearch.oninput = function() {
    updateTracker(true);
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
//#endregion

//#region Main event handlers
function CheckAntiBlockerPixel(e) {
    if (mapData.antiBlockerOn)
    {
        let pixel = antiBlockerCanvas.getImageData((e.pageX + board.scrollLeft), (e.pageY + board.scrollTop), 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0 && pixel[3] == 0)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    else
    {
        return true;
    }
}

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
    if (token.dm!=null)
    {
        if (token.dm)
        {
            if (isDM)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else 
        {
            return true;
        }
    }
    else
    {
        if (token.image!=null)
        {
            if (mapData.tokenList.includes(token.image))
            {
                return true;
            }
            else
            {
                if (isDM)
                {
                    return true;
                }
                else
                {
                    return false
                }
            }
        }
    }
}

function DrawNewPolyMarkers(activateMousedown) {
    console.log(newPolyBlockerVerts);
    newPolyBlockerHandles.innerHTML = "";
    for (let j = 0; j < newPolyBlockerVerts.length; j++)
    {
        let vert = newPolyBlockerVerts[j];
        let editHandleContainer = document.createElement("div");
        editHandleContainer.style.position = "absolute";
        editHandleContainer.style.left = vert.x;
        editHandleContainer.style.top = vert.y;
        let editHandle = document.createElement("div");
        editHandle.className = "newPolyBlockerHandle";
        editHandle.style.left = "-0.35vw";
        editHandle.style.top = "-0.35vw";
        editHandle.title = (j+1).toString();
        
        editHandle.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            let menuOptions = [
                {text: "Remove vert", hasSubMenu: false, callback: function() {
                    newPolyBlockerVerts.splice(j, 1);
                    DrawNewPolyMarkers();
                }}
            ];
            displayMenu(e, menuOptions);
        });

        function handleMouseMovement(e) {
            editHandleContainer.style.left = e.clientX + board.scrollLeft;
            editHandleContainer.style.top = e.clientY + board.scrollTop;
        }

        editHandle.addEventListener("mousedown", function() {
            document.body.addEventListener("mousemove", handleMouseMovement);
        });

        editHandle.addEventListener("mouseup", function(e) {
            document.body.removeEventListener("mousemove", handleMouseMovement);
            if ((e.clientX + board.scrollLeft)!=vert.x && (e.clientY + board.scrollTop)!=vert.y)
            {
                vert.x = e.clientX + board.scrollLeft;
                vert.y = e.clientY + board.scrollTop;
                DrawNewPolyMarkers();
            }
        });

        editHandle.addEventListener("dragover", function(e) {
            e.preventDefault();
        });

        editHandleContainer.appendChild(editHandle);
        newPolyBlockerHandles.appendChild(editHandleContainer);
        if (j==newPolyBlockerVerts.length-1 && activateMousedown)
        {
            editHandle.dispatchEvent(new Event('mousedown'));
        }
    }
}

window.addEventListener("mouseup", async function(e) {
    if (e.button == 0)
    {
        if (isPanning)
        {
            isPanning = false;
            document.body.style.cursor = "";
            drawCanvas();
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
            bulkInitGeneratorScreen.style.right = (calcWidth + 2).toString() + "vw";
            mapOptionsMenu.style.right = (calcWidth + 2).toString() + "vw";
        }

        if (isDraggingBlocker && mapData.usePolyBlockers)
        {
            polyBlockerHandles.style.visibility = "";
            let moveX = -polyDragOffset.x + (e.pageX + board.scrollLeft);
            let moveY = -polyDragOffset.y + (e.pageY + board.scrollTop);
            if (moveX!=0 && moveY!=0)
            {
                requestServer({c: "movePolyBlocker", id: draggedPolygonId, offsetX: moveX, offsetY: moveY});
                updateMapData();
            }
            draggedPolygonId = -1;
            isDraggingBlocker = false;
        }

        if (selectedVertHandle!=-1)
        {
            selectedVertHandle=-1;
        }

        if ((e.pageX + board.scrollLeft)>0 && (e.pageX + board.scrollLeft)<map.width && (e.pageY + board.scrollTop)>0 && (e.pageY + board.scrollTop)<map.height)
        {
            if (isMovingShape)
            {
                isMovingShape = false;
                document.body.style.cursor = "default";
                if (CheckAntiBlockerPixel(e) || isDM)
                {
                    requestServer({c: "editDrawing", id: movingShapeId, x: (e.pageX + board.scrollLeft) + shapeDragOffset.x, y: (e.pageY + board.scrollTop) + shapeDragOffset.y, both: true});
                }
                updateMapData();
            }

            if (isMovingCone)
            {
                isMovingCone = false;
                document.body.style.cursor = "default";
                let angle = mapData.drawings[movingShapeId].angle + (Math.atan2(((e.pageY + board.scrollTop) - shapeDragOffset.y), ((e.pageX + board.scrollLeft) - shapeDragOffset.x)) - shapeDragStartAngle);
                if (angle<0)
                    angle+=2*Math.PI;
                requestServer({c: "editDrawing", id: movingShapeId, angle: angle});
                updateMapData();
            }

            if (isMoving5ftLine)
            {
                isMoving5ftLine = false;
                document.body.style.cursor = "default";
                let angle = mapData.drawings[movingShapeId].angle + (Math.atan2(((e.pageY + board.scrollTop) - shapeDragOffset.y), ((e.pageX + board.scrollLeft) - shapeDragOffset.x)) - shapeDragStartAngle);
                if (angle<0)
                    angle+=2*Math.PI;
                requestServer({c: "editDrawing", id: movingShapeId, angle: angle});
                updateMapData();
            }
        }
        else
        {
            document.body.style.cursor = "default";
            isMovingShape = false;
            isMovingCone = false;
            isMoving5ftLine = false;
            updateMapData();
        }
    }
})

document.body.addEventListener("keyup", async function(e) {
    if (document.activeElement.tagName!="INPUT" && document.activeElement.tagName!="TEXTAREA")
    {
        switch (e.code) {
            case "KeyG":
                GridActive = !GridActive;
                updateButtonColors();
                updateMapData(true);
                break;
            
            case "KeyS":
                GridSnap = !GridSnap;
                updateButtonColors();
                break;

            case "KeyB":
                if (isDM)
                {
                    blockerEditMode = !blockerEditMode;
                    updateButtonColors();
                    drawCanvas();
                }
                break;

            case "KeyP":
                if (isDM)
                {
                    if (mapData.usePolyBlockers)
                    {
                        document.getElementById("quickPolyButton").click();
                    }
                }
            break;

            case "Delete":
                if (isDM)
                {
                    if (selectedToken!=-1)
                    {
                        let result = await requestServer({c: "removeToken", id: selectedToken, tokensRemoved: mapData.removedTokens});
                        selectedToken = -1;
                        if(result[0] == true)
                        {
                            updateMapData();
                        }
                        else
                        {
                            alert("That token has already been removed by someone else");
                        }
                        return;
                    }
                    if (selectedBlocker!=-1) {
                        if (mapData.usePolyBlockers) {
                            await requestServer({c: "removePolyBlocker", id: selectedBlocker});
                        } else {
                            await requestServer({c: "removeBlocker", id: selectedBlocker});
                        }
                        selectedBlocker = -1;
                        updateMapData();
                        return;
                    }
                }
                break;
        }
    }
})

shapeMap.addEventListener("mousedown", function(e) {
    if (e.button == 0)
    {
        selectedToken=-1;
        selectedBlocker=-1;
        selectedShapeId=-1;
        displayNoteEditor = false;
        noteEditor.style.display = "none";
        hideDetailsScreen();
        if (alignToolStep == 1) {
            gridToolData.startX = (e.pageX + board.scrollLeft);
            gridToolData.startY = (e.pageY + board.scrollTop);
            alert("Now click on the intersection to the bottom right of that one. (2;2)")
            alignToolStep = 2;
            return;
        }

        if (alignToolStep == 2) {
            gridToolData.gridX = (e.pageX + board.scrollLeft) - gridToolData.startX;
            gridToolData.gridY = (e.pageY + board.scrollTop) - gridToolData.startY;
            alert("Now click on last visible intersection in the bottom right of the pre-existing grid.");
            alignToolStep = 3;
            return;
        }

        if (alignToolStep == 3) {
            gridToolData.endX = (e.pageX + board.scrollLeft);
            gridToolData.endY = (e.pageY + board.scrollTop);
            let Xcount = Math.round((gridToolData.endX - gridToolData.startX)/gridToolData.gridX) + 1;
            let Ycount = Math.round((gridToolData.endY - gridToolData.startY)/gridToolData.gridY) + 1;
            if (gridToolData.startX/gridToolData.gridX>1) {
                Xcount += Math.floor(gridToolData.startX/gridToolData.gridX);
                gridToolData.startX -= gridToolData.gridX*Math.floor(gridToolData.startX/gridToolData.gridX);
            }
            if (gridToolData.startY/gridToolData.gridY>1) {
                Ycount += Math.floor(gridToolData.startY/gridToolData.gridY);
                gridToolData.startY -= gridToolData.gridY*Math.floor(gridToolData.startY/gridToolData.gridY);
            }
            Xcount += (map.width - gridToolData.endX)/gridToolData.gridX;
            Ycount += (map.height - gridToolData.endY)/gridToolData.gridY;
            requestServer({c: "setMapData", map: mapData.map, x: Xcount, y: Ycount, offsetX: (gridToolData.startX - gridToolData.gridX), offsetY: (gridToolData.startY - gridToolData.gridY), hideInit: mapData.hideInit});
            updateMapData();
            alignToolStep = 0;
            return;
        }

        if (placingBulkOrigin)
        {
            let autoGenInit = confirm("Automatically generate initiatives for the new tokens?");
            let sameInit = false;
            if (autoGenInit)
            {
                sameInit = confirm("Should all the tokens have the same initiative?");
            }
            
            let dexMod;
            if (autoGenInit)
            {
                dexMod = prompt("Enter the dex mod of the new tokens");
            }
            let tmpInit;
            if (autoGenInit && sameInit)
            {
                tmpInit = Math.ceil(Math.random()*20)+parseInt(dexMod);
                if (isNaN(tmpInit))
                {
                    placingBulkOrigin = false;
                    return;
                }
            }
            
            let groupNum;
            if (confirm("Automatically add new tokens to the same group?"))
            {
                groupNum = parseInt(prompt("Enter the group number"));
                if (isNaN(groupNum))
                {
                    placingBulkOrigin = false;
                    return;
                }
            }
            let hideTokens = confirm("Should the tokens be hidden?");
            let commonNameInText;
            let newAC;
            let newHP;
            if (confirm("Set HP/AC for the new tokens?"))
            {
                newAC = parseInt(prompt("Enter the desired AC"));
                newHP = parseInt(prompt("Enter the desired HP"));
                if (isNaN(newAC) || isNaN(newHP))
                {
                    placingBulkOrigin = false;
                    return;
                }
            }
            if (bulkInitSettings.image == "number")
            {
                commonNameInText = confirm("Display common name in token text?");
            }
            for (let f = 1; f <= bulkInitSettings.tokenAmount; f++)
            {
                if (autoGenInit && !sameInit)
                {
                    tmpInit = Math.ceil(Math.random()*20)+parseInt(dexMod);
                    if (isNaN(tmpInit))
                    {
                        placingBulkOrigin = false;
                        return;
                    }
                }
                if (bulkInitSettings.image=="number")
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
                    if (newHP!=null) {
                        requestServer({c: "createToken", text: tokenText, x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hp: newHP.toString()+"/"+newHP.toString(), ac: newAC});
                    } else {
                        requestServer({c: "createToken", text: tokenText, x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum});
                    }
                }
                else
                {
                    if (newHP!=null) {
                        requestServer({c: "createToken", x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hp: newHP.toString()+"/"+newHP.toString(), ac: newAC});
                    } else {
                        requestServer({c: "createToken", x: (e.pageX + board.scrollLeft) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: (e.pageY + board.scrollTop), image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 0, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum});
                    }
                    
                }
            }
            placingBulkOrigin = false;
            updateMapData();
            return;
        }

        if (quickPolyBlockerMode) {
            newPolyBlockerVerts.push({x: e.pageX+board.scrollLeft, y: e.pageY + board.scrollTop});
            DrawNewPolyMarkers(true);
            return;
        }

        if (isPlacingSquare)
        {
            squareMarkers.width = (e.pageX + board.scrollLeft) - squareMarkers.x;
            squareMarkers.height = (e.pageY + board.scrollTop) - squareMarkers.y;
            if (squareMarkers.width >= -map.width && squareMarkers.width <= map.width && squareMarkers.height >= -map.height && squareMarkers.height <= map.height)
            {
                if (isDM || CheckAntiBlockerPixel(e))
                {
                    let shapeIsVisible = true;
                    if (isDM) {
                        shapeIsVisible = confirm("Should the shape be visible?");
                    }
                    requestServer({c: "addDrawing", shape: "square", x: squareMarkers.x, y: squareMarkers.y, width: squareMarkers.width, height: squareMarkers.height, trueColor: shapeColor, visible: shapeIsVisible});
                }
                updateMapData();
            }
            else
            {
                alert("That square was too large or too small");
            }
            isPlacingSquare = false;
            return;
        }

        if (isPlacingBlocker)
        {
            if (isDM)
            {
                blockerMarkers.width = (e.pageX + board.scrollLeft) - blockerMarkers.x;
                blockerMarkers.height = (e.pageY + board.scrollTop) - blockerMarkers.y;
                requestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
            }
            isPlacingBlocker = false;
            updateMapData(true);
            drawCanvas();
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
            if (isDM || CheckAntiBlockerPixel(e))
            {
                let shapeIsVisible = true;
                if (isDM) {
                    shapeIsVisible = confirm("Should the shape be visible?");
                }
                requestServer({c: "addDrawing", shape: "line", x: lineMarkers.x, y: lineMarkers.y, destX: lineMarkers.destX, destY: lineMarkers.destY, trueColor: shapeColor, visible: shapeIsVisible});
            }
            updateMapData();
            isPlacingLine = false;
            return;
        }
        if (isPlacing5ftLine)
        {
            let destX = (e.pageX + board.scrollLeft);
            let destY = (e.pageY + board.scrollTop);
            let angle = Math.atan2((destY - thickLineMarkers.y), (destX - thickLineMarkers.x));
            if (angle<0) { angle+=2*Math.PI; }
            let shapeIsVisible = true;
            if (isDM) {
                shapeIsVisible = confirm("Should the shape be visible?");
            }
            requestServer({c: "addDrawing", shape: "5ftLine", x: thickLineMarkers.x, y: thickLineMarkers.y, angle: angle, trueColor: shapeColor, link: thickLineMarkers.linkId, range: thickLineMarkers.range, visible: shapeIsVisible});
            updateMapData();
            isPlacing5ftLine = false;
            return;
        }
        if (isPlacingCone)
        {
            let destX = e.pageX + board.scrollLeft;
            let destY = e.pageY + board.scrollTop;
            let angle = Math.atan2((destY - coneMarkers.y), (destX - coneMarkers.x));
            if (angle<0) { angle+=2*Math.PI; }
            let shapeIsVisible = true;
            if (isDM) {
                shapeIsVisible = confirm("Should the shape be visible?");
            }
            requestServer({c: "addDrawing", shape: "cone", link: coneMarkers.linkId, x: coneMarkers.x, y: coneMarkers.y, angle: angle, range: coneMarkers.range, trueColor: shapeColor, visible: shapeIsVisible, is90Deg: coneMarkers.is90Deg});
            updateMapData();
            isPlacingCone = false;
            return;
        }

        let pixel = hitboxCanvas.getImageData((e.pageX + board.scrollLeft), (e.pageY + board.scrollTop), 1, 1).data;
        if (!(pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) && CheckAntiBlockerPixel(e))
        {
            let testString = "#" + decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
            let shapeId = colorToSigned24Bit(testString) / 16;
            shapeId--;
            let clickedShape;
            for (let h = 0; h<mapData.drawings.length; h++)
            {
                if (mapData.drawings[h].id == shapeId)
                {
                    clickedShape = mapData.drawings[h];
                }
            }
            if (shapeId%1 == 0)
            {
                if (clickedShape.link==null)
                {
                    if (clickedShape.shape=="line")
                    {
                        selectedShapeId = clickedShape.id;
                        selectedBlocker = -1;
                        selectedToken = -1;
                        drawCanvas();
                    }
                    document.body.style.cursor = "pointer";
                    shapeDragOffset.x = clickedShape.x - (e.pageX + board.scrollLeft);
                    shapeDragOffset.y = clickedShape.y - (e.pageY + board.scrollTop);
                    movingShapeId = shapeId;
                    isMovingShape = true;
                }
                else
                {
                    console.log(clickedShape.shape);
                    if (clickedShape.shape=="cone")
                    {
                        document.body.style.cursor = "pointer";
                        shapeDragOffset.x = clickedShape.x;
                        shapeDragOffset.y = clickedShape.y;
                        shapeDragStartAngle = Math.atan2(((e.pageY + board.scrollTop) - shapeDragOffset.y), ((e.pageX + board.scrollLeft) - shapeDragOffset.x));
                        movingShapeId = shapeId;
                        isMovingCone = true;
                        return;
                    }
                    if (clickedShape.shape=="5ftLine")
                    {
                        document.body.style.cursor = "pointer";
                        shapeDragOffset.x = clickedShape.x;
                        shapeDragOffset.y = clickedShape.y;
                        shapeDragStartAngle = Math.atan2(((e.pageY + board.scrollTop) - shapeDragOffset.y), ((e.pageX + board.scrollLeft) - shapeDragOffset.x));
                        movingShapeId = shapeId;
                        isMoving5ftLine = true;
                        return;
                    }
                    isPanning = true;
                    oldMousePos.x = e.pageX;
                    oldMousePos.y = e.pageY;
                    oldScrollPos.x = board.scrollLeft;
                    oldScrollPos.y = board.scrollTop;
                    document.body.style.cursor = "grabbing";
                    drawCanvas();
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
        drawCanvas();
    }
})

window.addEventListener("mousemove", function(e) {
    if (isPanning)
    {
        board.scrollLeft = oldScrollPos.x - (e.pageX - oldMousePos.x);
        board.scrollTop = oldScrollPos.y - (e.pageY - oldMousePos.y);
    }
})

shapeMap.addEventListener("dragstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
})

shapeMap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (!isPanning)
    {
        if (CheckAntiBlockerPixel(e) || isDM)
        {
            let pixel = hitboxCanvas.getImageData((e.pageX + board.scrollLeft), (e.pageY + board.scrollTop), 1, 1).data;
            if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0)
            {
                displayContextMenu(e);
            }
            else
            {
                shapeContextMenu(e, pixel);
            }
        }
        else
        {
            closeMenu();
            closeSubMenu();
        }
    }
})

function shapeContextMenu(e, pixel)
{
    let testString = "#" + decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
    let shapeId = colorToSigned24Bit(testString) / 16;
    if (shapeId%1 == 0)
    {
        shapeId--;
        let selectedShape;
        for (let h = 0; h<mapData.drawings.length; h++)
        {
            if (mapData.drawings[h].id == shapeId)
            {
                selectedShape = mapData.drawings[h];
            }
        }
        let tmpText = "Hide shape";
        if (!selectedShape.visible) {
            tmpText = "Reveal shape";
        }
        let menuOptions = [
            {text: "Erase shape", hasSubMenu: false, callback: async function() {
                let result = await requestServer({c: "removeDrawing", id: shapeId, removedDrawings: mapData.removedDrawings});
                if (result[0]) {
                    if (selectedShapeId == shapeId) {
                        shapeId == -1;
                    }
                    updateMapData();
                } else {
                    alert("That drawing has already been removed by someone else!");
                }
            }}
        ];
        if (isDM) {
            menuOptions.push({text: tmpText, hasSubMenu: false, callback: async function() {
                await requestServer({c: "editDrawing", id: shapeId, visible: !selectedShape.visible});
                updateMapData();
            }});
        }
        switch(selectedShape.shape)
        {
            case "5ftLine":
                menuOptions.push({text: "Edit range", hasSubMenu: false, callback: function() {
                    let newRange = parseInt(prompt("Please enter the new range", selectedShape.range*feetPerSquare));
                    if (!isNaN(newRange))
                    {
                        newRange = newRange/feetPerSquare;
                        requestServer({c: "editDrawing", range: newRange, id: shapeId});
                    }
                }});
                break;
            case "circle":
                menuOptions.push({text: "Edit radius", hasSubMenu: false, callback: function() {
                    let newRange = parseInt(prompt("Please enter the new radius", selectedShape.range));
                    if (!isNaN(newRange))
                    {
                        if (selectedShape.link!=null) {
                            newRange = newRange/feetPerSquare + 0.5;
                        } else {
                            newRange = newRange/feetPerSquare;
                        }
                        requestServer({c: "editDrawing", radius: newRange, id: shapeId});
                    }
                }});
                break;
            case "cone":
                menuOptions.push({text: "Edit range", hasSubMenu: false, callback: function() {
                    let newRange = parseInt(prompt("Please enter the new range", selectedShape.range*feetPerSquare));
                    if (!isNaN(newRange))
                    {
                        newRange = newRange/feetPerSquare;
                        requestServer({c: "editDrawing", range: newRange, id: shapeId});
                    }
                }});
                break;
        }
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
                    if (!isNaN(radiusInput))
                    {
                        circleMarkers.radius = radiusInput / feetPerSquare;
                        circleMarkers.x = e.pageX + board.scrollLeft;
                        circleMarkers.y = e.pageY + board.scrollTop;
                        let shapeIsVisible = true;
                        if (isDM) {
                            shapeIsVisible = confirm("Should the shape be visible?");
                        }
                        requestServer({c: "addDrawing", shape: "circle", x: circleMarkers.x, y: circleMarkers.y, radius: circleMarkers.radius, trueColor: shapeColor, visible: shapeIsVisible});
                        updateMapData();
                    }    
                }},
                {text: "Draw Square", callback: function() {
                    squareMarkers.x = e.pageX + board.scrollLeft;
                    squareMarkers.y = e.pageY + board.scrollTop;
                    isPlacingSquare = true;
                    drawCanvas();
                }},
                {text: "Draw Line", callback: function() {
                    let rangeTextInput = prompt("Please enter the desired range of the line in feet, leave blank for no range limit");
                    if (rangeTextInput!=null)
                    {
                        let rangeInput = parseFloat(rangeTextInput);
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
                        drawCanvas();
                    }
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
        }}
    ]
    if (mapData.usePolyBlockers)
    {
        let titleText = "Create Blocker"
        if (mapData.antiBlockerOn)
        {
            titleText = "Create Anti Blocker";
        }
        DMoptions.push({text: titleText, description: "Creates a blockers with 3 verts at the current position", hasSubMenu: false, callback: async function() {
            requestServer({c: "addPolyBlocker", x: (e.pageX + board.scrollLeft), y: (e.pageY + board.scrollTop), offset: gridSize});
            updateMapData();
        }})
    }
    else
    {
        let titleText = "Place Blocker"
        if (mapData.antiBlockerOn)
        {
            titleText = "Place Anti Blocker";
        }
        DMoptions.push({text: titleText, description: "Upon clicking this button click somewhere else to define the bottom right corner", hasSubMenu: false, callback: async function() {
            blockerMarkers.x = (e.pageX + board.scrollLeft);
            blockerMarkers.y = (e.pageY + board.scrollTop);
            isPlacingBlocker = true;
            drawCanvas();
        }});
    }
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
    for (let i = 0; i < ancestry.length; i++)
    {
        try {
            if (ancestry[i].className.includes("custom-menu")) { shouldCloseMenus = false; }
        }
        catch {
            if (ancestry[i].className.baseVal.includes("custom-menu")) { shouldCloseMenus = false; }
        }
        
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
            let tmpHeight = listData.length * 4;
            if (tmpHeight > 24)
            {
                tmpHeight = 24;
                customMenu.style.overflowY = "scroll";
            }
            else
            {
                customMenu.style.overflowY = "hidden";
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
                listItem.style.userSelect = "none";
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
            let customMenuPos;
            if (event.pageX + customMenu.offsetWidth > window.innerWidth + window.pageXOffset - sideMenu.offsetWidth)
            {
                customMenuPos = parseInt(customMenu.style.left.substr(0, customMenu.style.left.length-2));
                customMenu.style.left = "calc("+(customMenuPos - (event.pageX + customMenu.offsetWidth - (window.innerWidth + window.pageXOffset - sideMenu.offsetWidth))).toString()+"px - 0.9vw)";
            }
            if (event.pageY + customMenu.offsetHeight > window.innerHeight + window.pageYOffset)
            {
                customMenuPos = parseInt(customMenu.style.top.substr(0, customMenu.style.top.length-2));
                customMenu.style.top = "calc("+(customMenuPos - (event.pageY + customMenu.offsetHeight - window.innerHeight - window.pageYOffset)).toString()+"px - 1.5vh)";
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
            let tmpHeight = listData.length * 4;
            if (tmpHeight > 24)
            {
                tmpHeight = 24;
                customSubMenu.style.overflowY = "scroll";
            }
            else
            {
                customSubMenu.style.overflowY = "hidden";
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
                listItem.style.userSelect = "none";
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
        try {
            p = p.parentElement;
        }
        catch{
            return [];
        }
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
    if (e.button == 0)
    {
        e.preventDefault();
        e.stopPropagation();
        resizingSideMenu = true;
    }
})

function addQuickPolyBlockerButton() {
    let quickPolyButton = document.createElement("Button");
    let quickPolyButtonSVG = document.createElement("object");
    quickPolyButtonSVG.type = "image/svg+xml";
    quickPolyButtonSVG.data = "images/group_work-24px.svg";
    quickPolyButtonSVG.style.pointerEvents = "none";
    quickPolyButton.appendChild(quickPolyButtonSVG);
    quickPolyButton.id = "quickPolyButton"
    quickPolyButton.title = "Quick add polyblocker (P)";
    quickPolyButton.className = "dmOnly";
    quickPolyButton.onclick = function() {
        if (quickPolyBlockerMode) {
            if(confirm("Add the new blocker?")) {
                if (newPolyBlockerVerts.length>2) {
                    requestServer({c: "addCustomPolyBlocker", newPolyBlockerVerts: JSON.stringify(newPolyBlockerVerts)});
                }
            }
            quickPolyBlockerMode = false;
            newPolyBlockerVerts = [];
            DrawNewPolyMarkers();
        }
        else {
            quickPolyBlockerMode = true;
            drawCanvas();
        }
        updateButtonColors();
    }
    buttonList.appendChild(quickPolyButton)
}

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

        if (quickPolyBlockerMode)
        {
            let qpb = document.getElementById("quickPolyButton");
            if (qpb!=null)
            {
                qpb.style.backgroundColor = "aquamarine";
            }
        }
        else
        {
            let qpb = document.getElementById("quickPolyButton");
            if (qpb!=null)
            {
                qpb.style.backgroundColor = "rgb(240, 240, 240)";
            }
        }
    }
}
//#endregion Side menu stuff