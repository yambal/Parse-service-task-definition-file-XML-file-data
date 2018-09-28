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