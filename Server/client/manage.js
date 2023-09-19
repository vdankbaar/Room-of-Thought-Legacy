let fileList = document.getElementById("fileList");
let currentFolderInput = document.getElementById("currentFolder");
let publicFolderButton = document.getElementById("publicFolderButton");
let dataFolderButton = document.getElementById("dataFolderButton");
let formFolder = document.getElementById("formFolder");
let submitButton = document.getElementById("submitButton");
let formSubmit = document.getElementById("formSubmit");
let files;

refreshList();

setInterval(refreshList, 3000);

publicFolderButton.onclick = function() {
    currentFolderInput.value = "client/public";
    formFolder.value = "client/public";
    refreshList();
}

dataFolderButton.onclick = function() {
    currentFolderInput.value = "data";
    formFolder.value = "data";
    refreshList();
}

submitButton.onclick = function() {
    formSubmit.click();
}

async function refreshList() {
    let prevFiles = files ? files.join() : "";
    files = await listDir(currentFolderInput.value, "");
    if (prevFiles==files.join())
        return;
    
    fileList.style.border = "2px solid black";
    fileList.innerHTML = "";
    if (currentFolderInput.value != "data" && currentFolderInput.value != "client/public") {
        let returnElement = document.createElement("li");
        returnElement.innerText = "Go up";
        returnElement.style.textDecoration = "underline";
        returnElement.style.color = "darkblue";
        returnElement.onclick = function() {
            let splitPath = currentFolderInput.value.split("/");
            splitPath.pop();
            currentFolderInput.value = splitPath.join("/");
            formFolder.value = splitPath.join("/");
            refreshList();
        }
        fileList.appendChild(returnElement);
    }
    for (let file of files)
    {
        let fileElement = document.createElement("li");
        fileElement.innerText = file.name;
        if (file.folder)
        {
            fileElement.style.textDecoration = "underline";
            fileElement.style.color = "darkblue";
            fileElement.onclick = function() {
                currentFolderInput.value = currentFolderInput.value+"/"+file.name;
                formFolder.value = currentFolderInput.value;
                refreshList();
            }
        }
        else
        {
            fileElement.onclick = function() {
                exportFile(currentFolderInput.value+"/"+file.name, file.name);
            }
        }
        fileList.appendChild(fileElement);
    }
}

currentFolderInput.onchange = function() {
    formFolder.value = currentFolderInput.value;
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

async function listDir(localPath, filter) {
    const rawResponse = await fetch('/ls', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({path: localPath, filter: filter})
    });
    const content = await rawResponse.text();
    return JSON.parse(content);
}

async function exportFile(localPath, name) {
    const rawResponse = await fetch('/export', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({path: localPath})
    });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(await rawResponse.blob());
    link.download = name;
    link.click();
}