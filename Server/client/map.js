var socket = io.connect();
let starting = true;
let GridActive = true;
let GridSnap = true;
let blockerOutlineColor = "violet";
let shapeWidth = 2;
let GridLineWidth = 1;
let feetPerSquare = 5.0;
let showOtherViewports = false;

var browser = "";
if(navigator.userAgent.indexOf("Chrome") != -1 )
    browser = "c";
else if (navigator.userAgent.indexOf("Firefox") != -1 )
    browser = "f";
else
    alert("Room of thought is only supported for firefox and chrome. Some features may be unavailable!");

let offsetX = 0;
let offsetY = 0;
let GridColor = "#222222FF";
let shapeColor = "#FF0000FF";
//Used to draw the hitbox of shapes to make it easier to move them
let hitboxMultiplier = 3;
let gridMap = document.getElementById("gridMap");
let board = document.getElementById("board");
let viewport = document.getElementById("viewport");
let mapImage = document.getElementById("mapImage");
let shapeMap = document.getElementById("shapeMap");
let hitboxMap = document.getElementById("hitboxMap");
let tokensDiv = document.getElementById("tokens");
let blockersDiv = document.getElementById("blockers");
let mapSourceSelect = document.getElementById("mapSource");
let mapXInput = document.getElementById("mapX");
let mapYInput = document.getElementById("mapY");
let offsetXInput = document.getElementById("offsetX");
let offsetYInput = document.getElementById("offsetY");
let blockerTypeSelect = document.getElementById("blockerType");
let initiativeTrackerDiv = document.getElementById("initiativeTracker");
let trackerScaleSlider = document.getElementById("trackerScaleSlider");
let closeNotesButton = document.getElementById("closeNotes");
let notesHeader = document.getElementById("notesHeader");
let notesHeaderBar = notesHeader.parentElement;

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
let noteArea = noteEditor.children[1];
let concentratingInput = document.getElementById("concentrating");
let hideTrackerInput = document.getElementById("visibility");
let hpIcon = document.getElementById("hitpointsIcon");

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
let quickPolyButton = document.getElementById("quickPolyButton");
let colorPickerButton = document.getElementById("colorPickerButton");
let gridCanvas;
let shapeCanvas;
let hitboxCanvas;
let antiBlockerContext;
let mapData;
let gridSize;
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

updateButtonColors();
let resizer = document.getElementById("Resizer");

let sideMenuIsHidden = getCookie("sideMenuHidden") == "true";
sideMenu.style.display = sideMenuIsHidden ? "none" : "";
viewport.style.width = sideMenuIsHidden ? "99.5vw" : "";
resizer.style.right = sideMenuIsHidden ? "0vw" : "";
resizer.style.width = sideMenuIsHidden ? "0.5vw" : "0.4vw";

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
let oldDataString = "";
let oldParsedData;
let resizingSideMenu = false;
let controlPressed = false;
let placingBulkOrigin = false;
let baseTokenIndex = 4;
let shapeDragStartAngle = 0;
let polyDragOffset = {x: 0, y: 0};
let alignToolStep = 0;
let gridToolData = {startX: 0, startY: 0, gridX: 0, gridY: 0, endX: 0, endY: 0, }
let quickPolyBlockerMode = false;
let newPolyBlockerVerts = [];
let selectedNewVertHandle = -1;
let playerMode = false;
let isDraggingPoint = false;

function Setup() {
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
    
    noteEditor.style.display = "none";
    gridCanvas = gridMap.getContext("2d");
    //mapCanvas = map.getContext("2d");
    hitboxCanvas = hitboxMap.getContext("2d");
    shapeCanvas = shapeMap.getContext("2d");
    antiBlockerContext = antiBlockerMap.getContext("2d");
    setColor(shapeColor);
    quickPolyButton.style.display = (mapData.blockerType == 1 && isDM) ? "" : "none";
    
    if (!mapData.blockerType)
        requestServer({c:"switchBlockerType", type: 0});
    blockerTypeSelect.value = mapData.blockerType ? mapData.blockerType.toString() : "0";
    
    if (isDM) {
        shapeMap.style.zIndex = 941;
        baseTokenIndex = 500;
    } else {
        baseTokenIndex = 0;
    }
}

socket.addEventListener('pingAt', (dataString) => {
    let data = JSON.parse(dataString);
    console.log("Created Ping!");
    let pingCircle = document.createElement('div');
    pingCircle.className = 'ping';
    pingCircle.style.setProperty('transform', `translate(-50%, -50%) translate(${data.pingX}px, ${data.pingY}px)`)
    board.appendChild(pingCircle);
    setTimeout(() => {
        board.removeChild(pingCircle);
    }, 5000);
});

socket.addEventListener('currentMapData', (dataString) => {
    mapData = JSON.parse(dataString);
    if (oldDataString == dataString)
        return;

    if (starting) {
        Setup();
        starting = false;
    } 

    GridColor = mapData.gridColor;
    document.body.style.setProperty("--antiBlocker-color", (isDM && !playerMode)?"#00000080":"#000000FF");
    document.body.style.setProperty("--blocker-color", mapData.antiBlockerOn ? ((isDM && !playerMode)?"#00000080":"#000000FF") : "#00000000");

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
    if (mapData.map!=(oldParsedData?oldParsedData.map:""))
    {
        console.log("Switching/Redrawing map!");
        selectedToken = -1;
        selectedBlocker = -1;
        selectedShapeId = -1;
        detailsScreen.style.display = "none";
        mapImage.src = "/public/maps/" + mapData.map;

        mapImage.onload = function()
        {
            blockerTypeSelect.value = mapData.blockerType.toString();
            drawCanvas();
            mapSourceSelect.value = mapData.map;
            mapYInput.value = mapData.y;
            mapXInput.value = mapData.x;
            offsetXInput.value = mapData.offsetX;
            offsetYInput.value = mapData.offsetY;
            quickPolyBlockerMode = false;
            updateButtonColors();
            quickPolyButton.style.display = (mapData.blockerType == 1 && isDM) ? "" : "none";
            oldDataString = dataString;
            oldParsedData = oldDataString?JSON.parse(oldDataString):oldParsedData;
        }
    }
    else
    {
        let skipMapRedraw = true;
        if (oldParsedData.x != mapData.x) { skipMapRedraw = false; }
        if (oldParsedData.y != mapData.y) { skipMapRedraw = false; }
        if (oldParsedData.offsetX != mapData.offsetX) { skipMapRedraw = false; }
        if (oldParsedData.offsetY != mapData.offsetY) { skipMapRedraw = false; }
        if (oldParsedData.gridColor != mapData.gridColor) { skipMapRedraw = false; }
        drawCanvas(skipMapRedraw);
        oldDataString = dataString;
        oldParsedData = oldDataString?JSON.parse(oldDataString):oldParsedData;
    }
});

socket.addEventListener('clearViewport', (dataString) => {
    let otherViewportData = JSON.parse(dataString);
    let otherViewportBox = document.getElementById(otherViewportData.id);
    if (otherViewportBox) {
        otherViewportBox.parentElement.removeChild(otherViewportBox);
    }
})

socket.addEventListener('drawViewport', (dataString) => {
    if (showOtherViewports)
    {
        let otherViewportData = JSON.parse(dataString);
        let otherViewportBox = document.getElementById(otherViewportData.origin);
        if (!otherViewportBox) {
            otherViewportBox = document.createElement("div");
            otherViewportBox.id = otherViewportData.origin;
            otherViewportBox.className = "otherViewport";
            board.appendChild(otherViewportBox);
        }
        otherViewportBox.style.width = otherViewportData.width * (1+extraZoom/20);
        otherViewportBox.style.height = otherViewportData.height * (1+extraZoom/20);
        otherViewportBox.style.top = otherViewportData.top * (1+extraZoom/20);
        otherViewportBox.style.left = otherViewportData.left * (1+extraZoom/20); 
    }
})

let oldViewportDatastring = "";
let updateViewportBounds = true;
viewport.addEventListener("scroll", () => {
    if (updateViewportBounds) {
        updateViewportBounds = false;
        let newViewportData = {c: 'shareViewportBounds', left: (viewport.scrollLeft)/(1+extraZoom/20), top: (viewport.scrollTop)/(1+extraZoom/20), width: (viewport.offsetWidth)/(1+extraZoom/20), height: (viewport.offsetHeight)/(1+extraZoom/20)};
        let newViewportDatastring = JSON.stringify(newViewportData);
        if (newViewportDatastring != oldViewportDatastring) {
            requestServer(newViewportData);
            oldViewportDatastring = newViewportDatastring;
        }
        setTimeout(() => {updateViewportBounds = true}, 100);
    }
});

function returnToken(id) {
    for (let h = 0; h<mapData.tokens.length; h++)
    {
        if (mapData.tokens[h].id == id)
            return mapData.tokens[h];
    }
}

//#region Drag system
let draggableElements = [];
function draggableElement(element, followMouse, pickupElement, dropElement, moveElement, checkBlocker, followCondition) {
    let offset = {x: 0, y: 0};
    element.draggable = false;
    element.setAttribute("dragging", 0);
    element.setAttribute("checkBlocker", checkBlocker);
    element.addEventListener("mousedown", function(e) {
        if (e.button == 0) {
            if (checkBlocker)
            {
                if (!CheckAntiBlockerPixel(e) && !isDM && !playerMode)
                {
                    isPanning = true;
                    oldMousePos.x = e.pageX;
                    oldMousePos.y = e.pageY;
                    oldScrollPos.x = viewport.scrollLeft;
                    oldScrollPos.y = viewport.scrollTop;
                    document.body.style.cursor = "grabbing";
                    return;
                }
            }
            closeMenu();
            closeSubMenu();
            e.preventDefault();
            element.style.cursor = "grabbing";
            element.style.userSelect = "none";
            draggableElements.push(element);
            element.setAttribute("dragging", 1);
            offset.x = (e.pageX + viewport.scrollLeft)/(1+extraZoom/20) - element.offsetLeft;
            offset.y = (e.pageY + viewport.scrollTop)/(1+extraZoom/20) - element.offsetTop;
            if (pickupElement)
                pickupElement(e, offset);
        }
    });

    element.addEventListener("release", function(e) {
        element.style.cursor = "";
        element.style.userSelect = "";
        draggableElements.splice(draggableElements.indexOf(element), 1);
        if (dropElement)
            dropElement(e.detail.event, offset);
    });

    let value = [];
    if (followMouse) {
        if (moveElement) {
            element.addEventListener("followMouse", function(e) {
                if (followCondition)
                    followCondition(value, e.detail.event);
                if (followCondition ? value[0] : true)
                {
                    element.style.left = ((e.detail.event.pageX + viewport.scrollLeft)/(1+extraZoom/20) - offset.x).toString()+"px";
                    element.style.top = ((e.detail.event.pageY + viewport.scrollTop)/(1+extraZoom/20) - offset.y).toString()+"px";
                    moveElement(e.detail.event, offset);
                }
            })
        }
        else
        {
            element.addEventListener("followMouse", function(e) {
                if (followCondition)
                    followCondition(value, e.detail.event);
                if (followCondition ? value[0] : true)
                {
                    element.style.left = ((e.detail.event.pageX + viewport.scrollLeft)/(1+extraZoom/20) - offset.x).toString()+"px";
                    element.style.top = ((e.detail.event.pageY + viewport.scrollTop)/(1+extraZoom/20) - offset.y).toString()+"px";
                }
            })
        }    
    }
}

