/**
 * This class handles user inputs concerning the creation of decision trees, executes the steps and organizes the necessary data.
 */

var allResults = [];
var allItems = [];
var ids = [];
var splitAttributes = [{number: "", splitAttr: "", splitValue: "", splitId: 0}];
var splits = [];
var pieChart;
var count = 0;
var removedSplits = [];
var allCategories = [];
var categoryColor = [];
var numb = 0;
var allIds = [];

/**
 * Transforms input array of objects from the .csv file into attribute headings and attribute values.
 *
 * @param input
 * @returns {{attribute_headings: string[], attribute_values: Array}}
 */
function checkAttributes(input) {
    var col = [];
    var result = [];
    var final = [];
    var headings = Object.getOwnPropertyNames(input[0]);
    for (var i = 1; i < input.length - 1; i++) {
        result.push(Object.values(input[i]));
    }
    //create columns of input as rows in array
    for (var k = 0; k < headings.length; k++) {
        for (var j = 0; j < result.length; j++) {
            col.push(result[j][k]);
            col = col.filter(unique);
        }
        final.push(col);
        col = [];
    }
    return {
        attribute_values: final,
        attribute_headings: headings,
    };
}

/**
 * Converts type string from .csv data into number if necessary
 *
 * @param input
 * @param headings
 */
function convertToNumber(input, headings) {
    for(var a = 0; a < input.length; a++) {
        var obj = input[a]
        var example = Object.values(obj)
        for(var attr in example) {
            if(!isNaN(example[attr])) {
                obj[headings[attr]] = parseInt(example[attr])
            }
        }
    }
}

/**
 * Prepares the configuration to build the decision tree
 * Reads data from the .csv table, converts the data, separates headings and values
 * @returns {{data, headings: string[], attributes: Array}}
 */
function prepareConfig() {
    var attributes, headings;
    var data_table = parseTable(document.getElementById('data'));
    var check = checkAttributes(data_table);
    attributes = check.attribute_values;
    headings = check.attribute_headings;
    convertToNumber(data_table, headings)
    // remove first item of array (the headings)
    data_table.shift();
    return {
        attributes: attributes,
        headings: headings,
        data: data_table,
    };
}

$('#build').click(function () {
    //document.getElementById('eyeButton').style.visibility = "visible";
    //document.getElementById("splitOptions").innerText = "Choose a Feature for the Split";
    if(document.getElementById('data').innerText === "") {
        alert("Please import data.")
        return;
    }
    if(document.getElementById('displayTree').innerText === "") {
        count = 0;
    }
    var calc = "Entropy "
    var mode = "auto"
    var content = prepareConfig();
    // Case Gini
    if($('#gini').is(':checked')) {
        calc = "Gini Index "
    }
    //reset config data after manually mode
    if(!($('#manually').is(':checked')) && !($('#stepwise').is(':checked'))) {
        splitAttributes.shift();
        splitAttributes.push({number: 0, splitAttr:"", splitValue:"", splitId:0});
        mode = "auto"
    }
    //set config data for manually mode
    if($('#manually').is(':checked') ) {
        splitAttributes.length = 0;
        splits.length = 0;
        ids.length = 0;
        splitAttributes.push({number: 0, splitAttr: "start", splitValue: "none", splitId: 0});
        mode = "manually";
    }
    if($('#stepwise').is(':checked') ) {
        splitAttributes.length = 0;
        splitAttributes.push({number: ++count, splitAttr: "start", splitValue: "none", splitId: 0});
        mode = "stepwise";
    }
    var config = {
        trainingSet: content.data,
        categoryAttr: content.headings[content.headings.length-1],
        attribute_values: content.attributes,
        attribute_headings: content.headings,
        ignoredAttributes: [],
        id: 1,
        calc: calc,
        splitAttributes: splitAttributes,
        mode: mode
    };
    //var rows = document.getElementById("data").innerText.split("\n");
    var rows = document.getElementById("data").innerText.split("\n");
    readCategoryValues(rows);
    var decisionTree = new dt.DecisionTree(config);
    document.getElementById('displayTree').innerHTML = treeToHtml(decisionTree.root);
    // set first node checked by default; mark all data items and display pie
    document.getElementById("1").click();
});

$('#clear').click(function () {
    emptyAllExceptData();
    splitAttributes.length = 0;
    count = 0;
});

