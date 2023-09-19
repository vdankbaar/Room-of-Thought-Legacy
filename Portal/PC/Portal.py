import requests
import serial
import time
import math
import os
import serial.tools.list_ports
import json

def requestServer(requestData):
    r = requests.post(rotAddress, data=requestData, cookies=cookies)
    return r.json()

def findOriginToken():
    global foundOriginPreviously
    for tokenData in mapData['tokens']:
        if 'text' in tokenData:
            if tokenData['text'] == portalText:
                foundOriginPreviously = True
                global originX
                newOriginX = math.floor((tokenData['x']-mapData['offsetX'])/gridXSize)
                global originY
                newOriginY = math.floor((tokenData['y']-mapData['offsetY'])/gridYSize)
                if newOriginX!=originX or newOriginY!=originY:
                    originX = newOriginX
                    originY = newOriginY
                    updateServerData()
                return True
    if foundOriginPreviously:
        print("Couldn't find an origin token with the name: " + portalText)
        foundOriginPreviously = False
    return False

def placedToken(boardPosition):
    if len(liftedMini)>0:
        miniLink = liftedMini.pop()
        updateLiftedData()
        for link in links:
            if link['x']==miniLink['x'] and link['y']==miniLink['y']:
                link['x'] = boardPosition['x']
                link['y'] = boardPosition['y']
                break
        if miniLink['id']!=-1:
            movedToken = tokenByID(miniLink['id'])
            bypassLink = True
            if 'objectLock' in movedToken:
                bypassLink = not movedToken['objectLock']
            requestServer({"c": "moveToken", "id": miniLink['id'], "x": int((boardPosition['x']+originX+0.5*movedToken['size'])*gridXSize)+mapData['offsetX']+1, "y": int((boardPosition['y']+originY+0.5*movedToken['size'])*gridYSize)+mapData['offsetY']+1, "bypassLink":bypassLink})
            print("Moved mini to " + str(boardPosition['x']) + ":" + str(boardPosition['y']))
        else:
            print("Moved mini wasn't linked to a token")
    else:
        links.append({'x': boardPosition['x'], 'y': boardPosition['y'], 'id': -1})
        print("Created new link at " + str(boardPosition['x']) + ":" + str(boardPosition['y']))
    updateServerData()


def tokenByID(id):
    for token in mapData['tokens']:
        if id == token['id']:
            return token

def removedToken(boardPosition):
    for link in links:
        if link['x']==boardPosition['x'] and link['y']==boardPosition['y']:
            print("Picked up mini at "+str(link['x'])+":"+str(link['y']))
            liftedMini.append(link)
            updateLiftedData()
            return
    print("The picked up mini didn't have a link!")

def updateLiftedData():
    global portalID
    newId = requestServer({'c': 'setLiftedMinis', 'id': portalID, 'lifted': json.dumps(liftedMini)})
    if not portalID==newId:
        print("New portal id: "+str(newId))
        portalID = newId

def updateServerData():
    global portalID
    newId = requestServer({'c': 'setPortalData', 'x': portalX, 'y': portalY, 'links': json.dumps(links), 'id': portalID, 'name': portalText, 'originX': originX, 'originY': originY, 'lifted': json.dumps(liftedMini)})
    if not portalID==newId:
        print("New portal id: "+str(newId))
        portalID = newId

try:
    portArray = []
    for port, desc, hwid in sorted(serial.tools.list_ports.comports()):
        portArray.append(port)
        print("{}: {} {}".format(len(portArray)-1, port, desc))
    x = input("Enter the number of the portal: ")
    ser = serial.Serial(timeout=0)
    ser.port = portArray[int(x)]
    ser.baudrate = 500000
    try:
        ser.open()
        print("Creating the portal...")
    except serial.SerialException:
        print("That port may be already in use by another application!")
        exit()

    testData = ser.read_all()
    while len(testData)==0:
        testData = ser.read_all()
        ser.flushInput()
        ser.flushOutput()
        ser.write(b"a\n")
        time.sleep(1)

    f = open("config.txt", "r")
    portalX = int(f.readline().split("=")[1])
    portalY = int(f.readline().split("=")[1])
    portalText = f.readline().split("=")[1].replace("\n","")
    ipAddress = f.readline().split("=")[1].replace("\n","")
    cookies = {"playerName": portalText}
    rotAddress = "http://" + ipAddress + "/api"
    print("Connecting to "+rotAddress)
    portalID = -1
    originFound = False
    originX = 0
    originY = 0
    gridXSize = 0
    gridYSize = 0
    mapData = {}
    links = []
    liftedMini = []
    foundOriginPreviously = True
    updateServerData()
    updateLiftedData()
    ser.write(b"b")
    previousBoardGrid = []
    boardGrid = []
    for i in range(0, portalX*portalY):
        boardGrid.append(0)
    previousBoardGrid = boardGrid.copy()
    serData = ""
    ser.flushInput()
    ser.flushOutput()

    while 1:
        time.sleep(0.2)
        mapData = requestServer({"c": "currentMapData"})
        if portalID<len(mapData['portalData']):
            newLinks = mapData['portalData'][portalID]['links']
            checkLifted = len(newLinks)<len(links)
            links = newLinks
            liftedMini = mapData['portalData'][portalID]['lifted']
            if checkLifted:
                for mini in liftedMini:
                    linkExists = False
                    for link in links:
                        if link['x']==mini['x'] and link['y'] == mini['y']:
                            linkExists = True
                    if not linkExists:
                        liftedMini.remove(mini)
        else:
            updateServerData()
        gridXSize = mapData['mapX']/mapData['x']
        gridYSize = mapData['mapY']/mapData['y']
        originFound = findOriginToken()
        if originFound:
            serData += str(ser.read_all(), 'utf-8')
            serData = serData.replace("Test", "")
            if len(serData)>=portalX*portalY:
                recentValue = serData.split("|")[len(serData.split("|"))-2]
                boardGrid = [int(x) for x in recentValue]
                if (len(boardGrid)>0):
                    for i in range(0, len(boardGrid)):
                        boardPosition = {'x': i%portalX, 'y': math.floor(i/portalX)}
                        if previousBoardGrid[i]<boardGrid[i]:
                            placedToken(boardPosition)
                        if previousBoardGrid[i]>boardGrid[i]:
                            removedToken(boardPosition)
                    previousBoardGrid = boardGrid.copy()
                serData = ""
        else:
            print("No origin token found!")
            ser.flushInput()
            ser.flushOutput()
            serData = ""
            time.sleep(1)
except Exception as err:
    print(err)
    requestServer({'c':'setPortalData', 'id':portalID, 'crash': err})