let draggingElement = false;
window.addEventListener("mousemove", function(e) {
    draggingElement = false;
    for (let element of draggableElements) {
        if (element.getAttribute("dragging")=="1")
        {
            draggingElement = true
            element.dispatchEvent(new CustomEvent("followMouse", {
                "detail": {"event": e}
            }));
        }
    }
    if (draggingElement)
        e.preventDefault();
});

window.addEventListener("mouseup", function(e) {
    if (e.button == 0) {
        for (let element of draggableElements) {
            if (element.getAttribute("dragging")=="1")
            {
                element.setAttribute("dragging", 0);
                if (element.getAttribute("checkBlocker")=="true")
                    if (!CheckAntiBlockerPixel(e))
                    {
                        element.style.cursor = "";
                        element.style.userSelect = "";
                        draggableElements.splice(draggableElements.indexOf(element), 1);
                        element.parentElement.removeChild(element);
                        element.dispatchEvent(new CustomEvent("dragcancel", {
                            "detail": {"event": e}
                        }));
                        return;
                    }    
                    
                element.dispatchEvent(new CustomEvent("release", {
                    "detail": {"event": e}
                }));
            }
        }
    }
});
//#endregion

//#region Custom zoom
let extraZoom = 0;
window.addEventListener("wheel", function(e) {
    if (e.ctrlKey || e.metaKey)
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
    requestServer({c: "setMapData", gridColor: gridColorPicker.value});
}

mapSelect.onchange = function() {
    requestServer({c: "changeSelectedMap", selectedMap: mapSelect.value})
}

mapSourceSelect.onchange = function() {
    requestServer({c: "setMapData", map: mapSourceSelect.value});
}

mapYInput.onchange = function() {
    requestServer({c: "setMapData", y: parseFloat(mapYInput.value)});
}

mapXInput.onchange = function() {
    requestServer({c: "setMapData", x: parseFloat(mapXInput.value)});
}

offsetXInput.onchange = function() {
    requestServer({c: "setMapData", offsetX: parseFloat(offsetXInput.value)});
}

offsetYInput.onchange = function() {
    requestServer({c: "setMapData", offsetY: parseFloat(offsetYInput.value)});
}
//#endregion

//#region Drawing functions
function drawCanvas(skipMap, force)
{
    for (let [i, element] of draggableElements.entries()) {
        if (!document.body.contains(element)) {
            draggableElements.splice(i, 1);
        }
    }
    polyBlockers.innerHTML = '';
    polyBlockerHandles.innerHTML = '';
    blockersDiv.innerHTML = "";
    antiBlockerContext.clearRect(0, 0, antiBlockerMap.width, antiBlockerMap.height);
    if (!skipMap) {
        gridCanvas.strokeStyle = GridColor;
        gridCanvas.lineWidth = GridLineWidth;
        polyBlockers.setAttribute("width", mapImage.clientWidth.toString());
        polyBlockers.setAttribute("height", mapImage.clientHeight.toString());
        shapeMap.width = mapImage.clientWidth;
        shapeMap.height = mapImage.clientHeight;
        hitboxMap.width = mapImage.clientWidth;
        hitboxMap.height = mapImage.clientHeight;
        antiBlockerMap.width = mapImage.clientWidth;
        antiBlockerMap.height = mapImage.clientHeight;
        gridMap.width = mapImage.clientWidth;
        gridMap.height = mapImage.clientHeight;
        gridSize = {x: (mapImage.clientWidth-mapData.offsetX)/mapData.x, y: (mapImage.clientHeight-mapData.offsetY)/mapData.y, min:Math.min((mapImage.clientWidth-mapData.offsetX)/mapData.x, (mapImage.clientHeight-mapData.offsetY)/mapData.y)};
        gridCanvas.clearRect(0, 0, mapImage.clientWidth, mapImage.clientHeight);
    }
    document.body.style.setProperty("--antiBlocker-color", (isDM && !playerMode)?"#00000080":"#000000FF");
    document.body.style.setProperty("--blocker-color", mapData.antiBlockerOn ? ((isDM && !playerMode)?"#00000080":"#000000FF") : "#00000000");
    if (mapData.antiBlockerOn)
        drawAntiBlocker();
    if (mapData.blockerType == 0) {
        polyBlockerHandles.style.visibility = "hidden";
        drawBlockers();
    }
        
    if (mapData.blockerType == 1) {
        polyBlockerHandles.style.visibility = "";
        drawPolyBlockers();
    }
    if (GridActive)
        drawGrid();
    drawTokens();
    drawShapes();
    updateTracker(force);
}

function drawShapes()
{
    shapeCanvas.clearRect(0, 0, shapeMap.width, shapeMap.height);
    hitboxCanvas.clearRect(0, 0, hitboxMap.width, hitboxMap.height);
    shapeHandles.innerHTML = "";
    for (let currentShape of mapData.drawings)
    {
        if (currentShape.visible || (isDM&&!playerMode)) {
            switch (currentShape.shape)
            {
                case "circle":
                    drawCircle(currentShape);
                    break;
                
                case "square":
                    drawSquare(currentShape);
                    break;
    
                case "cone":
                    currentShape.is90Deg ? draw90Cone(currentShape) : drawCone(currentShape);
                    break;
                
                case "5ftLine":
                    draw5Line(currentShape);
                    break;

                case "vertexLine":
                    drawVertexLine(currentShape);
                    break;
            }
        }
    }
}

function drawVertexLine(shape)
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
    let hex = ((parseInt(shape.id) + 1) * 16).toString(16);
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
            draggableElement(handle, true, null,
                function(e) {
                    if (((e.pageX + viewport.scrollLeft)/(1+extraZoom/20))!=shape.x && ((e.pageY + viewport.scrollTop)/(1+extraZoom/20))!=shape.y)
                    {
                        shape.points[i].x = ((e.pageX + viewport.scrollLeft)/(1+extraZoom/20));
                        shape.points[i].y = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                        requestServer({c:"editDrawing", id: shape.id, points: shape.points});
                    }
                }
            );

            handle.addEventListener("contextmenu", function(e) {
                e.preventDefault();
                let menuOptions = [
                    {text: "Remove vert", hasSubMenu: false, callback: function() {
                        if (shape.points.length>2)
                        {
                            shape.points.splice(i, 1);
                            requestServer({c: "editDrawing", id: shape.id, points: shape.points});
                        }
                        else
                        {
                            alert("There are too few verts in the line to remove one!");
                        }
                    }}
                ];
                displayMenu(e, menuOptions);
            });
            handleContainer.appendChild(handle);
            shapeHandles.appendChild(handleContainer);
        }      
    }
}

function drawCircle(shape) 
{
    let trueRadius = shape.radius*gridSize.min;
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.arc(shape.x, shape.y, trueRadius, 0, 2 * Math.PI);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(shape.id) + 1) * 16).toString(16);
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

function drawSquare(shape) 
{
    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.rect(shape.x, shape.y, shape.width, shape.height);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(shape.id) + 1) * 16).toString(16);
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

