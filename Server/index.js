const fs = require('fs');
const pathLib = require('path');
var express = require("express");
var bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
var app = express();
let dataFolder = __dirname+"/data/";
let publicFolder = __dirname+"/client/public/";
let selectedMap = "currentSettings";
var currentMap;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());
LoadCurrentMap();
let removedTokens = 0;
let previousRemovedTokenId = -1;
let removedDrawings = 0;
let previousRemovedDrawingId = -1;
let playerNameList = [];

app.post("/api", function(request, response) {
    let playerName = GetCookie(request, "playerName");
    if (!playerNameList.includes(playerName))
    {
        console.log("A new player has connected: "+playerName);
        playerNameList.push(playerName);
        console.log("Currently connected: "+JSON.stringify(playerNameList));
    }
    if (request.body.c!="currentMapData")
        console.log(playerName+": "+JSON.stringify(request.body));
    switch(request.body.c) 
    {
        case "currentMapData":
            LoadCurrentMap();
            currentMap.removedTokens = removedTokens;
            currentMap.removedDrawings = removedDrawings;
            response.send(JSON.stringify(currentMap));
            break;

        case "changeSelectedMap":
            selectedMap = request.body.selectedMap;
            response.send(true);
            break


        case "createToken":
            if (minMax(request.body.size, 0, 20))
            {
                let tmpToken = {};
                tmpToken.id = currentMap.tokens.length;
                tmpToken.x = request.body.x;
                tmpToken.y = request.body.y;
                tmpToken.image = request.body.image;
                tmpToken.size = request.body.size;
                tmpToken.status = request.body.status;
                if (request.body.hidden!=null)
                    tmpToken.hidden = request.body.hidden;
                currentMap.tokens.push(tmpToken);
                response.send("[true]");
                SaveCurrentMap();
            }
            else
            {
                response.send("[false]");
            }
            break;
        
        case "setTokenHidden":
            LoadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    currentToken.hidden = request.body.hidden;
                    console.log("Changed to: "+request.body.hidden);
                }
            }
            SaveCurrentMap();
            response.send("[true]");
            break;

        case "editToken":
            LoadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    if (minMax(request.body.size, 0, 20))
                    {
                        currentMap.tokens[i].status = request.body.status;
                        currentMap.tokens[i].size = request.body.size;
                    }
                }
            }
            SaveCurrentMap();
            response.send("[true]");

        case "changeStatus":
            request.body.id;
            request.body.status;
            break;

        case "removeToken":
            LoadCurrentMap();
            if (request.body.id==previousRemovedTokenId && request.body.tokensRemoved < removedTokens)
            {
                response.send("[false]");
            }
            else
            {
                let tokenFound = 0;
                for (let i in currentMap.tokens)
                {
                    let currentToken = currentMap.tokens[i];
                    if (currentToken.id == request.body.id)
                    {
                        tokenFound = i;
                        currentMap.tokens.splice(i, 1);
                    }
                }
                for (let i = tokenFound; i<currentMap.tokens.length; i++)
                {
                    currentMap.tokens[i].id = currentMap.tokens[i].id-1;
                }
                SaveCurrentMap();
                response.send("[true]");
                removedTokens++;
                previousRemovedTokenId = request.body.id;
            }
            break;

        case "moveToken":
            LoadCurrentMap();
            for (let i in currentMap.tokens)
            {
                let currentToken = currentMap.tokens[i];
                if (currentToken.id == request.body.id)
                {
                    currentMap.tokens[i].x = request.body.x;
                    currentMap.tokens[i].y = request.body.y;
                }
            }
            SaveCurrentMap();
            response.send("[true]");
            break;
        
        case "addDrawing":
            LoadCurrentMap();
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
                case "line":
                    isShape = true;
                    tmpDrawing.x = request.body.x;
                    tmpDrawing.y = request.body.y;
                    tmpDrawing.destX = request.body.destX;
                    tmpDrawing.destY = request.body.destY;
                    break;
            }
            if (isShape)
            {
                tmpDrawing.shape = request.body.shape;
                tmpDrawing.id = currentMap.drawings.length;
                tmpDrawing.trueColor = request.body.trueColor;
                currentMap.drawings.push(tmpDrawing);
                SaveCurrentMap();
            }
        
        response.send("[true]");
        break;

        case "editDrawing":
            LoadCurrentMap();
            for (let i in currentMap.drawings)
            {
                let currentDrawing = currentMap.drawings[i];
                console.log(currentDrawing);
                if (currentDrawing.id == request.body.id)
                {
                    if (currentMap.drawings[i].shape=="line")
                    {
                        let dx = currentMap.drawings[i].destX - currentMap.drawings[i].x;
                        let dy = currentMap.drawings[i].destY - currentMap.drawings[i].y;
                        currentMap.drawings[i].destX = request.body.x + dx;
                        currentMap.drawings[i].destY = request.body.y + dy;
                    }
                    currentMap.drawings[i].x = request.body.x;
                    currentMap.drawings[i].y = request.body.y;
                }
            }
            SaveCurrentMap();
            response.send("[true]");
            break;

        case "removeDrawing":
            LoadCurrentMap();    
            if (request.body.id==previousRemovedDrawingId && request.body.drawingsRemoved < removedDrawings)
            {
                response.send("[false]");
            }
            else
            {
            
                let shapeFound = 0;
                for (let i in currentMap.drawings)
                {
                    let currentDrawing = currentMap.drawings[i];
                    if (currentDrawing.id == request.body.id)
                    {
                        shapeFound = i;
                        currentMap.drawings.splice(i, 1);
                    }
                }
                for (let i = shapeFound; i<currentMap.drawings.length; i++)
                {
                    currentMap.drawings[i].id = currentMap.drawings[i].id-1;
                }
                SaveCurrentMap();
                response.send("[true]");
                previousRemovedDrawingId = request.body.id;
                removedDrawings++;
            }
            break;

        case "addBlocker":
            LoadCurrentMap();    
            let tmpBlocker = {};
            tmpBlocker.id = currentMap.blockers.length;
            tmpBlocker.x = request.body.x;
            tmpBlocker.y = request.body.y;
            tmpBlocker.width = request.body.width;
            tmpBlocker.height = request.body.height;
            currentMap.blockers.push(tmpBlocker);
            response.send("[true]");
            SaveCurrentMap();
            break;
        
        case "editBlocker":
            LoadCurrentMap();
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
            SaveCurrentMap();
            response.send("[true]");
            break;

        case "removeBlocker":
            LoadCurrentMap();
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
            for (let i = blockerFound; i<currentMap.blockers.length; i++)
            {
                currentMap.blockers[i].id = currentMap.blockers[i].id-1;
            }
            SaveCurrentMap();
            response.send("[true]");
            break;

        case "exportMap":
            copyFile(dataFolder+"currentSettings.json", publicFolder+"export/currentSettings.json");
            response.send("[true]");
            break;
    }
});

