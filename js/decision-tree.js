/**
 * Copyright (c) 2013 Yurii Lahodiuk
 * Licensed under MIT https://github.com/lagodiuk/decision-tree-js/blob/master/LICENSE
 *
 * edited by Miriam Elia 2019
 */

var dt = (function () {
    var resultCollection = [];
    var allItems = [];

    function DecisionTree(builder) {
        allItems.length = 0;
        resultCollection.length = 0;
        this.root = buildDecisionTree({
            trainingSet: builder.trainingSet,
            categoryAttr: builder.categoryAttr || 'category',
            minItemsCount: builder.minItemsCount || 1,
            entropyThrehold: builder.entropyThrehold || 0.01, //from 0.9 impure nodes
            maxTreeDepth: builder.maxTreeDepth || 70,
            attribute_values: builder.attribute_values,
            attribute_headings: builder.attribute_headings,
            id: builder.id,
            calc: builder.calc,
            splitAttributes: builder.splitAttributes,
            mode: builder.mode,
            splitValue: builder.splitValue
        });

    }

    /**
     * Returns number of category attributes
     *
     * @param items
     * @param attr
     */
    function countUniqueValues(items, attr) {
        var counter = {};
        for (var i = items.length - 1; i >= 0; i--) {
            counter[items[i][attr]] = 0;
        }
        for (var i = items.length - 1; i >= 0; i--) {
            counter[items[i][attr]] += 1;
        }
        return counter;
    }

    function entropy(items, attr) {
        var counter = countUniqueValues(items, attr);
        var entropy = 0;
        var p;
        for (var i in counter) {
            p = counter[i] / items.length;
            entropy += -p * Math.log2(p);
        }
        return entropy;
    }

    function gini(items, attr) {
        var counter = countUniqueValues(items, attr);
        var gini = 0;
        var c;
        for(var i in counter) {
            c = counter[i] / items.length;
            gini += Math.pow(c,2);
        }
        return 1 - gini;
    }

    function split(items, attr, predicate, pivot, attribute_values, attribute_headings) {
        //finds right position in column to calculate number of different attribute_values
        var index = attribute_headings.indexOf(attr);
        var length = attribute_values[index].length;
        var new_array = [];
        var rest = items.slice(0);  //copy
        for (var i = 0; i < length; i++) {
            var check = split_two(rest, attr, predicate, attribute_values[index][i]);
            if(check.match.length !== 0)
                new_array.push(check.match);
            rest = check.notMatch;
        }
        return {new_array: new_array};
    }

    function split_two(items, attr, predicate, pivot) {
        var match = [];
        var notMatch = [];
        var item, attrValue;
        for (var i = items.length - 1; i >= 0; i--) {
            item = items[i];
            attrValue = item[attr];
            if (predicate(attrValue, pivot)) {
                match.push(item);
            } else {
                notMatch.push(item);
            }
        };
        return {
            match: match,
            notMatch: notMatch
        };
    }

    var predicates = {
        '==': function (a, b) { return a == b },
        '>=': function (a, b) { return a >= b }
    };

    /**
     * Returns number of occurrences of the values of each attribute
     * @param items
     * @param attr
     * @returns {*|string}
     */
    function mostFrequentValue(items, attr) {
        var counter = countUniqueValues(items, attr);
        var mostFrequentCount = 0;
        var mostFrequentValue;
        for (var value in counter) {
            if (counter[value] > mostFrequentCount) {
                mostFrequentCount = counter[value];
                mostFrequentValue = value;
            }
        };
        return mostFrequentValue;
    }

    /**
     * Builds decision tree recursively
     *
     * @param builder
     * @returns {{id: number, category: string}|{predicateName: string, allItems: Array, counts: Array, resultColl: Array,
     * trees: Array, gain: number, attribute_headings: (*|string[]), predicate: *, attribute_values: (*|Array), pivot: *,
     * attribute: string, id: number, value: Array, initialValue: string, trainingSet: *}|{id: number,
     * category: (*|string)}|{predicateName: string, counts: Array, resultColl: Array, trees: Array, gain: string,
     * attribute_headings: (*|string[]), predicate: *, attribute_values: (*|Array), pivot: number, attribute: string,
     * id: number, value: Array, initialValue: string, trainingSet: Array}|{predicateName: string, allItems: Array,
     * counts: Array, resultColl: Array, trees: Array, gain: string, attribute_headings: (*|string[]),
     * predicate: string, attribute_values: (*|Array), pivot: string, attribute: string, id: number,
     * value: Array, initialValue: string, trainingSet: *}}
     *
     */
    function buildDecisionTree(builder) {
        var trainingSet = builder.trainingSet;
        var minItemsCount = builder.minItemsCount;
        var categoryAttr = builder.categoryAttr;
        var entropyThrehold = builder.entropyThrehold;
        var maxTreeDepth = builder.maxTreeDepth;
        var ignoredAttributes = builder.ignoredAttributes;
        var attribute_values = builder.attribute_values;
        var attribute_headings = builder.attribute_headings;
        var id = builder.id++;
        var content = "init";
        var calc = builder.calc;
        var splitAttributes = builder.splitAttributes
        var mode = builder.mode

        if(mode === "manually") {
            var splitId;
            if(splitAttributes.length > 0) {
                var splitContent = splitAttributes[0]
                var v = splitContent.splitValue;
                var splitAttr = splitContent.splitAttr;
                splitId = splitContent.splitId
            } else {
                v = "child"
                splitId = "child"
                splitAttr = ""
            }
            var splitValue = v;
        }

        if(mode === "stepwise") {
           var count = splitAttributes[0].number
        } else {
            count = -1;
        }

        if ((maxTreeDepth == 0) || (trainingSet.length <= minItemsCount)) {
            // restriction by maximal depth of tree
            // or size of training set is to small
            // so we have to terminate process of building tree
            resultCollection.push(id+", "+calc+"of current node: 0.0000");
            if(calc === "Entropy ") {
                resultCollection.push(id+", Information Gain:");    // <br>
            } else {
                resultCollection.push(id+", Gini Gain:");   // <br>
            }
            resultCollection.push(id+", "+" A pure node is optimal ")

            for(var i = 0; i < trainingSet.length; i++) {
                allItems.push(id+", "+Object.values(trainingSet[i]));
            }
            return {
                id: id,
                category: mostFrequentValue(trainingSet, categoryAttr)
            };
        }

        var initialValue = 0;
        if(calc === "Entropy ") {
            initialValue = entropy(trainingSet, categoryAttr);
        } else {
            initialValue = gini(trainingSet, categoryAttr);
        }
        var initV = initialValue.toFixed(4)
        resultCollection.push(id+", "+calc+"of current node: "+initV);

        if(calc === "Entropy ") {
            resultCollection.push(id+", Information Gain: <br>");
        } else {
            resultCollection.push(id+",Gini Gain: <br>");
        }

        //return category if no more split necessary
        if (initialValue <= entropyThrehold) {
            // entropy of training set too small
            // (it means that training set is almost homogeneous),
            // so we have to terminate process of building tree
            resultCollection.push(id+", "+calc+"of current node: 0.0000");
            if(calc === "Entropy ") {
                resultCollection.push(id+", Information Gain: <br>");
            } else {
                resultCollection.push(id+", Gini Gain: <br>");
            }
            resultCollection.push(id+", "+" A pure node is optimal ")

            for(var i = 0; i < trainingSet.length; i++) {
                allItems.push(id+", "+Object.values(trainingSet[i]));
            }
            return {
                id: id,
                category: mostFrequentValue(trainingSet, categoryAttr)
            };
        }
        // used as hash-set for avoiding the checking of split by rules
        // with the same 'attribute-predicate-pivot' more than once
        var alreadyChecked = {};

        // this variable expected to contain rule, which splits training set
        // into subsets with smaller values of entropy (produces informational gain)
        var bestSplit = {gain: 0};
        for (var itemIndex = trainingSet.length - 1; itemIndex >= 0; itemIndex--) { //
            var item = trainingSet[itemIndex];
            // iterating over all attributes of item
            for (var attr in item) {
                if ((attr == categoryAttr)) {
                    continue;
                }
                // let the value of current attribute be the pivot
                var pivot = item[attr];
                // pick the predicate
                // depending on the type of the attribute value
                var predicateName;
                var pred;
                var spl;
                if (typeof pivot == 'number') {
                    predicateName = '>=';
                    if(mode === "manually") {
                        pred = splitAttr.split("=")[1]
                        spl = splitAttr.split(">")[0]
                    }
                } else {
                    predicateName = '==';
                }

                var attrPredPivot = attr + predicateName + pivot;
                if (alreadyChecked[attrPredPivot]) {
                    continue;
                }
                alreadyChecked[attrPredPivot] = true;
                var predicate = predicates[predicateName];
                var newValue = 0;
                if(typeof pivot == 'number') {
                    var currSplit = split_two(trainingSet, attr, predicate, pivot);
                    content = pivot.toString();
                    // calculating entropy or gini index of subsets
                    var matchValue = 0;
                    var notMatchValue = 0;
                    if(calc === "Entropy ") {
                        matchValue = entropy(currSplit.match, categoryAttr);
                        notMatchValue = entropy(currSplit.notMatch, categoryAttr);
                    } else {
                        matchValue = gini(currSplit.match, categoryAttr);
                        notMatchValue = gini(currSplit.notMatch, categoryAttr);
                    }

                    // calculating information gain
                    newValue += matchValue * currSplit.match.length;
                    newValue += notMatchValue * currSplit.notMatch.length;
                    newValue /= trainingSet.length;
                    var currGain = initialValue - newValue;

                    resultCollection.push(id+", "+attr+predicateName+pivot +": "+currGain.toFixed(4))
                } else {
                    // more than two subsets
                    content = attr;
                    var currSplit = split(trainingSet, attr, predicate, pivot, attribute_values, attribute_headings);

                    const iterator = currSplit.new_array.values();
                    var calcValues = [];
                    var lengths = [];

                    // calculating entropy or gini index of subsets
                    for (const value of iterator) {
                        lengths.push(value.length);
                        if(calc === "Entropy ") {
                            calcValues.push(entropy(value, categoryAttr));
                        } else {
                            calcValues.push(gini(value, categoryAttr));
                        }
                        newValue += calcValues[calcValues.length - 1] * lengths[lengths.length - 1];
                    }
                    newValue /= trainingSet.length;
                    // calculating information gain
                    var currGain = initialValue - newValue;
                    resultCollection.push(id+", "+attr+": "+currGain.toFixed(4))
                }
                if(mode === "manually") {
                    if(splitId <= id) {
                        if (splitValue.trim() === initV) {
                            if(typeof pivot === 'number') {
                                if ((attr.trim() === spl.trim()) && (pivot === Number(pred))){
                                    bestSplit = currSplit;
                                    bestSplit.predicateName = predicateName;
                                    bestSplit.predicate = predicate;
                                    bestSplit.attribute = attr;
                                    bestSplit.pivot = pivot;
                                    bestSplit.gain = currGain;
                                }
                            }
                            else if (!(typeof pivot === 'number') && attr === splitAttr) {
                                bestSplit = currSplit;
                                bestSplit.predicateName = predicateName;
                                bestSplit.predicate = predicate;
                                bestSplit.attribute = attr;
                                bestSplit.pivot = pivot;
                                bestSplit.gain = currGain;
                            }
                        }
                    }
                    // auto or stepwise mode
                } else if (currGain > bestSplit.gain) {
                    bestSplit = currSplit;
                    bestSplit.predicateName = predicateName;
                    bestSplit.predicate = predicate;
                    bestSplit.attribute = attr;
                    bestSplit.pivot = pivot;
                    bestSplit.gain = currGain;
                }
            }
            attrPredPivot = bestSplit.predicateName+bestSplit.pivot;
        }
        if(mode === "stepwise") {
            var object = new Object({
                    number: --count,
                    splitAttr: bestSplit.attribute,
                    splitValue: bestSplit.gain,
                    splitId: id
                })
            builder.splitAttributes.push(object);
        }

        if(!(mode === "manually")) {
            //Best split has been found
            if (!bestSplit.gain) {
                // can't find optimal split
                return {id: id, category: "No-" + mostFrequentValue(trainingSet, attr)};
            }
        }

        // all elements have been calculated
        if(((mode === "manually") && builder.splitAttributes.length === 0) || ((mode === "stepwise") && count === 0)) {
            return {
                trainingSet: builder.trainingSet,
                allItems: allItems,
                attribute_headings: attribute_headings,
                attribute_values: attribute_values,
                attribute: bestSplit.attribute,
                predicate: bestSplit.predicate,
                predicateName: bestSplit.predicateName,
                pivot: bestSplit.pivot,
                trees: [],
                counts: [],
                value: [],
                gain: bestSplit.gain,
                initialValue: initialValue.toFixed(4),
                resultColl: resultCollection,
                id: id // of the tree node
            };
        }

        if((mode === "manually") && (splitAttr === "start"|| !(splitValue.trim() === initV) || splitId > id || splitId === "child")) {
            return {
                trainingSet: builder.trainingSet,
                allItems: allItems,
                attribute_headings: attribute_headings,
                attribute_values: attribute_values,
                attribute: "",
                predicate: "",
                predicateName: "",
                pivot: "",
                trees: [],
                counts: [],
                value: [],
                gain: "",
                initialValue: initialValue.toFixed(4),
                resultColl: resultCollection,
                id: id // of the tree node
            };
        }

        if(((mode === "manually") && !(splitAttr === "")) || (mode === "stepwise" )) {
            builder.splitAttributes.shift();
        }
        // building subtrees
        builder.maxTreeDepth = maxTreeDepth - 1;

        if(typeof  bestSplit.pivot == 'number') {
            var values = []
            var trees = []
            var lengths = []

            /*if(mode === "manually")
                values.push(splitAttr.split(" ")[1])
            else
                values.push(attrPredPivot)

            console.log(attrPredPivot)*/
            values.push(">="+bestSplit.pivot)
            values.push("<"+bestSplit.pivot)

            builder.trainingSet = bestSplit.match;

            var matchSubTree = buildDecisionTree(builder);
            lengths.push(bestSplit.match.length)

            builder.trainingSet = bestSplit.notMatch;

            var notMatchSubTree = buildDecisionTree(builder);
            lengths.push(bestSplit.notMatch.length)

            trees.push(matchSubTree)
            trees.push(notMatchSubTree)

        } else {
            // more than two subtrees
            var trees = [];
            var lengths = [];
            var values = [];
            try {
                for (var l = 0; l < bestSplit.new_array.length; l++) {
                    var subtree = bestSplit.new_array[l][0]
                    for (var property in subtree) {
                        if (bestSplit.attribute === property) {
                            values.push(subtree[property]);
                        }
                    }
                    builder.trainingSet = bestSplit.new_array[l];
                    lengths.push(bestSplit.new_array[l].length);
                    var subtree = buildDecisionTree(builder)
                    trees.push(subtree)
                }
            } catch(error) {
                console.error(error)
            }

        }

        // add all items of current tree
        for(var i = 0; i < trainingSet.length; i++) {
            allItems.push(id+", "+Object.values(trainingSet[i]));
        }
        return {
            trainingSet: allItems,
            attribute_headings: attribute_headings,
            attribute_values: attribute_values,
            attribute: bestSplit.attribute,
            predicate: bestSplit.predicate,
            predicateName: bestSplit.predicateName,
            pivot: bestSplit.pivot,
            trees: trees,
            counts: lengths,
            value: values,
            gain: bestSplit.gain.toFixed(4),
            initialValue: initialValue.toFixed(4),
            resultColl: resultCollection,
            id: id
        };
    }

    var exports = {};
    exports.DecisionTree = DecisionTree;
    return exports;
})();