let GridActive = true;
let GridSnap = true;
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
let viewport = document.getElementById("viewport");
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
let trackerScaleSlider = document.getElementById("trackerScaleSlider");

//Detail screen vars
let detailsScreen = document.getElementById("detailsScreen");
let initiativeInput = document.getElementById("detailsInitiative");
let nameInput = document.getElementById("detailsNameInput");
let acInput = document.getElementById("armorClass");
let currentHpInput = document.getElementById("currentHitpoints");
let maxHpInput = document.getElementById("maxHitpoints");
let groupIdInput = document.getElementById("detailsGroup");
let statusInput = document.getElementById("detailsStatusInput");
let detailsIcon = document.getElementById("detailsIcon").children[0];
let noteEditor = document.getElementById("notesEditor");
let noteArea = noteEditor.children[0];
let concentratingInput = document.getElementById("concentrating");
let hideTrackerInput = document.getElementById("visibility");

let sideMenu = document.getElementById("sideMenu");
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
let buttonList = document.getElementById("toggleButtonList");
let quickPolyButton = document.getElementById("quickPolyButton");
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
let playerMode = false;
let selectedPortal = -1;

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

    if (getCookie("sideMenuWidth")!="") {
        document.body.style.setProperty("--sidemenu-width", getCookie("sideMenuWidth"));
    }

    if (getCookie("trackerScale")!="") {
        let tmpTrackerScale = getCookie("trackerScale");
        document.body.style.setProperty("--tracker-scale", tmpTrackerScale);
        trackerScaleSlider.value = tmpTrackerScale*100;
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
    if((!mapData.usePolyBlockers && isDM) || !isDM)
    {
        quickPolyButton.style.display = "none";
    }
    if (autoUpdate)
    {
        setInterval(function() {updateMapData();}, mapUpdateInterval);
    }
    if (isDM)
    {
        shapeMap.style.zIndex = 54;
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
            if (isDM && !playerMode)
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
            if (isDM && !playerMode)
            {
                document.body.style.setProperty("--blocker-color", "#00000080");    
            }
            else
            {
                document.body.style.setProperty("--blocker-color", "#000000FF");
            }
        }

        mapSelect.innerHTML = "";
        for (let map of mapData.maps)
        {
            let tmpOption = document.createElement("option");
            tmpOption.value = map;
            tmpOption.innerText = map;
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
            for (let playerImage of mapData.tokenList)
            {
                let tmpOption = document.createElement("option");
                tmpOption.value = playerImage;
                tmpOption.innerText = playerImage;
                bulkTokenSelect.append(tmpOption);
            }
            for (let dmTokenImage of mapData.dmTokenList)
            {
                let tmpOption = document.createElement("option");
                tmpOption.value = dmTokenImage;
                tmpOption.innerText = dmTokenImage;
                bulkTokenSelect.append(tmpOption);
            }
        }

        if (document.activeElement != mapSourceSelect)
        {
            mapSourceSelect.innerHTML = "";
            for (let mapSource of mapData.mapSourceList)
            {
                let tmpOption = document.createElement("option");
                tmpOption.value = mapSource;
                tmpOption.innerText = mapSource;
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
                mapCanvas.clearRect(0, 0, map.width, map.height);
                loadedMap.src = "/public/maps/" + mapData.map;
                selectedToken = -1;
                selectedBlocker = -1;
                selectedShapeId = -1;
                selectedVertHandle = -1;
                detailsScreen.style.display = "none";
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
            mapCanvas.clearRect(0, 0, map.width, map.height);
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

//#region Portal stuff
function setPortal(portalID)
{
    if (portalID<mapData.portalData.length && portalID>=0)
    {
        selectedPortal = portalID;
    }
}
//#endregion

//#region Custom zoom
var browser = "";
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

let extraZoom = 0;
window.addEventListener("wheel", function(e) {
    if (e.ctrlKey)
    {
        if (e.deltaY<0)
        {
            if (extraZoom < 0 || zoomMaxed())
            {
                extraZoom+=1;
                board.style.transform = "scale("+(1+extraZoom/20).toString()+")";
                viewport.scrollLeft = viewport.scrollLeft*((20+extraZoom)/(20+extraZoom-1));
                viewport.scrollTop = viewport.scrollTop*((20+extraZoom)/(20+extraZoom-1));
                e.preventDefault();
            }
        }
        if (e.deltaY>0)
        {
            if (extraZoom > 0 || zoomMined())
            {
                extraZoom-=1;
                board.style.transform = "scale("+(1+extraZoom/20).toString()+")";
                viewport.scrollLeft = viewport.scrollLeft/((1+extraZoom/20)/(1+(extraZoom-1)/20));
                viewport.scrollTop = viewport.scrollTop/((1+extraZoom/20)/(1+(extraZoom-1)/20));
                e.preventDefault();
            }
        }
    }
}, { passive: false });

document.body.addEventListener("keydown", function(e) {
    if (e.ctrlKey)
    {
        switch(e.code)
        {
            case "Digit0":
                extraZoom = 0;
                break;
            case "Minus":
                if (extraZoom>0)
                {
                    extraZoom-=1;
                    board.style.transform = "scale("+(1+extraZoom/20).toString()+")";
                    viewport.scrollLeft = viewport.scrollLeft/((1+extraZoom/20)/(1+(extraZoom-1)/20));
                    viewport.scrollTop = viewport.scrollTop/((1+extraZoom/20)/(1+(extraZoom-1)/20));
                    e.preventDefault();
                }
                break;
            case "Equal":
                if (zoomCapped())
                {
                    extraZoom+=1;
                    board.style.transform = "scale("+(1+extraZoom/20).toString()+")";
                    viewport.scrollLeft = viewport.scrollLeft*((20+extraZoom)/(20+extraZoom-1));
                    viewport.scrollTop = viewport.scrollTop*((20+extraZoom)/(20+extraZoom-1));
                    e.preventDefault();
                }
                break;
        }
    }
});

function zoomMaxed() {
    if (browser=="f")
    {
        if (window.devicePixelRatio==3)
            return true;
        else
            return false;
    }
    
    if (browser=="c")
    {
        if (window.devicePixelRatio==5)
            return true;
        else
            return false;
    }
}

function zoomMined() {
    if (browser=="f")
    {
        if (window.devicePixelRatio==0.3)
            return true;
        else
            return false;
    }
    
    if (browser=="c")
    {
        if (window.devicePixelRatio==0.25)
            return true;
        else
            return false;
    }
}

let previousScrollHeight = initiativeTrackerDiv.scrollHeight;
let previousScrollTop = 0;
initiativeTrackerDiv.onscroll = function()
{
    if (initiativeTrackerDiv.scrollHeight==previousScrollHeight)
    {
        previousScrollTop = initiativeTrackerDiv.scrollTop * window.devicePixelRatio;
    }
    else
    {
        initiativeTrackerDiv.scrollTop = previousScrollTop / window.devicePixelRatio;
        previousScrollHeight = initiativeTrackerDiv.scrollHeight;
    }
}
//#endregion

//#region Map options


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
    quickPolyBlockerMode = false;
    updateButtonColors();
    if(mapData.usePolyBlockers)
        quickPolyButton.style.display = "";
    else
        quickPolyButton.style.display = "none";
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
        gridSize = Math.min(map.width / mapData.x, map.height / mapData.y);
    }
    mapData.usePolyBlockers ? drawPolyBlockers() : drawBlockers();
    if (!skipMap) {
        drawMap();
        if (GridActive)
            drawGrid();
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
    for (let [k, currentShape] of mapData.drawings.entries())
    {
        if (currentShape.visible || (isDM&&!playerMode)) {
            switch (currentShape.shape)
            {
                case "circle":
                    drawCircle(k, currentShape);
                    break;
                
                case "square":
                    drawSquare(k, currentShape);
                    break;
    
                case "cone":
                    currentShape.is90Deg ? draw90Cone(k, currentShape) : drawCone(k, currentShape);
                    break;
                
                case "5ftLine":
                    draw5Line(k, currentShape);
                    break;

                case "vertexLine":
                    drawVertexLine(k, currentShape);
                    break;
            }
        }
    }
}

function drawVertexLine(index, shape)
{
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(shape.points[0].x, shape.points[0].y);
    for (let i = 1; i < shape.points.length; i++)
    {
        shapeCanvas.lineTo(shape.points[i].x, shape.points[i].y)
    }
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
    hitboxCanvas.moveTo(shape.points[0].x, shape.points[0].y);
    for (let i = 1; i < shape.points.length; i++)
    {
        hitboxCanvas.lineTo(shape.points[i].x, shape.points[i].y)
    }
    hitboxCanvas.stroke();
    if (selectedShapeId == shape.id)
    {
        let pickedUpHandle = -1;
        for (let i = 0; i < shape.points.length; i++)
        {
            let handleContainer = document.createElement("div");
            handleContainer.style.position = "absolute";
            handleContainer.style.left = shape.points[i].x;
            handleContainer.style.top = shape.points[i].y;
            let handle = document.createElement("div");
            handle.className = "shapeHandle";
            handle.draggable = true;
            handle.style.left = "-0.25vw";
            handle.style.top = "-0.25vw";
            handle.addEventListener("mousedown", function(e) {
                if (e.button == 0)
                {
                    pickedUpHandle = i;
                }
            });
    
            handle.addEventListener("mouseup", function(e) {
                if (e.button == 0)
                {
                    pickedUpHandle = -1;
                }
            })
    
            handle.addEventListener("contextmenu", function(e) {
                e.preventDefault();
                let menuOptions = [
                    {text: "Remove vert", hasSubMenu: false, callback: function() {
                        if (shape.points.length>2)
                        {
                            shape.points.splice(i, 1);
                            requestServer({c: "editDrawing", id: shape.id, points: shape.points});
                            updateMapData();
                        }
                        else
                        {
                            alert("There are too few verts in the line to remove one!");
                        }
                    }}
                ];
                displayMenu(e, menuOptions);
            });
    
            handle.addEventListener("dragover", function(e) {
                e.preventDefault();
            });
    
            handle.addEventListener("dragend", function(e) {
                pickedUpHandle = -1;
            });
    
            handleContainer.appendChild(handle);
            shapeHandles.appendChild(handleContainer);
        }      
        window.addEventListener("drop", async function(e) {
            if (pickedUpHandle!=-1)
            {
                if (((e.clientX + viewport.scrollLeft)/(1+extraZoom/20))!=shape.x && ((e.clientY + viewport.scrollTop)/(1+extraZoom/20))!=shape.y)
                {
                    shape.points[pickedUpHandle].x = ((e.clientX + viewport.scrollLeft)/(1+extraZoom/20));
                    shape.points[pickedUpHandle].y = ((e.clientY + viewport.scrollTop)/(1+extraZoom/20));
                    await requestServer({c:"editDrawing", id: shape.id, points: shape.points});
                    updateMapData();
                }
            }
        });
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

function drawMap()
{
    mapCanvas.drawImage(loadedMap, 0, 0);
}

function drawPolyBlockers() {
    if (!isDraggingBlocker)
    {
        if (mapData.antiBlockerOn)
            drawAntiBlocker();
        polyBlockers.innerHTML = '';
        polyBlockerHandles.innerHTML = '';
        blockersDiv.innerHTML = "";
        for (let [i, currentPolyBlocker] of mapData.polyBlockers.entries())
        {
            let newPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            newPolygon.style.position = "absolute";
            let polyString = "";
            for (let [j, vert] of currentPolyBlocker.verts.entries())
            {
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
                    editHandle.title = (j+1).toString();
                    
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
                            selectedVertHandle = j;
                    });

                    editHandle.addEventListener("dragover", function(e) {
                        e.preventDefault();
                    });

                    window.addEventListener("drop", function(e) {
                        if (selectedVertHandle!=-1)
                        {
                            if (((e.clientX + viewport.scrollLeft)/(1+extraZoom/20))!=vert.x && ((e.clientY + viewport.scrollTop)/(1+extraZoom/20))!=vert.y)
                            {
                                requestServer({c:"editVert", id: selectedBlocker, vertIndex: selectedVertHandle, x: ((e.clientX + viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.clientY + viewport.scrollTop)/(1+extraZoom/20))});
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
            if (isDM && !playerMode)
            {
                if (quickPolyBlockerMode)
                    newPolygon.style.pointerEvents = "none";
                if (blockerEditMode)
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
                            polyDragOffset.x = ((e.pageX+ viewport.scrollLeft)/(1+extraZoom/20));
                            polyDragOffset.y = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                            polyBlockerHandles.style.visibility = "hidden";
                        }
                    });
                    
                    window.addEventListener("mousemove", function(e) {
                        if (isDraggingBlocker)
                        {
                            if (currentPolyBlocker.id == draggedPolygonId)
                            {
                                newPolygon.setAttribute("transform", "matrix(1,0,0,1,"+(-polyDragOffset.x + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))).toString()+", "+(-polyDragOffset.y + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))).toString()+")");
                            }
                        }
                    })
                }
                else
                    newPolygon.style.pointerEvents = "none";
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
                            oldMousePos.x = (e.pageX/(1+extraZoom/20));
                            oldMousePos.y = (e.pageY/(1+extraZoom/20));
                            oldScrollPos.x = viewport.scrollLeft;
                            oldScrollPos.y = viewport.scrollTop;
                            document.body.style.cursor = "grabbing";
                            drawCanvas();
                        }
                    });
                    newPolygon.addEventListener("mousemove", function(e) {
                        if (isPanning)
                        {
                            viewport.scrollLeft = oldScrollPos.x - ((e.pageX/(1+extraZoom/20)) - oldMousePos.x);
                            viewport.scrollTop = oldScrollPos.y - ((e.pageY/(1+extraZoom/20)) - oldMousePos.y);
                        }
                    });
                }
                else
                    newPolygon.style.pointerEvents = "none";
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
        for (let currentBlocker of mapData.blockers)
        {
            let tmpBlocker = document.createElement("div");
            tmpBlocker.setAttribute("blockerid", currentBlocker.id);
            let extraBlocker = document.createElement("div");
            tmpBlocker.className = "blocker";
            tmpBlocker.style.left = currentBlocker.x + "px";
            tmpBlocker.style.top = currentBlocker.y + "px";
            tmpBlocker.style.width = currentBlocker.width + "px";
            tmpBlocker.style.height = currentBlocker.height + "px";
            if (isDM && !playerMode)
            {
                extraBlocker.style.width = currentBlocker.width + "px";
                extraBlocker.style.height = currentBlocker.height + "px";
                if (blockerEditMode && !isPlacingBlocker)
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
                        blockerDragOffset.x = currentBlocker.x - ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                        blockerDragOffset.y = currentBlocker.y - ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
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
                        oldMousePos.x = (e.pageX/(1+extraZoom/20));
                        oldMousePos.y = (e.pageY/(1+extraZoom/20));
                        oldScrollPos.x = viewport.scrollLeft;
                        oldScrollPos.y = viewport.scrollTop;
                        document.body.style.cursor = "grabbing";
                        drawCanvas();
                    }
                });
                tmpBlocker.addEventListener("mousemove", function(e) {
                    if (isPanning)
                    {
                        viewport.scrollLeft = oldScrollPos.x - ((e.pageX/(1+extraZoom/20)) - oldMousePos.x);
                        viewport.scrollTop = oldScrollPos.y - ((e.pageY/(1+extraZoom/20)) - oldMousePos.y);
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
    for (let blocker of blockersDiv.children)
    {
        if (blockerEditMode) {
            blocker.style.outline = blocker.getAttribute("blockerid")==selectedBlocker ? "0.3vh dashed "+blockerOutlineColor : "";
            blocker.style.zIndex = blocker.getAttribute("blockerid")==selectedBlocker ? reverse?101:102 : reverse?102:101;
        }
        else
        {
            blocker.style.zIndex = null;
            blocker.style.outline = "";
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
        for (let blocker of mapData.blockers)
        {
            antiBlockerCanvas.fillStyle = "#FFFFFFFF";
            antiBlockerCanvas.fillRect(blocker.x, blocker.y, blocker.width, blocker.height);
        }
        antiBlockerCanvas.globalCompositeOperation = "source-over";
    }
    else
    {
        antiBlockerCanvas.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
        antiBlockerCanvas.fillRect(0, 0, map.width, map.height);
        antiBlockerCanvas.globalCompositeOperation = "destination-out";
        for (let polyBlocker of mapData.polyBlockers)
        {
            antiBlockerCanvas.beginPath();
            antiBlockerCanvas.fillStyle = "#FFFFFFFF";
            antiBlockerCanvas.moveTo(polyBlocker.verts[0].x, polyBlocker.verts[0].y);
            for (let vert of polyBlocker.verts)
                antiBlockerCanvas.lineTo(vert.x, vert.y);
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

function LoadTokenData(token, force) {
    if (CheckTokenPermission(token))
    {
        detailsIcon.src = mapData.tokenList.includes(token.image)?"public/tokens/" + token.image:mapData.dmTokenList.includes(token.image)?"public/dmTokens/" + token.image:"public/blankToken.png";

        if (document.activeElement!=nameInput || force)
            nameInput.value = token.name;
    
        if (document.activeElement!=noteArea || force)
            noteArea.value = token.notes?token.notes:"";
        
        if (document.activeElement!=initiativeInput || force)
            initiativeInput.value = token.initiative?token.initiative:"";
        
        if (document.activeElement!=acInput || force)
            acInput.value = token.ac?token.ac:"";
        
        if ((document.activeElement!=currentHpInput && document.activeElement!=maxHpInput) || force)
        {
            currentHpInput.value = token.hp?token.hp.split("/")[0]:"";
            maxHpInput.value = token.hp?token.hp.split("/")[1]:"";
        }
        
        if (document.activeElement!=statusInput || force)
            statusInput.value = token.status?token.status:"No status";
        
        if (document.activeElement!=groupIdInput || force)
            groupIdInput.value = token.group?token.group:"";

        DetailsToggleButtonsUpdate(token.concentrating, token.hideTracker);
    }
    else
    {
        detailsIcon.src = "public/blankToken.png";
        nameInput.value = "DM only!";
        maxHpInput.value = "";
        currentHpInput.value = "";
        statusInput.value = token.status;
        initiativeInput.value = "";
        groupIdInput.value = "";
        acInput.value = "";
        noteArea.value = "";
        DetailsToggleButtonsUpdate(false, false);
    }
}

function drawTokens() 
{
    tokensDiv.innerHTML = "";
    for (let token of mapData.tokens)
    {
        let imageElement = document.createElement("img");
        if (token.id == selectedToken)
            LoadTokenData(token);

        imageElement.setAttribute("tokenid", token.id);
        imageElement.src = mapData.tokenList.includes(token.image)?"public/tokens/" + token.image:mapData.dmTokenList.includes(token.image)?"public/dmTokens/" + token.image:"public/blankToken.png";
        
        if (isPlacingCone || isPlacingLine || isPlacingSquare)
            imageElement.style.pointerEvents = "none";

        imageElement.className = "token";
        imageElement.style.top = token.y - (gridSize * token.size) / 2 + 0.5*GridLineWidth + "px";
        imageElement.style.left = token.x - (gridSize * token.size) / 2 + 0.5*GridLineWidth + "px";
        imageElement.style.width = (token.size * gridSize).toString() + "px";
        imageElement.style.height = (token.size * gridSize).toString() + "px";

        imageElement.style.zIndex = (token.layer + baseTokenIndex).toString();
        imageElement.title = token.status;
        imageElement.draggable = true;
        if (isDM && !playerMode && token.hidden)
        {
            let hiddenImage = document.createElement("img");
            hiddenImage.src = "images/hidden.png";
            hiddenImage.className = "hiddenToken";
            hiddenImage.style.width = (token.size * gridSize / 3).toString() + "px";
            hiddenImage.style.height = (token.size * gridSize / 3).toString() + "px";
            hiddenImage.style.top = token.y - (gridSize * token.size) / 2 + "px";
            hiddenImage.style.left = token.x - (gridSize * token.size) / 2  + "px";
            hiddenImage.style.zIndex = (token.layer + baseTokenIndex + 1).toString();
            tokensDiv.appendChild(hiddenImage);
        }

        if (mapData.portalData!={} && mapData.portalData[selectedPortal]!=null)
        {
            for (let link of mapData.portalData[selectedPortal].links)
            {
                if (link.id == token.id)
                {
                    let linkImage = document.createElement("img");
                    let tokenX = Math.round((token.x-mapData.offsetX)/gridSize-0.5*token.size);
                    let tokenY = Math.round((token.y-mapData.offsetY)/gridSize-0.5*token.size);
                    if (tokenX == (mapData.portalData[selectedPortal].originX+link.x) && tokenY == (mapData.portalData[selectedPortal].originY+link.y))
                    {
                        linkImage.src = "images/link.png";
                        linkImage.style.filter = "invert(98%) sepia(29%) saturate(3387%) hue-rotate(49deg) brightness(95%) contrast(81%)";
                    }
                    else
                    {
                        linkImage.src = "images/unlink.png";
                        linkImage.style.filter = "invert(47%) sepia(71%) saturate(6403%) hue-rotate(341deg) brightness(101%) contrast(87%)";

                        let ghostElement = document.createElement("img");
                        ghostElement.className = "token";
                        ghostElement.style.top = (link.y+mapData.portalData[selectedPortal].originY)*gridSize + "px";
                        ghostElement.style.left = (link.x+mapData.portalData[selectedPortal].originX)*gridSize + "px";
                        ghostElement.style.width = (token.size * gridSize).toString() + "px";
                        ghostElement.style.height = (token.size * gridSize).toString() + "px";
                        ghostElement.style.opacity = "0.5";
                        ghostElement.style.pointerEvents = "none";
                        ghostElement.style.zIndex = (token.layer + baseTokenIndex).toString();
                        ghostElement.src = mapData.tokenList.includes(token.image)?"public/tokens/" + token.image:mapData.dmTokenList.includes(token.image)?"public/dmTokens/" + token.image:"public/blankToken.png";
                        tokensDiv.appendChild(ghostElement);
                    }
                        
                    linkImage.className = "linkImage";
                    tokensDiv.appendChild(linkImage);
                    linkImage.style.width = (token.size * gridSize / 3).toString() + "px";
                    linkImage.style.height = (token.size * gridSize / 3).toString() + "px";
                    linkImage.style.top = token.y - (gridSize * token.size) / 2 + "px";
                    linkImage.style.left = token.x + (gridSize * token.size) / 2 - linkImage.offsetWidth + "px";
                    linkImage.style.zIndex = (token.layer + baseTokenIndex + 1).toString();
                }
            }
        }
            
        if (token.concentrating)
        {
            if (!token.dm || (isDM&&!playerMode))
            {
                let concentratingIcon = document.createElement("img");
                concentratingIcon.className = "concentratingText";
                concentratingIcon.src = "images/literally_copyright.png";
                tokensDiv.appendChild(concentratingIcon);
                concentratingIcon.style.width = (token.size * gridSize / 3).toString() + "px";
                concentratingIcon.style.height = (token.size * gridSize / 3).toString() + "px";
                concentratingIcon.style.top = token.y + (gridSize * token.size) / 2 - concentratingIcon.offsetHeight + "px";
                concentratingIcon.style.left = token.x - (gridSize * token.size) / 2 + "px";
                concentratingIcon.style.zIndex = (token.layer + baseTokenIndex + 1).toString();
            }
        }

        imageElement.addEventListener("mousemove", function(e) {
            if (isPanning)
            {
                viewport.scrollLeft = oldScrollPos.x - ((e.pageX/(1+extraZoom/20)) - oldMousePos.x);
                viewport.scrollTop = oldScrollPos.y - ((e.pageY/(1+extraZoom/20)) - oldMousePos.y);
            }
        })
        
        imageElement.addEventListener("dragstart", function(e) {
            if (!isPanning && (!mapData.groupLock.includes(token.group) || e.ctrlKey))
            {
                if (CheckAntiBlockerPixel(e) || (isDM&&!playerMode))
                {
                    e.dataTransfer.effectAllowed = "pointer";
                    tokenDragOffset.x = token.x - (e.pageX + viewport.scrollLeft)/(1+extraZoom/20);
                    tokenDragOffset.y = token.y - (e.pageY + viewport.scrollTop)/(1+extraZoom/20);
                    draggingToken = token.id;
                    isDraggingToken = true;
                    if (e.ctrlKey || e.metaKey)
                        controlPressed = true;
                }
                else
                {
                    e.preventDefault();
                    isPanning = true;
                    oldMousePos.x = e.pageX;
                    oldMousePos.y = e.pageY;
                    oldScrollPos.x = viewport.scrollLeft;
                    oldScrollPos.y = viewport.scrollTop;
                    document.body.style.cursor = "grabbing";
                    updateMapData();
                    return;
                }
            }
            else
            {
                e.preventDefault();
                document.body.style.cursor = "";
            }
            isPanning = false;
        });

        imageElement.addEventListener("mousedown", function(e) {
            if (e.button==0)
            {
                if (CheckAntiBlockerPixel(e) || (isDM&&!playerMode)&&!playerMode)
                {
                    detailsScreen.style.display = "grid";
                    selectedToken = token.id;
                    selectedBlocker = -1;
                    selectedShapeId = -1;
                    updateTrackerHighlight();
                    if (mapData.usePolyBlockers)
                    {
                        drawPolyBlockers()
                    }
                    else
                    {
                        drawBlockers();
                    }
                    LoadTokenData(token, true);
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
            if (CheckAntiBlockerPixel(e) || (isDM&&!playerMode))
            {
                let menuOptions = [
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
                                    if (!isNaN(rangeInput))
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
                    menuOptions.splice(0, 0,
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
                                DetailsToggleButtonsUpdate(false, false);
                            }
                            let result = await requestServer({c: "removeToken", id: token.id, tokensRemoved: mapData.removedTokens});
                            if(result[0] == true)
                                updateMapData();
                            else
                                alert("That token has already been removed by someone else");
                        }}
                    );

                    menuOptions.push({text: "Edit token", hasSubMenu: true, callback: function() {
                        let subMenuOptions = [
                            {text: "Change size", callback: function() {
                                let tokenSize = parseFloat(prompt("Please enter the new size of the token"));
                                if (!isNaN(tokenSize))
                                {
                                    if (isDM)
                                    {
                                        if (tokenSize < 20 && tokenSize > 0)
                                            requestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: token.layer, group: token.group});
                                        else
                                            alert("The desired size is too large or invalid");
                                    }
                                    else
                                    {
                                        if (tokenSize < 6 && tokenSize > 0)
                                            requestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: token.layer, group: token.group});
                                        else
                                            alert("That token size isn't allowed for players");
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
                                    alert("Layer must be > -1 and < 50 ");
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
                    }});

                    menuOptions.push({text: "Change image", hasSubMenu: true, callback: function() {
                        let subMenu = [];
                        subMenu.push({text: "Text", callback: function() {
                            requestServer({c: "editToken", id: token.id, image: "reset", text: token.text?token.text:"Text"});
                            updateMapData();
                        }});
                        for (let image of mapData.tokenList)
                        {
                            subMenu.push({text: image.substring(0, image.length - 4), callback: function() {
                                requestServer({c: "editToken", id: token.id, image: image});
                                updateMapData();
                            }});
                        }
                        if (isDM)
                        {
                            for (let image of mapData.dmTokenList)
                            {
                                subMenu.push({text: image.substring(0, image.length - 4), callback: function() {
                                    requestServer({c: "editToken", id: token.id, image: image});
                                    updateMapData();
                                }});
                            }
                        }
                        displaySubMenu(e, subMenu);
                    }});
                    
                    menuOptions.push({text: "Duplicate token", hasSubMenu: false, callback: async function() {
                        let tokenDupeCommand = JSON.parse(JSON.stringify(token));
                        delete tokenDupeCommand.id;
                        tokenDupeCommand.c = 'createToken';
                        tokenDupeCommand.x += 10;
                        let newId = parseInt(await requestServer(tokenDupeCommand));
                        for (let drawing of mapData.drawings)
                        {
                            if (drawing.link == token.id)
                            {
                                let drawingDupeCommand = JSON.parse(JSON.stringify(drawing));
                                delete drawingDupeCommand.id;
                                drawingDupeCommand.c = 'addDrawing';
                                drawingDupeCommand.link = newId;
                                await requestServer(drawingDupeCommand);
                            }
                        }
                        updateMapData();
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
                                subMenuOptions.push({text: "(Un)lock group", callback: async function() {
                                    await requestServer({c:"toggleGroupLock", group: token.group});
                                    updateMapData(true);
                                }});
                                subMenuOptions.push({text: "Hide tokens", callback: async function() {
                                    for (let a = 0; a < mapData.tokens.length; a++)
                                    {
                                        if (mapData.tokens[a].group == token.group) {
                                            await requestServer({c:"setTokenHidden", id: mapData.tokens[a].id, hidden: true});
                                        }
                                    }
                                    updateMapData(true);
                                }})
                                subMenuOptions.push({text: "Reveal tokens", callback: async function() {
                                    for (let a = 0; a < mapData.tokens.length; a++)
                                    {
                                        if (mapData.tokens[a].group == token.group) {
                                            await requestServer({c:"setTokenHidden", id: mapData.tokens[a].id, hidden: false});
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
        
        if (isDraggingBlocker || quickPolyBlockerMode)
            imageElement.style.pointerEvents = "none";

        tokensDiv.appendChild(imageElement);

        if (!token.image)
        {
            let textHolder = document.createElement("div");
            textHolder.style.zIndex = parseInt(imageElement.style.zIndex);
            textHolder.style.left = (token.x - 0.4*token.size*gridSize + 0.5*GridLineWidth).toString() + "px";
            textHolder.style.top = (token.y - 0.25*token.size*gridSize + 0.5*GridLineWidth).toString() + "px";
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
            textElement.style.textAlign = "center";
            textHolder.appendChild(textElement);
            tokensDiv.appendChild(textHolder);
            let autoCalcSize = parseInt(textElement.style.fontSize.substr(0, textElement.style.fontSize.length-2)) * (textHolder.getBoundingClientRect().width/textElement.getBoundingClientRect().width);
            if (autoCalcSize < 0.8*imageElement.getBoundingClientRect().width)
                textElement.style.fontSize = autoCalcSize;
            else
                textElement.style.fontSize = 0.8*imageElement.getBoundingClientRect().width;
            textElement.style.width = (token.size*gridSize*0.8).toString() + "px";
        }
    }
    updateHighlightedToken();
}

function updateHighlightedToken() {
    if (selectedToken!=null)
        for (let token of tokensDiv.children)
            token.style.outline = token.getAttribute("tokenid")==selectedToken?"0.20vw dashed aqua":"";
} 

let previousInitiativeTrackerScrollPosition = 0;
function updateTracker(force)
{
    if (oldParsedData)
        if (JSON.stringify(oldParsedData.tokens) == JSON.stringify(mapData.tokens) && oldParsedData.hideInit == mapData.hideInit && !force)
            return;
    previousInitiativeTrackerScrollPosition = initiativeTrackerDiv.scrollTop;
    initiativeTrackerDiv.innerHTML = "";
    for (let [i, token] of mapData.tokens.entries())
    {
        if (CheckTokenPermission(token) && !token.hideTracker)
        {
            if (initSearch.value!="") {
                if (token.name)
                    if (token.name.toLowerCase().includes(initSearch.value.toLowerCase()) || !token.dm)
                        createTracker(token, i);
            } else {
                createTracker(token, i);
            }
            
        }
    }
    initiativeTrackerDiv.scrollTop = previousInitiativeTrackerScrollPosition;
}

let isDraggingTracker = false;
function createTracker(trackerData, index)
{
    if (trackerData.initiative != null || trackerData.name != null || trackerData.ac != null || trackerData.hp != null)
    {
        let initiativeItem = document.createElement("div");
        initiativeItem.className = "initiativeItem";
        initiativeItem.draggable = "true";
        initiativeItem.addEventListener("drop", async function(e) {
            if (isDraggingTracker)
            {
                if (e.dataTransfer.getData("trackerId")!=index)
                    await requestServer({c: "switchTrackerPosition", origin: e.dataTransfer.getData("trackerId"), target: index});
                updateMapData();
                isDraggingTracker = false;
            }
        });
        initiativeItem.addEventListener("dblclick", function() {
            viewport.scrollLeft = ((trackerData.x)/(1+extraZoom/20))-window.innerWidth*0.5+0.5*trackerData.size*gridSize;
            viewport.scrollTop = ((trackerData.y)/(1+extraZoom/20))-window.innerHeight*0.5+0.5*trackerData.size*gridSize;
        });

        initiativeItem.addEventListener("dragstart", function(e) {
            isDraggingTracker = true;
            e.dataTransfer.setData("trackerId", index);
        });
        initiativeItem.addEventListener("dragend", function(e) {
            isDraggingTracker = false;
        })
        initiativeItem.addEventListener("dragover", function(e) {
            e.preventDefault();
        });
        initiativeItem.addEventListener("contextmenu", function(e) {
            e.preventDefault();
        });
        initiativeItem.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            detailsScreen.style.display = "grid";
            selectedToken = trackerData.id;         
            LoadTokenData(trackerData);
            updateTracker();
            drawTokens();
            updateTrackerHighlight();
        });
        if (!mapData.hideInit)
        {
            let initiativeDiv = document.createElement("div");
            initiativeDiv.className = "initiative";
            initiativeDiv.innerText = trackerData.initiative ? Math.floor(trackerData.initiative) : "";
            initiativeItem.append(initiativeDiv);
        }
            let nameDiv = document.createElement("div");
            nameDiv.className = "trackerName";
            nameDiv.innerText = trackerData.name;
            initiativeItem.append(nameDiv);
            let armorClassDiv = document.createElement("div");
            armorClassDiv.className = "trackerArmorClass";
            armorClassDiv.innerText = trackerData.ac ? trackerData.ac : "-";
            initiativeItem.appendChild(armorClassDiv);
            let armorClassText = document.createElement("div");
            armorClassText.innerText = "AC";
            armorClassText.className = "trackerArmorClassText";
            initiativeItem.appendChild(armorClassText);
            let trackerHitpointsSection = document.createElement("div");
            trackerHitpointsSection.className = "trackerHitpointsSection";
                let hitpointMaxDiv = document.createElement("div");
                hitpointMaxDiv.className = "trackerHitpointsMax";
                hitpointMaxDiv.innerText = trackerData.hp ? trackerData.hp.split("/")[1] : "-";
                trackerHitpointsSection.appendChild(hitpointMaxDiv);
                trackerHitpointsSection.innerHTML += "\n/\n";
                let hitpointsDiv = document.createElement("div");
                hitpointsDiv.className = "trackerHitpoints";
                hitpointsDiv.innerText = trackerData.hp ? trackerData.hp.split("/")[0] : "-";
                trackerHitpointsSection.appendChild(hitpointsDiv);
                let trackerDamageButton = document.createElement("button");
                trackerDamageButton.className = "trackerDamageButton";
                    let trackerDamageImage = document.createElement("img");
                    trackerDamageImage.src = "images/swap_vert-24px.png";
                    trackerDamageButton.append(trackerDamageImage);
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
                trackerHitpointsSection.append(trackerDamageButton);    
            initiativeItem.appendChild(trackerHitpointsSection);
            let healthTextDiv = document.createElement("div");
            healthTextDiv.className = "trackerHealthText";
            healthTextDiv.innerText = "HP";
            initiativeItem.append(healthTextDiv);
        initiativeItem.setAttribute("id", trackerData.id);
        initiativeItem.setAttribute("dm", trackerData.dm);
        initiativeTrackerDiv.appendChild(initiativeItem);
        updateTrackerHighlight();
    }
}

function updateTrackerHighlight() {
    let trackerScale = parseFloat(getComputedStyle(document.body).getPropertyValue("--tracker-scale"));
    let sideMenuWidthProperty = document.body.style.getPropertyValue("--sidemenu-width");
    let sideMenuWidth = parseFloat(sideMenuWidthProperty.substr(0, sideMenuWidthProperty.length-2));
    for (let currentInitTracker of initiativeTrackerDiv.children)
    {
        if (currentInitTracker.tagName=="DIV")
        {
            sideMenuWidth>=21*trackerScale ? currentInitTracker.classList.add("oneLineInitiative") : currentInitTracker.classList.remove("oneLineInitiative");
            if (currentInitTracker.id == selectedToken)
                currentInitTracker.style.backgroundColor = currentInitTracker.getAttribute("dm")=="true" ? "#a14b28" : "#3b3b96";
            else if (currentInitTracker.id != "")
                currentInitTracker.style.backgroundColor = currentInitTracker.getAttribute("dm")=="true" ? "#614d45" : "#424254";
        }
    }
}

function DetailsToggleButtonsUpdate(concentrating, hide)
{
    concentratingInput.style.backgroundColor = concentrating ? getComputedStyle(document.body).getPropertyValue("--toggle-highlighted-color") : "";
    hideTrackerInput.children[0].src = hide ? "images/visibility_off-24px.svg" : "images/visibility-24px.svg";
    hideTrackerInput.style.backgroundColor = hide ? getComputedStyle(document.body).getPropertyValue("--toggle-highlighted-color") : "";
}
//#endregion

//#region Menu events
document.getElementById("openBulkGenerator").onclick = function() {
    if (displayMapSettings) {
        document.getElementById("toggleSettingsButton").click();
    }
    
    if (bulkInitGeneratorScreen.style.display=="none" || bulkInitGeneratorScreen.style.display=="")
        bulkInitGeneratorScreen.style.display = "block";
    else
        bulkInitGeneratorScreen.style.display = "none";
}

document.getElementById("sortTracker").onclick = async function() {
    await requestServer({c:"sortTracker"});
    updateMapData();
}

initSearch.oninput = function() {
    updateTracker(true);
}

trackerScaleSlider.oninput = function() {
    document.body.style.setProperty("--tracker-scale", (trackerScaleSlider.value/100).toString());
    updateTrackerHighlight();
    setCookie("trackerScale", trackerScaleSlider.value/100);
}

document.getElementById("setScaleToOneLine").onclick = function() {
    let tmpSideMenuWidthText = getComputedStyle(document.body).getPropertyValue("--sidemenu-width");
    let tmpSideMenuWidth = parseFloat(tmpSideMenuWidthText.substr(0, tmpSideMenuWidthText.length-2))/21.1;
    if (tmpSideMenuWidth>(trackerScaleSlider.max/100))
        tmpSideMenuWidth = trackerScaleSlider.max/100;
    if (tmpSideMenuWidth<(trackerScaleSlider.min/100))
        tmpSideMenuWidth = trackerScaleSlider.min/100;
    document.body.style.setProperty("--tracker-scale", (tmpSideMenuWidth).toString());
    trackerScaleSlider.value = tmpSideMenuWidth*100;
    updateTrackerHighlight();
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
//#endregion

//#region Side buttons
document.getElementById("toggleGridButton").onclick = function() {
    GridActive = !GridActive;
    updateMapData(true);
    updateButtonColors();
}

document.getElementById("toggleSnapButton").onclick = function() {
    GridSnap = !GridSnap;
    updateButtonColors();
}

quickPolyButton.onclick = function() {
    if (isDM) {
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
    }
    updateButtonColors();
}

let displayMapSettings = false;
let mapOptionsMenu = document.getElementById("mapOptionsMenu");
document.getElementById("toggleSettingsButton").onclick = function() {
    if (isDM)
    {
        if (!(bulkInitGeneratorScreen.style.display=="none" || bulkInitGeneratorScreen.style.display=="")) {
            document.getElementById("openBulkGenerator").click();
        }
        
        if (displayMapSettings)
            mapOptionsMenu.style.display = "none";
        else
            mapOptionsMenu.style.display = "flex";
        displayMapSettings =! displayMapSettings;
    }
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
colorPicker.onchange = function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
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
//#endregion

//#region Details menu
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

noteArea.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
    {
        await requestServer({c: "editToken", id: selectedToken, notes: noteArea.value});
    }
    updateMapData();
}

initiativeInput.oninput = async function() {
    updateSelectedTokenData();
    let newInit = parseFloat(initiativeInput.value);
    if (CheckTokenPermission(selectedTokenData))
    {
        if (isNaN(newInit))
        {
            await requestServer({c: "editToken", id: selectedToken, initiative: "reset"});
        }
        else
        {
            await requestServer({c: "editToken", id: selectedToken, initiative: newInit});
        }
    }   
    updateMapData();
}

nameInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        await requestServer({c: "editToken", id: selectedToken, name: nameInput.value});
    }
    updateMapData();
}

acInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        await requestServer({c: "editToken", id: selectedToken, ac: acInput.value});  
    }
    updateMapData();
}

currentHpInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        await requestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value + "/" + maxHpInput.value});
    }
    updateMapData();
}

maxHpInput.oninput = async function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        await requestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value + "/" + maxHpInput.value});
    }
    updateMapData();
}

statusInput.oninput = async function() {
    updateSelectedTokenData();
    await requestServer({c:"editToken", id: selectedToken, status: statusInput.value});
    updateMapData();
}

groupIdInput.oninput = async function() {
    let newGroupId = parseInt(groupIdInput.value);
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData)) {
        if (newGroupId)
        {
            await requestServer({c:"editToken", id: selectedToken, group: newGroupId});
        }
        else
        {
            await requestServer({c:"editToken", id: selectedToken, group: "reset"});
        }
    }
    updateMapData();
}

hideTrackerInput.onclick = async function() {
    updateSelectedTokenData();
    await requestServer({c:"editToken", id: selectedToken, hideTracker: !selectedTokenData.hideTracker});
    updateMapData();
}

concentratingInput.onclick = async function() {
    updateSelectedTokenData();
    await requestServer({c:"editToken", id: selectedToken, concentrating: !selectedTokenData.concentrating});
    updateMapData();
}
//#endregion

//#region DM Menu
document.getElementById("clearTokensButton").onclick = function() {
    if (confirm("Do you really want to remove all the tokens?") && isDM)
    {
        requestServer({c:"clearTokens"});
        updateMapData(true);
    }
}

document.getElementById("clearDrawingsButton").onclick = function() {
    if (confirm("Do you really want to remove all the drawings?") && isDM)
    {
        requestServer({c:"clearDrawings"});
        updateMapData(true);
    }
}

document.getElementById("clearBlockersButton").onclick = function() {
    if (confirm("Do you really want to remove all the blockers?") && isDM)
    {
        requestServer({c:"clearBlockers"});
        updateMapData(true);
    }
}

document.getElementById("switchBlockerTypeButton").onclick = async function() {
    if (confirm("Are you sure you want to switch blocker types?") && isDM)
    {
        if(mapData.usePolyBlockers)
        {
            quickPolyBlockerMode = false;
            quickPolyButton.style.display = "none";
        }
        else
        {
            quickPolyBlockerMode = false;
            quickPolyButton.style.display = "";
        }
        requestServer({c:"switchBlockerType"});
    }
    await updateMapData(true);
}

document.getElementById("invertBlockerButton").onclick = function() {
    if (confirm("Do you really want to invert the blockers?") && isDM)
    {
        requestServer({c: "invertBlockers"});
        updateMapData(true);
    }
}

document.getElementById("togglePlayerMode").onclick = function() {
    playerMode = !playerMode;
    if (!playerMode)
    {
        shapeMap.style.zIndex = 54;
        baseTokenIndex = 54;
    }
    else
    {
        baseTokenIndex = 4;
        shapeMap.style.zIndex = "";
    }
        
    updateMapData(true);
}

document.getElementById("clearPortals").onclick = function() {
    requestServer({c: "clearPortals"});
    updateMapData(true);
}

let extraOptions = [
    document.getElementById("startAlignTool"),
    document.getElementById("hideInits"),
    document.getElementById("importMap"),
    document.getElementById("exportMap")
];

document.getElementById("toggleExtraOptions").onclick = function() {
    console.log("derp!");
    for (let element of extraOptions)
    {
        if (element.style.display == "")
            element.style.display = "none";
        else if (element.style.display == "none")
            element.style.display = "";
    }
}

//Extra options

document.getElementById("startAlignTool").onclick = function() {
    alignToolStep = 1;
    alert("Click on a intersection in the top left of the pre-existing grid.");
}

document.getElementById("hideInits").onclick = function() {
    if (mapData.hideInit)
        requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: false});
    else
        requestServer({c: "setMapData", map: mapData.map, x: mapData.x, y: mapData.y, offsetX: mapData.offsetX, offsetY: mapData.offsetY, hideInit: true});
    updateMapData();
}

document.getElementById("importMap").onclick = function() {
    document.getElementById("fileImport").click();
}

document.getElementById("fileImport").onchange = function() {
    document.getElementById("submitMap").click();
    updateMapData(true);
}

document.getElementById("exportMap").onclick = function() {
    requestServer({c: "exportMap"});
    window.open("/public/export/export.json");
}

//#endregion

//#region Main event handlers
function CheckAntiBlockerPixel(e) {
    if (mapData.antiBlockerOn)
    {
        let pixel = antiBlockerCanvas.getImageData(((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), 1, 1).data;
        return (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0 && pixel[3] == 0);
    }
    return true;
}

function updateSelectedTokenData()
{
    for (let token of mapData.tokens)
        if (token.id == selectedToken)
            selectedTokenData = token;
}

function CheckTokenPermission(token) {
    if (token==null)
        return false;
    if (token.dm!=null)
        return !(!isDM && token.dm);
    else
    {
        if (token.image!=null)
        {
            return isDM || mapData.tokenList.includes(token.image);
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
            editHandleContainer.style.left = (e.clientX + viewport.scrollLeft)/(1+extraZoom/20);
            editHandleContainer.style.top = (e.clientY + viewport.scrollTop)/(1+extraZoom/20);
        }

        editHandle.addEventListener("mousedown", function() {
            document.body.addEventListener("mousemove", handleMouseMovement);
        });

        editHandle.addEventListener("mouseup", function(e) {
            document.body.removeEventListener("mousemove", handleMouseMovement);
            if (((e.clientX + viewport.scrollLeft)/(1+extraZoom/20))!=vert.x && ((e.clientY + viewport.scrollTop)/(1+extraZoom/20))!=vert.y)
            {
                vert.x = (e.clientX + viewport.scrollLeft)/(1+extraZoom/20);
                vert.y = (e.clientY + viewport.scrollTop)/(1+extraZoom/20);
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
        document.body.style.cursor = "";
        isPanning = false;

        if (resizingSideMenu && !menuIsHidden)
        {
            let calcWidth = (window.innerWidth - e.clientX) / window.innerWidth * 100 - 1.8;
            if (calcWidth < 12)
                calcWidth = 12;
            if (calcWidth > 50)
                calcWidth = 50;
            let newWidth = (calcWidth).toString() + "vw";
            if (newWidth != document.body.style.getPropertyValue("--sidemenu-width"))
            {
                document.body.style.setProperty("--sidemenu-width", newWidth);
                setCookie("sideMenuWidth", newWidth);
                resizingSideMenu = false;
                bulkInitGeneratorScreen.style.right = (calcWidth + 2).toString() + "vw";
                updateTrackerHighlight();
            }
            else
            {
                resizingSideMenu = false;
            }
        }

        if (isDraggingBlocker && mapData.usePolyBlockers)
        {
            polyBlockerHandles.style.visibility = "";
            let moveX = -polyDragOffset.x + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
            let moveY = -polyDragOffset.y + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
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

        if (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))>0 && ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))<map.width && ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))>0 && ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))<map.height)
        {
            if (isMovingShape)
            {
                isMovingShape = false;
                document.body.style.cursor = "default";
                if (CheckAntiBlockerPixel(e) || (isDM&&!playerMode))
                {
                    requestServer({c: "editDrawing", id: movingShapeId, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + shapeDragOffset.x, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) + shapeDragOffset.y, both: true, moveShapeGroup: e.ctrlKey});
                }
                updateMapData();
            }

            if (isMovingCone)
            {
                isMovingCone = false;
                document.body.style.cursor = "default";
                let angle = mapData.drawings[movingShapeId].angle + (Math.atan2((((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - shapeDragOffset.y), (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - shapeDragOffset.x)) - shapeDragStartAngle);
                if (angle<0)
                    angle+=2*Math.PI;
                requestServer({c: "editDrawing", id: movingShapeId, angle: angle});
                updateMapData();
            }

            if (isMoving5ftLine)
            {
                isMoving5ftLine = false;
                document.body.style.cursor = "default";
                let angle = mapData.drawings[movingShapeId].angle + (Math.atan2((((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - shapeDragOffset.y), (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - shapeDragOffset.x)) - shapeDragStartAngle);
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
            case "KeyC":
                colorPicker.click();
                break;

            case "Digit0":
                if (mapData.portalData.length>0)
                    setPortal(parseInt(prompt("Enter your desired portal ID (0-"+(mapData.portalData.length-1).toString()+"):")));
                    updateMapData(true);
                break;

            case "KeyG":
                GridActive = !GridActive;
                updateButtonColors();
                updateMapData(true);
                break;
            
            case "KeyS":
                GridSnap = !GridSnap;
                updateButtonColors();
                break;

            case "KeyM":
                if (isDM) {
                    document.getElementById("togglePlayerMode").click();
                }
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
                if (isDM && mapData.usePolyBlockers)
                {
                    quickPolyButton.click();
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

map.addEventListener("mousedown", async function(e) {
    if (e.button == 0)
    {
        selectedToken=-1;
        selectedBlocker=-1;
        selectedShapeId=-1;
        updateTrackerHighlight();
        displayNoteEditor = false;
        noteEditor.style.display = "none";
        detailsScreen.style.display = "none";
        if (alignToolStep > 0)
        {
            if (alignToolStep == 1) {
                gridToolData.startX = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                gridToolData.startY = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                alert("Now click on the intersection to the bottom right of that one. (2;2)")
                alignToolStep = 2;
                return;
            }
    
            if (alignToolStep == 2) {
                gridToolData.gridX = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - gridToolData.startX;
                gridToolData.gridY = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - gridToolData.startY;
                alert("Now click on last visible intersection in the bottom right of the pre-existing grid.");
                alignToolStep = 3;
                return;
            }
    
            if (alignToolStep == 3) {
                gridToolData.endX = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                gridToolData.endY = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
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
                await requestServer({c: "setMapData", map: mapData.map, x: Xcount, y: Ycount, offsetX: (gridToolData.startX - gridToolData.gridX), offsetY: (gridToolData.startY - gridToolData.gridY), hideInit: mapData.hideInit});
                updateMapData();
                alignToolStep = 0;
                return;
            }
        }
        
        if (placingBulkOrigin || quickPolyBlockerMode || isPlacingSquare || isPlacingBlocker || isPlacingLine || isPlacing5ftLine || isPlacingCone)
        {
            if (placingBulkOrigin)
            {
                let autoGenInit = confirm("Automatically generate initiatives for the new tokens?");
                let sameInit = autoGenInit ? confirm("Should all the tokens have the same initiative?") : false;
                let dexMod = autoGenInit ? prompt("Enter the dex mod of the new tokens") : null;
                let tmpInit;
                if (autoGenInit && sameInit)
                {
                    tmpInit = randomRandom(20)+parseInt(dexMod);
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
                let commonNameInText = bulkInitSettings.image=="number" ? confirm("Display common name in token text?") : false;
                let hideTracker = isDM ? confirm("Hide the new tokens in the initiative tracker?") : false;
                for (let f = 1; f <= bulkInitSettings.tokenAmount; f++)
                {
                    if (autoGenInit && !sameInit)
                    {
                        tmpInit = randomRandom(20)+parseInt(dexMod);
                        if (isNaN(tmpInit))
                        {
                            placingBulkOrigin = false;
                            return;
                        }
                    }
                    if (bulkInitSettings.image=="number")
                    {
                        let tokenText = commonNameInText ? bulkInitSettings.commonName+" "+f.toString() : f.toString();
                        if (newHP!=null) 
                            await requestServer({c: "createToken", text: tokenText, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + ((f-1)%Math.ceil(Math.sqrt(bulkInitSettings.tokenAmount)))*bulkInitSettings.tokenSizes*gridSize, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) + (Math.floor((f-1)/Math.ceil(Math.sqrt(bulkInitSettings.tokenAmount))))*bulkInitSettings.tokenSizes*gridSize, size: bulkInitSettings.tokenSizes, status: "", layer: 1, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hideTracker: hideTracker, hp: newHP.toString()+"/"+newHP.toString(), ac: newAC});
                        else
                            await requestServer({c: "createToken", text: tokenText, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: bulkInitSettings.tokenSizes, status: "", layer: 1, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hideTracker: hideTracker});
                    }
                    else
                    {
                        if (newHP!=null) 
                            await requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 1, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hideTracker: hideTracker, hp: newHP.toString()+"/"+newHP.toString(), ac: newAC});
                        else
                            await requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + (f-1)*bulkInitSettings.tokenSizes*gridSize, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 1, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hideTracker: hideTracker});
                    }
                }
                placingBulkOrigin = false;
                updateMapData();
                return;
            }
            if (quickPolyBlockerMode) {
                newPolyBlockerVerts.push({x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY + viewport.scrollTop)/(1+extraZoom/20))});
                DrawNewPolyMarkers(true);
                return;
            }
            if (isPlacingSquare)
            {
                squareMarkers.width = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - squareMarkers.x;
                squareMarkers.height = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - squareMarkers.y;
                if (squareMarkers.width >= -map.width && squareMarkers.width <= map.width && squareMarkers.height >= -map.height && squareMarkers.height <= map.height)
                {
                    if ((isDM&&!playerMode) || CheckAntiBlockerPixel(e))
                    {
                        let shapeIsVisible = true;
                        if (isDM)
                            shapeIsVisible = confirm("Should the shape be visible?");
                        await requestServer({c: "addDrawing", shape: "square", x: squareMarkers.x, y: squareMarkers.y, width: squareMarkers.width, height: squareMarkers.height, trueColor: shapeColor, visible: shapeIsVisible});
                    }
                    updateMapData();
                }
                else
                    alert("That square was too large or too small");
                isPlacingSquare = false;
                return;
            }
            if (isPlacingBlocker)
            {
                if (isDM)
                {
                    blockerMarkers.width = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - blockerMarkers.x;
                    blockerMarkers.height = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - blockerMarkers.y;
                    await requestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
                }
                isPlacingBlocker = false;
                updateMapData(true);
                drawCanvas();
                return;
            }
            if (isPlacingLine)
            {
                lineMarkers.destX = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                lineMarkers.destY = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                if ((isDM&&!playerMode) || CheckAntiBlockerPixel(e))
                {
                    let shapeIsVisible = true;
                    if (isDM)
                        shapeIsVisible = confirm("Should the shape be visible?");
                    await requestServer({c: "addDrawing", shape: "vertexLine", points:[{x: lineMarkers.x, y: lineMarkers.y}, {x: lineMarkers.destX, y: lineMarkers.destY}], trueColor: shapeColor, visible: shapeIsVisible});
                }
                updateMapData();
                isPlacingLine = false;
                return;
            }
            if (isPlacing5ftLine)
            {
                let destX = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                let destY = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                let angle = Math.atan2((destY - thickLineMarkers.y), (destX - thickLineMarkers.x));
                if (angle<0) { angle+=2*Math.PI; }
                if ((isDM&&!playerMode) || CheckAntiBlockerPixel(e))
                {
                    let shapeIsVisible = true;
                    if (isDM)
                        shapeIsVisible = confirm("Should the shape be visible?");
                    await requestServer({c: "addDrawing", shape: "5ftLine", x: thickLineMarkers.x, y: thickLineMarkers.y, angle: angle, trueColor: shapeColor, link: thickLineMarkers.linkId, range: thickLineMarkers.range, visible: shapeIsVisible});
                }
                updateMapData();
                isPlacing5ftLine = false;
                return;
            }
            if (isPlacingCone)
            {
                let destX = ((e.pageX+ viewport.scrollLeft)/(1+extraZoom/20));
                let destY = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                let angle = Math.atan2((destY - coneMarkers.y), (destX - coneMarkers.x));
                if (angle<0) { angle+=2*Math.PI; }
                if ((isDM&&!playerMode) || CheckAntiBlockerPixel(e))
                {
                    let shapeIsVisible = true;
                    if (isDM)
                        shapeIsVisible = confirm("Should the shape be visible?");
                    await requestServer({c: "addDrawing", shape: "cone", link: coneMarkers.linkId, x: coneMarkers.x, y: coneMarkers.y, angle: angle, range: coneMarkers.range, trueColor: shapeColor, visible: shapeIsVisible, is90Deg: coneMarkers.is90Deg});
                }
                updateMapData();
                isPlacingCone = false;
                return;
            }
        } 

        let pixel = hitboxCanvas.getImageData(((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), 1, 1).data;
        if (!(pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) && (CheckAntiBlockerPixel(e) || (isDM && !playerMode)))
        {
            let testString = "#" + decToHex(pixel[0]) + decToHex(pixel[1]) + decToHex(pixel[2]);
            let shapeId = colorToSigned24Bit(testString) / 16;
            shapeId--;
            let clickedShape;
            for (let shape of mapData.drawings)
            {
                if (shape.id == shapeId)
                {
                    clickedShape = shape;
                    break;
                }
            }
            if (shapeId%1 == 0)
            {
                if (clickedShape.link==null)
                {
                    if (clickedShape.shape=="vertexLine")
                    {
                        selectedShapeId = clickedShape.id;
                        selectedBlocker = -1;
                        selectedToken = -1;
                        drawCanvas();
                        shapeDragOffset.x = clickedShape.points[0].x - ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                        shapeDragOffset.y = clickedShape.points[0].y - ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                    }
                    else
                    {
                        shapeDragOffset.x = clickedShape.x - ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                        shapeDragOffset.y = clickedShape.y - ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                    }
                    document.body.style.cursor = "pointer";
                    movingShapeId = shapeId;
                    isMovingShape = true;
                    return;
                }
                else
                {
                    if (clickedShape.shape=="cone")
                    {
                        document.body.style.cursor = "pointer";
                        shapeDragOffset.x = clickedShape.x;
                        shapeDragOffset.y = clickedShape.y;
                        shapeDragStartAngle = Math.atan2((((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - shapeDragOffset.y), (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - shapeDragOffset.x));
                        movingShapeId = shapeId;
                        isMovingCone = true;
                        return;
                    }
                    if (clickedShape.shape=="5ftLine")
                    {
                        document.body.style.cursor = "pointer";
                        shapeDragOffset.x = clickedShape.x;
                        shapeDragOffset.y = clickedShape.y;
                        shapeDragStartAngle = Math.atan2((((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - shapeDragOffset.y), (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - shapeDragOffset.x));
                        movingShapeId = shapeId;
                        isMoving5ftLine = true;
                        return;
                    }
                }
            }
        }
        isPanning = true;
        oldMousePos.x = e.pageX;
        oldMousePos.y = e.pageY;
        oldScrollPos.x = viewport.scrollLeft;
        oldScrollPos.y = viewport.scrollTop;
        document.body.style.cursor = "grabbing";
        drawCanvas(true);
    }
})

let previousCalcWidth = 0;
window.addEventListener("mousemove", function(e) {
    if (resizingSideMenu && !menuIsHidden)
    {
        let calcWidth = (window.innerWidth - e.clientX) / window.innerWidth * 100 - 1.8;
        calcWidth = calcWidth<12 ? 12 : calcWidth;
        calcWidth = calcWidth>50 ? 50 : calcWidth;
        document.body.style.setProperty("--sidemenu-width", (calcWidth).toString() + "vw");
        bulkInitGeneratorScreen.style.right = (calcWidth + 2).toString() + "vw";
        let trackerScale = getComputedStyle(document.body).getPropertyValue("--tracker-scale");
        if ((previousCalcWidth < (21*trackerScale) && calcWidth > (21*trackerScale)) || (previousCalcWidth > (21*trackerScale) && calcWidth < (21*trackerScale)))
            updateTrackerHighlight();
        previousCalcWidth = calcWidth;
        return;
    }

    if (isPanning)
    {
        viewport.scrollLeft = oldScrollPos.x + oldMousePos.x - e.pageX;
        viewport.scrollTop = oldScrollPos.y + oldMousePos.y - e.pageY;
        return;
    }
})

map.addEventListener("dragstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
})

map.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (!isPanning)
    {
        if (CheckAntiBlockerPixel(e) || (isDM&&!playerMode))
        {
            let pixel = hitboxCanvas.getImageData(((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), 1, 1).data;
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
        for (let shape of mapData.drawings)
        {
            if (shape.id == shapeId)
            {
                selectedShape = shape;
                break;
            }
        }
        let menuOptions = [
            {text: "Erase shape", hasSubMenu: false, callback: async function() {
                let result = await requestServer({c: "removeDrawing", id: shapeId, removedDrawings: mapData.removedDrawings});
                if (result[0]) {
                    if (selectedShapeId == shapeId)
                        shapeId = -1;
                    updateMapData();
                } else {
                    alert("That drawing has already been removed by someone else!");
                }
            }},
            {text: "Set shape group", hasSubMenu: false, callback: async function() {
                let shapeGroupString;
                if (selectedShape.shapeGroup != null)
                    shapeGroupString = prompt("Enter shape group number: ", selectedShape.shapeGroup);
                else
                    shapeGroupString = prompt("Enter shape group number: ");
                let shapeGroup = parseInt(shapeGroupString);
                if (!isNaN(shapeGroup))
                    await requestServer({c:"editDrawing", id: shapeId, shapeGroup: shapeGroup});
                if (shapeGroupString=="")
                    await requestServer({c:"editDrawing", id: shapeId, shapeGroup: "null"});
                updateMapData();
            }}
        ];
        if (selectedShape.shape == "vertexLine") {
            menuOptions.splice(1, 0, {text: "Add vert", hasSubMenu: false, callback: async function() {
                let vertX = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                let vertY = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                
                for (let k = 1; k < selectedShape.points.length; k++)
                {
                    let originX = Math.min(selectedShape.points[k].x, selectedShape.points[k-1].x);
                    let originY = Math.min(selectedShape.points[k].y, selectedShape.points[k-1].y);
                    let width = Math.abs(selectedShape.points[k].x-selectedShape.points[k-1].x);
                    let height = Math.abs(selectedShape.points[k].y-selectedShape.points[k-1].y);
                    if (vertX >= originX && vertX <= (originX+width) && vertY >= originY && vertY <= (originY+height))
                    {
                        selectedShape.points.splice(k, 0, {x: vertX, y: vertY});
                        k = selectedShape.points.length;
                    }
                }
                await requestServer({c: "editDrawing", id: shapeId, points: selectedShape.points});
                updateMapData();
            }});
        }
        if (isDM) {
            menuOptions.push({text: selectedShape.visible?"Hide shape":"Reveal shape", hasSubMenu: false, callback: async function() {
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
                    if (isNaN(tokenSize))
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
                                    requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 1, dm: true})
                                else
                                    requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 1, dm: false})
                                
                                console.log("Placing text token with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                                requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 1, dm: false})
                                console.log("Placing text token with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                    if (isNaN(tokenSize))
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (isDM)
                        {
                            if (tokenSize < 20 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: tokenList[i], size: tokenSize, status: "", layer: 1, dm: false})
                                console.log("Placing " + tokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                                requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: tokenList[i], size: tokenSize, status: "", layer: 1, dm: false})
                                console.log("Placing " + tokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                        if (isNaN(tokenSize))
                        {
                            alert("That wasn't a valid size! Please try again!");
                        }
                        else
                        {
                            requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: dmTokenList[i], size: tokenSize, status: "", layer: 1, dm: true})
                            console.log("Placing " + dmTokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                        circleMarkers.x = ((e.pageX+ viewport.scrollLeft)/(1+extraZoom/20));
                        circleMarkers.y = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                        let shapeIsVisible = true;
                        if (isDM) {
                            shapeIsVisible = confirm("Should the shape be visible?");
                        }
                        requestServer({c: "addDrawing", shape: "circle", x: circleMarkers.x, y: circleMarkers.y, radius: circleMarkers.radius, trueColor: shapeColor, visible: shapeIsVisible});
                        updateMapData();
                    }    
                }},
                {text: "Draw Square", callback: function() {
                    squareMarkers.x = ((e.pageX+ viewport.scrollLeft)/(1+extraZoom/20));
                    squareMarkers.y = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                    isPlacingSquare = true;
                    drawCanvas();
                }},
                {text: "Draw Line", callback: function() {
                    lineMarkers.x = ((e.pageX+ viewport.scrollLeft)/(1+extraZoom/20));
                    lineMarkers.y = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                    isPlacingLine = true;
                    drawCanvas();
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
                    if (isNaN(tokenSize))
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (tokenSize < 20 && tokenSize > 0)
                        {
                            if (confirm("Make this a DM token?"))
                                requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 1, dm: true, hidden: true})
                            else
                                requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 1, dm: false, hidden: true})
                            
                            console.log("Placing text token with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                    if (isNaN(tokenSize))
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        if (tokenSize < 20 && tokenSize > 0)
                        {
                            requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: tokenList[i], size: tokenSize, status: "", hidden: true, layer: 1, dm: true})
                            console.log("Placing hidden " + tokenList[i] + " with size " + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
                    if (isNaN(tokenSize))
                    {
                        alert("That wasn't a valid size! Please try again!");
                    }
                    else
                    {
                        requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: dmTokenList[i], size: tokenSize, status: "", hidden: true, layer: 1, dm: true})
                        console.log("Placing " + dmTokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
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
            requestServer({c: "addPolyBlocker", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), offset: gridSize});
            updateMapData();
        }})
    }
    else
    {
        DMoptions.push({text: mapData.antiBlockerOn?"Place Anti Blocker":"Place Blocker", description: "Upon clicking this button click somewhere else to define the bottom right corner", hasSubMenu: false, callback: async function() {
            blockerMarkers.x = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
            blockerMarkers.y = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
            isPlacingBlocker = true;
            drawCanvas();
        }});
    }
    if (isDM)
        for (let option of DMoptions)
            listOptions.push(option);
    displayMenu(e, listOptions);
}