app.post('/upload', function(req, res) {
    if (req.body.isDM=='on')
    {
        if (!req.files || Object.keys(req.files).length === 0)
        {
            return res.status(400).send('No files were uploaded.');
        }
        let sampleFile = req.files.mapFile;
        console.log(sampleFile);
        sampleFile.mv(dataFolder+req.files.mapFile.name, function(err)
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
app.listen(80);

function LoadCurrentMap() 
{
    currentMap = JSON.parse(readFile("data/"+selectedMap+".json"));
    currentMap.mapName = selectedMap;
    currentMap.tokenList = readDirectory(publicFolder+"tokens", "jpg|png");
    currentMap.dmTokenList = readDirectory(publicFolder+"dmTokens", "jpg|png");
    currentMap.maps = ReturnMaps();
}

function SaveCurrentMap() 
{
    writeFile("data/"+selectedMap+".json", JSON.stringify(currentMap));
}

function ReturnMaps() 
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
    if (value>min && value<max)
        return true;
    else
        return false;
}

function renameFile(file, newName)
{
    try { fs.renameSync(file, pathLib.dirname(file)+"\\"+newName+pathLib.extname(file)); }
    catch (err) { console.log("Error: "+err); return false; }
    return true;
}

function renameFolder(path, newName) 
{
    try { fs.renameSync(path, pathLib.dirname(path)+"\\"+newName); }
    catch (err) { console.log("Error: "+err); return false;}
    return true;
}

function readFile(file) 
{
    //Function that synchronously reads a file
    try { return fs.readFileSync(file, 'utf-8') }
    catch (err) { console.log("Error: "+err); return false;}
}

function writeFile(file, content) 
{
    //Function that synchronously writes a file
    try { fs.writeFileSync(file, content, 'utf-8'); }
    catch(err) { console.log("Error: "+err); return false;}
    return true;
}

function readFileHex(file) 
{
    //Function that synchronously reads a file
    try { return fs.readFileSync(file, 'hex') }
    catch (err) { console.log("Error: "+err); return false;}
}

function writeFileHex(file, content) 
{
    //Function that synchronously writes a file
    try { fs.writeFileSync(file, content, 'hex'); }
    catch(err) { console.log("Error: "+err); return false;}
    return true;
}

function deletefile(file) 
{
    try { fs.unlinkSync(file); }
    catch(err) { console.log("Error: "+err); return false;}
    return true;
}

function fileExists(file) 
{
    try { return fs.existsSync(file); }
    catch(err) { console.log("Error: "+err);}
}

function copyFile(source, destination) 
{
    try { fs.copyFileSync(source, destination); }
    catch (err) { console.log("Error: "+err); return false;}
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
        for (var i = 0; i<dirData.length; i++) 
        {
            var correctType = false;
            for (var j = 0; j<fileTypes.length; j++)
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
    } catch (err) { console.log("Error: "+err); return false;}
    //Return array with only file types described in "filter"
    return returnData;
}

function createDirectory(path) 
{
    try { fs.mkdirSync(path); }
    catch (err) { console.log("Error: "+err); return false;}
    return true;
}

function deleteDirectory(path) 
{
    try 
    {
        if( fs.existsSync(path) ) 
        {
            fs.readdirSync(path).forEach(function(file,index)
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
    catch(err) { console.log("Error: "+err); return false;}
    return true;
}

//#endregion

//#region Cookies
function GetCookie(request, cookieName) 
{
    let cookies = request.headers.cookie.replace(/ /g,'').split(";");
    for (let i in cookies)
    {
        let splitCookie = cookies[i].split("=");
        if (splitCookie[0]==cookieName)
            return splitCookie[1];
    }
    return "No cookie!";
}
//#endregion

