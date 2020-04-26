var currentArticle;
var selected;
var lastKeyword = null;
var excludeReason = null;
var keyRelated;
class BiMap {
    constructor() {
        this.F2S = new Map();
        this.S2F = new Map();
    }
    addElement(dict, k, e) {
        if (k == null) {
            return;
        }
        if (!dict.has(k)) {
            if (e == null) {
                dict.set(k, new Set());
            } else {
                dict.set(k, new Set([e]));
            }
        } else {
            if (e != null) {
                dict.get(k).add(e);
            }
        }
    }
    add(first, second) {
        this.addElement(this.F2S, first, second);
        this.addElement(this.S2F, second, first);
    }
    remove(e) {
        if (!this.F2S.has(e)) {
            var temp = Array.from(this.S2F.get(e));
            this.S2F.get(e).forEach(element => {
                var todelete = this.F2S.get(element);
                if (todelete.size == 1) {
                    this.F2S.delete(todelete);
                } else {
                    this.F2S.get(element).delete(e);
                }
            });
            this.S2F.delete(e);
            return temp;
        } else {
            var temp = Array.from(this.F2S.get(e));
            this.F2S.get(e).forEach(element => {
                var toDelete = this.S2F.get(element);
                if (toDelete.size == 1) {
                    this.S2F.delete(toDelete);
                } else {
                    toDelete.delete(e);
                }
            });
            this.F2S.delete(e);
            return temp;
        }
    }
}


function makeNewReason(customReason) {
    var newReason = document.createElement("button");
    newReason.appendChild(document.createTextNode(customReason));
    newReason.onclick = setExcludeReason;
    newReason.id = customReason;
    newReason.className="reason"
    document.getElementById("exclude_reasion").prepend(newReason);
}
function getNextAbstract() {
    if (this.readyState == 4 && this.status == 200) {
        currentArticle = JSON.parse(this.responseText);
        document.getElementById("abstract").innerHTML = currentArticle.abstract;
        console.log(currentArticle.pubmedID);
        lastKeyword=null;
        selected=null;
        keyRelated = new BiMap();
    }
}
function retriveAbstract() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.addEventListener("load", getNextAbstract);
    xmlHttp.open("GET", 'http://localhost:8080/nextAbstract', true); // true for asynchronous 
    xmlHttp.send(null);
    var reasons = new XMLHttpRequest();
    reasons.addEventListener("load", function () {
        JSON.parse(this.responseText).forEach(function (e) { makeNewReason(e); });
    });
    reasons.open("GET", 'http://localhost:8080/excludeReasons', true); // true for asynchronous 
    reasons.send(null);
}
function highlight(selected, className) {
    wordHighted = selected.toString()
    nextNode = selected.anchorNode.splitText(selected.anchorOffset);
    nextNode.splitText(selected.focusOffset);
    var highlighted = document.createElement("span");
    highlighted.appendChild(document.createTextNode(wordHighted));
    highlighted.className = className;
    highlighted.id = selected.toString();
    nextNode.parentElement.replaceChild(highlighted, nextNode);
    return wordHighted;
}
function removeHighlight(containingElement) {
    parent = containingElement.parentElement;
    parent.replaceChild(document.createTextNode(containingElement.textContent), containingElement);
    parent.normalize();
}
function removeKeyword(selected) {
    temp = keyRelated.remove(selected.toString());
    temp.forEach(element => {
        removeHighlight(document.getElementById(element));
    });
    removeHighlight(selected.anchorNode.parentElement);

}
function updateLastKeyword(k) {
    Array.from(document.getElementsByClassName("relatedAssociated")).forEach(a => { a.className = "related"; });
    if (lastKeyword != null) {
        document.getElementById(lastKeyword).className = "keyword";
    }
    lastKeyword = k;
}
function addSelectedStr(id){
    var toAdd=document.getElementById(id);
    if (toAdd.value=="") {
        toAdd.value = selected.toString();
    }else{
        toAdd.value+=(","+selected.toString());
    }

}
function handleKeyPress(e) {
    selected = window.getSelection();
    if (selected.toString() == "") {
        switch (e.code) {
            case "Enter":
                if (currentArticle.PMCID == "NULL") {
                    window.open("https://dx.doi.org/" + currentArticle.doi);
                }
                window.open("https://www.ncbi.nlm.nih.gov/pmc/articles/" + currentArticle.PMCID);
                break;
            case "ArrowRight":
                submitForm();
                break;
            default:
                break;
        }
        return;
    }
    switch (selected.anchorNode.parentElement.className) {
        case "keyword":
            if (e.code == "KeyC") {
                removeKeyword(selected);
            } else if (e.code == "KeyR") {
                updateLastKeyword(selected.toString());
                selected.anchorNode.parentElement.className = "keywordAssociated";
                keyRelated.F2S.get(lastKeyword).forEach(e => { document.getElementById(e).className = "relatedAssociated"; });
            }
            break;
        case "keywordAssociated":
            if (e.code == "KeyC") {
                lastKeyword = null;
                removeKeyword(selected);
            }
            break;
        case "relatedAssociated":
        case "related":
            keyRelated.remove(selected.toString());
            removeHighlight(selected.anchorNode.parentElement);
            break;
        default:
            switch (e.code) {
                case "KeyA":
                    updateLastKeyword(highlight(selected, "keywordAssociated"));
                    keyRelated.add(lastKeyword, null);
                    break;
                case "KeyR":
                    keyRelated.add(lastKeyword, highlight(selected, "relatedAssociated"));
                    break;
                case "KeyM":
                    addSelectedStr("mutagen")
                break;
                case "KeyG":
                    addSelectedStr("knockout")
                break;
                default:
                    break;
            }
    }

}
function setExcludeReason(e) {
    e = e.srcElement;
    if (excludeReason != null) { excludeReason.className = "reason"; }
    if (excludeReason == e) {
        e.className = "reason";
        excludeReason = null;
    } else {
        excludeReason = e;
        e.className = "buttonPressed";
    }
}
function e2N(e) {
    v = document.getElementById(e).value;
    document.getElementById(e).value="";
    return v == "" ? null : v;
}

function submitForm() {
    result = {
        mutagen: e2N("mutagen"),
        knockout: e2N("knockout"),
        pubmedID: currentArticle.pubmedID,
        repo: e2N("repo"),
        accession: e2N("accession")
    };
    word = [];
    keyRelated.F2S.forEach((rs, k) => {
        if (rs.size == 0) {
            word.push([k, null]);
        } else {
            rs.forEach(r => { word.push([k, r]); });
        }
    });
    result.word = word;
    result.excludeReason = excludeReason == null ? null : excludeReason.textContent;
    customReason = document.getElementById("customeExcludeReason").value;
    if (customReason != "") {
        result.excludeReason = customReason;
        makeNewReason(customReason);
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = getNextAbstract;
    xmlHttp.open("POST", 'http://localhost:8080/', true); // true for asynchronous 
    xmlHttp.send(JSON.stringify(result));
    if (excludeReason != null) { excludeReason.className = ""; }
    excludeReason=null;
    document.getElementById("customeExcludeReason").value=""
    
    return result;
}
document.addEventListener('keydown', handleKeyPress);

window.onload = retriveAbstract;