window.onclick = function(event) 
{
    let ancestry = getAncestry(event.target);
    let shouldCloseMenus = true;
    for (let element of ancestry)
    {
        try {
            if (element.className.includes("custom-menu")) { shouldCloseMenus = false; }
        }
        catch {
            if (element.className.baseVal.includes("custom-menu")) { shouldCloseMenus = false; }
        }
    }
    if (shouldCloseMenus) { 
        closeMenu();
        closeSubMenu();
    }
}

let isDraggingToken = false;
map.addEventListener("dragover", function(e) {
    e.preventDefault();
})

map.addEventListener("dragend", function(e) {
    e.preventDefault();
})

document.body.ondrop = async function(e) 
{
    e.preventDefault();
    if (isDraggingToken && (CheckAntiBlockerPixel(e) || (isDM&&!playerMode)))
    {
        let gridX = map.width / mapData.x;
        let gridY = map.height / mapData.y;
        let draggingTokenData;
        for (let token of mapData.tokens)
        {
            if (token.id == draggingToken)
            {
                draggingTokenData = token;
                break;
            }
        }
        if (GridSnap)
        {
            let tX;
            let tY;
            if (draggingTokenData.size >= 1)
            {
                tX = Math.round(((e.pageX + viewport.scrollLeft + tokenDragOffset.x)/(1+extraZoom/20) - mapData.offsetX - 0.5 * gridX * draggingTokenData.size)/gridX) * gridX + 0.5 * gridX * draggingTokenData.size + GridLineWidth + offsetX;
                tY = Math.round(((e.pageY + viewport.scrollTop + tokenDragOffset.y)/(1+extraZoom/20) - mapData.offsetY - 0.5 * gridY * draggingTokenData.size)/gridY) * gridY + 0.5 * gridY * draggingTokenData.size + GridLineWidth + offsetY;
            }
            else
            {
                tX = Math.round(((e.pageX + viewport.scrollLeft + tokenDragOffset.x)/(1+extraZoom/20) - mapData.offsetX - 0.5 * gridX * draggingTokenData.size) / (gridX * draggingTokenData.size)) * (gridX * draggingTokenData.size) + 0.5 * gridX * draggingTokenData.size + GridLineWidth + offsetX;
                tY = Math.round(((e.pageY + viewport.scrollTop + tokenDragOffset.y)/(1+extraZoom/20) - mapData.offsetY - 0.5 * gridY * draggingTokenData.size) / (gridY * draggingTokenData.size)) * (gridY * draggingTokenData.size) + 0.5 * gridY * draggingTokenData.size + GridLineWidth + offsetY;
            }
            if (tX != draggingTokenData.x || tY != draggingTokenData.y)
                await requestServer({c: "moveToken", id: draggingToken, x: tX, y: tY, bypassLink: !controlPressed});
        }
        else
        {
            let tempx = (e.pageX + viewport.scrollLeft)/(1+extraZoom/20) + tokenDragOffset.x;
            let tempy = (e.pageY + viewport.scrollTop)/(1+extraZoom/20) + tokenDragOffset.y;
            if (tempx != draggingTokenData.x || tempy != draggingTokenData.y)
            {
                await requestServer({c: "moveToken", id: draggingToken, x: tempx, y: tempy, bypassLink: !controlPressed});
            }
        }
        updateMapData(true);
        isDraggingToken = false;
        controlPressed = false;
        draggingToken = -1;
    }
    if (isDraggingBlocker)
    {
        draggedBlocker.x = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
        draggedBlocker.y = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
    }
}
//#endregion