$('#reverseSplit').click(function () {
    deleteLastColumn();
    reverseLastSplit();
    var rowsTest = document.getElementById("testData").innerText;
    if(!(rowsTest === "")) {
        rowsTest = rowsTest.split("\n")
        for (var m = 0; m < rowsTest.length; m++) {
            document.getElementById("rowtest" + m.toString()).style.backgroundColor = "";
        }
    }
});

$('#redoSplit').click(function () {
    deleteLastColumn();
    redoLastSplit();
});

/**
 * Recursive (DFS) function for displaying inner structure of decision tree
 */
function treeToHtml(tree) {
    if (tree.category && !tree.category.startsWith("No-")) {
        // only set if tree has been built at least once
        var color = allColors[allCategories.indexOf(tree.category)];
        allIds.push(tree.category.trim())
        return ['<ul id=' +tree.category+' name=' +tree.category +'>',
            '<li '+' name=' +tree.category+'>',
            '<a href="#" style="color: #fefefe; background-color: '+color+' " id='+ tree.id + ' name=' +tree.category+'>',
            '<b>', tree.category, '</b>',
            '</a>',
            '</li>',
            '</ul>'].join('');
    }

    // if tree still has impure nodes they will be red
    if (tree.category && tree.category.startsWith("No-")) {
        tree.category = tree.category.split("-").pop();
        return ['<ul id=' +tree.category+' name=' +tree.category+'>',
            '<li'+' name=' +tree.category+'>',
            '<a href="#"  style="color: #fefefe; background-color: darkred" id='+ tree.id +' name=' +tree.category+'>',
            '<b>', tree.category, '</b>',
            '</a>',
            '</li>',
            '</ul>'].join('');
    }

    allIds.push(tree.attribute.trim());

    return ['<ul id=' +tree.attribute+ ' name=' +tree.attribute+'>',
        '<li' + ' name=' +tree.attribute+'>',
        '<a href="#" id='+ tree.id + ' name=' +tree.attribute+'>',
        '<b>', tree.attribute, '</b>',
        '</a>',
        '<ul id=' +tree.attribute+ ' name=' +tree.attribute+'>',
        trees(tree),
        '</ul>',
        '</li>',
        '</ul>'].join('');
}

/**
 * Builds subtrees and collects their respective items and results (entropy/gini index values)
 *
 * @param tree
 * @returns {string|string}
 */
function trees(tree) {
    var subtree = '';
    for(var z = 0; z < tree.trees.length; z++) {
        if(parseInt(tree.value[z].split(">").join("")) || parseInt(tree.value[z].split(">=").join(""))) {
            var name;
            var greaterThan = '\u2265'
            if(tree.value[z].includes(">=")) {
                name = greaterThan+tree.value[z].split(">=").join("").trim()
            }
            subtree += '<li id=' +name +  ' name=' +name+ '> ' + name +treeToHtml(tree.trees[z]) +'</li>';
            allIds.push(name.trim())
        } else {
            subtree += '<li id=' + tree.value[z] + ' name=' + tree.value[z] + '>' + tree.value[z] + treeToHtml(tree.trees[z]) + '</li>';
            allIds.push(tree.value[z].trim())
        }
    }
    allResults = getResultColl(tree);
    allItems = getItems(tree);
    numb++;
    return subtree;
}

function getResultColl(tree) {
    var nodeContent = [];
    for(var x = 0; x < tree.resultColl.length; x++) {
        nodeContent.push(tree.resultColl[x]+'<br>');
    }
    return nodeContent
}

function getItems(tree) {
    var items = [];
    for(var i = 0; i < tree.trainingSet.length; i++) {
        items.push(tree.trainingSet[i]+'<br>')
    }
    return items;
}

/**
 * Only necessary for manually mode
 * Builds the decision tree according to the order of attributes that were selected by the user
 *
 * @param idNode
 * @param text
 * @param value
 * @param redo
 */
