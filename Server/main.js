//Mocht port 80 geblokeerd zijn door windows, voer de command 'net stop http' uit in een shell met admin of run unblock.bat in een shell met admin
let port = 80;

const fs = require('fs');
const pathLib = require('path');
var express = require("express");
var bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
var app = express();
let dataFolder = __dirname + "/data/";
let publicFolder = __dirname + "/client/public/";
let selectedMap = "currentSettings";
var currentMap;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(fileUpload());
loadCurrentMap();
for (let i = 0; i<currentMap.tokens.length; i++)
{
    if (currentMap.tokens[i].dm==null)
    {
        if (currentMap.dmTokenList.includes(currentMap.tokens[i].image))
            currentMap.tokens[i].dm = true;
        else
            currentMap.tokens[i].dm = false;
    }
}

for (let i = 0; i<currentMap.drawings.length; i++) {
    if (currentMap.drawings[i].visible == null) {
        currentMap.drawings[i].visible = true;
    }
}
currentMap.portalData = [];
saveCurrentMap();
let removedTokens = 0;
let previousRemovedTokenId = -1;
let removedDrawings = 0;
let previousRemovedDrawingId = -1;
let playerNameList = [];
let nonLoggedCommands = ["currentMapData", "setLiftedMinis", "setPortalData"]