function draw5Line(shape) {
    let lineOrigin = {x: Math.round(shape.x + Math.cos(shape.angle)*gridSize.x*0.5), y: Math.round(shape.y + Math.sin(shape.angle)*gridSize.y*0.5)};
    let topOriginCorner = {x: Math.round(lineOrigin.x + Math.cos(shape.angle-0.5*Math.PI)*gridSize.x*0.5), y: Math.round(lineOrigin.y + Math.sin(shape.angle-0.5*Math.PI)*gridSize.y*0.5)};
    let topTargetCorner = {x: Math.round(topOriginCorner.x + Math.cos(shape.angle) * shape.range * gridSize.x), y: Math.round(topOriginCorner.y + Math.sin(shape.angle) * shape.range * gridSize.y)};
    let bottomOriginCorner = {x: Math.round(lineOrigin.x + Math.cos(shape.angle+0.5*Math.PI)*gridSize.x*0.5), y: Math.round(lineOrigin.y + Math.sin(shape.angle+0.5*Math.PI)*gridSize.y*0.5)};
    let bottomTargetCorner = {x: Math.round(bottomOriginCorner.x + Math.cos(shape.angle) * shape.range * gridSize.x), y: Math.round(bottomOriginCorner.y + Math.sin(shape.angle) * shape.range * gridSize.y)};
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
    let hex = ((parseInt(shape.id) + 1) * 16).toString(16);
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

function drawCone(shape)
{
    let angle = shape.angle;
    let linkedToken = returnToken(shape.link);
    let originX = Math.round(shape.x + Math.cos(angle)*0.5*linkedToken.size*gridSize.x);
    let originY = Math.round(shape.y +  Math.sin(angle)*0.5*linkedToken.size*gridSize.y);

    let centerY = Math.round(originY + Math.sin(angle) * shape.range * gridSize.y);
    let centerX = Math.round(originX + Math.cos(angle) * shape.range * gridSize.x);

    let destX1 = Math.round(0.5*(-centerY + originY) + centerX);
    let destY1 = Math.round(0.5*(centerX - originX) + centerY);

    let destX2 = Math.round(0.5*(centerY - originY) + centerX);
    let destY2 = Math.round(0.5*(-centerX + originX) + centerY);

    shapeCanvas.strokeStyle = shape.trueColor;
    shapeCanvas.lineWidth = shapeWidth;
    shapeCanvas.beginPath();
    shapeCanvas.moveTo(originX, originY);
    shapeCanvas.lineTo(destX1, destY1);
    shapeCanvas.lineTo(destX2, destY2);
    shapeCanvas.lineTo(originX, originY);
    shapeCanvas.stroke();

    let colorString = "#";
    let hex = ((parseInt(shape.id) + 1) * 16).toString(16);
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

function draw90Cone(shape) {
    let angle = shape.angle;
    let linkedToken = returnToken(shape.link);
    let originX = Math.round(shape.x + Math.cos(angle)*0.5*linkedToken.size*gridSize.x);
    let originY = Math.round(shape.y +  Math.sin(angle)*0.5*linkedToken.size*gridSize.y);

    let destX1 = Math.round(originX + Math.cos(angle+0.25*Math.PI) * shape.range * gridSize.x);
    let destY1 = Math.round(originY + Math.sin(angle+0.25*Math.PI) * shape.range * gridSize.y);

    let destX2 = Math.round(originX + Math.cos(angle-0.25*Math.PI) * shape.range * gridSize.x);
    let destY2 = Math.round(originY + Math.sin(angle-0.25*Math.PI) * shape.range * gridSize.y);

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
    let hex = ((parseInt(shape.id) + 1) * 16).toString(16);
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

function drawPolyBlockers() {
    if (!isDraggingBlocker)
    {
        for (let [i, currentPolyBlocker] of mapData.polyBlockers.entries())
        {
            let newPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            newPolygon.style.position = "absolute";
            let polyString = "";
            if (!mapData.antiBlockerOn)
            {
                antiBlockerContext.beginPath();
                antiBlockerContext.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
            }
            
            for (let [j, vert] of currentPolyBlocker.verts.entries())
            {
                if (!mapData.antiBlockerOn)
                {
                    if (j==0)
                        antiBlockerContext.moveTo(vert.x, vert.y);
                    else
                        antiBlockerContext.lineTo(vert.x, vert.y);
                }
                polyString += vert.x + "," + vert.y + " ";
                if (blockerEditMode && i==selectedBlocker && !quickPolyBlockerMode)
                {
                    let editHandleContainer = document.createElement("div");
                    editHandleContainer.style.position = "absolute";
                    editHandleContainer.style.left = vert.x;
                    editHandleContainer.style.top = vert.y;
                    let editHandle = document.createElement("div");
                    editHandle.className = "polyBlockerHandle";
                    editHandle.style.left = "-0.35vw";
                    editHandle.style.top = "-0.35vw";
                    editHandle.title = (j+1).toString();
                    
                    draggableElement(editHandle, true, function() {},
                    function(e) {
                        requestServer({c:"editVert", id: selectedBlocker, vertIndex: j, x: ((e.pageX + viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY + viewport.scrollTop)/(1+extraZoom/20))});
                        
                    })

                    editHandle.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                        let menuOptions = [
                            {text: "Add new vert", hasSubMenu: false, callback: function() {
                                requestServer({c: "addVert", id: currentPolyBlocker.id, vertId: j});
                                
                            }},
                            {text: "Remove vert", hasSubMenu: false, callback: function() {
                                if (currentPolyBlocker.verts.length>3)
                                {
                                    requestServer({c: "removeVert", id: currentPolyBlocker.id, vertId: j});
                                    
                                }
                                else
                                {
                                    alert("There are too few verts in that poly blocker to remove one!");
                                }
                            }}
                        ];
                        displayMenu(e, menuOptions);
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
                if (!mapData.antiBlockerOn)
                    antiBlockerContext.fill();
                if (currentPolyBlocker.inactive)
                {
                    newPolygon.style.stroke = "red";
                    newPolygon.style.strokeDasharray = "4";
                    newPolygon.style.fill = "";
                }
                if (blockerEditMode && !quickPolyBlockerMode)
                {
                    newPolygon.addEventListener("dragover", function(e) {
                        e.preventDefault();
                    });

                    draggableElement(newPolygon, true, function(e) {
                        newPolygon.style.stroke = "violet";
                        newPolygon.style.strokeDasharray = "4";
                        polyDragOffset.x = ((e.pageX+ viewport.scrollLeft)/(1+extraZoom/20));
                        polyDragOffset.y = ((e.pageY + viewport.scrollTop)/(1+extraZoom/20));
                        polyBlockerHandles.style.visibility = "hidden";
                        updateHighlightedToken();
                        updateTrackerHighlight();
                    },
                    function(e) {
                        let moveX = -polyDragOffset.x + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
                        let moveY = -polyDragOffset.y + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
                        if (moveX!=0 && moveY!=0)
                        {
                            requestServer({c: "movePolyBlocker", id: currentPolyBlocker.id, offsetX: moveX, offsetY: moveY});
                            
                        }
                    }, 
                    function(e) {
                        newPolygon.setAttribute("transform", "matrix(1,0,0,1,"+(-polyDragOffset.x + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))).toString()+", "+(-polyDragOffset.y + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))).toString()+")");
                    });

                    newPolygon.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                        let menuOptions = [
                            {text: currentPolyBlocker.inactive ? "Activate" : "Deactivate", hasSubMenu: false, callback: function() {
                                requestServer({c: "togglePolyBlocker", id: currentPolyBlocker.id});
                                
                            }},
                            {text: "Remove blocker", hasSubMenu: false, callback: function() {
                                selectedBlocker=-1;
                                requestServer({c: "removePolyBlocker", id: currentPolyBlocker.id});
                                
                            }}
                        ];
                        displayMenu(e, menuOptions);
                    });
                }
                else
                    newPolygon.style.pointerEvents = "none";
            }
            else
            {
                if (!mapData.antiBlockerOn && !currentPolyBlocker.inactive)
                    antiBlockerContext.fill();
                if (currentPolyBlocker.inactive)
                    return;
                if (!mapData.antiBlockerOn)
                {
                    newPolygon.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                    });

                    draggableElement(newPolygon, false, function(e) {
                        isPanning = true;
                        oldMousePos.x = (e.pageX/(1+extraZoom/20));
                        oldMousePos.y = (e.pageY/(1+extraZoom/20));
                        oldScrollPos.x = viewport.scrollLeft;
                        oldScrollPos.y = viewport.scrollTop;
                        document.body.style.cursor = "grabbing";
                        drawCanvas();
                    })
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
            if (!mapData.antiBlockerOn)
            {
                antiBlockerContext.beginPath();
                antiBlockerContext.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
                antiBlockerContext.fillRect(currentBlocker.x, currentBlocker.y, currentBlocker.width, currentBlocker.height);
            }
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
                    });

                    tmpBlocker.addEventListener("contextmenu", function(e) {
                        e.preventDefault();
                        selectedBlocker = currentBlocker.id;
                        selectedToken = -1;
                        updateHighlightedBlocker()
                        let menuOptions = [
                            {text: "Remove blocker", hasSubMenu: false, callback: function() {
                                selectedBlocker=-1;
                                requestServer({c: "removeBlocker", id: currentBlocker.id});
                                
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
            blocker.style.zIndex = blocker.getAttribute("blockerid")==selectedBlocker ? reverse?1001:1002 : reverse?1002:1001;
        }
        else
        {
            blocker.style.zIndex = null;
            blocker.style.outline = "";
        }
    }
}

function drawAntiBlocker() {
    if (mapData.blockerType == 0)
    {
        antiBlockerContext.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
        antiBlockerContext.fillRect(0, 0, mapImage.clientWidth, mapImage.clientHeight);
        antiBlockerContext.globalCompositeOperation = "destination-out";
        for (let blocker of mapData.blockers)
        {
            antiBlockerContext.fillStyle = "#FFFFFFFF";
            antiBlockerContext.fillRect(blocker.x, blocker.y, blocker.width, blocker.height);
        }
        antiBlockerContext.globalCompositeOperation = "source-over";
    }
    
    if (mapData.blockerType == 1)
    {
        antiBlockerContext.fillStyle = document.body.style.getPropertyValue("--antiBlocker-color");
        antiBlockerContext.fillRect(0, 0, mapImage.clientWidth, mapImage.clientHeight);
        antiBlockerContext.globalCompositeOperation = "destination-out";
        for (let polyBlocker of mapData.polyBlockers)
        {
            if (polyBlocker.inactive)
                continue;
            antiBlockerContext.beginPath();
            antiBlockerContext.fillStyle = "#FFFFFFFF";
            antiBlockerContext.moveTo(polyBlocker.verts[0].x, polyBlocker.verts[0].y);
            for (let vert of polyBlocker.verts)
                antiBlockerContext.lineTo(vert.x, vert.y);
            antiBlockerContext.fill();
        }
        antiBlockerContext.globalCompositeOperation = "source-over";
    }
}

function drawGrid()
{
    gridCanvas.save();
    let bigBox = Math.sqrt(Math.pow(mapImage.clientWidth, 2) + Math.pow(mapImage.clientHeight, 2));
    for (let x = -Math.round(bigBox/gridSize.x); x <= Math.round(bigBox/gridSize.x); x++)
    {
        gridCanvas.moveTo(x * gridSize.x + offsetX + 0.5, -bigBox);
        gridCanvas.lineTo(x * gridSize.x + offsetX + 0.5, bigBox);
    }    
    for (let y = -Math.round(bigBox/gridSize.y); y <= Math.round(bigBox/gridSize.y); y++)
    {
        gridCanvas.moveTo(-bigBox, y * gridSize.y + offsetY + 0.5);
        gridCanvas.lineTo(bigBox, y * gridSize.y + offsetY + 0.5);
    }
    gridCanvas.stroke();
    gridCanvas.restore();
}

function LoadTokenData(token, force) {
    if (CheckTokenPermission(token))
    {
        notesTargetToken = token.id;
        detailsIcon.src = mapData.tokenList.includes(token.image)?"public/tokens/" + token.image:mapData.dmTokenList.includes(token.image)?"public/dmTokens/" + token.image:"public/blankToken.png";

        notesHeader.innerText = "Notes: "+(token.name?token.name:"token "+token.id.toString());

        if (document.activeElement!=nameInput || force)
            nameInput.value = token.name?token.name:"";
    
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
            statusInput.value = token.status?token.status:"";
        
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
        notesHeader.innerText = "Notes";
        DetailsToggleButtonsUpdate(false, false);
    }
}

function drawTokens() 
{
    tokensDiv.innerHTML = "";
    for (let token of mapData.tokens)
    {
        if (!token.hidden || (isDM && !playerMode))
        {
            if (token.id == selectedToken)
                LoadTokenData(token);
            let imageElement = document.createElement("img");
            imageElement.src = mapData.tokenList.includes(token.image)?"public/tokens/" + token.image:mapData.dmTokenList.includes(token.image)?"public/dmTokens/" + token.image:"public/blankToken.png";
            imageElement.className = "token";
            imageElement.style.top = token.y - (gridSize.y * token.size) / 2 + "px";
            imageElement.style.left = token.x - (gridSize.x * token.size) / 2 + "px";
            imageElement.style.width = (token.size * gridSize.x-GridLineWidth).toString() + "px";
            imageElement.style.height = (token.size * gridSize.y-GridLineWidth).toString() + "px";
            imageElement.style.zIndex = (Math.floor(token.objectLock ? token.layer * 5 : token.layer*10) + baseTokenIndex).toString();
            if (token.rotation && token.objectLock)
                imageElement.style.transform = "rotate("+token.rotation.toString()+"deg)";

            if (isPlacingCone || isPlacingLine || isPlacingSquare)
                imageElement.style.pointerEvents = "none";
            imageElement.setAttribute("tokenid", token.id);

            imageElement.title = token.status;
            let hiddenImage;
            if (token.hidden)
            {
                hiddenImage = document.createElement("img");
                hiddenImage.src = "images/hidden.png";
                hiddenImage.className = "hiddenToken";
                hiddenImage.style.width = ((token.size * gridSize.x-GridLineWidth) / 3).toString() + "px";
                hiddenImage.style.height = ((token.size * gridSize.y-GridLineWidth) / 3).toString() + "px";
                hiddenImage.style.top = token.y - (gridSize.y * token.size) / 2 + "px";
                hiddenImage.style.left = token.x - (gridSize.x * token.size) / 2  + "px";
                hiddenImage.style.zIndex = (Math.floor(token.layer*10) + baseTokenIndex + 1).toString();
                tokensDiv.appendChild(hiddenImage);
            }    
            
            let concentratingIcon;
            if (token.concentrating)
            {
                if (!token.dm || (isDM&&!playerMode))
                {
                    concentratingIcon = document.createElement("img");
                    concentratingIcon.className = "concentratingText";
                    concentratingIcon.src = "images/literally_copyright.png";
                    tokensDiv.appendChild(concentratingIcon);
                    concentratingIcon.style.width = ((token.size * gridSize.x-GridLineWidth) / 3).toString() + "px";
                    concentratingIcon.style.height = ((token.size * gridSize.y-GridLineWidth) / 3).toString() + "px";
                    concentratingIcon.style.top = token.y + (gridSize.y * token.size) / 2 - concentratingIcon.offsetHeight + "px";
                    concentratingIcon.style.left = token.x - (gridSize.x * token.size) / 2 + "px";
                    concentratingIcon.style.zIndex = (Math.floor(token.layer*10) + baseTokenIndex + 1).toString();
                }
            }
    
            imageElement.addEventListener("mousemove", function(e) {
                if (isPanning)
                {
                    viewport.scrollLeft = oldScrollPos.x - ((e.pageX/(1+extraZoom/20)) - oldMousePos.x);
                    viewport.scrollTop = oldScrollPos.y - ((e.pageY/(1+extraZoom/20)) - oldMousePos.y);
                }
            })

            imageElement.addEventListener("dragover", function(e) {
                e.preventDefault();
            })
            
            if (isDraggingBlocker || quickPolyBlockerMode)
                imageElement.style.pointerEvents = "none";
    
            tokensDiv.appendChild(imageElement);
    
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
                                        circleMarkers.radius = (radiusInput + (feetPerSquare / 2) * token.size) / feetPerSquare;
                                        requestServer({c: "addDrawing", shape: "circle", link: token.id, x: token.x, y: token.y, radius: circleMarkers.radius, trueColor: shapeColor, visible: isDM ? confirm("Should the shape be visible?") : true});
                                        
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
                            {text: "Delete token", hasSubMenu: false, callback: function() {
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
                                requestServer({c: "removeToken", id: token.id, tokensRemoved: mapData.removedTokens});
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
                                            if (tokenSize < 49 && tokenSize > 0)
                                                requestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: 50 - tokenSize, group: token.group, viewRange: token.viewRange ? token.viewRange + (token.size - tokenSize)*5 : null});
                                            else
                                                alert("The desired size is too large or invalid");
                                        }
                                        else
                                        {
                                            if (tokenSize < 6 && tokenSize > 0)
                                                requestServer({c:"editToken", id: token.id, size: tokenSize, status: token.status, layer: 50 - tokenSize, group: token.group, viewRange: token.viewRange ? token.viewRange + (token.size - tokenSize)*5 : null});
                                            else
                                                alert("That token size isn't allowed for players");
                                        }   
                                        
                                    }
                                }},
                                {text: "Change layer", callback: function() {
                                    let newLayer = parseInt(prompt("Please enter the new layer", token.layer));
                                    if (!isNaN(newLayer) && newLayer>=0 && newLayer<499)
                                    {
                                        requestServer({c:"editToken", id: token.id, size: token.size, status: token.status, layer: newLayer, group: token.group});
                                        
                                    }
                                    else
                                    {
                                        alert("Layer must be > 10 and < 500 ");
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
                                        
                                    }
                                }});
                            }
                            if (isDM)
                            {
                                subMenuOptions.push({text: "Toggle DM only", callback: function() {
                                    requestServer({c:"editToken", id: token.id, dm: !token.dm});
                                }});
                                if (mapData.blockerType == 2)
                                {
                                    subMenuOptions.push({text: "View radius", callback: function() {
                                        let newRange = parseFloat(prompt("Please enter the new view range (in feet)", !isNaN(parseFloat(token.viewRange)) ? parseFloat(token.viewRange)-(feetPerSquare/2)*token.size : 10)) + (feetPerSquare/2)*token.size;
                                        if (!isNaN(newRange))
                                        {
                                            requestServer({c:"editToken", id: token.id, viewRange: newRange});
                                            
                                        }
                                    }});
                                }
                            }
                            displaySubMenu(e, subMenuOptions);
                        }});
    
                        menuOptions.push({text: "Change image", hasSubMenu: true, callback: function() {
                            let subMenu = [];
                            subMenu.push({text: "Text", callback: function() {
                                requestServer({c: "editToken", id: token.id, image: "", text: token.text?token.text:"Text"});
                                
                            }});
                            for (let image of mapData.tokenList)
                            {
                                subMenu.push({text: image.substring(0, image.length - 4), callback: function() {
                                    requestServer({c: "editToken", id: token.id, image: image});
                                    
                                }});
                            }
                            if (isDM)
                            {
                                for (let image of mapData.dmTokenList)
                                {
                                    subMenu.push({text: image.substring(0, image.length - 4), callback: function() {
                                        requestServer({c: "editToken", id: token.id, image: image});
                                        
                                    }});
                                }
                            }
                            displaySubMenu(e, subMenu);
                        }});
                        
                        //TODO Reimplement token duplication
                        /*
                        menuOptions.push({text: "Duplicate token", hasSubMenu: false, callback: function() {
                            let tokenDupeCommand = JSON.parse(JSON.stringify(token));
                            delete tokenDupeCommand.id;
                            tokenDupeCommand.c = 'createToken';
                            tokenDupeCommand.x += 10;
                            let newId = parseInt(requestServer(tokenDupeCommand));
                            for (let drawing of mapData.drawings)
                            {
                                if (drawing.link == token.id)
                                {
                                    let drawingDupeCommand = JSON.parse(JSON.stringify(drawing));
                                    delete drawingDupeCommand.id;
                                    drawingDupeCommand.c = 'addDrawing';
                                    drawingDupeCommand.link = newId;
                                    requestServer(drawingDupeCommand);
                                }
                            }
                            
                        }});*/
    
                        if (token.group != null)
                        {
                            menuOptions.push({text: "Group options", hasSubMenu: true, callback: function() {
                                let subMenuOptions = [
                                    {text: "Rotate left 90°", callback: function() {
                                        requestServer({c:"rotateDeg", id: token.id, angle: 90});
                                        
                                    }},
                                    {text: "Rotate right 90°", callback: function() {
                                        requestServer({c:"rotateDeg", id: token.id, angle: -90});
                                        
                                    }},
                                    {text: "Rotate 180°", callback: function() {
                                        requestServer({c:"rotateDeg", id: token.id, angle: 180});
                                        
                                    }},
                                    {text: "Rotate by °", callback: function() {
                                        let Angle = parseFloat(prompt("Enter the amount of degrees to rotate the group by:"));
                                        if (!isNaN(Angle))
                                        {
                                            requestServer({c:"rotateDeg", id: token.id, angle: Angle});
                                            
                                        }
                                    }}
                                ];
                                if (isDM)
                                {
                                    subMenuOptions.push({text: "Hide tokens", callback: function() {
                                        for (let tmpToken of mapData.tokens)
                                        {
                                            if (tmpToken.group == token.group)
                                                requestServer({c:"setTokenHidden", id: tmpToken.id, hidden: true});
                                        }
                                        
                                    }})
                                    subMenuOptions.push({text: "Reveal tokens", callback: function() {
                                        for (let tmpToken of mapData.tokens)
                                        {
                                            if (tmpToken.group == token.group)
                                                requestServer({c:"setTokenHidden", id: tmpToken.id, hidden: false});
                                        }
                                        
                                    }})
                                    subMenuOptions.push({text: "Hide trackers", callback: function() {
                                        for (let tmpToken of mapData.tokens)
                                        {
                                            if (tmpToken.group == token.group)
                                                requestServer({c:"editToken", id: tmpToken.id, hideTracker: true});
                                        }
                                        
                                    }})
                                    subMenuOptions.push({text: "Show trackers", callback: function() {
                                        for (let tmpToken of mapData.tokens)
                                        {
                                            if (tmpToken.group == token.group)
                                                requestServer({c:"editToken", id: tmpToken.id, hideTracker: false});
                                        }
                                        
                                    }})
                                    subMenuOptions.push({text: "Toggle DM only", callback: function() {
                                        for (let tmpToken of mapData.tokens)
                                        {
                                            if (tmpToken.group == token.group)
                                                requestServer({c:"editToken", id: tmpToken.id, dm: !token.dm});
                                        }
                                        
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
                            menuOptions.push({text: "Reveal token", hasSubMenu: false, callback: function() {
                                requestServer({c: "setTokenHidden", id: token.id, hidden: false});
                                
                            }})
                        }
                        else
                        {
                            menuOptions.push({text: "Hide token", hasSubMenu: false, callback: function() {
                                requestServer({c: "setTokenHidden", id: token.id, hidden: true});
                                
                            }})
                        }
                    }
                    displayMenu(e, menuOptions);
                }
            })

            draggableElement(imageElement, true,
                function(e) {
                    if (!isPanning && (!token.objectLock || (e.ctrlKey || e.metaKey)))
                    {
                        detailsScreen.style.display = "grid";
                        selectedToken = token.id;
                        selectedBlocker = -1;
                        selectedShapeId = -1;
                        LoadTokenData(token, true);
                        if (e.ctrlKey || e.metaKey)
                            controlPressed = true;
                        updateHighlightedToken();
                        updateHighlightedBlocker();
                        updateTrackerHighlight();
                        imageElement.style.opacity = "0.7";
                        board.appendChild(imageElement);
                        if (concentratingIcon) {
                            concentratingIcon.style.opacity = "0.7";
                            board.appendChild(concentratingIcon);
                        }   
                        if (textHolder) {
                            textHolder.style.opacity = "0.7";
                            board.appendChild(textHolder);
                        }
                        if (hiddenImage) {
                            hiddenImage.style.opacity = "0.7";
                            board.appendChild(hiddenImage);
                        }
                        drawTokens();
                        isPanning = false;
                    }
                    else
                    {
                        isPanning = true;
                        oldMousePos.x = e.pageX;
                        oldMousePos.y = e.pageY;
                        oldScrollPos.x = viewport.scrollLeft;
                        oldScrollPos.y = viewport.scrollTop;
                        document.body.style.cursor = "grabbing";
                        drawCanvas();
                    }
                },
                function(e, offset) {
                    if (!isPanning && (!token.objectLock || (e.ctrlKey || e.metaKey)))
                    {
                        if (GridSnap)
                        {
                            let tX;
                            let tY;
                            if (token.size >= 1)
                            {
                                tX = Math.round(((e.pageX + viewport.scrollLeft)/(1+extraZoom/20) - offset.x + (token.size * gridSize.x)/2 - mapData.offsetX - 0.5 * gridSize.x * token.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * token.size + offsetX + GridLineWidth;
                                tY = Math.round(((e.pageY + viewport.scrollTop)/(1+extraZoom/20) - offset.y + (token.size * gridSize.x)/2 - mapData.offsetY - 0.5 * gridSize.y * token.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * token.size + offsetY + GridLineWidth;
                            }
                            else
                            {
                                tX = Math.round(((e.pageX + viewport.scrollLeft)/(1+extraZoom/20) - mapData.offsetX - 0.5 * gridSize.x * token.size) / (gridSize.x * token.size)) * (gridSize.x * token.size) + 0.5 * gridSize.x * token.size + offsetX + GridLineWidth;
                                tY = Math.round(((e.pageY + viewport.scrollTop)/(1+extraZoom/20) - mapData.offsetY - 0.5 * gridSize.y * token.size) / (gridSize.y * token.size)) * (gridSize.y * token.size) + 0.5 * gridSize.y * token.size + offsetY + GridLineWidth;
                            }
                            
                            if ((tX!= token.x || tY != token.y) && (CheckAntiBlockerPixelPosition(tX, tY) || (isDM&&!playerMode)) && (tX < mapImage.offsetWidth && tY < mapImage.offsetHeight) && tX>0 && tY>0)
                                requestServer({c: "moveToken", id: token.id, x: tX, y: tY, bypassLink: !controlPressed});
                            else
                                drawTokens();
                        }
                        else
                        {
                            let tempx = (e.pageX + viewport.scrollLeft)/(1+extraZoom/20) - offset.x + (token.size * gridSize.x)/2;
                            let tempy = (e.pageY + viewport.scrollTop)/(1+extraZoom/20) - offset.y + (token.size * gridSize.y)/2;
                            if ((tempx != token.x || tempy != token.y) && (CheckAntiBlockerPixelPosition(tempx, tempy) || (isDM&&!playerMode)) && (tempx < mapImage.offsetWidth && tempy < mapImage.offsetHeight))
                                requestServer({c: "moveToken", id: token.id, x: tempx, y: tempy, bypassLink: !controlPressed});
                            else
                                drawTokens();
                        }
                        try {
                            if (concentratingIcon)
                                board.removeChild(concentratingIcon);
                            if (textHolder)
                                board.removeChild(textHolder);
                            if (hiddenImage)
                                board.removeChild(hiddenImage);
                            board.removeChild(imageElement);
                        }
                        catch(err) {console.log("Something went wrong!", err);}
                    }
                    controlPressed = false;
                },
                function(e, offset) {
                    if (token.concentrating) {
                        concentratingIcon.style.top = imageElement.offsetTop + imageElement.offsetHeight/2 + (gridSize.y * token.size) / 2 - concentratingIcon.offsetHeight + "px";
                        concentratingIcon.style.left = imageElement.offsetLeft + imageElement.offsetWidth/2 - (gridSize.x * token.size) / 2 + "px";
                    }

                    if (token.hidden) {
                        hiddenImage.style.top = imageElement.offsetTop + imageElement.offsetHeight/2 - (gridSize.y * token.size) / 2 + "px";
                        hiddenImage.style.left = imageElement.offsetLeft + imageElement.offsetWidth/2 - (gridSize.x * token.size) / 2  + "px";
                    }

                    if (!token.image) {
                        textHolder.style.left = (imageElement.offsetLeft + imageElement.offsetWidth/2 - 0.4*token.size*gridSize.x).toString() + "px";
                        textHolder.style.top = (imageElement.offsetTop + imageElement.offsetHeight/2 - 0.25*token.size*gridSize.y).toString() + "px";
                    }

                }, (!isDM || playerMode), function(value, e) {
                    value[0] = !isPanning && (!token.objectLock || (e.ctrlKey || e.metaKey));
                }
            );

            let textHolder;
            if (!token.image)
            {
                textHolder = document.createElement("div");
                textHolder.style.zIndex = parseInt(imageElement.style.zIndex);
                textHolder.style.left = (token.x - 0.4*token.size*gridSize.x).toString() + "px";
                textHolder.style.top = (token.y - 0.25*token.size*gridSize.y).toString() + "px";
                textHolder.style.width = ((token.size*gridSize.x-2*GridLineWidth)*0.8).toString() + "px";
                textHolder.style.height = ((token.size*gridSize.y-2*GridLineWidth)*0.5).toString() + "px";
                textHolder.style.lineHeight = ((token.size*gridSize.y-2*GridLineWidth)*0.5).toString() + "px";
                textHolder.style.pointerEvents = "none";
                textHolder.style.position = "absolute";
                textHolder.style.display = "flex";
                let textElement = document.createElement("a");
                textElement.innerText = token.text;
                textElement.style.height = "100%";
                textElement.style.whiteSpace = "nowrap";
                textElement.style.fontSize = "10px";
                textElement.style.transform = "translate(-50%, -50%);";
                textElement.style.userSelect = "none";
                textElement.style.textAlign = "center";
                imageElement.addEventListener("dragcancel", () => {
                    textHolder.parentElement.removeChild(textHolder);
                })
                textHolder.appendChild(textElement);
                tokensDiv.appendChild(textHolder);
                let autoCalcSize = parseInt(textElement.style.fontSize.substr(0, textElement.style.fontSize.length-2)) * (textHolder.getBoundingClientRect().width/textElement.getBoundingClientRect().width);
                if (autoCalcSize < 0.8*imageElement.getBoundingClientRect().width)
                    textElement.style.fontSize = autoCalcSize;
                else
                    textElement.style.fontSize = 0.8*imageElement.getBoundingClientRect().width;
                textElement.style.width = (token.size*gridSize.x*0.8).toString() + "px";
            }
        }
    }
    updateHighlightedToken();
}

function updateHighlightedToken() {
    if (selectedToken!=null)
        for (let token of tokensDiv.children)
            token.style.outline = token.getAttribute("tokenid")==selectedToken?"0.15vw dashed aqua":"";
} 

let previousInitiativeTrackerScrollPosition = 0;
function updateTracker(force)
{
    if (oldParsedData && !force)
    {
        if (JSON.stringify(oldParsedData.tokens) == JSON.stringify(mapData.tokens))
            return;
    }
    else
    {
        console.log("No old data or forced update!");
    }
    previousInitiativeTrackerScrollPosition = initiativeTrackerDiv.scrollTop;
    initiativeTrackerDiv.innerHTML = "";
    for (let [i, token] of mapData.tokens.entries())
    {
        if (CheckTokenPermission(token) && !token.hideTracker)
        {
            if (initSearch.value!="") {
                if (token.name ? (token.name.toLowerCase().includes(initSearch.value.toLowerCase()) || !token.dm) : false)
                    createTracker(token, i);
                continue;
            }
            createTracker(token, i);
            
        }
    }
    initiativeTrackerDiv.scrollTop = previousInitiativeTrackerScrollPosition;
}

let isDraggingTracker = false;
function createTracker(trackerData, index)
{
    if (trackerData.initiative == null && trackerData.name == null && trackerData.ac == null && trackerData.hp == null)
        return;
    let initiativeItem = document.createElement("div");
    initiativeItem.className = "initiativeItem";
    initiativeItem.draggable = "true";
    initiativeItem.addEventListener("drop", function(e) {
        if (isDraggingTracker)
        {
            if (e.dataTransfer.getData("trackerId")!=index)
                requestServer({c: "switchTrackerPosition", origin: e.dataTransfer.getData("trackerId"), target: index});
            
            isDraggingTracker = false;
        }
    });
    initiativeItem.addEventListener("dblclick", function() {
        viewport.scrollLeft = ((trackerData.x)/(1+extraZoom/20))-window.innerWidth*0.5+0.5*trackerData.size*gridSize.x;
        viewport.scrollTop = ((trackerData.y)/(1+extraZoom/20))-window.innerHeight*0.5+0.5*trackerData.size*gridSize.y;
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
        let initiativeDiv = document.createElement("div");
        initiativeDiv.className = "initiative";
        initiativeDiv.innerText = trackerData.initiative ? Math.floor(trackerData.initiative) : "";
        initiativeItem.append(initiativeDiv);
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
            trackerDamageButton.onclick = function(e)
            {
                e.preventDefault();
                e.stopPropagation();
                let damage = parseInt(prompt("Enter the damage to deal to this token: "));
                if (!isNaN(damage))
                {
                    if (trackerData.hp != null)
                    {
                        requestServer({c: "editToken", id: trackerData.id, hp: (trackerData.hp.split("/")[0] - damage).toString() + "/" + trackerData.hp.split("/")[1]});
                        
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
    if (displayMapSettings)
        document.getElementById("toggleSettingsButton").click();
    colorPicker.style.display = "none";
    bulkInitGeneratorScreen.style.display = (bulkInitGeneratorScreen.style.display=="none" || bulkInitGeneratorScreen.style.display=="")?"block":"none";
}

document.getElementById("sortTracker").onclick = function() { requestServer({c:"sortTracker"}); }

initSearch.oninput = function() { updateTracker(true); }

trackerScaleSlider.oninput = function() {
    document.body.style.setProperty("--tracker-scale", (trackerScaleSlider.value/100).toString());
    updateTrackerHighlight();
    setCookie("trackerScale", trackerScaleSlider.value/100);
}

document.getElementById("setScaleToOneLine").onclick = function() {
    let tmpSideMenuWidthText = getComputedStyle(document.body).getPropertyValue("--sidemenu-width");
    let tmpSideMenuWidth = parseFloat(tmpSideMenuWidthText.substr(0, tmpSideMenuWidthText.length-2))/21.1;
    tmpSideMenuWidth = min(trackerScaleSlider.min/100, max(trackerScaleSlider.max/100, tmpSideMenuWidth));
    document.body.style.setProperty("--tracker-scale", (tmpSideMenuWidth).toString());
    trackerScaleSlider.value = tmpSideMenuWidth*100;
    updateTrackerHighlight();
}

bulkTokenConfirm.onclick = function() {
    let tokensToPlace = parseInt(bulkTokenAmountInput.value);
    if (isNaN(tokensToPlace) || tokensToPlace<1) {
        alert("The settings of the bulk initiative generator aren't valid");
        return;
    }
    let tokenSizes = parseFloat(prompt("Enter the size of the new tokens"));
    if (isNaN(tokenSizes)) {
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
    drawCanvas();
    updateButtonColors();
}

document.getElementById("toggleSnapButton").onclick = function() {
    GridSnap = !GridSnap;
    updateButtonColors();
}

quickPolyButton.onclick = function() {
    if (isDM) {
        if (quickPolyBlockerMode) {
            if(confirm("Add the new blocker?") && newPolyBlockerVerts.length>2)
                requestServer({c: "addCustomPolyBlocker", newPolyBlockerVerts: JSON.stringify(newPolyBlockerVerts)});
            quickPolyBlockerMode = false;
            newPolyBlockerVerts = [];
            DrawNewPolyMarkers();
        } else {
            quickPolyBlockerMode = true;
            drawCanvas();
        }
    }
    updateButtonColors();
}

let displayMapSettings = false;
let mapOptionsMenu = document.getElementById("mapOptionsMenu");
document.getElementById("toggleSettingsButton").onclick = function() {
    if (isDM) {
        bulkInitGeneratorScreen.style.display = "none";
        colorPicker.style.display = "none";
        mapOptionsMenu.style.display = displayMapSettings ? "none": "flex";
        displayMapSettings =! displayMapSettings;
    }
    updateButtonColors();
}

colorPickerButton.onclick = function() {
    if (displayMapSettings)
        document.getElementById("toggleSettingsButton").click();
    bulkInitGeneratorScreen.style.display = "none";
    colorPicker.style.display = (colorPicker.style.display=="block") ? "none" : "block";
}

document.getElementById("toggleBlockerEditing").onclick = function() {
    blockerEditMode = !blockerEditMode;
    updateButtonColors();
}

detailsIcon.onclick = function() {
    notesTargetToken = selectedToken;
    noteEditor.style.display = (noteEditor.style.display=="none") ? "flex" : "none";
}

closeNotesButton.onclick = detailsIcon.onclick;
//#endregion

//#region Color picker
let colorPicker = document.getElementById("color_picker");
let colorPickerPreview = document.getElementById("shapeColorPicker");
let redSlider = document.getElementById("redSlider");
let greenSlider = document.getElementById("greenSlider");
let blueSlider = document.getElementById("blueSlider");
let opacitySlider = document.getElementById("opacitySlider");
redSlider.oninput = updateColorPreview;
greenSlider.oninput = updateColorPreview;
blueSlider.oninput = updateColorPreview;
opacitySlider.oninput = updateColorPreview;

redSlider.oninput = updateColor;
greenSlider.onchange = updateColor;
blueSlider.onchange = updateColor;
opacitySlider.onchange = updateColor;

function componentToHex(c, isAlpha) {
    if (isAlpha)
        c = parseInt(c*255);
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbaToHex(r, g, b, a) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a, true);
}

function hexToRgba(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseInt(result[4], 16)
    } : null;
}

function setColor(hexValue) {
    shapeColor = hexValue;
    let components = hexToRgba(hexValue);
    redSlider.value = components.r;
    greenSlider.value = components.g;
    blueSlider.value = components.b;
    opacitySlider.value = components.a/255;
    colorPickerPreview.style.backgroundColor = "rgba("+redSlider.value+","+greenSlider.value+","+blueSlider.value+","+opacitySlider.value+")";
}

function updateColorPreview() {
    colorPickerPreview.style.backgroundColor = "rgba("+redSlider.value+","+greenSlider.value+","+blueSlider.value+","+opacitySlider.value+")";
}

function updateColor() {
    shapeColor = rgbaToHex(parseInt(redSlider.value), parseInt(greenSlider.value), parseInt(blueSlider.value), parseFloat(opacitySlider.value));
    colorPickerPreview.style.backgroundColor = "rgba("+redSlider.value+","+greenSlider.value+","+blueSlider.value+","+opacitySlider.value+")";
    setCookie("shapeColor", shapeColor);
}
//#endregion

//#region Details menu
hpIcon.onclick = function() {
    updateSelectedTokenData();
    let damage = parseInt(prompt("Enter the damage to deal to this token: "));
    if (isNaN(damage) || selectedTokenData.hp == null)
        return;
    requestServer({c: "editToken", id: selectedToken, hp: (selectedTokenData.hp.split("/")[0] - damage).toString() + "/" + selectedTokenData.hp.split("/")[1]});
}

let notesTargetToken = -1;
let noteData;
noteArea.oninput = function() {
    for (let token of mapData.tokens)
        if (token.id == notesTargetToken)
            noteData = token;
    if (CheckTokenPermission(noteData))
        requestServer({c: "editToken", id: notesTargetToken, notes: noteArea.value});
    
}

initiativeInput.oninput = function() {
    updateSelectedTokenData();
    let newInit = parseFloat(initiativeInput.value);
    if (CheckTokenPermission(selectedTokenData))
        requestServer({c: "editToken", id: selectedToken, initiative: !isNaN(newInit) ? newInit : ""});
    
}

nameInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        requestServer({c: "editToken", id: selectedToken, name: nameInput.value});
    
}

acInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        requestServer({c: "editToken", id: selectedToken, ac: acInput.value});  
    
}

currentHpInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        requestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value + "/" + maxHpInput.value});
    
}

maxHpInput.oninput = function() {
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        requestServer({c: "editToken", id: selectedToken, hp: currentHpInput.value + "/" + maxHpInput.value});
    
}

statusInput.oninput = function() {
    updateSelectedTokenData();
    requestServer({c:"editToken", id: selectedToken, status: statusInput.value});
    
}

groupIdInput.oninput = function() {
    let newGroupId = parseInt(groupIdInput.value);
    updateSelectedTokenData();
    if (CheckTokenPermission(selectedTokenData))
        requestServer({c:"editToken", id: selectedToken, group: newGroupId ? newGroupId : ""});
    
}

hideTrackerInput.onclick = function() {
    updateSelectedTokenData();
    requestServer({c:"editToken", id: selectedToken, hideTracker: !selectedTokenData.hideTracker});
    
}

concentratingInput.onclick = function() {
    updateSelectedTokenData();
    requestServer({c:"editToken", id: selectedToken, concentrating: !selectedTokenData.concentrating});
    
}
//#endregion

//#region DM Menu
document.getElementById("clearTokensButton").onclick = function() {
    if (confirm("Do you really want to remove all the tokens?") && isDM)
        requestServer({c:"clearTokens"});
}

document.getElementById("clearDrawingsButton").onclick = function() {
    if (confirm("Do you really want to remove all the drawings?") && isDM)
        requestServer({c:"clearDrawings"});
}

document.getElementById("clearBlockersButton").onclick = function() {
    if (confirm("Do you really want to remove all the blockers?") && isDM)
        requestServer({c:"clearBlockers"});
}

blockerTypeSelect.onchange = function() {
    if (confirm("Are you sure you want to switch blocker types?") && isDM)
    {
        quickPolyBlockerMode = false;
        quickPolyButton.style.display = blockerTypeSelect.value == 1 ? "" : "none";
        requestServer({c:"switchBlockerType", type: blockerTypeSelect.value});
    }
}

document.getElementById("invertBlockerButton").onclick = function() {
    if (confirm("Do you really want to invert the blockers?") && isDM)
        requestServer({c: "invertBlockers"});
}

document.getElementById("togglePlayerMode").onclick = function() {
    playerMode = !playerMode;
    shapeMap.style.zIndex = playerMode ? "" : 941;
    baseTokenIndex = playerMode ? 0 : 500;
    drawCanvas();
}

document.getElementById("startAlignTool").onclick = function() {
    alignToolStep = 1;
    alert("Click on a intersection in the top left of the pre-existing grid.");
}
//#endregion

//#region Main event handlers
function CheckAntiBlockerPixel(e) {
    if (mapData.antiBlockerOn || mapData.blockerType == 2) {
        return antiBlockerContext.getImageData(Math.round((e.pageX + viewport.scrollLeft)/(1+extraZoom/20)), Math.round((e.pageY + viewport.scrollTop)/(1+extraZoom/20)), 1, 1).data[3] == 0;
    }
    return true;
}

function CheckAntiBlockerPixelPosition(x, y) {
    let pixel = antiBlockerContext.getImageData(x, y, 1, 1).data;
    return pixel[3] == 0;
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
            return isDM || mapData.tokenList.includes(token.image);
    }
}

function DrawNewPolyMarkers(activateMousedown) {
    newPolyBlockerHandles.innerHTML = "";
    for (let [j, vert] of newPolyBlockerVerts.entries())
    {
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

        draggableElement(editHandleContainer, true, null, function(e) {
            if (((e.pageX + viewport.scrollLeft)/(1+extraZoom/20))!=vert.x && ((e.pageY + viewport.scrollTop)/(1+extraZoom/20))!=vert.y)
            {
                vert.x = (e.pageX + viewport.scrollLeft)/(1+extraZoom/20);
                vert.y = (e.pageY + viewport.scrollTop)/(1+extraZoom/20);
                DrawNewPolyMarkers();
            }
        })

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

window.addEventListener("mousedown", function(e) {
    if (e.button == 1) {
        e.preventDefault();
        if (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))>0 && ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))<mapImage.clientWidth && ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))>0 && ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))<mapImage.clientHeight)
            requestServer({c: "requestPing", pingX: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), pingY: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))});
    }
});

