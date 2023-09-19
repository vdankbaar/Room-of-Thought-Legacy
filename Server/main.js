//Mocht port 80 geblokeerd zijn door windows, voer de command 'net stop http' uit in een shell met admin of run unblock.bat in een shell met admin
let port = 80;

const fs = require('fs');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new socketIO.Server(server);

let publicFolder = __dirname + "/client/public/";
let selectedMap = "currentSettings";
var currentMap;
loadCurrentMap();

let removedTokens = 0;
let previousRemovedTokenId = -1;
let removedDrawings = 0;
let previousRemovedDrawingId = -1;

app.use(bodyParser.json());
app.use(express.static('client'));

io.on('connection', (socket) => {
    console.log('Client connected!');
    socket.emit('currentMapData', JSON.stringify(currentMap));

    socket.on('disconnect', () => {
        socket.broadcast.to('receiveViewports').emit("clearViewport", JSON.stringify({origin: socket.id}))
        console.log('Client disconnected!');
    })

    socket.on('toggleViewportRoom', () => {
        if (socket.rooms.has("receiveViewports"))
            socket.leave("receiveViewports")
        else
            socket.join("receiveViewports");
    })

    socket.on('shareViewportBounds', (body) => {
        socket.broadcast.to('receiveViewports').emit("drawViewport", JSON.stringify({origin: socket.id, left: body.left, top: body.top, height: body.height, width: body.width}));
    })

    socket.on('setMapData', (body) => {
        if (body.map!=null) {currentMap.map = body.map;}
        if (body.x!=null) {currentMap.x = body.x;}
        if (body.y!=null) {currentMap.y = body.y;}
        if (body.offsetX!=null) {currentMap.offsetX = body.offsetX;}
        if (body.offsetY!=null) {currentMap.offsetY = body.offsetY;}
        if (body.gridColor!=null) {currentMap.gridColor = body.gridColor;}
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('changeSelectedMap', (body) => {
        selectedMap = body.selectedMap;
        loadCurrentMap();
        broadcastMap();
    });

    socket.on('createToken', (body) => {
        if (minMax(body.size, 0, 50))
        {
            let tmpToken = {};
            let tmpTokens = [];
            let newId = 0;
            //Deep copy
            tmpTokens = JSON.parse(JSON.stringify(currentMap.tokens));
            tmpTokens.sort(function(a,b){return a.id - b.id;});
            for (let token of tmpTokens)
                if (token.id > -1 && token.id == newId)
                    newId++;
            tmpToken.id = newId;
            tmpToken.x = body.x;
            tmpToken.y = body.y;
            tmpToken.image = body.image;
            tmpToken.size = body.size;
            tmpToken.status = body.status;
            tmpToken.layer = body.layer;
            if (body.dm != null) {tmpToken.dm = body.dm;}
            if (body.text != null) {
                if (body.name == null)
                    tmpToken.name = body.text;
                tmpToken.text = body.text;
            }
            if (body.hidden != null) {tmpToken.hidden = body.hidden;}
            if (body.initiative != null) {tmpToken.initiative = body.initiative;}
            if (body.name != null) {tmpToken.name = body.name;}
            if (body.ac != null) {tmpToken.ac = body.ac;}
            if (body.hp != null) {tmpToken.hp = body.hp;}
            if (body.group != null) {tmpToken.group = body.group;}
            if (body.hideTracker != null) {tmpToken.hideTracker = body.hideTracker;}
            if (body.notes != null) {tmpToken.notes = body.notes;}
            currentMap.tokens.push(tmpToken);
            broadcastMap();
            saveCurrentMap();
        }
    });

    socket.on('setTokenHidden', (body) => {
        for (let currentToken of currentMap.tokens)
        {
            if (currentToken.id == body.id)
            {
                currentToken.hidden = body.hidden;
                for (let currentDrawing of currentMap.drawings)
                    if (currentDrawing.link == currentToken.id)
                        currentDrawing.visible = !currentToken.hidden;
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('toggleGroupLock', (body) => {
        loadCurrentMap();
        if (body.group!=null)
        {
            if (currentMap.groupLock.includes(body.group))
                currentMap.groupLock.splice(currentMap.groupLock.indexOf(body.group), 1);
            else
                currentMap.groupLock.push(body.group);
        }
        checkGroupLock();
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('editToken', (body) => {
        for (let token of currentMap.tokens)
        {
            if (token.id == body.id)
            {    
                if (body.size != null)
                    if (minMax(body.size, 0, 50))
                    {
                        updateTokenCircleRange(token, body.size);
                        token.size = body.size;
                    }
                if (body.status != null) {token.status = body.status;}     
                if (body.layer != null) {token.layer = body.layer;}
                if (body.notes != null) {token.notes = body.notes;}
                if (body.text != null) {token.text = body.text;}    
                if (body.dm != null) {token.dm = body.dm;}
                if (body.concentrating != null) {token.concentrating = body.concentrating;}
                if (body.hideTracker != null) {token.hideTracker = body.hideTracker;}
                // Following parameters contain a ternary statement to allow resetting through a "" or false value.
                if (body.group != null) {token.group = body.group ? body.group : null;}    
                if (body.initiative != null) {token.initiative = body.initiative ? body.initiative : null;}
                if (body.name != null) {token.name = body.name ? body.name : null;}
                if (body.ac != null) {token.ac = body.ac ? body.ac : null;}    
                if (body.hp != null) {token.hp = body.hp != "/" ? body.hp : null;}
                if (body.image != null) {token.image = body.image ? body.image : null;}
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('removeToken', (body) => {
        if (body.id == previousRemovedTokenId && body.tokensRemoved < removedTokens)
        {
            console.log("Two people removed a token at the same time!");
            return
        }
        currentMap.tokens = currentMap.tokens.filter(token => token.id != body.id);
        currentMap.drawings = currentMap.drawings.filter(drawing => drawing.link != body.id);
        checkGroupLock();
        broadcastMap();
        saveCurrentMap();
        removedTokens++;
        previousRemovedTokenId = body.id;
    });

    socket.on('moveToken', (body) => {
        let newX = parseFloat(body.x);
        if (isNaN(newX) || newX < 0)
            newX = 0;
        body.x = newX;

        let newY = parseFloat(body.y);
        if (isNaN(newY) || newY < 0)
            newY = 0;
        body.y = newY;
        for (let currentToken of currentMap.tokens)
        {
            if (currentToken.id != body.id)
                continue;
            let dx = body.x - currentToken.x;
            let dy = body.y - currentToken.y;
            if (currentToken.group != null && !body.bypassLink)
            {
                for (let otherToken of currentMap.tokens)
                {
                    if (currentToken.id != otherToken.id && otherToken.group == currentToken.group)
                    {
                        otherToken.x += dx;
                        otherToken.y += dy;
                        moveLinkedShapes(otherToken);
                    }
                }
            }
            currentToken.x = body.x;
            currentToken.y = body.y;
            moveLinkedShapes(currentToken);
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('rotateDeg', (body) => {
        for (let currentToken of currentMap.tokens)
        {
            if (currentToken.id != body.id)
                continue;
            let inputAngle = body.angle * -Math.PI / 180;
            for (let otherToken of currentMap.tokens)
            {
                if (currentToken.objectLock)
                    otherToken.rotation = otherToken.rotation == null ? parseInt(body.angle) : otherToken.rotation - parseInt(body.angle);
                if (currentToken.id == otherToken.id || otherToken.group != currentToken.group)
                    continue;
                let oldX = otherToken.x - currentToken.x;
                let oldY = otherToken.y - currentToken.y;
                let radius = Math.sqrt(Math.pow(oldY, 2)+Math.pow(oldX, 2));
                let currentAngle = Math.atan2(oldY, oldX);
                let newX = Math.cos(currentAngle + inputAngle) * radius;
                let newY = Math.sin(currentAngle + inputAngle) * radius;
                otherToken.x = currentToken.x + newX;
                otherToken.y = currentToken.y + newY;
                moveLinkedShapes(otherToken);
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('addDrawing', (body) => {
        let tmpDrawing = {};
        let isShape = false;
        switch(body.shape)
        {
            case "circle":
                isShape = true;
                tmpDrawing.x = Math.round(body.x);
                tmpDrawing.y = Math.round(body.y);
                tmpDrawing.radius = body.radius;
                break;
            case "square":
                isShape = true;
                tmpDrawing.x = Math.round(body.x);
                tmpDrawing.y = Math.round(body.y);
                tmpDrawing.width = Math.round(body.width);
                tmpDrawing.height = Math.round(body.height);
                break;
            case "line":
                isShape = true;
                tmpDrawing.x = Math.round(body.x);
                tmpDrawing.y = Math.round(body.y);
                tmpDrawing.destX = Math.round(body.destX);
                tmpDrawing.destY = Math.round(body.destY);
                break;
            case "vertexLine":
                isShape = true;
                tmpDrawing.points = body.points;
                break;
            case "5ftLine":
                isShape = true;
                tmpDrawing.x = Math.round(body.x);
                tmpDrawing.y = Math.round(body.y);
                tmpDrawing.range = body.range;
                tmpDrawing.angle = body.angle;
                break;
            case "cone":
                isShape = true;
                tmpDrawing.x = Math.round(body.x);
                tmpDrawing.y = Math.round(body.y);
                tmpDrawing.is90Deg = body.is90Deg;
                tmpDrawing.angle = body.angle;
                tmpDrawing.range = body.range;
                break;
        }
        if (!isShape)
            return;
        tmpDrawing.visible = body.visible;
        tmpDrawing.shape = body.shape;
        tmpDrawing.id = 0;
        currentMap.drawings.sort(function(a,b){
            return a.id - b.id; 
        });
        for (let drawing of currentMap.drawings) {
            if (drawing.id > -1 && drawing.id == tmpDrawing.id)
                tmpDrawing.id++;
        }
        tmpDrawing.trueColor = body.trueColor;
        tmpDrawing.link = body.link;
        currentMap.drawings.push(tmpDrawing);
        for (let token of currentMap.tokens)
            moveLinkedShapes(token);
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('editDrawing', (body) => {
        for (let currentDrawing of currentMap.drawings)
        {
            if (currentDrawing.id != body.id)
                continue;
            if (currentDrawing.shape == "vertexLine" && body.both)
            {
                if (body.x == null || body.y == null)
                    continue;
                let dx = body.x - currentDrawing.points[0].x;
                let dy = body.y - currentDrawing.points[0].y;
                if (body.moveShapeGroup) { moveShapeGroup(currentDrawing.id, dx, dy, currentDrawing.shapeGroup); }
                for (let currentPoint of currentDrawing.points)
                {
                    currentPoint.x = Math.round(currentPoint.x + dx);
                    currentPoint.y = Math.round(currentPoint.y + dy);
                }
            }
            else
            {
                if ((body.x != null || body.y != null) && body.moveShapeGroup)
                {
                    let dx = body.x - currentDrawing.x;
                    let dy = body.y - currentDrawing.y;
                    moveShapeGroup(currentDrawing.id, dx, dy, currentDrawing.shapeGroup);
                }
                if (body.shapeGroup!=null) { currentDrawing.shapeGroup = body.shapeGroup == "null" ? null : body.shapeGroup; }
                if (body.visible!=null) { currentDrawing.visible = body.visible; }
                if (body.points!=null) { currentDrawing.points = body.points; }
                if (body.radius!=null) { currentDrawing.radius = body.radius; }
                if (body.angle!=null) { currentDrawing.angle = body.angle; }
                if (body.destX!=null) { currentDrawing.destX = Math.round(body.destX); }
                if (body.destY!=null) { currentDrawing.destY = Math.round(body.destY); }
                if (body.range!=null) { currentDrawing.range = body.range; }
                if (body.x!=null) { currentDrawing.x = Math.round(body.x); }
                if (body.y!=null) { currentDrawing.y = Math.round(body.y); }
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('removeDrawing', (body) => {
        if (body.id == previousRemovedDrawingId && body.drawingsRemoved < removedDrawings)
            return;
        currentMap.drawings = currentMap.drawings.filter(drawing => drawing.id != body.id);
        previousRemovedDrawingId = body.id;
        removedDrawings++;
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('addBlocker', (body) => {
        if (body.width == 0 && body.height == 0)
            return;
            
        let tmpBlocker = {};
        tmpBlocker.id = currentMap.blockers.length;
        tmpBlocker.x = body.x;
        tmpBlocker.y = body.y;
        if (body.width>0)
        {
            if (body.height<0)
            {
                tmpBlocker.y = tmpBlocker.y + body.height;
                tmpBlocker.width = body.width;
                tmpBlocker.height = Math.abs(body.height);
            }
            else
            {
                tmpBlocker.width = body.width;
                tmpBlocker.height = body.height;
            }
        }
        else
        {
            if (body.height>0)
            {
                tmpBlocker.x = tmpBlocker.x + body.width;
                tmpBlocker.width = Math.abs(body.width);
                tmpBlocker.height = body.height;
            }
            else
            {
                tmpBlocker.y = tmpBlocker.y + body.height;
                tmpBlocker.x = tmpBlocker.x + body.width;
                tmpBlocker.width = Math.abs(body.width);
                tmpBlocker.height = Math.abs(body.height);
            }
        }
        currentMap.blockers.push(tmpBlocker);
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('editBlocker', (body) => {
        for (let currentBlocker of currentMap.blockers) {
            if (currentBlocker.id != body.id)
                continue;
            currentBlocker.x = body.x;
            currentBlocker.y = body.y;
            currentBlocker.width = body.width;
            currentBlocker.height = body.height;
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('removeBlocker', (body) => {
        let blockerFound = 0;
        for (let [currentBlocker, i] in currentMap.blockers.entries()) {
            if (currentBlocker.id == body.id) {
                blockerFound = i;
                currentMap.blockers.splice(i, 1);
            }
        }
        for (let i = blockerFound; i < currentMap.blockers.length; i++)
            currentMap.blockers[i].id = currentMap.blockers[i].id - 1;
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('addPolyBlocker', (body) => {
        let tmpPoly = {id: currentMap.polyBlockers.length, verts: []};
        tmpPoly.verts.push({x: body.x-body.offset.min, y: body.y+body.offset.min});
        tmpPoly.verts.push({x: body.x+body.offset.min, y: body.y+body.offset.min});
        tmpPoly.verts.push({x: body.x+body.offset.min, y: body.y-body.offset.min});
        tmpPoly.verts.push({x: body.x-body.offset.min, y: body.y-body.offset.min});
        currentMap.polyBlockers.push(tmpPoly);
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('togglePolyBlocker', (body) => {
        for (let currentBlocker of currentMap.polyBlockers)
            if (currentBlocker.id == body.id)
                currentBlocker.inactive = !currentBlocker.inactive;
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('editVert', (body) => {
        for (let currentBlocker of currentMap.polyBlockers) {
            if (currentBlocker.id == body.id) {
                currentBlocker.verts[body.vertIndex].x = body.x;
                currentBlocker.verts[body.vertIndex].y = body.y;
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('movePolyBlocker', (body) => {
        for (let currentBlocker of currentMap.polyBlockers) {
            if (currentBlocker.id != body.id)
                continue;
            for (let currentVert of currentBlocker.verts) {
                currentVert.x = currentVert.x + body.offsetX;
                currentVert.y = currentVert.y + body.offsetY;
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('addCustomPolyBlocker', (body) => {
        let newPolyBlocker = {id: currentMap.polyBlockers.length, verts: JSON.parse(body.newPolyBlockerVerts)};
        currentMap.polyBlockers.push(newPolyBlocker);
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('addVert', (body) => {
        for (let currentBlocker of currentMap.polyBlockers) {
            if (currentBlocker.id != body.id)
                continue;
            let prevVert = currentBlocker.verts[body.vertId];
            let nextVertId = (nextVertId>=currentBlocker.verts.length) ? body.vertId+1 : 0;
            let nextVert = currentBlocker.verts[nextVertId];
            let newVert = {x: (prevVert.x+nextVert.x)/2, y: (prevVert.y+nextVert.y)/2};
            currentBlocker.verts.splice(nextVertId, 0, newVert);
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('removeVert', (body) => {
        for (let currentBlocker of currentMap.polyBlockers)
            if (currentBlocker.id == body.id)
                currentBlocker.verts.splice(body.vertId, 1);
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('removePolyBlocker', (body) => {
        let polyBlockerFound = 0;
        for (let [i, currentBlocker] of Object.entries(currentMap.polyBlockers)) {
            if (currentBlocker.id == body.id) {
                polyBlockerFound = i;
                currentMap.polyBlockers.splice(i, 1);
            }
        }
        for (let i = polyBlockerFound; i < currentMap.polyBlockers.length; i++)
            currentMap.polyBlockers[i].id = currentMap.polyBlockers[i].id - 1;
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('invertBlockers', (body) => {
        currentMap.antiBlockerOn = !currentMap.antiBlockerOn;
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('clearTokens', (body) => {
        currentMap.tokens = [];
        for (let targetDrawing of currentMap.drawings) {
            if (targetDrawing.link==null)
                continue;
            currentMap.drawings = currentMap.drawings.filter(drawing => drawing.id != targetDrawing.link);
            previousRemovedDrawingId = targetDrawing.link;
            removedDrawings++;
        }
        saveCurrentMap();
    });

    socket.on('clearDrawings', (body) => {
        currentMap.drawings = [];
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('clearBlockers', (body) => {
        currentMap.blockers = [];
        currentMap.polyBlockers = [];
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('sortTracker', (body) => {
        if (currentMap.tokens.length>0)
        {
            let tmpTokens = [];
            tmpTokens.push(currentMap.tokens[0]);
            if (currentMap.tokens.length>1)
            {
                for (let f = 1; f < currentMap.tokens.length; f++)
                {
                    let currentLength = tmpTokens.length;
                    for (let g = 0; g < currentLength; g++)
                    {
                        if (currentMap.tokens[f].initiative==null)
                        {
                            tmpTokens.push(currentMap.tokens[f]);
                            g = currentLength;
                        }
                        else
                        {
                            if (tmpTokens[g].initiative < currentMap.tokens[f].initiative || tmpTokens[g].initiative == null)
                            {
                                tmpTokens.splice(g, 0, currentMap.tokens[f]);
                                g = currentLength;
                            }
                            else
                            {
                                if (g==tmpTokens.length-1)
                                {
                                    tmpTokens.push(currentMap.tokens[f]);
                                    g=currentLength;
                                }
                            }
                        }
                    }
                }
                currentMap.tokens = tmpTokens;
            }
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('switchTrackerPosition', (body) => {
        let origin = parseInt(body.origin);
        let target = parseInt(body.target);
        if (origin<target)
        {
            currentMap.tokens.splice(target+1, 0, currentMap.tokens[origin]);
            currentMap.tokens.splice(origin, 1);
        }
        else
        {
            currentMap.tokens.splice(target, 0, currentMap.tokens[origin]);
            currentMap.tokens.splice(origin+1, 1);
        }
        broadcastMap();
        saveCurrentMap();
    });

    socket.on('switchBlockerType', (body) => {
        if (!isNaN(parseInt(body.type)))
        {
            currentMap.blockerType = parseInt(body.type);
            currentMap.usePolyBlockers = currentMap.blockerType == 1;
        }
        broadcastMap();
        saveCurrentMap();
    })

    socket.on('requestPing', (body) => {
        io.sockets.emit('pingAt', JSON.stringify({pingX: body.pingX, pingY: body.pingY}));
    });
})

server.listen(port);

function checkGroupLock()
{
    for (let i = currentMap.groupLock.length-1; i >= 0; i--)
    {
        let groupActive = false;
        let maxLayerInGroup = 0;
        for (let currentToken of currentMap.tokens)
        {
            if (currentToken.group==currentMap.groupLock[i])
            {
                if (maxLayerInGroup<currentToken.layer) { maxLayerInGroup = currentToken.layer; }
                if (currentToken.layer<maxLayerInGroup) { currentToken.layer = maxLayerInGroup; }
                groupActive = true;
            }
        }
        if (groupActive) {
            for (let currentToken of currentMap.tokens)
                if (currentToken.group!=currentMap.groupLock[i] && currentToken.layer <= maxLayerInGroup)
                    currentToken.layer = maxLayerInGroup+1;
            return;
        }
        currentMap.groupLock.splice(i, 1);
    }
}

function moveShapeGroup(moveShapeOriginId, dx, dy, targetShapeGroup)
{
    if (targetShapeGroup!=null)
    {
        for (let drawing of currentMap.drawings)
        {
            if (drawing.shapeGroup == targetShapeGroup && drawing.id != moveShapeOriginId)
            {
                if (drawing.shape == "vertexLine")
                {
                    for (let point of drawing.points)
                    {
                        point.x = point.x + dx;
                        point.y = point.y + dy;
                    }
                }
                else
                {
                    drawing.x = drawing.x + dx;
                    drawing.y = drawing.y + dy;
                }
            }
        }
    }
}

function moveLinkedShapes(tokenData) 
{
    for (let i = 0; i < currentMap.drawings.length; i++)
    {
        if (currentMap.drawings[i].link == tokenData.id)
        {
            let dx = tokenData.x - currentMap.drawings[i].x;
            let dy = tokenData.y - currentMap.drawings[i].y;
            moveShapeGroup(currentMap.drawings[i].id, dx, dy, currentMap.drawings[i].shapeGroup);
            currentMap.drawings[i].x = tokenData.x;
            currentMap.drawings[i].y = tokenData.y;
        }
    }
}

function updateTokenCircleRange(tokenData, newSize) {
    for (let i = 0; i < currentMap.drawings.length; i++)
        if (currentMap.drawings[i].link == tokenData.id && currentMap.drawings[i].shape == "circle")
            currentMap.drawings[i].radius += (newSize-tokenData.size)*0.5;
}

function loadCurrentMap() 
{
    currentMap = JSON.parse(readFile("data/" + selectedMap + ".json"));
    if (currentMap.offsetX == null) { currentMap.offsetX = 0; }
    if (currentMap.antiBlockerOn == null) { currentMap.antiBlockerOn = false; }
    if (currentMap.offsetY == null) { currentMap.offsetY = 0; }
    if (currentMap.gridColor == null) { currentMap.gridColor = "#222222FF"; }
    if (currentMap.usePolyBlockers == null) { currentMap.usePolyBlockers = false; }
    if (currentMap.polyBlockers == null) { currentMap.polyBlockers = []; }
    if (currentMap.groupLock == null) { currentMap.groupLock = []; }
    if (currentMap.groupPresets == null) { currentMap.groupPresets = []; }
    if (currentMap.blockerType == null) { currentMap.blockerType = currentMap.usePolyBlockers ? 1 : 0; }
    currentMap.mapName = selectedMap;
    currentMap.tokenList = readDirectory(publicFolder + "tokens", "jpg|png|jpeg|gif", false);
    currentMap.dmTokenList = readDirectory(publicFolder + "dmTokens", "jpg|png|jpeg|gif", false);
    currentMap.mapSourceList = readDirectory(publicFolder + "maps", "jpg|png|jpeg|gif|webm|mp4", false);
    let tmpMaps = readDirectory("data/", "json", false);
    for (let i in tmpMaps) { tmpMaps[i] = tmpMaps[i].split(".")[0]; }
    currentMap.maps = tmpMaps;
}

function broadcastMap() {
    io.sockets.emit('currentMapData', JSON.stringify(currentMap));
}

function saveCurrentMap() {   
    writeFile("data/" + selectedMap + ".json", JSON.stringify(currentMap, null, 4));
}

//#region Low level functions
function minMax(value, min, max)
{
    return value > min && value < max;
}

function renameFile(file, newName)
{
    try { fs.renameSync(file, pathLib.dirname(file) + "\\" + newName + pathLib.extname(file)); }
    catch (err) { logError("Error: " + err); return false; }
    return true;
}

function renameFolder(path, newName) 
{
    try { fs.renameSync(path, pathLib.dirname(path) + "\\" + newName); }
    catch (err) { logError("Error: " + err); return false;}
    return true;
}

function readFile(file) 
{
    //Function that synchronously reads a file
    let fileReadSuccess = false;
    while (!fileReadSuccess)
    {
        try
        { 
            let data = fs.readFileSync(file, 'utf8');
            fileReadSuccess = true;
            return data;
        }
        catch (err) { logError("Error: " + err); }
    }
}

function writeFile(file, content) 
{
    //Function that synchronously writes a file
    try { fs.writeFileSync(file, content, 'utf8'); }
    catch(err) { logError("Error: " + err); return false;}
    return true;
}

function readFileHex(file) 
{
    //Function that synchronously reads a file
    try { return fs.readFileSync(file, 'hex') }
    catch (err) { logError("Error: " + err); return false;}
}

function writeFileHex(file, content) 
{
    //Function that synchronously writes a file
    try { fs.writeFileSync(file, content, 'hex'); }
    catch(err) { logError("Error: " + err); return false;}
    return true;
}

function deletefile(file) 
{
    try { fs.unlinkSync(file); }
    catch(err) { logError("Error: " + err); return false;}
    return true;
}

function fileExists(file) 
{
    try { return fs.existsSync(file); }
    catch(err) { logError("Error: " + err);}
}

function copyFile(source, destination) 
{
    try { fs.copyFileSync(source, destination); }
    catch (err) { logError("Error: " + err); return false;}
    return true;
}

function copyFileHex(source, destination) 
{
    let tmp = readFileHex(source);
    writeFileHex(destination, tmp);
}

function readDirectory(path, filter, keepType) 
{
    //Function that reads all the file names in a directory and returns an array of file names that are filtered
    //so only certain file types are counted. the desired filetypes were delimited with a "|" in the paramter "filter"
    if (!fileExists(path))
        return false;
    let returnData = [];
    try {
        //Read the complete folder
        let dirData = fs.readdirSync(path, { withFileTypes: keepType });
        let fileTypes = filter.split("|");
        for (let dirEntry of dirData) 
        {
            let correctType = false;
            for (let allowedType of fileTypes)
            {
                if (keepType ? dirEntry.name.includes(allowedType) : dirEntry.includes(allowedType)) 
                    correctType = true;
            }
            if (keepType)
                dirEntry = {name: dirEntry.name, folder: dirEntry.isDirectory()};
            if (correctType) 
                returnData.push(dirEntry);
        }
    } catch (err) { logError("Error: " + err); return false;}
    //Return array with only file types described in "filter"
    return returnData;
}

function createDirectory(path) 
{
    try { fs.mkdirSync(path); }
    catch (err) { logError("Error: " + err); return false;}
    return true;
}

function deleteDirectory(path) 
{
    try 
    {
        if( fs.existsSync(path) ) 
        {
            fs.readdirSync(path).forEach(function(file, index)
            {
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory())
                    deleteDirectory(curPath);
                else
                    fs.unlinkSync(curPath);
            });
            fs.rmdirSync(path);
        }
    }
    catch(err) { logError("Error: " + err); return false;}
    return true;
}

//#endregion