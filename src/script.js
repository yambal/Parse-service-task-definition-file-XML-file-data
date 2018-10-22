(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var DomParser = require('./lib/DomParser');
module.exports = DomParser;

},{"./lib/DomParser":3}],2:[function(require,module,exports){
var
  tagRegExp          = /(<\/?[a-z][a-z0-9]*(?::[a-z][a-z0-9]*)?\s*(?:\s+[a-z0-9-_]+=(?:(?:'[\s\S]*?')|(?:"[\s\S]*?")))*\s*\/?>)|([^<]|<(?![a-z\/]))*/gi,
  attrRegExp         = /\s[a-z0-9-_]+\b(\s*=\s*('|")[\s\S]*?\2)?/gi,
  splitAttrRegExp    = /(\s[a-z0-9-_]+\b\s*)(?:=(\s*('|")[\s\S]*?\3))?/gi,
  startTagExp        = /^<[a-z]/,
  selfCloseTagExp    = /\/>$/,
  closeTagExp        = /^<\//,
  nodeNameExp        = /<\/?([a-z][a-z0-9]*)(?::([a-z][a-z0-9]*))?/i,
  attributeQuotesExp = /^('|")|('|")$/g,
  noClosingTagsExp   = /^(?:area|base|br|col|command|embed|hr|img|input|link|meta|param|source)/i;

var Node = require('./Node');

function findByRegExp(html, selector, onlyFirst) {

  var
    result        = [],
    tagsCount     = 0,
    tags          = html.match(tagRegExp),
    composing     = false,
    currentObject = null,
    matchingSelector,
    fullNodeName,
    selfCloseTag,
    attributes,
    attrBuffer,
    attrStr,
    buffer,
    tag;

  for (var i = 0, l = tags.length; i < l; i++) {

    tag = tags[i];
    fullNodeName = tag.match(nodeNameExp);

    matchingSelector = selector.test(tag);

    if (matchingSelector && !composing){
      composing = true;
    }

    if (composing) {

      if (startTagExp.test(tag)) {
        selfCloseTag = selfCloseTagExp.test(tag) || noClosingTagsExp.test(fullNodeName[1]);
        attributes = [];
        attrStr = tag.match(attrRegExp) || [];
        for (var aI = 0, aL = attrStr.length; aI < aL; aI++) {
          splitAttrRegExp.lastIndex = 0;
          attrBuffer = splitAttrRegExp.exec(attrStr[aI]);
          attributes.push({
            name: attrBuffer[1].trim(),
            value: (attrBuffer[2] || '').trim().replace(attributeQuotesExp, '')
          });
        }

        ((currentObject && currentObject.childNodes) || result).push(buffer = new Node({
          nodeType: 1, //element node
          nodeName: fullNodeName[1],
          namespace: fullNodeName[2],
          attributes: attributes,
          childNodes: [],
          parentNode: currentObject,
          startTag: tag,
          selfCloseTag: selfCloseTag
        }));
        tagsCount++;

        if (!onlyFirst && matchingSelector && currentObject){
          result.push(buffer);
        }

        if (selfCloseTag) {
          tagsCount--;
        }
        else {
          currentObject = buffer;
        }

      }
      else if (closeTagExp.test(tag)) {
        if (currentObject.nodeName == fullNodeName[1]){
          currentObject = currentObject.parentNode;
          tagsCount--;
        }
      }
      else {
        currentObject.childNodes.push(new Node({
          nodeType: 3,
          text: tag,
          parentNode: currentObject
        }));
      }

      if (tagsCount == 0) {
        composing = false;
        currentObject = null;

        if (onlyFirst){
          break;
        }
      }

    }

  }

  return onlyFirst ? result[0] || null : result;
}


function Dom(rawHTML) {
  this.rawHTML = rawHTML;
}

Dom.prototype.getElementsByClassName = function (className) {
  var selector = new RegExp('class=(\'|")(.*?\\s)?' + className + '(\\s.*?)?\\1');
  return findByRegExp(this.rawHTML, selector);
};

Dom.prototype.getElementsByTagName = function (tagName) {
  var selector = new RegExp('^<'+tagName, 'i');
  return findByRegExp(this.rawHTML, selector);
};

Dom.prototype.getElementById = function(id){
  var selector = new RegExp('id=(\'|")' + id + '\\1');
  return findByRegExp(this.rawHTML, selector, true);
};

Dom.prototype.getElementsByName = function(name){
  var selector = new RegExp('name=(\'|")' + name + '\\1');
  return findByRegExp(this.rawHTML, selector);
};


module.exports = Dom;
},{"./Node":4}],3:[function(require,module,exports){
var Dom = require('./Dom');

function DomParser() {
}

DomParser.prototype.parseFromString = function (html) {
  return new Dom(html);
};

module.exports = DomParser;
},{"./Dom":2}],4:[function(require,module,exports){
//https://developer.mozilla.org/en-US/docs/Web/API/Element


function Node(cfg) {

  this.namespace     = cfg.namespace || null;
  this.text          = cfg.text;
  this._selfCloseTag = cfg.selfCloseTag;


  Object.defineProperties(this, {
    nodeType: {
      value: cfg.nodeType
    },
    nodeName: {
      value: cfg.nodeType == 1 ? cfg.nodeName : '#text'
    },
    childNodes: {
      value: cfg.childNodes
    },
    firstChild: {
      get: function(){
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      get: function(){
        return this.childNodes[this.childNodes.length-1] || null;
      }
    },
    parentNode: {
      value: cfg.parentNode || null
    },
    attributes: {
      value: cfg.attributes || []
    },
    innerHTML: {
      get: function(){
        var
          result = '',
          cNode;
        for (var i = 0, l = this.childNodes.length; i < l; i++) {
          cNode = this.childNodes[i];
          result += cNode.nodeType === 3 ? cNode.text : cNode.outerHTML;
        }
        return result;
      }
    },
    outerHTML: {
      get: function(){
        if (this.nodeType != 3){
          var
            str,
            attrs = (this.attributes.map(function(elem){
              return elem.name + (elem.value ? '=' + '"'+ elem.value +'"' : '');
            }) || []).join(' '),
            childs = '';

          str = '<' + this.nodeName + (attrs ? ' ' + attrs : '') + (this._selfCloseTag ? '/' : '') + '>';

          if (!this._selfCloseTag){
            childs = (this._selfCloseTag ? '' : this.childNodes.map(function(child){
              return child.outerHTML;
            }) || []).join('');

            str += childs;
            str += '</' + this.nodeName + '>';
          }
        }
        else{
          str = this.textContent;
        }
        return str;
      }
    },
    textContent: {
      get: function(){
        if (this.nodeType == Node.TEXT_NODE){
          return this.text;
        }
        else{
          return this.childNodes.map(function(node){
            return node.textContent;
          }).join('').replace(/\x20+/g, ' ');
        }
      }
    }
  });
}

Node.prototype.getAttribute = function (attributeName) {
  for (var i = 0, l = this.attributes.length; i < l; i++) {
    if (this.attributes[i].name == attributeName) {
      return this.attributes[i].value;
    }
  }
  return null;
};

function searchElements(root, conditionFn, onlyFirst){
  var result = [];
  onlyFirst = !!onlyFirst;
  if (root.nodeType !== 3) {
    for (var i = 0, l = root.childNodes.length; i < l; i++) {
      if (root.childNodes[i].nodeType !== 3 && conditionFn(root.childNodes[i])) {
        result.push(root.childNodes[i]);
        if (onlyFirst){
          break;
        }
      }
      result = result.concat(searchElements(root.childNodes[i], conditionFn));
    }
  }
  return onlyFirst ? result[0] : result;
}

Node.prototype.getElementsByTagName = function (tagName) {
  return searchElements(this, function(elem){
    return elem.nodeName == tagName;
  })
};

Node.prototype.getElementsByClassName = function (className) {
  var expr = new RegExp('^(.*?\\s)?' + className + '(\\s.*?)?$');
  return searchElements(this, function(elem){
    return elem.attributes.length && expr.test(elem.getAttribute('class'));
  })
};

Node.prototype.getElementById = function (id) {
  return searchElements(this, function(elem){
    return elem.attributes.length && elem.getAttribute('id') == id;
  }, true)
};

Node.prototype.getElementsByName = function (name) {
  return searchElements(this, function(elem){
    return elem.attributes.length && elem.getAttribute('name') == name;
  })
};


Node.ELEMENT_NODE = 1;
Node.TEXT_NODE    = 3;

module.exports = Node;
},{}],5:[function(require,module,exports){
var confToDataNum = function(confName) {
  if (confName) {
    var dNum = parseInt(configs.get(confName), 10);
    if (!isNaN(dNum) && typeof dNum === "number") {
      return dNum;
    }
  }
  return null;
};

var confGetDataString = function(confName, def) {
  var dNum = confToDataNum(confName);
  if (typeof dNum === "number") {
    var res = engine.findDataByNumber(dNum);
    if (!res) {
      return def;
    }
    return String(res);
  }
  return def;
};

var confGetDataFile = function(confName, fileNum){
  var dNum = confToDataNum(confName);
  if (typeof dNum === "number") {
    var fArr = engine.findDataByNumber(dNum);
    var f = fArr.get(fileNum)
    if(f){
      var text = "";
      fileRepository.readFile(f, "UTF-8", function(line) {
        text += line + '\n';
      })
      return text
    }
  }
  return null
}

var confSetDataString = function(confName, str) {
  var data = String(str);
  var dNum = confToDataNum(confName);
  if (typeof dNum === "number") {
    engine.setDataByNumber(dNum, data);
  }
};

var confSetDataStringSingleLine = function(confName, str) {
  var data = String(str);
  data = data.replace(/\r?\n/g, "");
  confSetDataString(confName, data);
};

var confSetDataDateByYYYYMMDD = function(confName, str) {
  var data = String(str);
  var jDate = java.sql.Date.valueOf(data);

  var dNum = confToDataNum(confName);
  if (typeof dNum === "number" && jDate) {
    engine.setDataByNumber(dNum, jDate);
  }
};

var confClear = function(confName) {
  var dNum = confToDataNum(confName);
  if (typeof dNum === "number") {
    engine.setDataByNumber(dNum, null);
  }
};

module.exports = {
  conf: {
    getData: {
      string: confGetDataString,
      file:confGetDataFile,
    },
    setData: {
      string: {
        multiLine: confSetDataString,
        singleLine: confSetDataStringSingleLine
      },
      date: {
        yyyymmdd: confSetDataDateByYYYYMMDD
      }
    },
    clearData: confClear
  }
};
},{}],6:[function(require,module,exports){
var DomParser = require("dom-parser");

var gatNodeAttr = function(labelNode, name, def) {
    if (!labelNode) {
        return def;
    }
    var attrs = labelNode.attributes;
    if (attrs) {
        attrs = attrs.filter(function(element, index, array) {
            if (element.name.toLowerCase() == name) {
                return true;
            }
        });
        if (attrs.length > 0 && attrs[0].value) {
            return attrs[0].value;
        }
        return def;
    }
};

function servicetaskXmlParser(servicetaskXml) {
    if (servicetaskXml) {
        // scriptはパースできない
        servicetaskXml = servicetaskXml.replace(/<script>(.|\s)*?<\/script>/gi, "<script></script>");
        // ハイフン付きタグネームはパースできないみたい
        servicetaskXml = servicetaskXml.replace(/last-modified/gi, "lastmodified");
        servicetaskXml = servicetaskXml.replace(/help-page-url/gi, "helppageurl");
        servicetaskXml = servicetaskXml.replace(/engine-type/gi, "enginetype");

        var parser = new DomParser();
        var dom = parser.parseFromString(servicetaskXml, "text/xml");

        // - - - - - - - - - - - - - - - -
        // configs > config をリストアップ
        var congigLabelTexts = [];
        var configs = {};
        var configsDom = dom.getElementsByTagName("configs");
        if(configsDom && configsDom[0] && configsDom[0].childNodes){
            for (var i = 0; i < configsDom[0].childNodes.length; i++) {
                var n = configsDom[0].childNodes[i];
                var nn = n.nodeName;
                if (nn.toLowerCase() == "config") {
                    // configs > config
                    var configName = gatNodeAttr(n, "name", null);
                    if (!configs[configName]) {
                        configs[configName] = {};
                    }

                    configs[configName].required =
                        gatNodeAttr(n, "required", "false") == "true";
                    configs[configName].elEnabled =
                        gatNodeAttr(n, "el-enabled", "false") == "true";
                    configs[configName].formType = gatNodeAttr(n, "form-type", null);
                    configs[configName].selectDataTypes = gatNodeAttr(
                        n,
                        "select-data-type",
                        ""
                    ).split("|");

                    var labels = n.getElementsByTagName("label");
                    for (var ii = 0; ii < labels.length; ii++) {
                        var locale = gatNodeAttr(labels[ii], "locale", "en");
                        if(labels[ii] && labels[ii].textContent){
                            var labelText = labels[ii].textContent;
                            if (!configs[configName].labels) {
                                configs[configName].labels = {};
                            }
                            configs[configName].labels[locale] = labelText;
                            congigLabelTexts.push(labelText);
                        }
                    }
                }
            }
        }

        // - - - - - - - - - - - - - - - -
        // サービスタスクの名称（root/label）を取得
        var addonNameLabels = {};
        var labelDom = dom.getElementsByTagName("label");
        for (var i = 0; i < labelDom.length; i++) {

            if(labelDom[i] && labelDom[i].textContent){
                var labelText = labelDom[i].textContent;
                if (congigLabelTexts.indexOf(labelText) == -1) {
                    // どうしても Config 配下の label と区別して抽出できない
                    // config/label の text は サービスタスク名と同じものはない、として抽出
                    var locale = gatNodeAttr(labelDom[i], "locale", "en");
                    addonNameLabels[locale] = labelText;
                }
            }
        }

        // - - - - - - - - - - - - - - - -
        var summaries = {};
        var summaryDom = dom.getElementsByTagName("summary");
        for (var i = 0; i < summaryDom.length; i++) {
            var locale = gatNodeAttr(summaryDom[i], "locale", "en");
            if(summaryDom[i] && summaryDom[i].textContent){
                summaries[locale] = summaryDom[i].textContent;
            }
        }

        // - - - - - - - - - - - - - - - -
        var lastModifiedDate;
        var lastModified;
        var lastModifiedDom = dom.getElementsByTagName("lastmodified");

        if (lastModifiedDom) {
            if(lastModifiedDom[0] && lastModifiedDom[0].textContent){
                lastModified = lastModifiedDom[0].textContent;
                lastModifiedDate = Date.parse(lastModifiedDom[0].textContent);
            }
        }

        // - - - - - - - - - - - - - - - -
        var helpUrls = {};
        var helppageUrlDom = dom.getElementsByTagName("helppageurl");
        for (var i = 0; i < helppageUrlDom.length; i++) {
            var locale = gatNodeAttr(helppageUrlDom[i], "locale", "en");
            if(helppageUrlDom[i] && helppageUrlDom[i].textContent){
                helpUrls[locale] = helppageUrlDom[i].textContent;
            }
            
        }

        var engineType = null;
        var engineTypeDom = dom.getElementsByTagName("enginetype");
        if (engineTypeDom && engineTypeDom[0] && engineTypeDom[0].textContent){
            engineType = parseInt(engineTypeDom[0].textContent, 10)
        }

        // - - - - - - - - - - - - - - - -
        var script
        var scriptNodes = dom.getElementsByTagName("script");
        if(scriptNodes){
            script = 'Script is exists.';
        }

        // - - - - - - - - - - - - - - - -
        var iconBase64;
        var iconNodes = dom.getElementsByTagName("icon");
        if (iconNodes && iconNodes[0] && iconNodes[0].textContent) {
            iconBase64 = iconNodes[0].textContent;
        }

        var res = {
            labels: addonNameLabels,
            summaries: summaries,
            helpPageUrls: helpUrls,
            configs: configs,
            lastModified: lastModified,
            lastModifiedDate: lastModifiedDate,
            script: script,
            iconBase64: iconBase64,
            engineType : engineType
        };

        res.warning = servicetaskXmlChecker(res);

        return res;
    }
    return null;
}

function servicetaskXmlChecker(servicetaskJson, checkHelpUrl) {
    var warning = [];
    if (!servicetaskJson.labels) {
        warning.push("サービスタスクの名前 <label>(日英) が指定されていません");
    } else {
        if (!servicetaskJson.labels.ja) {
            warning.push(
                'サービスタスクの名前 <label locale="ja">(日本語) が指定されていません'
            );
        }
        if (!servicetaskJson.labels.en) {
            warning.push("サービスタスクの名前 <label>(英語) が指定されていません");
        }
    }

    if (!servicetaskJson.summaries) {
      warning.push("概要説明 <summary>(日英) が指定されていません");
    } else {
        if (!servicetaskJson.summaries.ja) {
            warning.push('概要説明 <summary locale="ja">(日本語) が指定されていません');
        }
        if (!servicetaskJson.summaries.en) {
            warning.push("概要説明 <summary>(英語) が指定されていません");
        }
    }

    if(checkHelpUrl === true){
      if (!servicetaskJson.helpPageUrls.ja) {
          warning.push(
              'ヘルプのURL <summary locale="ja">(日本語) が指定されていません'
          );
      }
      if (!servicetaskJson.helpPageUrls.en) {
          warning.push("ヘルプのURL <summary>(英語) が指定されていません");
      }
    }

    var keys = Object.keys(servicetaskJson.configs);
    for (var i = 0; i < keys.length; i++) {
        var config = servicetaskJson.configs[keys[i]];
        if (!config.labels.ja) {
            warning.push(
                "config [" +
                keys[i] +
                '] の名前 <label locale="ja">(日本語) が指定されていません'
            );
        }
        if (!config.labels.en) {
            warning.push(
                "config [" + keys[i] + "] の名前 <label>(英語) が指定されていません"
            );
        }
    }

    if (!servicetaskJson.script) {
        warning.push("スクリプト <script> が指定されていません");
    }

    if (!servicetaskJson.iconBase64) {
        warning.push("アイコン <icon> が指定されていません");
    }

    if (typeof servicetaskJson.engineType !== "number") {
        warning.push("<engine-type> が指定されていません");
    }

    var hasWarning = false;
    if (warning.length > 0) {
        hasWarning = true;
    }
    return {
        warning: warning,
        hasWarning: hasWarning
    };
}

module.exports = servicetaskXmlParser
},{"dom-parser":1}],7:[function(require,module,exports){
var stxParser = require("service_task_xml_parser")
var util = require("npm_script_task_utility")

//var xmlUrl = util.conf.getData.string("xmlUrl", null);
var xmlStr = util.conf.getData.file("xmlFile", 0);

//if(xmlUrl){
if(xmlStr){

  /*
  var response = httpClient.begin().get(xmlUrl);
  if (response.getStatusCode() != 200) {
      var error = response.getStatusCode() + "\n" + response.getResponseAsString();
      throw error;
  }
  var body = String(response.getResponseAsString());
  var servicetask = stxParser(body);
  */

  
  util.conf.setData.string.multiLine("XML", xmlStr);

  var servicetask = stxParser(xmlStr);

  engine.log(JSON.stringify(servicetask, null, 2));

  util.conf.clearData("labelServiceTask_Ja")
  if(servicetask.labels && servicetask.labels.ja){
    util.conf.setData.string.singleLine("labelServiceTask_Ja", servicetask.labels.ja);
  }

  util.conf.clearData("labelServiceTask_En")
  if(servicetask.labels && servicetask.labels.en){
    util.conf.setData.string.singleLine("labelServiceTask_En", servicetask.labels.en);
  }

  util.conf.clearData("Summary_Ja")
  if(servicetask.summaries && servicetask.summaries.ja){
    util.conf.setData.string.multiLine("Summary_Ja", servicetask.summaries.ja);
  }

  util.conf.clearData("Summary_En")
  if(servicetask.summaries && servicetask.summaries.en){
    util.conf.setData.string.multiLine("Summary_En", servicetask.summaries.en);
  }

  util.conf.clearData("LastModified")
  if(servicetask.lastModified){
    util.conf.setData.date.yyyymmdd("LastModified", servicetask.lastModified)
  }

  util.conf.clearData("HelpPageUrl_Ja")
  if(servicetask.helpPageUrls && servicetask.helpPageUrls.ja){
    util.conf.setData.string.singleLine("HelpPageUrl_Ja", servicetask.helpPageUrls.ja);
  }

  util.conf.clearData("HelpPageUrl_En")
  if(servicetask.helpPageUrls && servicetask.helpPageUrls.en){
    util.conf.setData.string.singleLine("HelpPageUrl_En", servicetask.helpPageUrls.en);
  }

  util.conf.clearData("ConfList")
  if(servicetask.configs){
    var confRows = []
    var keys = Object.keys(servicetask.configs)
    for(var i = 0; i < keys.length; i++){
      var conf = servicetask.configs[keys[i]]
      confRows.push('[' + keys[i] + '] - - - - - - -')
      if(conf.labels && conf.labels.ja){
        confRows.push('  label(ja) : ' + conf.labels.ja)
      }
      if(conf.labels && conf.labels.en){
        confRows.push('  label(en) : ' + conf.labels.en)
      }
      if(typeof conf.required !== 'undefined'){
        confRows.push('  required : ' + conf.required)
      }
      if(typeof conf.elEnabled !== 'undefined'){
        confRows.push('  el-enabled : ' + conf.elEnabled)
      }
      if(conf.formType){
        confRows.push('  form-type : ' + conf.formType)
        if(conf.formType == 'SELECT' && conf.selectDataTypes){
          confRows.push('    select-data-types : ' + conf.selectDataTypes.join(', '))
        }
      }
    }
    util.conf.setData.string.multiLine("ConfList", confRows.join('\n'));
  }

  util.conf.clearData("Icon")
  if(servicetask.iconBase64){
    util.conf.setData.string.multiLine("Icon", servicetask.iconBase64);
  }

  util.conf.clearData("Warning")
  if(servicetask.warning && servicetask.warning.hasWarning){
    var warningText = '- ' + servicetask.warning.warning.join('\n- ')
    util.conf.setData.string.multiLine("Warning", warningText);
  }

  util.conf.clearData("JSON")
  if(servicetask){
    util.conf.setData.string.multiLine("JSON", JSON.stringify(servicetask, null, 2));
  }
}
},{"npm_script_task_utility":5,"service_task_xml_parser":6}]},{},[7]);
