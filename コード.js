//全体的に使用する値や定数は、最初に変数に入れてしまい1箇所を変更するだけで使用できるようにする。
//スプレッドシートへのアクセスなどは処理が重いのでなるべく少なくしたい、最初に1回アクセスするだけ。
//data.lengthみたいに、変数ドットで使用しているのはプログラム側で元々用意されている関数ですのでつど調べて機能を確認してください。（.lengthは配列や文字列の長さを取得します）

//スプレッドシートにアクセスする為のURLを変数に入れる
var URL = "https://docs.google.com/spreadsheets/d/14gF_mGaMyxqxowmRM9LTySC4jmbeDqpjdXLIOX6CLxY/edit#gid=0";

//URLを使ってスプレッドシートオブジェクトを開き変数に入れる
var ss = SpreadsheetApp.openByUrl(URL);

//スプレッドシートオブジェクトからシートを取得して変数に入れる
var sheet = ss.getActiveSheet();

//最終行が何行目かを取得（今のとこ使ってないのでコメント化）
//var lastRow = sheet.getDataRange().getLastRow();

//シートから入力されているデータの範囲を2次元配列で全て取得。以下のようなイメージ
//[0][ID、ファイル名、URL、キーワード]
//[1][ID、ファイル名、URL、キーワード]
//[2][ID、ファイル名、URL、キーワード]
var data = sheet.getDataRange().getValues();

//最大表示件数
var displayMaxNum = 10;

//区切り文字
var delimit = ",";

//検索対象が見つからなかったら時に表示するメッセージ
//メッセージはcreateErrorMessageの関数の中で作成している
var errorMessage = createErrorMessage();

/**
 * ダイレクトメッセージか、@付きのメンションがBotに送られたときに呼び出される関数
 * Responds to a MESSAGE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onMessage(event) {
  
  //表示するメッセージを入れる変数
  var message = "";
  //関数内で表示するメッセージを取得して変数に入れる
  message = getManualURL(event.message.text);
  
  //変数の中身を確認する為のログ
  Logger.log(message);
  
  //メッセージを表示
  return { "text": message };
}

/**
 * Botをチャットルームに追加したときに呼び出される関数
 * Responds to an ADDED_TO_SPACE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onAddToSpace(event) {
  var message = "";

  if (event.space.type == "DM") {
    message = "Thank you for adding me to a DM, " + event.user.displayName + "!";
  } else {
    message = "Thank you for adding me to " + event.space.displayName;
  }

  if (event.message) {
    // Bot added through @mention.
    message = message + " and you said : \"" + event.message.text + "\"";
  }
  return { "text": message };
}

/**
 * Botをチャットルームから削除したときに呼び出される関数
 * Responds to a REMOVED_FROM_SPACE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onRemoveFromSpace(event) {
  //Botが削除されたことを表示させる
  console.info("Bot removed from ", event.space.name);
}

/**
* スプレッドシートからマニュアルのURLを取得して表示メッセージを作成する。
*/
function getManualURL(message) {
  
  //最終的に返却するメッセージを格納する変数
  var result = "";
  //重複チェックと最大件数を確認する為の配列
  var checkArray = new Array();
  
  //スプレッドシートの行数だけループ処理します。
  //配列は0番から始まりますが、0番目はヘッダー行なので飛ばして1行目から始めます。
  for(var i=1; i < data.length; i++){
    
    //スプレッドシートの１行分を配列として変数に入れる
    var values = data[i];
    //配列データの1列目IDを変数に格納
    var id = values[0];
    //配列データの2列目ファイル名を変数に格納
    var fileName = values[1];
    //配列データの3列目URLを変数に格納
    var url = values[2];
    //配列データの4列目キーワード（カンマ区切り）を変数に格納
    var keyWords = values[3];
    
    //最大表示件数を制御
    //取得したIDの件数が最大件数に達したらループ処理から抜けます。
    if(checkArray.length == displayMaxNum){
      result = result + "最大表示件数に到達したので、これ以上は表示できません。"
      break;
    }
    
    //入力メッセージがファイル名に含まれていれば表示メッセージとして追加
    if(fileName.search(message) != -1){
      result = result + "ファイル名：" + fileName + " URL：" + url + "\n";
      
      //取得したファイルのIDを確認用配列に突っ込む
      checkArray.push(id);
      //検索に引っかかったらキーワード検索する必要がないので次のループを処理します。
      continue;
    }
    
    //ファイル名が引っ掛からなかったらキーワードで検索
    //キーワード（カンマ区切り）をカンマで区切って配列に入れます。
    var keyWordArray = keyWords.split(delimit);
    
    //キーワード1つずつに対してループ処理で確認
    for(var j=0; j < keyWordArray.length; j++){
      
      //入力メッセージがキーワードに含まれているかを確認
      //含まれていたら表示メッセージに追加
      if(keyWordArray[j].search(message) != -1){
        
        result = result + "ファイル名：" + fileName + " URL：" + url + "\n";
        
        //取得したファイルのIDを確認用配列に突っ込む
        checkArray.push(id);
        //検索に引っかかったら残りのループを処理する必要がないのでループを抜けます。
        break;
      }
    }
  }
  
  //メッセージが空っぽならID一覧のメッセージを表示
  if(result == ""){
    result = errorMessage;
  }
  
  //表示するメッセージを返してあげる
  return result;
}

//検索対象が見つからなかった時の一覧表示メッセージを作成します。
function createErrorMessage(){
  
  var str = "検索対象がみつかりませんでした。\n マニュアルのID一覧を表示します。対象のIDを入力してください。\n"
  
  //dataの数だけループ
  //配列は0番から始まりますが、0番目はヘッダー行なので飛ばします。
  for(var i=1; i < data.length; i++){
    
    var values = data[i];
    str = str + "ID:" + values[0] + " ファイル名：" + values[1] + "\n";
    
  }
  return str;
}