//#region Menu and Submenu
    let customMenu = document.getElementById("contextMenu");
    let customMenuPos;
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
            
            let posx = (event.pageX + viewport.scrollLeft)/(1+extraZoom/20);
            let posy = (event.pageY + viewport.scrollTop)/(1+extraZoom/20);
            customMenu.style.transform = "scale("+1/(1+extraZoom/20)+")";
            customMenu.style.transformOrigin = "top left";
            customMenu.style.top = posy + "px";
            customMenu.style.left = posx + "px";
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
            if (event.pageX + customMenu.offsetWidth >= window.innerWidth + window.pageXOffset - sideMenu.offsetWidth)
            {
                customMenu.style.left = ((window.innerWidth + viewport.scrollLeft - customMenu.offsetWidth - sideMenu.offsetWidth - 5)/(1+extraZoom/20)).toString()+"px";
            }
            if (event.pageY + customMenu.offsetHeight > window.innerHeight + window.pageYOffset)
            {
                customMenu.style.top = ((window.innerHeight + viewport.scrollTop - customMenu.offsetHeight - 4)/(1+extraZoom/20)).toString()+"px";
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
            if (tmpHeight > 60)
            {
                tmpHeight = 60;
                customSubMenu.style.overflowY = "scroll";
            }
            else
            {
                customSubMenu.style.overflowY = "hidden";
            }
            customSubMenu.style.display = "block";
            customSubMenu.style.transform = "scale("+1/(1+extraZoom/20)+")";
            customSubMenu.style.transformOrigin = "top left";
            customSubMenu.style.height = tmpHeight + "vh";
            customSubMenu.style.top = ((event.pageY + viewport.scrollTop)/(1+extraZoom/20)).toString() + "px";
            customSubMenu.style.left = (customMenu.offsetLeft + customSubMenu.offsetWidth/(1+extraZoom/20) + 1/(1+extraZoom/20)).toString()+"px";
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

            if (event.pageY + customSubMenu.offsetHeight > window.innerHeight + window.pageYOffset)
            {
                customSubMenu.style.top = ((window.innerHeight + viewport.scrollTop - customSubMenu.offsetHeight - 4)/(1+extraZoom/20)).toString()+"px";
            }
            
            if (event.pageX + customMenu.offsetWidth + customSubMenu.offsetWidth >= window.innerWidth + window.pageXOffset - sideMenu.offsetWidth)
            {
                customSubMenu.style.left = (customMenu.offsetLeft - customSubMenu.offsetWidth/(1+extraZoom/20) - 1/(1+extraZoom/20)).toString()+"px";
            }
        }
    }

    function closeSubMenu() { customSubMenu.style.display = "none"; }