window.addEventListener("mouseup", function(e) {
    if (e.button == 0)
    {
        document.body.style.cursor = "";
        isPanning = false;
        draggingNotes = false;
        if (resizingSideMenu && !sideMenuIsHidden)
        {
            let calcWidth = (window.innerWidth - e.pageX) / window.innerWidth * 100 - 1.8;
            calcWidth = calcWidth < 12 ? 12 : calcWidth;
            calcWidth = calcWidth > 50 ? 50 : calcWidth;
            let newWidth = (calcWidth).toString() + "vw";
            console.log("terst");
            if (newWidth != getCookie("sideMenuWidth", newWidth))
            { 
                document.body.style.setProperty("--sidemenu-width", newWidth);
                setCookie("sideMenuWidth", newWidth);
                resizingSideMenu = false;
                bulkInitGeneratorScreen.style.right = (calcWidth + 2).toString() + "vw";
                updateTrackerHighlight();
            }
            else
                resizingSideMenu = false;
            return;
        }

        if (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))>0 && ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20))<mapImage.clientWidth && ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))>0 && ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20))<mapImage.clientHeight)
        {
            if (isMovingShape)
            {
                isMovingShape = false;
                document.body.style.cursor = "default";
                if (CheckAntiBlockerPixelPosition(((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + shapeDragOffset.x, ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) + shapeDragOffset.y) || (isDM&&!playerMode))
                {
                    requestServer({c: "editDrawing", id: movingShapeId, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + shapeDragOffset.x, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) + shapeDragOffset.y, both: true, moveShapeGroup: (e.ctrlKey || e.metaKey)});
                }
                
                return;
            }

            if (isMovingCone)
            {
                isMovingCone = false;
                document.body.style.cursor = "default";
                let angle = mapData.drawings[movingShapeId].angle + (Math.atan2((((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - shapeDragOffset.y), (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - shapeDragOffset.x)) - shapeDragStartAngle);
                if (angle<0)
                    angle+=2*Math.PI;
                requestServer({c: "editDrawing", id: movingShapeId, angle: angle});
                
                return;
            }

            if (isMoving5ftLine)
            {
                isMoving5ftLine = false;
                document.body.style.cursor = "default";
                let angle = mapData.drawings[movingShapeId].angle + (Math.atan2((((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) - shapeDragOffset.y), (((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) - shapeDragOffset.x)) - shapeDragStartAngle);
                if (angle<0)
                    angle+=2*Math.PI;
                requestServer({c: "editDrawing", id: movingShapeId, angle: angle});
                
                return;
            }
        }
        else
        {
            document.body.style.cursor = "default";
            isMovingShape = false;
            isMovingCone = false;
            isMoving5ftLine = false;
            return;
        }
    }
});

document.body.addEventListener("keydown", function(e) {
    if ((e.code.includes("Numpad") && document.activeElement.tagName!="INPUT" && document.activeElement.tagName!="TEXTAREA") || (e.code.includes("Numpad") && isNaN(parseInt(e.key))))
        e.preventDefault();
    
    if (e.ctrlKey || e.metaKey)
    {
        switch(e.code)
        {
            case "Digit0":
                extraZoom = 0;
                break;
            case "Minus":
                if (zoomMined() || extraZoom != 0)
                {
                    extraZoom-=1;
                    board.style.transform = "scale("+(1+extraZoom/20).toString()+")";
                    viewport.scrollLeft = viewport.scrollLeft/((1+extraZoom/20)/(1+(extraZoom-1)/20));
                    viewport.scrollTop = viewport.scrollTop/((1+extraZoom/20)/(1+(extraZoom-1)/20));
                    e.preventDefault();
                }
                break;
            case "Equal":
                if (zoomMaxed() || extraZoom != 0)
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

document.body.addEventListener("keyup", function(e) {
    if ((document.activeElement.tagName!="INPUT" && document.activeElement.tagName!="TEXTAREA") || (e.code.includes("Numpad") && isNaN(parseInt(e.key))) || (e.altKey && e.code=="KeyH"))
    {
        e.preventDefault();
        let tX;
        let tY;
        switch (e.code) {
            case "ArrowRight":
                updateSelectedTokenData();
                if ((e.ctrlKey || e.metaKey) && selectedTokenData.group)
                    requestServer({c:"rotateDeg", id: selectedToken, angle: -90});
                
                break;

            case "ArrowLeft":
                updateSelectedTokenData();
                if ((e.ctrlKey || e.metaKey) && selectedTokenData.group)
                    requestServer({c:"rotateDeg", id: selectedToken, angle: 90});
                
                break;

            case "Numpad8":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - gridSize.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x*selectedTokenData.size)) * (gridSize.x*selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - gridSize.y*selectedTokenData.size - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y*selectedTokenData.size)) * (gridSize.y*selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tY>0 && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;
            
            case "Numpad7":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x - gridSize.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - gridSize.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x - gridSize.x*selectedTokenData.size - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x*selectedTokenData.size)) * (gridSize.x*selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - gridSize.y*selectedTokenData.size - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y*selectedTokenData.size)) * (gridSize.y*selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tY>0 && tX>0 && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;
        
            case "Numpad9":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x + gridSize.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - gridSize.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x + (gridSize.x * selectedTokenData.size) - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x * selectedTokenData.size)) * (gridSize.x * selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - (gridSize.y * selectedTokenData.size) - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y * selectedTokenData.size)) * (gridSize.y * selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tY>0 && tX < mapImage.clientWidth && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;

            case "Numpad4":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x - gridSize.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x - (gridSize.x * selectedTokenData.size) - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x * selectedTokenData.size)) * (gridSize.x * selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y * selectedTokenData.size)) * (gridSize.y * selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tX>0 && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;
        
            case "Numpad6":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x + gridSize.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x + (gridSize.x * selectedTokenData.size) - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x * selectedTokenData.size)) * (gridSize.x * selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y * selectedTokenData.size)) * (gridSize.y * selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tX < mapImage.clientWidth && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;
            
            case "Numpad2":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y + gridSize.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x * selectedTokenData.size)) * (gridSize.x * selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y + (gridSize.y * selectedTokenData.size) - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y * selectedTokenData.size)) * (gridSize.y * selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tY<mapImage.clientHeight && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;
            
            case "Numpad1":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x - gridSize.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y + gridSize.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x - (gridSize.x * selectedTokenData.size) - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x * selectedTokenData.size)) * (gridSize.x * selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y + (gridSize.y * selectedTokenData.size) - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y * selectedTokenData.size)) * (gridSize.y * selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tY<mapImage.clientHeight && tX>0 && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;
        
            case "Numpad3":
                updateSelectedTokenData();
                if (selectedTokenData.size >= 1)
                {
                    tX = Math.round((selectedTokenData.x + gridSize.x - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/gridSize.x) * gridSize.x + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y + gridSize.y - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/gridSize.y) * gridSize.y + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                else
                {
                    tX = Math.round((selectedTokenData.x + (gridSize.x * selectedTokenData.size) - mapData.offsetX - 0.5 * gridSize.x * selectedTokenData.size)/(gridSize.x * selectedTokenData.size)) * (gridSize.x * selectedTokenData.size) + 0.5 * gridSize.x * selectedTokenData.size + offsetX + GridLineWidth;
                    tY = Math.round((selectedTokenData.y + (gridSize.y * selectedTokenData.size) - mapData.offsetY - 0.5 * gridSize.y * selectedTokenData.size)/(gridSize.y * selectedTokenData.size)) * (gridSize.y * selectedTokenData.size) + 0.5 * gridSize.y * selectedTokenData.size + offsetY + GridLineWidth;
                }
                if (tY<mapImage.clientHeight && tX < mapImage.clientWidth && (CheckAntiBlockerPixelPosition(tX, tY)||isDM))
                    requestServer({c: "moveToken", id: selectedToken, x: tX, y: tY, bypassLink: !(e.ctrlKey || e.metaKey)});
                
                break;

            case "KeyC":
                colorPickerButton.click();
                break;

            case "KeyG":
                GridActive = !GridActive;
                updateButtonColors();
                drawCanvas();
                break;

            case "KeyV":
                showOtherViewports = !showOtherViewports;
                socket.emit("toggleViewportRoom");
                if (!showOtherViewports)
                    Array.from(document.getElementsByClassName('otherViewport')).forEach(viewportElement => {viewportElement.parentElement.removeChild(viewportElement);});
                break;
            
            case "KeyS":
                GridSnap = !GridSnap;
                updateButtonColors();
                break;

            case "KeyM":
                if (isDM)
                    document.getElementById("togglePlayerMode").click();
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
                if (isDM && (mapData.blockerType==1))
                    quickPolyButton.click();
            break;

            case "KeyH":
                if (e.altKey)
                    hpIcon.click();
                break;

            case "Delete":
                if (isDM)
                {
                    if (selectedToken!=-1)
                    {
                        requestServer({c: "removeToken", id: selectedToken, tokensRemoved: mapData.removedTokens});
                        selectedToken = -1;
                        return;
                    }
                    if (selectedBlocker!=-1) {
                        requestServer({c: mapData.blockerType==1 ? "removePolyBlocker" : "removeBlocker", id: selectedBlocker});
                        selectedBlocker = -1;
                        
                        return;
                    }
                }
                break;
        }
    }
});

