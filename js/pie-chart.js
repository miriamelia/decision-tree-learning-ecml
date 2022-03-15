/**
 * Class that creates a pie chart from an input array of objects
 * Accepts up to 10 result categories
 */

var pieChart;
var allColors = ["#63FF84", "#6384FF", "#8463FF", "#FF6384", "#76064A", "#631BB5", "#234112", "#FF6245", "#542011", "#84FF63"];
//if old one exists destroy it
if(pieChart)
    pieChart.destroy();

const unique = (value, index, self) => {
    return self.indexOf(value) === index
};

/**
 * read category values of last table column to remember original sequence for the colors
 *
 *@param rows
 *@returns {Array}
 */
function readCategoryValues(rows) {
    var categories = [];
    // read rows
       for(var i = 1; i < rows.length; i++) {
           var v = document.getElementById("row"+i.toString());
           var a = v.innerHTML.split("\"");
           a = a[a.length-1].toString().replace("</td>", "");
           a = a.replace(">", "");
           categories.push(a.trim());
           categories = categories.filter(unique);
           categories = categories.sort();
       }
       allCategories = categories.slice(0);
       return categories
}

/**
 * Filter the distinct category values from content array
 *
 * @param content
 * @returns {Array}
 */
function countUniques(content) {
    var counts = []
    var count = 0;
    var labels = content.filter(unique);
    for(var i = 0; i < labels.length; i++) {
        for(var j = 0; j < content.length; j++) {
            if(labels[i] === content[j]) {
                ++count;
            }
        }
        counts.push(count);
        count = 0;
    }
    return counts;
}

function extractColors(input) {
    var items = [];
    var presentColors = [];
    var sum = 0;
    var counts;

    for(var i = 0; i < input.length; i++) {
        var category = input[i].split(",");
        var last = category.length;
        //last value which is category attribute
        var string = category[last-1];
        string = string.replace("<br>", "");
        items.push(string);
    }
    counts = countUniques(items.sort());
    items = items.filter(unique);

    //item count
    for(var j = 0; j < counts.length; j++) {
        sum += parseInt(counts[j]);
    }

    for(var j = 0; j < items.length; j++) {
        presentColors.push(allColors[allCategories.indexOf(items[j])]);
    }

    return {items: items,
            presentColors: presentColors,
            counts: counts,
            sum: sum};
}


function createPie(pieDiagram, input) {
    var result = extractColors(input);
    var counts = result.counts;
    var items = result.items;
    var presentColors = result.presentColors;
    var sum = result.sum;

    var numberResultClasses = counts.length;
    if(numberResultClasses > 10) {
        alert("The data set has too many result classes to be displayed.");
        return;
    }

    //up to 10 different colors --> up to 10 different category attributes
    var data = {
        labels: items,
        datasets: [{
                data: counts,
                backgroundColor: presentColors
            }],
    };

    pieChart = new Chart(pieDiagram, {
        type: 'pie',
        data: data,
        options: {
            title: {
                display: false,
                text: 'Distribution of split with ' +sum+' item(s)',
                position: 'bottom'
            },
            responsive: false,
            maintainAspectRatio: true,
            legend: {
                position: 'right',
                fontSize: 8,
                onClick: null
            },
            layout: {
                padding: {
                    left: 0,
                    right: 5,
                    top: 0,
                    bottom: 5
                }
            }
        }
    });
    return pieChart;
}