//#endregion

//#region Low level functions
function randomRandom(max) {
    let randomNums = []
    for (let i = 0; i < 20; i++)
    {
        randomNums.push(Math.ceil(Math.random()*max));
    }
    return randomNums[Math.floor(Math.random()*20)];
}

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
    for(let c of document.cookie.split(';')) {
        while (c.charAt(0)==' ')
            c = c.substring(1);
        if (c.indexOf(cname)==0)
            return c.substring(cname.length+1, c.length);
    }
    return "";
}
//#endregion

//#region Side menu stuff
updateButtonColors();
let resizer = document.getElementById("Resizer");
let menuIsHidden = false;
resizer.addEventListener("dblclick", function(e) {
    if (menuIsHidden)
    {
        sideMenu.style.display = "";
        viewport.style.width = "";
        resizer.style.right = "";
        resizer.style.width = "0.4vw";
    }
    else
    {
        resizer.style.width = "0.5vw";
        sideMenu.style.display = "none";
        resizer.style.right = "0vw";
        viewport.style.width = "99.5vw";
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

function updateButtonColors()
{
    if (GridActive)
    {
        document.getElementById("toggleGridButton").style.backgroundColor = "orange";
    }
    else
    {
        document.getElementById("toggleGridButton").style.backgroundColor = "#424254";
    }
        
    if (GridSnap)
    {
        document.getElementById("toggleSnapButton").style.backgroundColor = "orange";
    }
    else
    {
        document.getElementById("toggleSnapButton").style.backgroundColor = "#424254";
    }
        
    if (isDM)
    {
        if (displayMapSettings)
        {
            document.getElementById("toggleSettingsButton").style.backgroundColor = "orange";
        }
        else
        {
            document.getElementById("toggleSettingsButton").style.backgroundColor = "#424254";
        }

        if (blockerEditMode)
        {
            document.getElementById("toggleBlockerEditing").style.backgroundColor = "orange";
        }
        else
        {
            document.getElementById("toggleBlockerEditing").style.backgroundColor = "#424254";
        }

        if (quickPolyBlockerMode)
        {
            if (quickPolyButton.style.display!="none")
            {
                quickPolyButton.style.backgroundColor = "orange";
            }
        }
        else
        {
            if (quickPolyButton.style.display!="none")
            {
                quickPolyButton.style.backgroundColor = "#424254";
            }
        }
    }
}
//#endregion Side menu stuff