let draggingNotes = false;
let draggingNotesOffset = {x: 0, y: 0};
notesHeaderBar.addEventListener("mousedown", function(e) {
    if (e.button == 0)
    {
        draggingNotes = true;
        draggingNotesOffset.x = e.pageX - noteEditor.offsetLeft;
        draggingNotesOffset.y = e.pageY - noteEditor.offsetTop;
    }
});

mapImage.addEventListener("mousedown", function(e) {
    if (e.button == 0)
    {
        selectedToken=-1;
        selectedBlocker=-1;
        selectedShapeId=-1;
        updateTrackerHighlight();
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
                Xcount += (mapImage.clientWidth - gridToolData.endX)/gridToolData.gridX;
                Ycount += (mapImage.clientHeight - gridToolData.endY)/gridToolData.gridY;
                requestServer({c: "setMapData", x: Xcount, y: Ycount, offsetX: (gridToolData.startX - gridToolData.gridX), offsetY: (gridToolData.startY - gridToolData.gridY)});
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
                        requestServer({c: "createToken", text: commonNameInText ? bulkInitSettings.commonName+" "+f.toString() : f.toString(), x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + ((f-1)%Math.ceil(Math.sqrt(bulkInitSettings.tokenAmount)))*bulkInitSettings.tokenSizes*gridSize.x, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) + (Math.floor((f-1)/Math.ceil(Math.sqrt(bulkInitSettings.tokenAmount))))*bulkInitSettings.tokenSizes*gridSize.y, size: bulkInitSettings.tokenSizes, status: "", layer: 50-bulkInitSettings.tokenSizes, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hideTracker: hideTracker, hp: newHP?newHP.toString()+"/"+newHP.toString():null, ac: newAC});
                    else
                        requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)) + (f-1)*bulkInitSettings.tokenSizes*gridSize.x, y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)) + (Math.floor((f-1)/Math.ceil(Math.sqrt(bulkInitSettings.tokenAmount))))*bulkInitSettings.tokenSizes*gridSize.y, image: bulkInitSettings.image, size: bulkInitSettings.tokenSizes, status: "", layer: 50-bulkInitSettings.tokenSizes, dm: true, name: bulkInitSettings.commonName+" "+f.toString(), initiative: tmpInit, hidden: hideTokens, group: groupNum, hideTracker: hideTracker, hp: newHP?newHP.toString()+"/"+newHP.toString():null, ac: newAC});
                }
                placingBulkOrigin = false;
                
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
                if (squareMarkers.width >= -mapImage.clientWidth && squareMarkers.width <= mapImage.clientWidth && squareMarkers.height >= -mapImage.clientHeight && squareMarkers.height <= mapImage.clientHeight)
                {
                    if ((isDM&&!playerMode) || CheckAntiBlockerPixel(e))
                    {
                        let shapeIsVisible = true;
                        if (isDM)
                            shapeIsVisible = confirm("Should the shape be visible?");
                        requestServer({c: "addDrawing", shape: "square", x: squareMarkers.x, y: squareMarkers.y, width: squareMarkers.width, height: squareMarkers.height, trueColor: shapeColor, visible: shapeIsVisible});
                    }
                    
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
                    requestServer({c: "addBlocker", x: blockerMarkers.x, y: blockerMarkers.y, width: blockerMarkers.width, height: blockerMarkers.height});
                }
                isPlacingBlocker = false;
                
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
                    requestServer({c: "addDrawing", shape: "vertexLine", points:[{x: lineMarkers.x, y: lineMarkers.y}, {x: lineMarkers.destX, y: lineMarkers.destY}], trueColor: shapeColor, visible: shapeIsVisible});
                }
                
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
                    requestServer({c: "addDrawing", shape: "5ftLine", x: thickLineMarkers.x, y: thickLineMarkers.y, angle: angle, trueColor: shapeColor, link: thickLineMarkers.linkId, range: thickLineMarkers.range, visible: shapeIsVisible});
                }
                
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
                    requestServer({c: "addDrawing", shape: "cone", link: coneMarkers.linkId, x: coneMarkers.x, y: coneMarkers.y, angle: angle, range: coneMarkers.range, trueColor: shapeColor, visible: isDM ? confirm("Should the shape be visible?") : true, is90Deg: coneMarkers.is90Deg});
                
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
        drawCanvas();
    }
});

