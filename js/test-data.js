var resultvalues = ["Prediction"];
var resultWay = ["start"];
var numeric = false;
var mixed = false;

/*
    check first row of imported files to contain the same attributes
    mark correctly classifies items green; wrongly classified ones red
 */
$('#test').click(function () {
    resultvalues = ["Prediction"];
    resultWay = ["start"];
    var correct = 0;
    var incorrect = 0;
    var table = document.getElementById("testData");
    var data_table = parseTable(document.getElementById('data'));
    var values = checkAttributes(data_table);
    var attributes = values.attribute_values;
    var headings = values.attribute_headings;
    var rowsTrain = data_table.innerText;
    var rowsTest = table.innerText;
    if(rowsTrain === "" || rowsTest === "") {
        alert("Please import data.");
    } else {
        var train = document.getElementById("row0").innerText;
        var test = document.getElementById("rowtest0").innerText;
        if (!(train === test)) {
            alert("Please import from files with the same attributes.");
        } else {
            var coll = document.getElementById("displayTree").innerText;
            var tree = coll.split("\n");
            var hasSameValues = testTreeForSameValues();
            if(checkTree(tree)) {
                var check = createTreeBranches();
                console.log(check)
                for(var i = 1; i < table.rows.length; i++) {
                    var row = document.getElementById("rowtest"+i.toString());
                    var line = row.innerText.replace(/\s/g, ' ').split(" ");
                    //if(!numeric) {  //
                        if (testData(check, line, row.innerText, tree, i, headings)) {
                            row.style.backgroundColor = "#D4EFDF";
                            correct++;
                        } else {
                            row.style.backgroundColor = "#F2D7D5";
                            incorrect++;
                        }
                    /*} else {        // numerical values
                        if (checkItem(row.innerText, tree)) {
                            row.style.backgroundColor = "#D4EFDF";
                            correct++;
                        } else {
                            row.style.backgroundColor = "#F2D7D5";
                            incorrect++;
                        }
                    }*/
                }
                for(let i = 0; i < table.rows.length; i++){     // if last one undefined not counted in length
                    if(resultvalues[i] === undefined)
                        resultvalues[i] = "none";
                }
                appendColumn(resultvalues);
                // prepare array with numeric values to properly display paths
                console.log(resultWay)
               /* if(numeric) {
                    var next = [];
                    var pos = 0;
                    for(var i = 1; i < resultWay.length; i++) {
                        var value = resultWay[i.toString()];
                        if(next.length > 0) {
                            if(value.length > 1 && !equalsCategoryAttribute(next[next.length-1])) {     // check maybe wrong from before
                                next[next.length-1] = "none";
                                resultWay.splice(pos, 1, next);
                                next = [];
                                continue;
                            }
                        }
                        if(value.length === 1) {
                            pos = i;
                            next.push(value.toString())
                            if (equalsCategoryAttribute(value)) {
                                resultWay.splice(pos, 1, next);
                                next = [];
                            }
                        }
                    }
                    for(var i = 1; i < resultWay.length; i++) {
                        var value = resultWay[i.toString()];
                        if(value.length === 1) {
                            resultWay.splice(i, 1)
                            --i;
                        }
                    }
                }*/
                console.log(resultWay)
            } else {
                alert("Please finish training the tree before testing data.");
            }
        }
    }
    // set analysis values; calculate accuracy
    var accuracy = (correct / (correct+incorrect))*100;
    document.getElementById("accuracy").innerText = accuracy.toFixed(4).toString()+"%";
    document.getElementById("correct").innerText = correct.toString();
    document.getElementById("incorrect").innerText = incorrect.toString();
});

function unescapeHTML(escapedHTML) {
    return escapedHTML.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); //.replace(/\u2265/, '>=')
}

// append column to test data table
function appendColumn(content) {
    var tbl = document.getElementById('testData');
    // open loop for each row and append cell
    for (var i = 0; i < tbl.rows.length; i++) {
        createCell(tbl.rows[i].insertCell(tbl.rows[i].cells.length), content[i], 'col', i);
    }
}

