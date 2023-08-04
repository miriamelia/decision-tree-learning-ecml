/*
    save a complete session, meaning a decision tree object, i.e. the split attributes of a complete tree;
    training and test data, as well as other important values like the method into a .txt file.
    Only possible in manually mode.
    utf-8 encoding
    order: splittAttributes + rows + testrows + method
 */
function saveTextAsFile() {
    deleteLastColumn();
    removeMarksInData();
    if(!($('#manually').is(':checked'))) {
        alert("Save only manually created session.");
        return;
    }
    var calc = "Entropy";
    if ($('#gini').is(':checked')) {
        calc = "Gini Index";
    }
    var splits = convertSplitAttributesToString(splitAttributes);
    var rows = document.getElementById("data").innerHTML;
    rows = rows.toString().split("background-color: rgb(147, 155, 162);").join("");
    var testRows = document.getElementById("testData").innerHTML;
    testRows = testRows.toString().split("=\" selected\"").join("");
    testRows = testRows.toString().split("500").join("normal");
    testRows = testRows.toString().split("background-color: rgb(212, 239, 223);").join("");
    testRows = testRows.toString().split("background-color: rgb(242, 215, 213);").join("");
    var test = document.getElementById("displayTree").innerText;
    var tree = test.split("\n");
    if(checkTree(tree)) {
        var all = splits + " next: " +rows + " next: " +testRows + " next: " +calc;
        var textToSaveAsBlob = new Blob([all], {type: "text/plain"});
        var fileNameToSaveAs = "dt-learning-session.txt";

        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        if (window.webkitURL != null) {
            downloadLink.href = window.webkitURL.createObjectURL(textToSaveAsBlob);
        } else {
            downloadLink.href = window.URL.createObjectURL(textToSaveAsBlob);
            downloadLink.onclick = destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }
        downloadLink.click();
    } else {
        alert("Please finish training the tree before saving.");
    }
}

function convertSplitAttributesToString(splits) {
    var result = [];
    for(var i = 0; i < splits.length; i++) {
        result.push(JSON.stringify(splits[i])+" ; ");
    }
    return result;
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
}

/*
    Load a session from a txt file and build new tree according to the order of split-attributes.
 */
function loadFileAsText() {
    document.getElementById("testData").innerHTML = "";
    var fileToLoad = document.getElementById("loadSession").files[0];
    var fileReader = new FileReader();
    fileReader.readAsText(fileToLoad, "UTF-8");
    fileReader.onload = function(fileLoadedEvent) {
        var results = fileLoadedEvent.target.result.split(" next: ");
        document.getElementById("data").innerHTML = results[1];
        document.getElementById("testData").innerHTML = results[2];
        var mode = results[3];
        if(mode === "Entropy") {
            $("#entropy").prop("checked",true);
            $("#gini").prop("checked",false);
        } else {
            $("#entropy").prop("checked",false);
            $("#gini").prop("checked",true);
        }
        $('#manually').prop('checked', true);
        $('#automatically').prop('checked', false);
        $('#stepwise').prop('checked', false);
        $('#reverseSplit').prop('disabled', false);
        $('#redoSplit').prop('disabled', false);
        convertSplitAttributesToObject(results[0]);
    };
}

function convertSplitAttributesToObject(splits) {
    var result = [];
    var help = splits.split(" ; ");
    help.pop();
    for(var i = 0; i < help.length; i++) {
        if(help[i].startsWith(",")) {
            help[i] = help[i].substr(1);
        }
        result.push(JSON.parse(help[i]));
    }
    var rows = document.getElementById("data").innerText.split("\n");
    readCategoryValues(rows);
    buildTree(result);
}

/*
    import csv data, set id of rows as "row+number" for training data and "row+test+number" for test data
    removes other imported data, if not same attributes like imported data set
  */
function importData(elementId, tableId, dataType) {
    var file = document.getElementById(elementId.toString()).files[0];
    var reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = function (e) {
        var table = document.getElementById(tableId.toString());
        var rows = e.target.result.split("\n");
        fillTable(table, rows, dataType, tableId);
    };
    return !!file;
}