function setCurrSplit(idNode, text, value, redo) {
    // reset removed splits if new split is being made manually
    if(!redo)
        removedSplits = []
    idNode = parseInt(idNode);
    ids.push(idNode);
    if (idNode <= ids[ids.length - 1]) {
        ids.sort(function (a, b) {
            return a - b;
        });
    }
    var object = new Object({
        number: 0,
        splitAttr: text,
        splitValue: value,
        splitId: idNode
    })
    splitAttributes.splice(ids.indexOf(idNode), 0, object)
    // remember position of last insert
    var help = [...splitAttributes];
    // Building Decision Tree
    // Configuration reset to update Split attributes Array

    var headings = buildTree(splitAttributes);
    splitAttributes = [...help];
    // update correct ids of tree nodes if inserted split is in the middle/beginning of array
    if (idNode <= ids[ids.length - 1]) {
        var changed = []
        var count = getValueCountUpdateIDs(idNode.toString(), text, headings)
        for (var k = ids.indexOf(idNode) + 1; k < ids.length; k++) {
            for (var l = 0; l < splits.length; l++) {
                if (parseInt(splits[l]) === parseInt(ids[k]) && !(changed.includes(l))) {
                    changed.push(l);
                    var h = parseInt(splits[l]);
                    h += count;
                    splits[l] = h.toString();
                }
            }
            ids[k] += count;
        }
        for (var o = 0; o < splitAttributes.length; o++) {
            splitAttributes[o]['splitId'] = ids[o]
        }
    }
    help = [...splitAttributes];
    buildTree(splitAttributes);
    splitAttributes = [...help];
    // reset click after split
    document.getElementById(idNode).click();
}

/**
 * Only necessary for manually mode
 * If id node of manually entered split is smaller than the last id node of the last split element,
 * the ids have to be updated after removing that split attribute
 *
 */
function reverseLastSplit() {
    if($('#stepwise').is(':checked') || ($('#automatically').is(':checked'))) {
        return;
    }
    if(splits.length === 0) {
        alert("No splits to undo.");
        return;
    }
    var c;
    //value to be removed
    var edit = parseInt(splits[splits.length-1]);
    for(var i = 0; i < splitAttributes.length; i++) {
        if(parseInt(splitAttributes[i].splitId) === edit) {
            //all other split nodes need to have smaller ids if not, it is not the last id so the other ids need to be adjusted
            if(ids[ids.length-1] > edit) {
                var help = [...splitAttributes];
                var headings = buildTree(splitAttributes);
                splitAttributes = [...help];
                c = getValueCountUpdateIDs(edit.toString(), splitAttributes[i].splitAttr, headings);
            }
            // remember that split
            removedSplits.push(splitAttributes[i]);
            splitAttributes.splice(i, 1);
            break;
        }
    }
    // updating ids if necessary
    for(var k = 0; k < ids.length; k++) {
        if(parseInt(ids[k]) > edit) {
            var changed = []
            for(var m = 0; m < splits.length; m++) {
                if(parseInt(splits[m]) === ids[k] && !(changed.includes(m))) {
                    changed.push(m)
                    var h = parseInt(splits[m])
                    h   -= c;
                    splits[m] = h.toString()
                }
            }
            ids[k] -= c;
        }
    }
    for(var j = 0; j < ids.length; j++) {
        if(parseInt(ids[j]) === edit) {
            ids.splice(j ,1);
            break;
        }
    }
    // update ids of split attributes
    for (var o = 0; o < splitAttributes.length; o++) {
        splitAttributes[o]['splitId'] = ids[o]
    }
    // remove last split
    splits.pop();
    // build tree
    help = [...splitAttributes];
    buildTree(splitAttributes);
    splitAttributes = [...help];
}

function redoLastSplit() {
    if(removedSplits.length === 0) {
        alert("No splits to redo.")
        return;
    }
    var item = removedSplits[removedSplits.length-1];
    splits.push(item.splitId.toString())
    setCurrSplit(item.splitId, item.splitAttr, item.splitValue, true);
    removedSplits.pop();
}

function getValueCountUpdateIDs(spot, attr, headings) {
    if(attr.split(" ").length > 1) {
        attr = attr.split(" ")[0]
    }
    var index = headings.indexOf(attr)
    var values = [];
    var content = [];
    var count;
    for(var j = 0; j < allItems.length; j++) {
        //id of node fits position in array
        if (allItems[j].split(',')[0] === spot) {
            if(JSON.stringify(content).indexOf(JSON.stringify(allItems[j])) === -1) {
                content.push(allItems[j])
            }
        }
    }
    for (var k = 0; k < content.length; k++) {
        values.push(content[k].split(",")[index + 1])
    }
    if(parseInt(values[0])) {
        count = 2
    } else
        count = values.filter(unique).length;
    return count;
}