// create DIV element and append to the table cell
function createCell(cell, text, style, i) {
    //cell.style.padding = '0 2px';
    if (i === 0) {
        // make first row bold
        /* cell.style.background = '#FFF';
        cell.style.position = 'sticky';
        cell.style.top = '0';
        cell.id ='firstRow';*/
        cell.style.background = '#F6F7F8';
        cell.innerHTML = '<td id="firstRow"><button type="button" class="btn btn-light font-weight-bolder" style="box-shadow: none" disabled>' +text+ '</button></td>';
    }  else if (i === 1) {
        cell.style.borderTop = "1px solid #000"
        var div = document.createElement('td'),
            txt = document.createTextNode(text);
        div.appendChild(txt);
        div.setAttribute('class', style);
        div.setAttribute('className', style);
        cell.appendChild(div);
    } else {
        var div = document.createElement('td'),
            txt = document.createTextNode(text);
        div.appendChild(txt);
        div.setAttribute('class', style);
        div.setAttribute('className', style);
        cell.appendChild(div);
    }
}

// delete table columns with index greater then 0
function deleteLastColumn() {
    var tbl = document.getElementById('testData');
    if(tbl.innerText !== "") {
        var lastCol = tbl.rows[0].cells.length - 1;
        if (tbl.rows[0].cells[lastCol].innerText === "Prediction") {
            for (var i = 0; i < tbl.rows.length; i++) {
                tbl.rows[i].deleteCell(lastCol);
            }
        }
    }
}

/*
    Iterating through each line of treeBranches and comparing it to one line of test data set
 */
function testData(check, line, row, tree, rownumber, headings) {              // line is of data
    //console.log(check) // all tree Branches to check
    var way = [];
    var attrName = [];
    var val = [];
    for(let i = 0; i < check.length; i++) {     // iterating through all tree branches
        val = check[i].split(",");
        for(var j = 0; j < val.length; j++) {
            var help = j;
            ++help;
            var pos = findPosition(val[j].trim());          // finds position of attribute in data if value is attribute name
            if(pos > -1) {
                if((way.indexOf(val[j].trim()) === -1)) {
                    way.push(val[j].trim());                        // attribute Name
                    attrName.push(val[j].trim());
                }
                var tmp = val[help].trim();
                tmp = tmp.replace("<", "");
                tmp = tmp.replace("\u2265", "");
                if(headings.indexOf(way[way.length-1]) > -1 && !(parseInt(tmp))) {
                    way.push(line[pos].trim());                     // value of attribute
                }
                if(parseInt(tmp) || tmp === 0) {
                    //console.log(check[i])
                    var value = "";
                    //console.log(line[pos].trim())       // Zahlen werte
                    //console.log(tmp)                    // Vergleichswert
                    if (way[way.length - 1] !== val[j].trim()) {
                        way.push(val[j].trim());                        // attribute Name
                        attrName.push(val[j].trim());
                    }
                    if (parseInt(tmp, 10) <= parseInt(line[pos].trim(), 10)) {
                        value = "\u2265" + tmp
                    } else {
                        value = "<" + tmp
                    }
                    if(way.indexOf(value) === -1)
                        way.push(value);
                    else
                        way.pop();
                    if(value !== val[help].trim())
                        break;
                } else if(line[pos].trim() !== val[help].trim()) {
                    // case values do not exist in tree built by trainings data set not possible with numerical data
                    var res = containsValue(line[pos].trim(), check);
                    if (res !== "") {
                        resultvalues[rownumber] = "none";
                        if((way.indexOf("none") === -1))
                            way.push("none")
                    } /*else if(equalsCategoryAttribute(val[help].trim())) {
                        console.log(val[help].trim())
                        resultvalues[rownumber] = val[help].trim();
                        if((way.indexOf(val[help].trim()) === -1))
                            way.push(val[help].trim())
                    }*/
                    break;
                }
            } else if(j === (val.length-1)) {
                //if((way.indexOf(val[j].trim()) === -1))
                  //  way.push(val[j].trim());
                //
                if(equalsCategoryAttribute(val[j].trim()) && !equalsCategoryAttribute(way[way.length-1])) {    // add value found by following the tree from root to leaf
                    resultvalues[rownumber] = val[j].trim();
                    if((way.indexOf(val[j].trim()) === -1))
                        way.push(val[j].trim())
                }
                if(line[line.length-1].trim() === val[j].trim()) {          // check if that value equals the value of the test data set
                   // resultvalues.push(val[j].trim())
                   // resultvalues[rownumber] = val[j].trim();
                    if((way.indexOf(val[j].trim()) === -1))
                        way.push(val[j].trim());
                    resultWay[rownumber] = way;
                    return true;
                }
            }
        }
    }
    resultWay[rownumber] = way;
    return false;
}