let previousCalcWidth = 0;
let newNotePosition = {x: 0, y:0}
window.addEventListener("mousemove", function(e) {
    if (resizingSideMenu && !sideMenuIsHidden)
    {
        let calcWidth = (window.innerWidth - e.pageX) / window.innerWidth * 100 - 1.8;
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

    if (draggingNotes) {
        newNotePosition = {x: e.pageX - draggingNotesOffset.x, y: e.pageY - draggingNotesOffset.y};
        noteEditor.style.left = newNotePosition.x>0 ? ((newNotePosition.x<(window.innerWidth-noteEditor.offsetWidth)) ? newNotePosition.x : window.offsetWidth) : 0;
        noteEditor.style.top = newNotePosition.y>0 ? ((newNotePosition.y<(window.innerHeight-noteEditor.offsetHeight)) ? newNotePosition.y : window.offsetHeight) : 0;
        noteEditor.style.right = "auto";
    }
});

mapImage.addEventListener("dragstart", function(e) {
    e.preventDefault();
    e.stopPropagation();
});

mapImage.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (!isPanning)
    {
        if (CheckAntiBlockerPixel(e) || (isDM&&!playerMode))
        {
            let pixel = hitboxCanvas.getImageData(((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), 1, 1).data;
            if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0)
                displayContextMenu(e);
            else
                shapeContextMenu(e, pixel);
        }
        else
        {
            closeMenu();
            closeSubMenu();
        }
    }
});

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
            {text: "Erase shape", hasSubMenu: false, callback: function() {
                requestServer({c: "removeDrawing", id: shapeId, removedDrawings: mapData.removedDrawings});
            }},
            {text: "Set shape group", hasSubMenu: false, callback: function() {
                let shapeGroupString = prompt("Enter shape group number: ", selectedShape.shapeGroup ? selectedShape.shapeGroup : "");
                let shapeGroup = parseInt(shapeGroupString);
                if (!isNaN(shapeGroup))
                    requestServer({c:"editDrawing", id: shapeId, shapeGroup: shapeGroup});
                if (shapeGroupString=="")
                    requestServer({c:"editDrawing", id: shapeId, shapeGroup: "null"});
                
            }}
        ];
        if (selectedShape.shape == "vertexLine") {
            menuOptions.splice(1, 0, {text: "Add vert", hasSubMenu: false, callback: function() {
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
                requestServer({c: "editDrawing", id: shapeId, points: selectedShape.points});
                
            }});
        }
        if (isDM) {
            menuOptions.push({text: selectedShape.visible?"Hide shape":"Reveal shape", hasSubMenu: false, callback: function() {
                requestServer({c: "editDrawing", id: shapeId, visible: !selectedShape.visible});
                
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
                        newRange = selectedShape.link?newRange/feetPerSquare + 0.5:newRange/feetPerSquare;
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

let previousWallPosition = {x: -1, y: -1};
function displayContextMenu(e)
{
    let listOptions = [
        {text: "Place Token", hasSubMenu: true, callback: function() {
            let subMenu = [];
            let tokenList = mapData.tokenList;
            let dmTokenList = mapData.dmTokenList;
            let textToken = {text: "Text token", callback: function() {
                let textToDisplay = prompt("Enter the text to display on the text token:");
                if (textToDisplay!="")
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (!isNaN(tokenSize))
                    {
                        if (isDM)
                        {
                            if (tokenSize < 49 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 50-tokenSize, dm: confirm("Make this a DM token?")})
                                console.log("Placing text token with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                                
                            }
                            else
                                alert("The desired size is too large or invalid");
                        }
                        else
                        {
                            if (tokenSize < 6 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 50-tokenSize, dm: false})
                                console.log("Placing text token with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                            }
                            else
                                alert("That token size isn't allowed for players");
                        }
                    }
                    else
                        alert("That wasn't a valid size! Please try again!");
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
                            if (tokenSize < 49 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: tokenList[i], size: tokenSize, status: "", layer: 50-tokenSize, dm: false})
                                console.log("Placing " + tokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                                
                            }
                            else
                                alert("The desired size is too large or invalid");
                        }
                        else
                        {
                            if (tokenSize < 6 && tokenSize > 0)
                            {
                                requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: tokenList[i], size: tokenSize, status: "", layer: 50-tokenSize, dm: false})
                                console.log("Placing " + tokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                                
                            }
                            else
                                alert("That token size isn't allowed for players");
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
                        if (!isNaN(tokenSize))
                        {
                            requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: dmTokenList[i], size: tokenSize, status: "", layer: 50-tokenSize, dm: true})
                            console.log("Placing " + dmTokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                            
                        }
                        else
                            alert("That wasn't a valid size! Please try again!");
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
                        requestServer({c: "addDrawing", shape: "circle", x: circleMarkers.x, y: circleMarkers.y, radius: circleMarkers.radius, trueColor: shapeColor, visible: isDM?confirm("Should the shape be visible?"):true});
                        
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
        {text: "Place hidden Token", hasSubMenu: true, callback: function() {
            let subMenu = [];
            let textToken = {text: "Text token", callback: function() {
                let textToDisplay = prompt("Enter the text to display on the text token:");
                if (textToDisplay!="")
                {
                    let tokenSize = parseFloat(prompt("Please enter the size of the token"));
                    if (isNaN(tokenSize))
                        alert("That wasn't a valid size! Please try again!");
                    else
                    {
                        if (tokenSize < 49 && tokenSize > 0)
                        {
                            requestServer({c: "createToken", text: textToDisplay, x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), size: tokenSize, status: "", layer: 50-tokenSize, dm: confirm("Make this a DM token?"), hidden: true})                            
                            console.log("Placing text token with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                            
                        }
                        else
                            alert("The desired size is too large or invalid");
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
                        alert("That wasn't a valid size! Please try again!");
                    else
                    {
                        if (tokenSize < 49 && tokenSize > 0)
                        {
                            requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: tokenList[i], size: tokenSize, status: "", hidden: true, layer: 50-tokenSize, dm: true})
                            console.log("Placing hidden " + tokenList[i] + " with size " + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                            
                        }
                        else
                            alert("The desired size is too large or invalid");
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
                        alert("That wasn't a valid size! Please try again!");
                    else
                    {
                        requestServer({c: "createToken", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), image: dmTokenList[i], size: tokenSize, status: "", hidden: true, layer: 50-tokenSize, dm: true})
                        console.log("Placing " + dmTokenList[i] + " with size" + tokenSize + " at " + ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)).toString() + ":" + ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)).toString());
                        
                    }
                }
                subMenu.push(tmpElement);
            }
            displaySubMenu(e, subMenu);
        }}
    ]

    if (mapData.blockerType == 0)
    {
        DMoptions.push({text: mapData.antiBlockerOn?"Place Anti Blocker":"Place Blocker", description: "Upon clicking this button click somewhere else to define the bottom right corner", hasSubMenu: false, callback: function() {
            blockerMarkers.x = ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20));
            blockerMarkers.y = ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20));
            isPlacingBlocker = true;
            drawCanvas();
        }});
    }
    
    if (mapData.blockerType == 1)
    {
        let titleText = mapData.antiBlockerOn ? "Create Anti Blocker" : "Create Blocker";
        DMoptions.push({text: titleText, description: "Create a blocker with 4 verts at this position", hasSubMenu: false, callback: function() {
            requestServer({c: "addPolyBlocker", x: ((e.pageX+viewport.scrollLeft)/(1+extraZoom/20)), y: ((e.pageY+ viewport.scrollTop)/(1+extraZoom/20)), offset: gridSize});
            
        }})
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
    let shouldCloseColorPicker = true;
    for (let element of ancestry)
    {
        if (element.id == "color_picker" || element.id == "colorPickerButton") { shouldCloseColorPicker = false; }
        try {
            if (element.classList.contains("custom-menu"))
                shouldCloseMenus = false;
        }
        catch {
            if (element.className.baseVal.includes("custom-menu"))
                shouldCloseMenus = false;
        }
    }
    if (shouldCloseMenus) { 
        closeMenu();
        closeSubMenu();
    }
    if (shouldCloseColorPicker)
        colorPicker.style.display = "none";
}

mapImage.addEventListener("dragover", function(e) {
    e.preventDefault();
});

mapImage.addEventListener("dragend", function(e) {
    e.preventDefault();
})

window.ondrop = function(e) 
{
    e.preventDefault();
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
            if (tmpHeight > 28)
            {
                tmpHeight = 28;
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

function requestServer(data)
{
    socket.emit(data.c, data);
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
resizer.addEventListener("dblclick", function(e) {
    sideMenuIsHidden = !sideMenuIsHidden;
    e.stopPropagation();
    resizingSideMenu = false;
    setCookie("sideMenuHidden", sideMenuIsHidden);
    
    if (sideMenuIsHidden)
    {
        resizer.style.width = "0.5vw";
        sideMenu.style.display = "none";
        resizer.style.right = "0vw";
        viewport.style.width = "99.5vw";
    }
    else
    {
        sideMenu.style.display = "";
        viewport.style.width = "";
        resizer.style.right = "";
        resizer.style.width = "0.4vw";
    }
    
    console.log("Saved!");
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