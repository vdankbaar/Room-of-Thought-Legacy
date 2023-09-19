let gridDiv = document.getElementById("gridDiv");
let updateInterval = 1000;
let mapData;
Setup();

async function Setup()
{
    await updateMapData();
    setInterval(function() {updateMapData();}, updateInterval);
}

async function updateMapData()
{
    mapData = await requestServer({c: "currentMapData"});
}
//#region Low level
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