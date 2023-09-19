//Mocht port 80 geblokeerd zijn door windows, voer de command 'net stop http' uit in een shell met admin
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
saveCurrentMap();
let removedTokens = 0;
let previousRemovedTokenId = -1;
let removedDrawings = 0;
let previousRemovedDrawingId = -1;
let playerNameList = [];

app.post("/api", function(request, response) {
    let playerName = GetCookie(request, "playerName");
    if (!playerNameList.includes(playerName) && playerName != "")
    {
        console.log("A new player has connected: " + playerName);
        playerNameList.push(playerName);
        console.log("Currently connected: " + JSON.stringify(playerNameList));
    }
    if (request.body.c != "currentMapData")
        console.log(playerName + ": " + JSON.stringify(request.body));
    switch(request.body.c) 
    {
        case "currentMapData":
            loadCurrentMap();
            currentMap.removedTokens = removedTokens;
            currentMap.removedDrawings = removedDrawings;
            response.send(JSON.stringify(currentMap));
            break;
        
        case "setMapData":
            loadCurrentMap();
            if (request.body.map!=null) {currentMap.map = request.body.map;}
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
                currentMap.tokens.push(tmpToken);
                response.send("[true]");
                saveCurrentMap();
            }
            else
            {
                response.send("[false]");
            }
            break;

        case "setTokenHidden":
            loadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    currentToken.hidden = request.body.hidden;
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "editToken":
            loadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    if (request.body.status != null)
                        currentMap.tokens[i].status = request.body.status;
                    if (request.body.size != null)
                        if (minMax(request.body.size, 0, 20))
                            currentMap.tokens[i].size = request.body.size;
                    if (request.body.layer != null)
                        currentMap.tokens[i].layer = request.body.layer;
                    if (request.body.group != null)
                    {
                        if (request.body.group == "reset")
                            currentMap.tokens[i].group = null;
                        else
                            currentMap.tokens[i].group = request.body.group;
                    }
                    if (request.body.initiative != null)
                    {
                        if (request.body.initiative == "reset")
                            currentMap.tokens[i].initiative = null;
                        else    
                            currentMap.tokens[i].initiative = request.body.initiative;
                    }
                    if (request.body.name != null)
                        currentMap.tokens[i].name = request.body.name;
                    if (request.body.ac != null)
                        currentMap.tokens[i].ac = request.body.ac;
                    if (request.body.hp != null)
                        currentMap.tokens[i].hp = request.body.hp;
                    if (request.body.notes != null)
                        currentMap.tokens[i].notes = request.body.notes;
                    if (request.body.image != null)
                        currentMap.tokens[i].image = request.body.image;
                    if (request.body.text != null)
                        currentMap.tokens[i].text = request.body.text;
                    if (request.body.dm != null)
                        currentMap.tokens[i].dm = request.body.dm;
                }
            }
            saveCurrentMap();
            response.send("[true]");

        case "changeStatus":
            request.body.id;
            request.body.status;
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
                {
                    if (currentMap.tokens[h].id==request.body.id)
                    {
                        currentMap.tokens.splice(h, 1);
                    }
                }
                for (let i = 0; i<currentMap.drawings.length; i++)
                {
                    if (currentMap.drawings[i].link == request.body.id)
                    {
                        removeDrawingById(currentMap.drawings[i].id);
                    }
                }
                saveCurrentMap();
                response.send("[true]");
                removedTokens++;
                previousRemovedTokenId = request.body.id;
            }
            break;

        case "moveToken":
            loadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    let dx = request.body.x - currentMap.tokens[i].x;
                    let dy = request.body.y - currentMap.tokens[i].y;
                    if (currentMap.tokens[i].group != null && !request.body.bypassLink)
                    {
                        for (let j in currentMap.tokens)
                        {
                            if (j != i && currentMap.tokens[j].group == currentMap.tokens[i].group)
                            {
                                currentMap.tokens[j].x = currentMap.tokens[j].x + dx;
                                currentMap.tokens[j].y = currentMap.tokens[j].y + dy;
                                moveLinkedShapes(currentMap.tokens[j]);
                            }
                            
                        }
                    }
                    currentMap.tokens[i].x = request.body.x;
                    currentMap.tokens[i].y = request.body.y;
                    moveLinkedShapes(currentMap.tokens[i]);
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;
        
        case "rotateLeft":
            loadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    for (let j in currentMap.tokens)
                    {
                        if (j != i && currentMap.tokens[j].group == currentMap.tokens[i].group)
                        {
                            let dx = currentMap.tokens[j].x - currentMap.tokens[i].x;
                            let dy = currentMap.tokens[j].y - currentMap.tokens[i].y;
                            currentMap.tokens[j].x = currentMap.tokens[i].x + dy;
                            currentMap.tokens[j].y = currentMap.tokens[i].y - dx;
                            moveLinkedShapes(currentMap.tokens[j]);
                        }
                    }
                }
            }
            saveCurrentMap();
            response.send("[true]");
            break;

        case "rotateRight":
            loadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    for (let j in currentMap.tokens)
                    {
                        if (j != i && currentMap.tokens[j].group == currentMap.tokens[i].group)
                        {
                            let dx = currentMap.tokens[j].x - currentMap.tokens[i].x;
                            let dy = currentMap.tokens[j].y - currentMap.tokens[i].y;
                            currentMap.tokens[j].x = currentMap.tokens[i].x - dy;
                            currentMap.tokens[j].y = currentMap.tokens[i].y + dx;
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
                    tmpDrawing.x = request.body.x;
                    tmpDrawing.y = request.body.y;
                    tmpDrawing.radius = request.body.radius;
                    break;
                case "square":
                    isShape = true;
                    tmpDrawing.x = request.body.x;
                    tmpDrawing.y = request.body.y;
                    tmpDrawing.width = request.body.width;
                    tmpDrawing.height = request.body.height;
                    break;
                case "line":
                    isShape = true;
                    tmpDrawing.x = request.body.x;
                    tmpDrawing.y = request.body.y;
                    tmpDrawing.destX = request.body.destX;
                    tmpDrawing.destY = request.body.destY;
                    break;
                case "cone":
                    isShape = true;
                    tmpDrawing.x = request.body.x;
                    tmpDrawing.y = request.body.y;
                    tmpDrawing.angle = request.body.angle;
                    tmpDrawing.range = request.body.range;
                    break;
            }
            if (isShape)
            {
                tmpDrawing.shape = request.body.shape;
                tmpDrawing.id = currentMap.drawings.length;
                tmpDrawing.trueColor = request.body.trueColor;
                if (request.body.link != null)
                    tmpDrawing.link = request.body.link;
                currentMap.drawings.push(tmpDrawing);
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
                    switch(currentMap.drawings[i].shape)
                    {
                        case "cone":
                            currentMap.drawings[i].angle = request.body.angle;
                            break;

                        case "line":
                            let dx = currentMap.drawings[i].destX - currentMap.drawings[i].x;
                            let dy = currentMap.drawings[i].destY - currentMap.drawings[i].y;
                            currentMap.drawings[i].destX = request.body.x + dx;
                            currentMap.drawings[i].destY = request.body.y + dy;
                            currentMap.drawings[i].x = request.body.x;
                            currentMap.drawings[i].y = request.body.y;
                            break;

                        default:
                            currentMap.drawings[i].x = request.body.x;
                            currentMap.drawings[i].y = request.body.y;
                            break;
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
            tmpPoly.verts.push({x: request.body.x, y: request.body.y+request.body.offset});
            tmpPoly.verts.push({x: request.body.x+request.body.offset, y: request.body.y});
            tmpPoly.verts.push({x: request.body.x-request.body.offset, y: request.body.y});
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

function moveLinkedShapes(tokenData) 
{
    for (let i = 0; i < currentMap.drawings.length; i++)
    {
        if (currentMap.drawings[i].link == tokenData.id)
        {
            currentMap.drawings[i].x = tokenData.x;
            currentMap.drawings[i].y = tokenData.y;
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
    currentMap.mapName = selectedMap;
    currentMap.tokenList = readDirectory(publicFolder + "tokens", "jpg|png");
    currentMap.dmTokenList = readDirectory(publicFolder + "dmTokens", "jpg|png");
    currentMap.mapSourceList = readDirectory(publicFolder + "maps", "jpg|png");
    currentMap.maps = returnMaps();
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
                    if (tmpTokens[g].initiative < currentMap.tokens[f].initiative)
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
            currentMap.tokens = tmpTokens;
        }
    }
}

function saveCurrentMap() 
{
    writeFile("data/" + selectedMap + ".json", JSON.stringify(currentMap));
}

function returnMaps() 
{
    let tmpMaps = readDirectory("data/", "json");
    for (i in tmpMaps)
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
    try { return fs.readFileSync(file, 'utf-8') }
    catch (err) { console.log("Error: " + err); return false;}
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
    let cookies = request.headers.cookie.replace(/ /g, '').split(";");
    for (let i in cookies)
    {
        let splitCookie = cookies[i].split("=");
        if (splitCookie[0] == cookieName)
            return splitCookie[1];
    }
    return "No cookie!";
}
//#endregion