/**
 * check if attribute value is present in tree built by trainings data set
 *
 */
function containsValue(value, check) {
    for(var i = 0; i < check.length; i++) {
        var line = check[i].split(",");
        for(var j = 0; j < line.length; j++) {
            if(line[j].trim() === value) {
                return "";
            }
        }
    }
    return value;
}

function createTreeBranches() {
    var result = [];
    var input = document.getElementById("displayTree").innerHTML;
    input = input.toString().split("</ul>");
    for(var i = 0; i < input.length; i++) {
        if(input[i] === "," || input[i] === "" || input[i] === " ") {
            input.splice(i, 1);
            i = 0;
        }
        input[i] = input[i].replace(/(<([^>]+)>)/ig," ");
        input[i] = unescapeHTML(input[i]);
    }
    for(var i = 0; i < input.length; i++) {
        var start = input[0];
        start = start.split("   ");
        if(start[start.length-1] === "")
            start.pop();
        if(start[0] === "")
            start.shift();
        if(i === 0) {
            result.push(start.join());
        } else {
            var help = input[i].split("   ");
            if(help[help.length-1] === "")
                help.pop();
            var last = result[result.length-1].split(",");
            for(var k = last.length-1; k >= 0; k--) {
                var test2 = k;
                var values = [];
                var content;
                if(equalsAttribute(last[k].trim())) {
                    values = getValuesOfAttribute(last[k].trim());
                    var tmp = help[0].trim()
                    tmp = tmp.replace("<", "")
                    tmp = tmp.replace("\u2265", "")
                    if(parseInt(tmp) || tmp === 0) {
                        if(!mixed)
                            numeric = true;
                        var bridge = result[result.length-1].split(" ").join("").split(",")
                        var ind1 = bridge.indexOf("<"+tmp)
                        var ind2 = bridge.indexOf("\u2265"+tmp)
                        test2 = ind1 > ind2 ? ind1 : ind2;
                        if(values.indexOf(tmp.toString()) > -1) {
                            content = result[result.length-1].split(",").slice(0, test2); // ++test2
                            content.push(help);
                            result.push(content.join());
                            k = -1;
                        }
                    } else if(values.indexOf(help[0].trim()) > -1) {
                        if(numeric) {
                            mixed = true;
                            numeric = false;
                        }
                        content = result[result.length-1].split(",").slice(0, ++test2);
                        content.push(help);
                        result.push(content.join());
                        k = -1;
                    }
                }
            }
        }
    }
    return result;
}

function testTreeForSameValues() {
    var rows = document.getElementById("data").innerText.split("\n");
    var attr = rows[0].replace(/\s/g, ' ').split(" ");
    var help = ["start"];
    for(var i = 0; i < attr.length; i++) {
        var test = getValuesOfAttribute(attr[i]);
        for(var j = 0; j < help.length; j++) {
            if(test.indexOf(help[j]) > -1) {
                return true;
            }
        }
        help = test.splice(0, test.length);
    }
    return false;
}