function buildTree(splitAttributes) {
    var calc = "Entropy "
    if ($('#gini').is(':checked')) {
        calc = "Gini Index "
    }
    var content = prepareConfig();
    var config = {
        trainingSet: content.data,
        categoryAttr: content.headings[content.headings.length - 1],
        attribute_values: content.attributes,
        attribute_headings: content.headings,
        ignoredAttributes: [],
        id: 1,
        splitAttributes: splitAttributes,
        calc: calc,
        mode: "manually"
    };
    var decisionTreeMan = new dt.DecisionTree(config);
    // Displaying Decision Tree
    document.getElementById('displayTree').innerHTML = treeToHtml(decisionTreeMan.root, 1);
    return content.headings;
}

/**
 * After click on a node display the pie diagram and the entropy/gini index values for possible splits
 * also mark corresponding rows in table
 */
$(document).ready(function() {
    var idNode = -1;
    var marked = false;
    //window.onload = highlight_row;

    $( "#displayTree" ).on( "click", "a", function( event ) {
        document.getElementById("nodeContent0").innerHTML = ""
        document.getElementById("nodeContent00").innerHTML = ""
        document.getElementById("nodeContent").innerHTML = ""
        document.getElementById("nodeContent2").innerHTML = ""
        // reset as clicked marked node from before
        if (idNode >= 0 && !(idNode == null)) {
            var handler = document.getElementById(idNode);
            if(handler != null) {
                handler.style.borderColor = "#ccc";
                handler.style.borderWidth = "1px";
            }
        }
        var pieDiagram = document.getElementById("pieDiagram");
        //get content of table
        var rows = document.getElementById("data").innerText.split("\n");
        readCategoryValues(rows);
        for(var m = 0; m < rows.length; m++) {
            document.getElementById("row"+m.toString()).style.backgroundColor = "";
        }
        if(pieChart)
            pieChart.destroy();
        document.getElementById("nodeContent").innerHTML = "";
        event.preventDefault();
        document.getElementById("cardTitle").innerText = "Detailed Image of Data";
        var spot = $(this).attr('id');
        // set marker on click and remove marker on next click on same node
        if(spot === idNode) {
            var handler = document.getElementById(idNode);
            if(handler != null) {
                if(marked === true) {
                    marked = false;
                    handler.style.borderColor = "#ccc";
                    handler.style.borderWidth = "1px";
                } else {
                    marked = true;
                    document.getElementById(spot).style.borderColor = "#939BA2";
                    document.getElementById(spot).style.borderWidth = "2px";
                }
            }
        } else {
            // mark clicked node
            marked = true;
            document.getElementById(spot).style.borderColor = "#939BA2";
            document.getElementById(spot).style.borderWidth = "2px";
        }
        idNode = spot;
        var content = [];
        var pie = [];

        for(var i = 0; i < allResults.length; i++) {
            //id of node fits position in array of all calculated entropy/gini values
            if (allResults[i].split(',')[0] === spot.toString()) {
                //remove ID
                var cont = allResults[i].replace(allResults[i].split(',').shift()+", ", "");
                if(JSON.stringify(content).indexOf(JSON.stringify(cont)) === -1) {
                    content.push(cont);
                }
            }
        }

        for(var j = 0; j < allItems.length; j++) {
            //id of node fits position in array
            if (allItems[j].split(',')[0] === spot.toString()) {
                JSON.stringify(content).indexOf(JSON.stringify(allItems[j])) === -1 ? pie.push(allItems[j])  : "";
            }
        }
        pieChart = createPie(pieDiagram, pie);
        // Duplicate free result values that correspond to particular node that was clicked
        for(var k = 0; k < content.length; k++) {
            var buttonId = "button" + k;
            var buttonIdCalc = "button" + k + "Calc";
            if(content[k].startsWith('Gini Gain')) {
                content[k] = "Gini Gain: <br><br><br>"
            }
            if(parseInt(content[k].charAt(0))) {
                content[k] = "Gini Gain: <br><br><br>"  // background-color: #F8F9FA   font-weight-bolder  9CA3A8  6B747C
            }
            if(k === 0) {
                document.getElementById("nodeContent0").innerHTML += '<button class="list-group-item list-group-item-action list-group-item-secondary btn btn-secondary " style="box-shadow: none; " id="' + buttonId + '" disabled>' +content[k]+'</button>';
            } else if(k === 1) {
                document.getElementById("nodeContent00").innerHTML += '<button class="list-group-item list-group-item-action list-group-item-secondary btn btn-secondary btn-block" style="box-shadow: none; " id="' + buttonId + '" disabled>'+content[k]+ '</button>';
            } else {
                var value = content[k].split(":")[0];
                var value2 = content[k].split(":")[1];  //color: #7C7F81

                document.getElementById("nodeContent").innerHTML += '<button class="list-group-item list-group-item-action list-group-item-secondary btn btn-block btn-secondary " style="box-shadow: none;  " id="' + buttonId + '">' + value+'</button>';
                if(value2)
                    document.getElementById("nodeContent2").innerHTML += '<button class="list-group-item list-group-item-action list-group-item-dark btn btn-secondary btn-block " style="box-shadow: none;" id="' + buttonIdCalc + '" disabled>' + value2 + '</button>';
            }
        }

        // Mark rows in table
        for(var l = 0; l < allItems.length; l++) {
            if (allItems[l].split(',')[0] === spot.toString()) {
                //remove id for comparison
                var id = allItems[l].split(',').shift()
                var line = allItems[l]
                line = line.trim()
                line = line.replace(id+", ", "")
                line = line.replace(/,/g, "\t");
                line = line.replace("<br>", "")
                for(var m = 0; m < rows.length; m++) {
                    if(JSON.stringify(line.toString()) === JSON.stringify(rows[m].toString())) {
                        document.getElementById("row"+m.toString()).style.backgroundColor = "#939BA2";
                    }
                }
            }
        }

        // to display current content if content empty fake click and then reverse it if there has not been a click (no pie diagram)
        if(pie.length === 0) {
            var place = 0;
            var nodes = document.getElementById("nodeContent").innerText.split("\n");
            console.log(nodes)
            console.log(nodes.length)
            for (var i = 0; i < nodes.length; i++) {
                var v = document.getElementById("button" + (i+2).toString()+"Calc").innerText;
                console.log(v)
                if (parseFloat(v) > 0.0000) {
                    place = i+2;
                    break;
                }
            }
            document.getElementById("button" + place.toString()).click();
            reverseLastSplit();
            //mark clicked node
            document.getElementById(idNode).style.borderColor = "#939BA2";
            document.getElementById(idNode).style.borderWidth = "2px";
        }
    });

    $("#data").on("click", "td", function (event) {
        if(!containsNumericValues(this.innerText)) {
            marked = false;
            var value = document.getElementById("button0").innerText;
            value = value.split(":")[1];
            if ($('#manually').is(':checked')) {
                var attr = event.target.innerText;
                for (const a of document.querySelectorAll("button")) {
                    if (a.textContent.includes(attr.trim())) {
                        var gain = document.getElementById(a.id+"Calc");    //
                        if(gain)
                            gain = gain.innerText;
                        else
                            continue;
                        if(parseFloat(gain) === 0.0000) {
                            alert("A split with gain of 0 changes nothing. \nPlease choose another option.")
                        } else {
                            if (attr !== "Typ" && attr !== "Prediction") {
                                if (!(splits.includes(idNode.toString()))) {
                                    setCurrSplit(idNode, attr, value, false);
                                    splits.push(idNode.toString());
                                } else  if (splits.length > 1) {
                                    alert("That split has already been made.\n"+splits.length +"Please choose another node.")
                                }
                            }
                        }
                    }
                }
            }
        } else {
            alert("Numeric Values required. \nPlease choose adequate split option.")
        }
    });

    function highlightRow(clicked) {
        var table = document.getElementById('testData');
        var rowId = clicked.rowIndex;
        var rowsNotSelected = table.getElementsByTagName('tr');
        for (var row = 0; row < rowsNotSelected.length; row++) {
            rowsNotSelected[row].style.fontWeight = "normal";
            //rowSelected.style.fontStyle.color = "#000000";
            rowsNotSelected[row].classList.remove('selected');
        }
        var rowSelected = table.getElementsByTagName('tr')[rowId];
        rowSelected.style.fontWeight = "bold";       //bold
        //rowSelected.style.fontStyle.color = "#FFFFFF";
        rowSelected.className += " selected";
    }

    function removeClassSpecial() {
        $('li').removeClass('special');
        $('ul').removeClass('special');
        $('a').removeClass('special');
    }

    $("#testData").on("click", "tr", function (event) {
        var id = $(this).attr('id');
        id = id.replace("rowtest", "");
        var row0 = document.getElementById('rowtest0').innerText;
        var line0 = row0.replace(/\s/g, ' ').split(" ");
        var aTags = document.getElementsByTagName("a");
        for (var i = 0; i < aTags.length; i++) {
            aTags[i].style.fontWeight = "normal";
        }
        if(!(line0[line0.length-1] === "Prediction")) {
            alert("Please finish the tree and test it first.");
            return;
        }
        highlightRow(this);
        removeClassSpecial();

        for(let n = 0; n < resultWay[id].length; n++) {
            var test = resultWay[id][n].trim();
            // test ob zugehöriger a Tag fett
            if(allIds.indexOf(test) > -1) {
                var nodelist = document.getElementsByName(test.toString());
                for(let k = 0; k < nodelist.length; k++) {
                    let nextSibling = nodelist[k].nextElementSibling;
                    let parentList = nodelist[k].parentElement.classList;
                    if (parentList.contains('special')) {
                        if(nextSibling) {
                            if(nextSibling.classList.contains('special')) {
                                continue;
                            }
                        }
                        if (nodelist[k].tagName === "A")
                            nodelist[k].style.fontWeight = 'bold';
                        nodelist[k].classList.add('special');
                    }
                }
            }
        }

        // if same values clarify branch
        for(var i = 0; i < resultWay[id].length; i++) {
            var test0 = resultWay[id][i];
            if(occursMultipleTimes(test0)) {
                var help = 0;
                if (i < resultWay[id].length - 1)
                    help = i + 1;
                else
                    help = i;
                var confirm = resultWay[id][help];
                var nodelist = document.getElementsByName(test0.toString());
                for (let k = 0; k < nodelist.length; k++) {
                    let children = nodelist[k].children;
                    if (children.length >= 2) {
                        for (let j = 0; j < children.length; j++) {
                            if (children[j].tagName === "LI") {
                                if ((children[j].id !== confirm)) {
                                    children[j].classList.remove('special');
                                }
                            }
                        }
                    }
                }
            }
        }

    });

    function occursMultipleTimes(value) {
        var rows = document.getElementById("data").innerText.split("\n");
        var attr = rows[0].replace(/\s/g, ' ').split(" ");
        var count = 0;
        for(var i = 0; i < attr.length; i++) {
            var test = getValuesOfAttribute(attr[i]);
            if(test.indexOf(value) > -1) {
                count++;
            }
        }
        return count > 1;
    }

    function containsNumericValues(attribute) {
        var rows = document.getElementById("data").innerText.split("\n");
        var attrNames = rows[0].replace(/\s/g, ' ').split(" ");
        var index = attrNames.indexOf(attribute);
        var row = rows[1].replace(/\s/g, ' ').split(" ");
        //for(let i = 1; i < row.length; i++) {
        if(parseFloat(row[index])) {
            return true;
        }
        //}
        return false;
    }

    /**
     * Regulate splits in manually mode
     */
    $("#nodeContent").on("click", "button", function (event) {
        //console.log(innerClick)
        marked = false;
        var id = $(this).attr('id');
        var value = document.getElementById("button0").innerText;
        value = value.split(":")[1];
        if (!(id === "button0") && !(id === "button1") && $('#manually').is(':checked')) { //
            var attr = document.getElementById(id).innerText;
            var gain = document.getElementById(id+"Calc").innerText;
            if(parseFloat(gain) === 0.0000) {
                alert("A split with gain of 0 changes nothing.\nPlease choose another option.")
            } else {
                if(!(splits.includes(idNode.toString()))) {
                    setCurrSplit(idNode, attr, value, false);
                    splits.push(idNode.toString());
                } else if (splits.length > 1){
                    alert("That split has already been made.\nPlease choose another node.")
                }
            }
        }
    });

});