/*
    load default csv data, set id of rows as "row+number" for training data and "row+test+number" for test data.
    default data set is the monster-data.
    Original Dataset: https://www.kaggle.com/datasets/alphiree/cardiovascular-diseases-risk-prediction-dataset
    Integrated: Trainset: First 30 samples Testset: Last 10 samples + 14 + 45 (the next ones with heart disease = True)
    Modification for better usability within the software as an educational tool:
    -Summarised diseases to disease (Skin-Cancer, cancer, depression, diabetes, arthritis)
    -Removed height, weight (only BMI)
    -Removed general health
    -Removed green vegetables
    -Adjusted Age single number from range
  */
function loadDefaultData() {
    emptyAll();
    document.getElementById("testData").innerHTML = "";
    var trainData = './Files/CVD_train.csv';
    var testData = './Files/CVD_test.csv';
    var tableTest = document.getElementById("testData");
    var table = document.getElementById("data");
    document.getElementById("displayTree").innerText = "";
    loadData(trainData, table, "");
    loadData(testData, tableTest, "test");
}

function loadData(file, table, dataType) {
    var request = new XMLHttpRequest();
    request.open('GET', file, false);
    request.onreadystatechange = function() {
        if(request.responseText !== '') {
            var rows = request.responseText.split("\n");
            fillTable(table, rows, dataType, "");
        }
    };
    request.send();
}

/*
    Enter Data in table according to formatted rows and columns
 */
function fillTable(table, rows, dataType, tableId) {
    console.log(rows)
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].split(";");
        //more than one column
        if (cells.length > 1) {
            var row = table.insertRow(-1);
            row.id = "row" + dataType.toString() + i.toString();
            if(table.id === "testData") {
                row.style.cursor = 'pointer';
            }
            for (var j = 0; j < cells.length; j++) {
                var cell;
                cell = row.insertCell(-1);
                cell.style.padding = '0 2px';
                if (i === 0 && dataType === "") {
                    // make first row bold
                    //cell.style.fontWeight = 'bolder';
                    cell.style.background = '#F6F7F8';
                    if (table.id === "data") {
                        cell.style.cursor = 'pointer';
                    }
                    cell.style.position = 'sticky';
                    cell.style.top = '0';
                    cell.innerHTML = '<td id="firstRow" ><button type="button" class="btn btn-light font-weight-bolder" style="box-shadow: none; color: #7C7F81">' + cells[j] + '</button></td>';
                } else if (i === 0 && dataType.trim() !== "") {
                    //cell.style.fontWeight = 'bolder';
                    cell.style.background = '#F6F7F8';
                    if (table.id === "data") {
                        cell.style.cursor = 'pointer';
                    }
                    cell.style.position = 'sticky';
                    cell.style.top = '0';
                    cell.innerHTML = '<td id="firstRow" ><button type="button" class="btn btn-light font-weight-bolder" style="box-shadow: none" disabled>' + cells[j] + '</button></td>';
                } else if (i === 1) {
                    cell.style.borderTop = "1px solid #000"
                    cell.innerHTML = '<td>' + cells[j] + '</td>';
                } else {
                    cell.innerHTML = '<td>' + cells[j] + '</td>';
                }
                if (j === cells.length - 1) {
                    // add border to separate last column
                    cell.style.borderLeft = "1px solid #000"
                }
            }
        }
    }
    if (tableId !== "") {
        checkTable(tableId);
    }
}

function checkTable(tableId) {
    var pos = "";
    if(tableId === "data") {
        pos = "testData"
    } else {
        pos = "data"
    }
    var cont = document.getElementById(pos).innerHTML;
    if(cont !== "") {
        var train = document.getElementById("row0").innerText;
        var test = document.getElementById("rowtest0").innerText;
        if(train !== test) {
            emptyAllExceptData();
            document.getElementById(pos).innerHTML = "";
        }
    }
}