// all possible values of training data
function getValuesOfAttribute(value) {
    var rows = document.getElementById("data").innerText.split("\n")
    var start = rows[0].replace(/\s/g, ' ');
    start = start.split(" ");
    var pos = start.indexOf(value);
    var values = [];
    for (var i = 0; i < rows.length; i++) {
        var temp = rows[i].replace(/\s/g, ' ');
        temp = temp.split(" ");
        values.push(temp[pos]);
    }
    values = values.filter(unique);
    return values;
}

function checkItem(row, tree) {
    var way = [];
    const items = row.split(/\s+/);
    var slice;
    var pos = findPosition(tree[0]);
    var value = "";
    var index = 1;
    if(equalsCategoryAttribute(tree[0])) {
        resultvalues.push(items[items.length - 1].toString());
        way.push(items[items.length - 1].toString());
        resultWay.push(way);
        return {
            value: tree[0].toString() === items[items.length - 1].toString(),
            result: items[items.length - 1].toString()
        };
    }
    way.push(tree[0])
    if(pos > -1) {
        value = items[pos];
        if(parseInt(value, 10) || value === "0") {
            var comp = findNumberInArray(tree, tree[0]);
            if (parseInt(comp, 10) <= parseInt(value, 10)) {
                value = "\u2265" + comp
            } else {
                value = "<" + comp
            }
        }
        index = tree.indexOf(value.toString());
    }
    resultWay.push(way)
    slice = tree.slice(index, tree.length);
    return checkItem(row, slice);
}

// find position of attribute in tree array
function findNumberInArray(tree, attribute) {
    var pos = tree.indexOf(attribute)+1
    var result = tree[pos].split(" ");
    if(result.length === 1) {
        return result[0].replace("\u2265", "")
    }
    return result[1]
}

function findPosition(attributeName) {
    var help = -1;
    var firstRow = document.getElementById("rowtest0").innerText;
    var firstRowSplit = firstRow.split(/\s+/);
    for(var i = 0; i < firstRowSplit.length; i++) {
        if(attributeName.toString() === firstRowSplit[i].toString()) {
            help = i;
            return help;
        }
    }
    return help;
}

function equalsCategoryAttribute(val) {
    var table = document.getElementById("data");
    var category = []
    for(var i = 1; i < table.rows.length; i++) {
        var row = document.getElementById("row"+i.toString()).innerText;
        var rowItems = row.split(/\s+/);
        category.push(rowItems[rowItems.length-1])
    }
    category = category.filter(unique);
    for(var i = 0; i < category.length; i++) {
        if(category[i].toString() === val.toString()) {
            return true;
        }
    }
    return false;
}

function equalsAttribute(value) {
    var check = document.getElementById("rowtest0").innerText;
    return check.indexOf(value) > -1;
}

/*
    Test if in manually mode a tree has no open nodes
    As soon as two possible values are directly next to each other, the tree is unfinished
 */
function checkTree(tree) {
    if($('#displayTree').is(':empty') || document.getElementById("displayTree").innerText === "") {
        return false;
    } else if ($('#manually').is(':checked')) {
        var rows = document.getElementById("data").innerText.split("\n");
        var rowsTest = document.getElementById("testData").innerText.split("\n")
        var table;
        var name = "";
        if(rowsTest.length > 1) {
            table = document.getElementById("testData")
            name = "rowtest";
        } else if(rowsTest.length <= 1 && rows.length > 1) {
            table = document.getElementById("data")
            name = "row";
        } else {
            return false;
        }
        var check = findAllValues(table, name);
        for (var i = 0; i < tree.length; i++) {
            if ((check.indexOf(tree[i].toString()) > -1) && (check.indexOf(tree[i + 1].toString()) > -1)) {
                return false;
            }
        }
    }
    return true
}

// extracts all possible values except the category values
function findAllValues(table, name) {
    var values = [];
    for(var i = 1; i < table.rows.length; i++) {
        var row = document.getElementById(name+i.toString()).innerText;
        var rowItems = row.split(/\s+/);
        for (var j = 0; j < rowItems.length - 1; j++) {
            values.push(rowItems[j])
        }
        values = values.filter(unique);
    }
    return values;
}