app.post("/api", function(request, response) {
    let playerName = GetCookie(request, "playerName");
    if (!playerNameList.includes(playerName) && playerName != "")
    {
        console.log("A new player has connected: " + playerName);
        playerNameList.push(playerName);
        console.log("Currently connected: " + JSON.stringify(playerNameList));
    }
    if (!nonLoggedCommands.includes(request.body.c))
        console.log(playerName + ": " + JSON.stringify(request.body));
    switch(request.body.c) 
    {
        case "log":
            console.log(request.body.data);
            response.send(true);
            break;

        case "setLiftedMinis":
            loadCurrentMap();
            if (request.body.id != null) {
                let selectedPortal = parseInt(request.body.id);
                if (!isNaN(selectedPortal))
                {
                    if (selectedPortal==-1 || selectedPortal>=currentMap.portalData.length) {
                        selectedPortal = currentMap.portalData.push({}) - 1
                    }
                    if (request.body.lifted != null)
                    { currentMap.portalData[selectedPortal].lifted = JSON.parse(request.body.lifted); }
                    response.send(selectedPortal.toString());
                }
            }
            else
            {
                response.send(false);
            }
            saveCurrentMap();
            break;

        case "setPortalData":
            loadCurrentMap();
            if (request.body.id != null) {
                let selectedPortal = parseInt(request.body.id);
                if (!isNaN(selectedPortal))
                {
                    if (selectedPortal==-1 || selectedPortal>=currentMap.portalData.length) {
                        selectedPortal = currentMap.portalData.push({}) - 1
                    }
                    if (request.body.links != null)
                    { currentMap.portalData[selectedPortal].links = JSON.parse(request.body.links); }
                    if (request.body.name != null)
                    { currentMap.portalData[selectedPortal].name = request.body.name; }
                    if (!isNaN(parseInt(request.body.x)))
                    { currentMap.portalData[selectedPortal].portalX = parseInt(request.body.x); }
                    if (!isNaN(parseInt(request.body.y)))
                    { currentMap.portalData[selectedPortal].portalY = parseInt(request.body.y); }
                    if (!isNaN(parseInt(request.body.originX)))
                    { currentMap.portalData[selectedPortal].originX = parseInt(request.body.originX); }
                    if (!isNaN(parseInt(request.body.originY)))
                    { currentMap.portalData[selectedPortal].originY = parseInt(request.body.originY); }
                    if (request.body.lifted != null)
                    { currentMap.portalData[selectedPortal].lifted = JSON.parse(request.body.lifted); }
                    if (request.body.crash != null)
                    { currentMap.portalData[selectedPortal].crash = request.body.crash; }
                    response.send(selectedPortal.toString());
                }
            }
            else
            {
                response.send(false);
            }
            saveCurrentMap();
            break;

        case "clearPortals":
            loadCurrentMap();
            currentMap.portalData = [];
            response.send(true);
            saveCurrentMap();
            break;

        case "currentMapData":
            loadCurrentMap();
            currentMap.removedTokens = removedTokens;
            currentMap.removedDrawings = removedDrawings;
            if ((currentMap.mapX!=request.body.x && request.body.x!=null && request.body.x != 0) || (currentMap.mapY != request.body.y && request.body.y!=null && request.body.y != 0))
            {
                currentMap.mapX = request.body.x;
                currentMap.mapY = request.body.y;
                saveCurrentMap();
            }
            response.send(JSON.stringify(currentMap));
            break;
        
        case "setMapData":
            loadCurrentMap();
            if (request.body.map!=null) {
                currentMap.map = request.body.map;
            }
            if (request.body.x!=null) {currentMap.x = request.body.x;}
            if (request.body.y!=null) {currentMap.y = request.body.y;}
            if (request.body.offsetX!=null) {currentMap.offsetX = request.body.offsetX;}
            if (request.body.offsetY!=null) {currentMap.offsetY = request.body.offsetY;}
            if (request.body.hideInit!=null) {currentMap.hideInit = request.body.hideInit;}
            if (request.body.gridColor!=null) {currentMap.gridColor = request.body.gridColor;}
            saveCurrentMap();
            response.send(true);
            break;

        case "changeSelectedMap":
            selectedMap = request.body.selectedMap;
            response.send(true);
            break

        case "createToken":
            if (minMax(request.body.size, 0, 20))
            {
                let tmpToken = {};
                let tmpTokens = [];
                if (currentMap.tokens.length>0)
                {
                    tmpTokens.push(currentMap.tokens[0]);
                    if (currentMap.tokens.length>1)
                    {
                        for (let f = 1; f<currentMap.tokens.length; f++)
                        {
                            let currentLength = tmpTokens.length;
                            for (let g = 0; g<currentLength; g++)
                            {
                                if (tmpTokens[g].id > currentMap.tokens[f].id)
                                {
                                    tmpTokens.splice(g, 0, currentMap.tokens[f]);
                                    g = currentLength;
                                }
                                else
                                {
                                    if (g==tmpTokens.length-1)
                                    {
                                        tmpTokens.push(currentMap.tokens[f]);
                                        g = currentLength;
                                    }
                                }
                            }
                        }
                    }
                    for (let s = 0; s < tmpTokens.length; s++)
                    {
                        if (tmpTokens[s].id!=s)
                        {
                            tmpToken.id = s;
                            s = tmpTokens.length;
                        }
                    }
                    if (tmpToken.id == null)
                    {
                        tmpToken.id = tmpTokens.length;
                    }
                }
                else
                {
                    tmpToken.id = 0;
                }
                tmpToken.x = request.body.x;
                tmpToken.y = request.body.y;
                tmpToken.image = request.body.image;
                tmpToken.size = request.body.size;
                tmpToken.status = request.body.status;
                tmpToken.layer = request.body.layer;
                if (request.body.dm != null)
                    tmpToken.dm = request.body.dm;
                if (request.body.text != null)
                    tmpToken.text = request.body.text;
                if (request.body.hidden != null)
                    tmpToken.hidden = request.body.hidden;
                if (request.body.initiative != null)
                    tmpToken.initiative = request.body.initiative;
                if (request.body.name != null)
                    tmpToken.name = request.body.name;
                if (request.body.ac != null)
                    tmpToken.ac = request.body.ac;
                if (request.body.hp != null)
                    tmpToken.hp = request.body.hp;    
                if (request.body.group != null)
                    tmpToken.group = request.body.group;
                if (request.body.hideTracker != null)
                    tmpToken.hideTracker = request.body.hideTracker;
                currentMap.tokens.push(tmpToken);
                response.send(tmpToken.id.toString());
                saveCurrentMap();
            }
            else
            {
                response.send("[false]");
            }
            break;

        case "setTokenHidden":
            loadCurrentMap();
            for (let currentToken of currentMap.tokens)
            {
                if (currentToken.id == request.body.id)
                {
                    currentToken.hidden = request.body.hidden;
                    for (let currentDrawing of currentMap.drawings)
                    {
                        if (currentDrawing.link == currentToken.id)
                        {
                            currentDrawing.visible = !currentToken.hidden;
                        }
                    }
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "toggleGroupLock":
            loadCurrentMap();
            if (request.body.group!=null)
            {
                if (currentMap.groupLock.includes(request.body.group))
                    currentMap.groupLock.splice(currentMap.groupLock.indexOf(request.body.group), 1);
                else
                    currentMap.groupLock.push(request.body.group);
            }
            checkGroupLock();
            saveCurrentMap();
            response.send("[true]");
            break;

        case "editToken":
            loadCurrentMap();
            for (let token of currentMap.tokens)
            {
                if (token.id == request.body.id)
                {
                    if (request.body.status != null)
                        token.status = request.body.status;
                    if (request.body.size != null)
                        if (minMax(request.body.size, 0, 20))
                        {
                            updateTokenCircleRange(token, request.body.size);
                            token.size = request.body.size;
                        }
                            
                    if (request.body.layer != null)
                        token.layer = request.body.layer;
                    if (request.body.group != null)
                        token.group = request.body.group=="reset" ? null : request.body.group;
                    if (request.body.initiative != null)
                        token.initiative = request.body.initiative=="reset" ? null : request.body.initiative;
                    if (request.body.name != null)
                        token.name = request.body.name;
                    if (request.body.ac != null)
                        token.ac = request.body.ac;
                    if (request.body.hp != null)
                        token.hp = request.body.hp;
                    if (request.body.notes != null)
                        token.notes = request.body.notes;
                    if (request.body.image != null)
                        token.image = request.body.image=="reset" ? null : request.body.image;
                    if (request.body.text != null)
                        token.text = request.body.text;
                    if (request.body.dm != null)
                        token.dm = request.body.dm;
                    if (request.body.concentrating != null)
                        token.concentrating = request.body.concentrating;
                    if (request.body.hideTracker != null)
                        token.hideTracker = request.body.hideTracker;
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "removeToken":
            loadCurrentMap();
            if (request.body.id == previousRemovedTokenId && request.body.tokensRemoved < removedTokens)
            {
                console.log("Two people removed a token at the same time!");
                response.send("[false]");
            }
            else
            {
                
                for (let h = 0; h < currentMap.tokens.length; h++)
                    if (currentMap.tokens[h].id==request.body.id)
                        currentMap.tokens.splice(h, 1);

                for (let i = 0; i<currentMap.drawings.length; i++)
                    if (currentMap.drawings[i].link == request.body.id)
                        removeDrawingById(currentMap.drawings[i].id);
                        
                checkGroupLock();
                saveCurrentMap();
                response.send("[true]");
                removedTokens++;
                previousRemovedTokenId = request.body.id;
            }
            break;

        case "moveToken":
            loadCurrentMap();
            let newX = parseInt(request.body.x);
            let newY = parseInt(request.body.y);
            if (isNaN(newX))
                newX = 0;
            if (isNaN(newY))
                newY = 0;
            request.body.x = newX;
            request.body.y = newY;
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    if (!currentMap.groupLock.includes(currentToken.group) || !request.body.bypassLink)
                    {
                        let dx = request.body.x - currentToken.x;
                        let dy = request.body.y - currentToken.y;
                        if (currentToken.group != null && !request.body.bypassLink)
                        {
                            for (let j in currentMap.tokens)
                            {
                                if (j != i && currentMap.tokens[j].group == currentToken.group)
                                {
                                    currentMap.tokens[j].x = currentMap.tokens[j].x + dx;
                                    currentMap.tokens[j].y = currentMap.tokens[j].y + dy;
                                    moveLinkedShapes(currentMap.tokens[j]);
                                }
                                
                            }
                        }
                        currentToken.x = request.body.x;
                        currentToken.y = request.body.y;
                        moveLinkedShapes(currentToken);
                    }
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;
        
        case "rotateDeg":
            loadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    let inputAngle = request.body.angle * -Math.PI / 180;
                    for (let j in currentMap.tokens)
                    {
                        if (j != i && currentMap.tokens[j].group == currentMap.tokens[i].group)
                        {
                            let oldX = currentMap.tokens[j].x - currentToken.x;
                            let oldY = currentMap.tokens[j].y - currentToken.y;
                            let radius = Math.sqrt(Math.pow(oldY, 2)+Math.pow(oldX, 2));

                            let currentAngle = Math.atan2(oldY, oldX);
                            let newX = Math.cos(currentAngle + inputAngle) * radius;
                            let newY = Math.sin(currentAngle + inputAngle) * radius;
                            currentMap.tokens[j].x = newX + currentToken.x;
                            currentMap.tokens[j].y = currentToken.y + newY;
                            moveLinkedShapes(currentMap.tokens[j]);
                        }
                    }
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;
        
        case "addDrawing":
            loadCurrentMap();
            let tmpDrawing = {};
            let isShape = false;
            switch(request.body.shape)
            {
                case "circle":
                    isShape = true;
                    tmpDrawing.x = Math.round(request.body.x);
                    tmpDrawing.y = Math.round(request.body.y);
                    tmpDrawing.radius = request.body.radius;
                    break;
                case "square":
                    isShape = true;
                    tmpDrawing.x = Math.round(request.body.x);
                    tmpDrawing.y = Math.round(request.body.y);
                    tmpDrawing.width = Math.round(request.body.width);
                    tmpDrawing.height = Math.round(request.body.height);
                    break;
                case "line":
                    isShape = true;
                    tmpDrawing.x = Math.round(request.body.x);
                    tmpDrawing.y = Math.round(request.body.y);
                    tmpDrawing.destX = Math.round(request.body.destX);
                    tmpDrawing.destY = Math.round(request.body.destY);
                    break;
                case "vertexLine":
                    isShape = true;
                    tmpDrawing.points = request.body.points;
                    break;
                case "5ftLine":
                    isShape = true;
                    tmpDrawing.x = Math.round(request.body.x);
                    tmpDrawing.y = Math.round(request.body.y);
                    tmpDrawing.range = request.body.range;
                    tmpDrawing.angle = request.body.angle;
                    break;
                case "cone":
                    isShape = true;
                    tmpDrawing.x = Math.round(request.body.x);
                    tmpDrawing.y = Math.round(request.body.y);
                    tmpDrawing.is90Deg = request.body.is90Deg;
                    tmpDrawing.angle = request.body.angle;
                    tmpDrawing.range = request.body.range;
                    break;
            }
            if (isShape)
            {
                tmpDrawing.visible = request.body.visible;
                tmpDrawing.shape = request.body.shape;
                tmpDrawing.id = currentMap.drawings.length;
                tmpDrawing.trueColor = request.body.trueColor;
                if (request.body.link != null)
                    tmpDrawing.link = request.body.link;
                currentMap.drawings.push(tmpDrawing);
                for (let token of currentMap.tokens)
                {
                    moveLinkedShapes(token);
                }
                saveCurrentMap();
            }
        
        response.send("[true]");
        break;

        case "editDrawing":
            loadCurrentMap();
            for (let i in currentMap.drawings)
            {
                let currentDrawing = currentMap.drawings[i];
                if (currentDrawing.id == request.body.id)
                {
                    if (currentDrawing.shape == "vertexLine" && request.body.both)
                    {
                        if (request.body.x != null || request.body.y != null)
                        {
                            let dx = request.body.x - currentDrawing.points[0].x;
                            let dy = request.body.y - currentDrawing.points[0].y;
                            if (request.body.moveShapeGroup)
                            {
                                moveShapeGroup(currentDrawing.id, dx, dy, currentDrawing.shapeGroup);
                            }
                            for (let i = 0; i < currentDrawing.points.length; i++)
                            {
                                currentDrawing.points[i].x = Math.round(currentDrawing.points[i].x + dx);
                                currentDrawing.points[i].y = Math.round(currentDrawing.points[i].y + dy);
                            }   
                        }
                    }
                    else
                    {
                        if ((request.body.x != null || request.body.y != null) && request.body.moveShapeGroup)
                        {
                            let dx = request.body.x - currentMap.drawings[i].x;
                            let dy = request.body.y - currentMap.drawings[i].y;
                            moveShapeGroup(currentDrawing.id, dx, dy, currentDrawing.shapeGroup);
                        }
                        if (request.body.points!=null)
                        { currentMap.drawings[i].points = request.body.points; }
                        if (request.body.destX!=null)
                        { currentMap.drawings[i].destX = Math.round(request.body.destX); }
                        if (request.body.destY!=null)
                        { currentMap.drawings[i].destY = Math.round(request.body.destY); }
                        if (request.body.x!=null)
                        {currentMap.drawings[i].x = Math.round(request.body.x);} 
                        if (request.body.y!=null)
                        { currentMap.drawings[i].y = Math.round(request.body.y); }
                        if (request.body.range!=null)
                        { currentMap.drawings[i].range = request.body.range; }
                        if (request.body.radius!=null)
                        { currentMap.drawings[i].radius = request.body.radius; }
                        if (request.body.angle!=null)
                        { currentMap.drawings[i].angle = request.body.angle; }
                        if (request.body.visible!=null)
                        { currentMap.drawings[i].visible = request.body.visible; }
                        if (request.body.shapeGroup!=null)
                        {
                            if (request.body.shapeGroup == "null")
                                currentMap.drawings[i].shapeGroup = null
                            else
                                currentMap.drawings[i].shapeGroup = request.body.shapeGroup;
                        }
                    }
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "removeDrawing":
            loadCurrentMap();    
            if (request.body.id == previousRemovedDrawingId && request.body.drawingsRemoved < removedDrawings)
            {
                response.send("[false]");
            }
            else
            {
                removeDrawingById(request.body.id);
                saveCurrentMap();
                response.send("[true]");
            }
            break;

        case "addBlocker":
            if (request.body.width != 0 && request.body.height != 0)
            {
                loadCurrentMap();    
                let tmpBlocker = {};
                tmpBlocker.id = currentMap.blockers.length;
                tmpBlocker.x = request.body.x;
                tmpBlocker.y = request.body.y;
                if (request.body.width>0)
                {
                    if (request.body.height<0)
                    {
                        tmpBlocker.y = tmpBlocker.y + request.body.height;
                        tmpBlocker.width = request.body.width;
                        tmpBlocker.height = Math.abs(request.body.height);
                    }
                    else
                    {
                        tmpBlocker.width = request.body.width;
                        tmpBlocker.height = request.body.height;
                    }
                }
                else
                {
                    if (request.body.height>0)
                    {
                        tmpBlocker.x = tmpBlocker.x + request.body.width;
                        tmpBlocker.width = Math.abs(request.body.width);
                        tmpBlocker.height = request.body.height;
                    }
                    else
                    {
                        tmpBlocker.y = tmpBlocker.y + request.body.height;
                        tmpBlocker.x = tmpBlocker.x + request.body.width;
                        tmpBlocker.width = Math.abs(request.body.width);
                        tmpBlocker.height = Math.abs(request.body.height);
                    }
                }
                
                currentMap.blockers.push(tmpBlocker);
                response.send("[true]");
                saveCurrentMap();
            }
            break;
        
        case "editBlocker":
            loadCurrentMap();
            for (let i in currentMap.blockers)
            {
                let currentBlocker = currentMap.blockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    currentMap.blockers[i].x = request.body.x;
                    currentMap.blockers[i].y = request.body.y;
                    currentMap.blockers[i].width = request.body.width;
                    currentMap.blockers[i].height = request.body.height;
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;
        
        case "removeBlocker":
            loadCurrentMap();
            let blockerFound = 0;
            for (let i in currentMap.blockers)
            {
                let currentBlocker = currentMap.blockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    blockerFound = i;
                    currentMap.blockers.splice(i, 1);
                }
            }
            for (let i = blockerFound; i < currentMap.blockers.length; i++)
            {
                currentMap.blockers[i].id = currentMap.blockers[i].id - 1;
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "addPolyBlocker":
            loadCurrentMap();
            let tmpPoly = {id: currentMap.polyBlockers.length, verts: []};
            tmpPoly.verts.push({x: request.body.x-request.body.offset.min, y: request.body.y+request.body.offset.min});
            tmpPoly.verts.push({x: request.body.x+request.body.offset.min, y: request.body.y+request.body.offset.min});
            tmpPoly.verts.push({x: request.body.x+request.body.offset.min, y: request.body.y-request.body.offset.min});
            tmpPoly.verts.push({x: request.body.x-request.body.offset.min, y: request.body.y-request.body.offset.min});
            currentMap.polyBlockers.push(tmpPoly);
            saveCurrentMap();
            response.send("[true]");
            break;
        
        case "editVert":
            loadCurrentMap();
            for (let i in currentMap.polyBlockers)
            {
                let currentBlocker = currentMap.polyBlockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    currentBlocker.verts[request.body.vertIndex].x = request.body.x;
                    currentBlocker.verts[request.body.vertIndex].y = request.body.y;
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "movePolyBlocker":
            loadCurrentMap();
            for (let i in currentMap.polyBlockers)
            {
                let currentBlocker = currentMap.polyBlockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    for (let j in currentBlocker.verts)
                    {
                        currentBlocker.verts[j].x = currentBlocker.verts[j].x + request.body.offsetX;
                        currentBlocker.verts[j].y = currentBlocker.verts[j].y + request.body.offsetY;
                    }
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "addCustomPolyBlocker":
            loadCurrentMap();
            let newPolyBlocker = {id: currentMap.polyBlockers.length, verts: JSON.parse(request.body.newPolyBlockerVerts)};
            currentMap.polyBlockers.push(newPolyBlocker);
            saveCurrentMap();
            response.send("[true]");
            break;
            
        case "addVert":
            loadCurrentMap();
            for (let i in currentMap.polyBlockers)
            {
                let currentBlocker = currentMap.polyBlockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    let prevVert = currentBlocker.verts[request.body.vertId];
                    let nextVertId = request.body.vertId+1;
                    if (nextVertId>=currentBlocker.verts.length) {
                        nextVertId = 0;
                    }
                    let nextVert = currentBlocker.verts[nextVertId];
                    let newVert = {x: (prevVert.x+nextVert.x)/2, y: (prevVert.y+nextVert.y)/2};
                    currentBlocker.verts.splice(nextVertId, 0, newVert);
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "removeVert":
            loadCurrentMap();
            for (let i in currentMap.polyBlockers)
            {
                let currentBlocker = currentMap.polyBlockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    currentBlocker.verts.splice(request.body.vertId, 1);
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "removePolyBlocker":
            loadCurrentMap();
            let polyBlockerFound = 0;
            for (let i in currentMap.polyBlockers)
            {
                let currentBlocker = currentMap.polyBlockers[i];
                if (currentBlocker.id == request.body.id)
                {
                    polyBlockerFound = i;
                    currentMap.polyBlockers.splice(i, 1);
                }
            }
            for (let i = polyBlockerFound; i < currentMap.polyBlockers.length; i++)
            {
                currentMap.polyBlockers[i].id = currentMap.polyBlockers[i].id - 1;
            }
            saveCurrentMap();
            response.send("[true]");
            break;
        
        case "invertBlockers":
            loadCurrentMap();
            currentMap.antiBlockerOn = !currentMap.antiBlockerOn;
            saveCurrentMap();
            response.send("[true]");
            break;

        case "exportMap":
            console.log("Exporting: " + selectedMap);
            copyFile(dataFolder + selectedMap + ".json", publicFolder + "export/export.json");
            response.send("[true]");
            break;

        case "clearTokens":
            loadCurrentMap();
            currentMap.tokens = [];
            for (let i = 0; i < currentMap.drawings.length; i++)
            {
                if (currentMap.drawings[i].link!=null)
                {
                    removeDrawingById(currentMap.drawings[i].link);
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "clearDrawings":
            loadCurrentMap();
            currentMap.drawings = [];
            saveCurrentMap();
            response.send("[true]");
            break;

        case "clearBlockers":
            loadCurrentMap();
            currentMap.blockers = [];
            currentMap.polyBlockers = [];
            saveCurrentMap();
            response.send("[true]");
            break;

        case "switchBlockerType":
            loadCurrentMap();
            currentMap.usePolyBlockers = !currentMap.usePolyBlockers;
            saveCurrentMap();
            response.send("[true]");
            break;
    
        case "sortTracker":
            loadCurrentMap();
            if (currentMap.tokens.length>0)
            {
                let tmpTokens = [];
                tmpTokens.push(currentMap.tokens[0]);
                if (currentMap.tokens.length>1)
                {
                    for (let f = 1; f<currentMap.tokens.length; f++)
                    {
                        let currentLength = tmpTokens.length;
                        for (let g = 0; g<currentLength; g++)
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
            saveCurrentMap();
            response.send("[true]");
            break;
    
        case "switchTrackerPosition":
            loadCurrentMap();
            let origin = parseInt(request.body.origin);
            let target = parseInt(request.body.target);
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
            saveCurrentMap();
            response.send("[true]");
            break;
    }
});

app.post('/upload', function(req, res) {
    if (req.body.isDM == 'on')
    {
        if (!req.files || Object.keys(req.files).length === 0)
        {
            return res.status(400).send('No files were uploaded.');
        }
        let sampleFile = req.files.mapFile;
        sampleFile.mv(dataFolder + req.files.mapFile.name, function(err)
        {
            if (err)
                return res.status(500).send(err);
            res.send('File uploaded!');
        });
    }
    else
    {
        res.send("false");
    }
});

app.use(express.static('client'));
app.listen(port);

function checkGroupLock()
{
    for (let i = currentMap.groupLock.length-1; i >= 0; i--)
    {
        let groupActive = false;
        let maxLayerInGroup = 0;
        for (let j = 0; j < currentMap.tokens.length; j++)
        {
            let currentToken = currentMap.tokens[j];
            if (currentToken.group==currentMap.groupLock[i])
            {
                if (maxLayerInGroup<currentToken.layer)
                    maxLayerInGroup = currentToken.layer;
                if (currentToken.layer<maxLayerInGroup)
                    currentToken.layer = maxLayerInGroup;
                groupActive = true;
            }
        }
        if (!groupActive)
        {
            currentMap.groupLock.splice(i, 1);
        }
        else
        {
            for (let j = 0; j < currentMap.tokens.length; j++)
            {
                let currentToken = currentMap.tokens[j];
                if (currentToken.group!=currentMap.groupLock[i])
                {
                    if (currentToken.layer <= maxLayerInGroup)
                        currentMap.tokens[j].layer = maxLayerInGroup+1;
                }
            }
        }
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
    {
        if (currentMap.drawings[i].link == tokenData.id && currentMap.drawings[i].shape == "circle")
        {
            currentMap.drawings[i].radius += (newSize-tokenData.size)*0.5;
        }
    } 
}

function removeDrawingById(targetId) {
    let shapeFound = 0;
    for (let i in currentMap.drawings)
    {
        let currentDrawing = currentMap.drawings[i];
        if (currentDrawing.id == targetId)
        {
            shapeFound = i;
            currentMap.drawings.splice(i, 1);
        }
    }
    for (let i = shapeFound; i < currentMap.drawings.length; i++)
    {
        currentMap.drawings[i].id = currentMap.drawings[i].id - 1;
    }
    previousRemovedDrawingId = targetId;
    removedDrawings++;
}

function loadCurrentMap() 
{
    currentMap = JSON.parse(readFile("data/" + selectedMap + ".json"));
    if (currentMap.offsetX == null)
        currentMap.offsetX = 0;
    if (currentMap.antiBlockerOn == null)
        currentMap.antiBlockerOn = false;
    if (currentMap.offsetY == null)
        currentMap.offsetY = 0;
    if (currentMap.gridColor == null)
        currentMap.gridColor = "#222222FF";
    if (currentMap.usePolyBlockers == null)
        currentMap.usePolyBlockers = false;
    if (currentMap.polyBlockers == null)
        currentMap.polyBlockers = [];
    if (currentMap.portalX != null)
        delete currentMap.portalX;
    if (currentMap.portalY != null)
        delete currentMap.portalY;
    if (currentMap.groupLock == null)
        currentMap.groupLock = [];
    if (currentMap.portalData == null || currentMap.portalData=="")
        currentMap.portalData = [];
    if (currentMap.groupPresets == null)
        currentMap.groupPresets = [];
    currentMap.mapName = selectedMap;
    currentMap.tokenList = readDirectory(publicFolder + "tokens", "jpg|png|jpeg|gif");
    currentMap.dmTokenList = readDirectory(publicFolder + "dmTokens", "jpg|png|jpeg|gif");
    currentMap.mapSourceList = readDirectory(publicFolder + "maps", "jpg|png|jpeg|gif");
    currentMap.maps = returnMaps();
}

function saveCurrentMap() 
{
    writeFile("data/" + selectedMap + ".json", JSON.stringify(currentMap, null, 4));
}

function returnMaps() 
{
    let tmpMaps = readDirectory("data/", "json");
    for (let i in tmpMaps)
    {
        tmpMaps[i] = tmpMaps[i].split(".")[0];
    }
    return tmpMaps;
}

//#region Low level functions
function minMax(value, min, max)
{
    if (value > min && value < max)
        return true;
    else
        return false;
}

function renameFile(file, newName)
{
    try { fs.renameSync(file, pathLib.dirname(file) + "\\" + newName + pathLib.extname(file)); }
    catch (err) { console.log("Error: " + err); return false; }
    return true;
}

function renameFolder(path, newName) 
{
    try { fs.renameSync(path, pathLib.dirname(path) + "\\" + newName); }
    catch (err) { console.log("Error: " + err); return false;}
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
            let data = fs.readFileSync(file, 'utf-8');
            fileReadSuccess = true;
            return data;
        }
        catch (err) { console.log("Error: " + err); }
    }
}

function writeFile(file, content) 
{
    //Function that synchronously writes a file
    try { fs.writeFileSync(file, content, 'utf-8'); }
    catch(err) { console.log("Error: " + err); return false;}
    return true;
}

function readFileHex(file) 
{
    //Function that synchronously reads a file
    try { return fs.readFileSync(file, 'hex') }
    catch (err) { console.log("Error: " + err); return false;}
}

function writeFileHex(file, content) 
{
    //Function that synchronously writes a file
    try { fs.writeFileSync(file, content, 'hex'); }
    catch(err) { console.log("Error: " + err); return false;}
    return true;
}

function deletefile(file) 
{
    try { fs.unlinkSync(file); }
    catch(err) { console.log("Error: " + err); return false;}
    return true;
}

function fileExists(file) 
{
    try { return fs.existsSync(file); }
    catch(err) { console.log("Error: " + err);}
}

function copyFile(source, destination) 
{
    try { fs.copyFileSync(source, destination); }
    catch (err) { console.log("Error: " + err); return false;}
    return true;
}

function copyFileHex(source, destination) 
{
    var tmp = readFileHex(source);
    writeFileHex(destination, tmp);
}

function readDirectory(path, filter) 
{
    //Function that reads all the file names in a directory and returns an array of file names that are filtered
    //so only certain file types are counted. the desired filetypes were delimited with a "|" in the paramter "filter"
    try {
    //Read the complete folder
    var dirData = fs.readdirSync(path);
    //Filter function
    var returnData = [];
    var fileTypes = filter.split("|");
        for (var i = 0; i < dirData.length; i++) 
        {
            var correctType = false;
            for (var j = 0; j < fileTypes.length; j++)
            {
                if (dirData[i].includes(fileTypes[j])) 
                {
                    correctType = true;
                }
            }
            if (correctType) 
            {
                returnData.push(dirData[i]);
            }
        }
    } catch (err) { console.log("Error: " + err); return false;}
    //Return array with only file types described in "filter"
    return returnData;
}

function createDirectory(path) 
{
    try { fs.mkdirSync(path); }
    catch (err) { console.log("Error: " + err); return false;}
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
                {
                    deleteDirectory(curPath);
                }
                else
                {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    catch(err) { console.log("Error: " + err); return false;}
    return true;
}

//#endregion

//#region Cookies
function GetCookie(request, cookieName) 
{
    if (request.headers.cookie)
    {
        let cookies = request.headers.cookie.replace(/ /g, '').split(";");
        for (let i in cookies)
        {
            let splitCookie = cookies[i].split("=");
            if (splitCookie[0] == cookieName)
                return splitCookie[1];
        }
    }
    return "No cookie!";
}
//#endregion